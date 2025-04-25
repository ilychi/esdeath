/**
 * 域名存活验证工具 - 检查域名是否存活
 */
import * as dns from 'dns';
import * as util from 'util';

// 转换DNS查询为Promise形式
const lookupPromise = util.promisify(dns.lookup);
const resolve4Promise = util.promisify(dns.resolve4);
const resolve6Promise = util.promisify(dns.resolve6);
const resolveTxtPromise = util.promisify(dns.resolveTxt);
const resolveMxPromise = util.promisify(dns.resolveMx);
const resolveNsPromise = util.promisify(dns.resolveNs);

// 缓存查询结果，避免重复查询
const domainAliveCache = new Map<string, boolean>();
const apexDomainCache = new Map<string, string | null>();
const mutex = new Map<string, Promise<unknown>>();

// DNS服务器列表
const DNS_SERVERS = [
  '8.8.8.8', // Google DNS
  '1.1.1.1', // Cloudflare DNS
  '208.67.222.222', // OpenDNS
  '9.9.9.9', // Quad9
  '114.114.114.114', // 国内DNS
  '223.5.5.5', // 阿里DNS
];

/**
 * 互斥锁，防止对同一域名重复查询
 */
export function keyedAsyncMutexWithQueue<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (mutex.has(key)) {
    return mutex.get(key) as Promise<T>;
  }
  const promise = fn();
  mutex.set(key, promise);
  promise.finally(() => {
    mutex.delete(key);
  });
  return promise;
}

/**
 * 提取域名的顶级域名
 */
export function getApexDomain(domain: string): string | null {
  if (apexDomainCache.has(domain)) {
    return apexDomainCache.get(domain)!;
  }

  try {
    // 去除可能的前缀点号
    const cleanDomain = domain.startsWith('.') ? domain.substring(1) : domain;

    // 分割域名并提取顶级域名
    const parts = cleanDomain.split('.');
    if (parts.length < 2) {
      return null;
    }

    // 简单实现，取最后两部分作为顶级域名
    // 实际上应该使用更复杂的逻辑或库如 tldts-experimental
    const apexDomain = parts.slice(-2).join('.');
    apexDomainCache.set(domain, apexDomain);
    return apexDomain;
  } catch (error) {
    console.error(`提取顶级域名失败: ${domain}`, error);
    apexDomainCache.set(domain, null);
    return null;
  }
}

/**
 * 检查顶级域名是否存活
 */
async function isApexDomainAlive(apexDomain: string): Promise<boolean> {
  if (domainAliveCache.has(apexDomain)) {
    return domainAliveCache.get(apexDomain)!;
  }

  // 策略1: 检查是否有NS记录
  try {
    const nsRecords = await resolveNsPromise(apexDomain);
    if (nsRecords && nsRecords.length > 0) {
      domainAliveCache.set(apexDomain, true);
      return true;
    }
  } catch (error) {
    // NS查询失败，继续尝试其他方法
  }

  // 策略2: 检查是否有MX或TXT记录
  try {
    const [mxRecords, txtRecords] = await Promise.allSettled([
      resolveMxPromise(apexDomain),
      resolveTxtPromise(apexDomain),
    ]);

    if (
      (mxRecords.status === 'fulfilled' && mxRecords.value.length > 0) ||
      (txtRecords.status === 'fulfilled' && txtRecords.value.length > 0)
    ) {
      domainAliveCache.set(apexDomain, true);
      return true;
    }
  } catch (error) {
    // MX/TXT查询失败，继续尝试其他方法
  }

  // 策略3: 直接尝试解析顶级域名的IP
  try {
    const addresses = await lookupPromise(apexDomain);
    if (addresses) {
      domainAliveCache.set(apexDomain, true);
      return true;
    }
  } catch (error) {
    // 查询失败，域名可能不存在
    domainAliveCache.set(apexDomain, false);
    return false;
  }

  // 所有尝试都失败，认为域名已失效
  domainAliveCache.set(apexDomain, false);
  return false;
}

/**
 * 检查域名是否存活
 * @param domain 要检查的域名
 * @param isSuffix 是否为域名后缀（如 .example.com）
 * @returns 域名和是否存活的布尔值的元组
 */
export async function isDomainAlive(domain: string, isSuffix = false): Promise<[string, boolean]> {
  if (domainAliveCache.has(domain)) {
    return [domain, domainAliveCache.get(domain)!];
  }

  // 清理域名，去除前缀点
  const cleanDomain = domain.startsWith('.') ? domain.substring(1) : domain;

  // 检查是否是有效的域名格式
  if (!cleanDomain.includes('.')) {
    console.log('不是有效域名格式:', domain);
    domainAliveCache.set(domain, false);
    return [domain, false];
  }

  // 先查顶级域名是否存活
  const apexDomain = getApexDomain(cleanDomain);
  if (!apexDomain) {
    console.log('无法提取顶级域名:', domain);
    domainAliveCache.set(domain, false);
    return [domain, false];
  }

  // 检查顶级域名存活状态
  const apexAlive = await keyedAsyncMutexWithQueue(apexDomain, () => isApexDomainAlive(apexDomain));

  // 如果是域名后缀或顶级域名已死，直接返回顶级域名状态
  if (isSuffix || !apexAlive) {
    domainAliveCache.set(domain, apexAlive);
    return [domain, apexAlive];
  }

  // 检查具体子域名
  // 尝试A记录
  try {
    const aRecords = await resolve4Promise(cleanDomain);
    if (aRecords && aRecords.length > 0) {
      domainAliveCache.set(domain, true);
      return [domain, true];
    }
  } catch (error) {
    // A记录查询失败，继续尝试AAAA记录
  }

  // 尝试AAAA记录
  try {
    const aaaaRecords = await resolve6Promise(cleanDomain);
    if (aaaaRecords && aaaaRecords.length > 0) {
      domainAliveCache.set(domain, true);
      return [domain, true];
    }
  } catch (error) {
    // AAAA记录查询失败，继续尝试其他方法
  }

  // 如果顶级域名存活但是子域名没有记录，也视为失效
  console.log('子域名无记录:', domain);
  domainAliveCache.set(domain, false);
  return [domain, false];
}
