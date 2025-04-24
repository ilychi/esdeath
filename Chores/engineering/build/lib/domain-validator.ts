// 域名验证工具
// 实现类似Sukka的validate-domain-alive.ts功能

import dns from 'node:dns';
import { promisify } from 'node:util';

// 对DNS解析方法进行Promise包装
const dnsResolve4 = promisify(dns.resolve4);
const dnsResolve6 = promisify(dns.resolve6);
const dnsResolveMx = promisify(dns.resolveMx);
const dnsResolveNs = promisify(dns.resolveNs);

// 封装DNS服务器
const DNS_SERVERS = {
  GLOBAL: [
    '8.8.8.8', // Google DNS
    '1.1.1.1', // Cloudflare DNS
    '9.9.9.9', // Quad9
    '208.67.222.222', // OpenDNS
  ],
  CHINA: [
    '223.5.5.5', // AliDNS
    '119.29.29.29', // DNSPod/Tencent
    '114.114.114.114', // 114DNS
    '180.76.76.76', // Baidu DNS
  ],
};

// 域名缓存，避免重复查询
const domainStatusCache = new Map<string, boolean>();

// 互斥锁，防止并发请求相同域名
const domainMutex = new Map<string, Promise<boolean>>();

/**
 * 检查域名是否存活
 */
export async function isDomainAlive(domain: string): Promise<boolean> {
  // 处理以点开头的域名
  if (domain.startsWith('.')) {
    domain = domain.substring(1);
  }

  // 检查缓存
  if (domainStatusCache.has(domain)) {
    return domainStatusCache.get(domain)!;
  }

  // 检查互斥锁
  if (domainMutex.has(domain)) {
    return domainMutex.get(domain)!;
  }

  // 设置DNS服务器
  const originalServers = dns.getServers();

  // 创建检查Promise
  const checkPromise = (async () => {
    try {
      // 尝试解析A记录
      for (const dnsServer of [...DNS_SERVERS.GLOBAL, ...DNS_SERVERS.CHINA]) {
        try {
          dns.setServers([dnsServer]);
          await dnsResolve4(domain, { ttl: true });
          return true;
        } catch (e) {
          // 错误继续尝试下一个DNS服务器
        }
      }

      // 尝试解析AAAA记录
      for (const dnsServer of DNS_SERVERS.GLOBAL) {
        try {
          dns.setServers([dnsServer]);
          await dnsResolve6(domain);
          return true;
        } catch (e) {
          // 错误继续尝试下一个DNS服务器
        }
      }

      // 尝试解析NS记录
      try {
        dns.setServers(DNS_SERVERS.GLOBAL);
        await dnsResolveNs(domain);
        return true;
      } catch (e) {
        // 如果NS记录不存在，继续检查MX记录
      }

      // 尝试解析MX记录
      try {
        dns.setServers(DNS_SERVERS.GLOBAL);
        await dnsResolveMx(domain);
        return true;
      } catch (e) {
        // 所有记录都不存在，域名可能无效
        return false;
      }
    } catch (error) {
      console.error(`Error checking domain ${domain}:`, error);
      return false;
    } finally {
      // 恢复原始DNS服务器
      dns.setServers(originalServers);

      // 移除互斥锁
      domainMutex.delete(domain);
    }
  })();

  // 设置互斥锁
  domainMutex.set(domain, checkPromise);

  // 等待结果
  const isAlive = await checkPromise;

  // 缓存结果
  domainStatusCache.set(domain, isAlive);

  return isAlive;
}

/**
 * 解析规则文件，提取出所有域名
 */
export function extractDomainsFromRule(rule: string): string[] {
  const domains: string[] = [];

  // 处理不同类型的规则
  if (rule.startsWith('DOMAIN,')) {
    domains.push(rule.split(',')[1]);
  } else if (rule.startsWith('DOMAIN-SUFFIX,')) {
    domains.push('.' + rule.split(',')[1]);
  } else if (rule.startsWith('DOMAIN-KEYWORD,')) {
    // 关键词规则不检查
  } else if (!rule.includes(',')) {
    // 纯域名格式
    domains.push(rule);
  }

  return domains;
}

/**
 * 批量检查域名可用性
 */
export async function validateDomains(
  domains: string[],
  concurrency: number = 10
): Promise<{ alive: string[]; dead: string[] }> {
  const alive: string[] = [];
  const dead: string[] = [];

  // 并发控制
  const batchSize = concurrency;

  for (let i = 0; i < domains.length; i += batchSize) {
    const batch = domains.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async domain => {
        const isAlive = await isDomainAlive(domain);
        return { domain, isAlive };
      })
    );

    for (const { domain, isAlive } of results) {
      if (isAlive) {
        alive.push(domain);
      } else {
        dead.push(domain);
        console.log(`Dead domain found: ${domain}`);
      }
    }

    // 显示进度
    console.log(`Validated ${i + batch.length}/${domains.length} domains...`);
  }

  return { alive, dead };
}
