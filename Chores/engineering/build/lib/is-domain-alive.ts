import dns2, { DnsResponse as DNS2Response, PacketQuestion, DnsResolver } from 'dns2';
import asyncRetry from 'async-retry';
import picocolors from 'picocolors';
import { looseTldtsOpt } from '../constants/loose-tldts-opt.js';
import { createKeyedAsyncMutex } from './keyed-async-mutex.js';
import { pickRandom } from 'foxts/pick-random';
import tldts from 'tldts-experimental';
import * as whoiser from 'whoiser';
import process from 'node:process';
import { createRetrieKeywordFilter as createKeywordFilter } from 'foxts/retrie';
import { dohCache } from './doh-cache.js';

const domainAliveMap = new Map<string, boolean>();

class DnsError extends Error {
  name = 'DnsError';
  constructor(readonly message: string, public readonly server: string) {
    super(message);
  }
}

interface DnsResponse extends DNS2Response {
  dns: string
}

const dohServers: Array<[string, DnsResolver]> = ([
  '8.8.8.8',
  '8.8.4.4',
  '1.0.0.1',
  '1.1.1.1',
  '162.159.36.1',
  '162.159.46.1',
  'dns.cloudflare.com', // Cloudflare DoH that uses different IPs
  // one.one.one.one // Cloudflare DoH that uses 1.1.1.1 and 1.0.0.1
  '101.101.101.101', // TWNIC
  '185.222.222.222', // DNS.SB
  '45.11.45.11', // DNS.SB
  'doh.dns.sb', // DNS.SB, Different PoPs w/ GeoDNS
  // 'doh.sb', // DNS.SB xTom Anycast IP
  // 'dns.sb', // DNS.SB use same xTom Anycast IP as doh.sb
  'dns10.quad9.net', // Quad9 unfiltered
  'doh.sandbox.opendns.com', // OpenDNS sandbox (unfiltered)
  'unfiltered.adguard-dns.com',
  // '0ms.dev', // Proxy Cloudflare
  // '76.76.2.0', // ControlD unfiltered, path not /dns-query
  // '76.76.10.0', // ControlD unfiltered, path not /dns-query
  // 'dns.bebasid.com', // BebasID, path not /dns-query but /unfiltered
  // '193.110.81.0', // dns0.eu
  // '185.253.5.0', // dns0.eu
  // 'zero.dns0.eu',
  'dns.nextdns.io',
  'anycast.dns.nextdns.io',
  'wikimedia-dns.org',
  'puredns.org',
  // 'ordns.he.net',
  // 'dns.mullvad.net',
  'basic.rethinkdns.com'
  // '198.54.117.10' // NameCheap DNS, supports DoT, DoH, UDP53
  // 'ada.openbld.net',
  // 'dns.rabbitdns.org'
] as const).map(dns => [
  dns,
  dns2.DOHClient({
    dns,
    http: false
  })
] as const);

const domesticDohServers: Array<[string, DnsResolver]> = ([
  '223.5.5.5',
  '223.6.6.6',
  '120.53.53.53',
  '1.12.12.12'
] as const).map(dns => [
  dns,
  dns2.DOHClient({
    dns,
    http: false
  })
] as const);

const domainAliveMutex = createKeyedAsyncMutex<boolean>('isDomainAlive');

export async function isDomainAlive(
  domain: string,
  // we dont need to check domain[0] here, this is only from runAgainstSourceFile
  isIncludeAllSubdomain: boolean = false
): Promise<boolean> {
  if (domainAliveMap.has(domain)) {
    return domainAliveMap.get(domain)!;
  }
  const apexDomain = tldts.getDomain(domain, looseTldtsOpt);
  if (!apexDomain) {
    // console.log(picocolors.gray('[domain invalid]'), picocolors.gray('no apex domain'), { domain });
    domainAliveMap.set('.' + domain, true);
    return true;
  }

  const apexDomainAlive = await isApexDomainAlive(apexDomain);
  if (isIncludeAllSubdomain || domain.length > apexDomain.length) {
    return apexDomainAlive;
  }
  if (!apexDomainAlive) {
    return false;
  }

  return domainAliveMutex.acquire(domain, async () => {
    domain = domain[0] === '.' ? domain.slice(1) : domain;

    const aDns: string[] = [];
    const aaaaDns: string[] = [];

    // test 2 times before make sure record is empty
    const servers = pickRandom(dohServers, 2);
    for (let i = 0; i < 2; i++) {
    // eslint-disable-next-line no-await-in-loop -- sequential
      const aRecords = (await $resolve(domain, 'A', servers[i]));
      if (aRecords.answers.length > 0) {
        domainAliveMap.set(domain, true);
        return true;
      }

      aDns.push(aRecords.dns);
    }
    for (let i = 0; i < 2; i++) {
    // eslint-disable-next-line no-await-in-loop -- sequential
      const aaaaRecords = (await $resolve(domain, 'AAAA', servers[i]));
      if (aaaaRecords.answers.length > 0) {
        domainAliveMap.set(domain, true);
        return true;
      }

      aaaaDns.push(aaaaRecords.dns);
    }

    // only then, let's test twice with domesticDohServers
    const domesticServers = pickRandom(domesticDohServers, 2);
    for (let i = 0; i < 2; i++) {
    // eslint-disable-next-line no-await-in-loop -- sequential
      const aRecords = (await $resolve(domain, 'A', domesticServers[i]));
      if (aRecords.answers.length > 0) {
        domainAliveMap.set(domain, true);
        return true;
      }

      aDns.push(aRecords.dns);
    }
    for (let i = 0; i < 2; i++) {
    // eslint-disable-next-line no-await-in-loop -- sequential
      const aaaaRecords = (await $resolve(domain, 'AAAA', domesticServers[i]));
      if (aaaaRecords.answers.length > 0) {
        domainAliveMap.set(domain, true);
        return true;
      }

      aaaaDns.push(aaaaRecords.dns);
    }

    console.log(picocolors.red('[dead subdomain]'), { domain, aDns: new Set(aDns), aaaaDns: new Set(aaaaDns) });
    domainAliveMap.set(domain, false);
    return false;
  });
}

const apexDomainMap = createKeyedAsyncMutex<boolean>('isApexDomainAlive');

function isApexDomainAlive(apexDomain: string) {
  if (domainAliveMap.has(apexDomain)) {
    return domainAliveMap.get(apexDomain)!;
  }

  return apexDomainMap.acquire(apexDomain, async () => {
    const servers = pickRandom(dohServers, 2);
    for (let i = 0, len = servers.length; i < len; i++) {
      const server = servers[i];
      // eslint-disable-next-line no-await-in-loop -- one by one
      const resp = await $resolve(apexDomain, 'NS', server);
      if (resp.answers.length > 0) {
        domainAliveMap.set(apexDomain, true);
        return true;
      }
    }

    let whois: whoiser.WhoisSearchResult;
    try {
      whois = await getWhois(apexDomain);
    } catch (e) {
      console.log(picocolors.red('[whois error]'), { domain: apexDomain }, e);
      domainAliveMap.set(apexDomain, true);
      return true;
    }

    const whoisError = noWhois(whois);
    if (!whoisError) {
      console.log(picocolors.gray('[domain alive]'), picocolors.gray('whois found'), { domain: apexDomain });
      domainAliveMap.set(apexDomain, true);
      return true;
    }

    console.log(picocolors.red('[domain dead]'), 'whois not found', { domain: apexDomain, err: whoisError });

    domainAliveMap.set(apexDomain, false);
    return false;
  });
}

async function $resolve(name: string, type: PacketQuestion, server: [string, DnsResolver]) {
  const [dohServer, dohClient] = server;
  
  // 尝试从缓存获取
  const cacheKey = dohCache.getCacheKey(name, type, dohServer);
  const cachedResponse = dohCache.get(cacheKey);
  
  if (cachedResponse) {
    try {
      const parsed = JSON.parse(cachedResponse) as DnsResponse;
      return parsed;
    } catch (e) {
      // 缓存数据损坏，继续执行查询
    }
  }

  // 执行 DoH 查询
  try {
    return await asyncRetry(async () => {
      try {
        const response = await dohClient(name, type);
        const result = {
          ...response,
          dns: dohServer
        } satisfies DnsResponse;
        
        // 缓存成功的响应
        // TTL 设置：有答案的缓存更久（1小时），无答案的缓存较短（5分钟）
        const ttl = result.answers.length > 0 ? 3600000 : 300000;
        dohCache.set(cacheKey, JSON.stringify(result), ttl);
        
        return result;
      } catch (e) {
        // console.error(e);
        throw new DnsError((e as Error).message, dohServer);
      }
    }, { retries: 5 });
  } catch (e) {
    console.log('[doh error]', name, type, e);
    throw e;
  }
}

async function getWhois(domain: string) {
  return asyncRetry(() => (whoiser as any).whoisDomain(domain, { raw: true }), { retries: 5 });
}

// TODO: this is a workaround for https://github.com/LayeredStudio/whoiser/issues/117
const whoisNotFoundKeywordTest = createKeywordFilter([
  'no match for',
  'does not exist',
  'not found',
  'no found',
  'no entries',
  'no data found',
  'is available for registration',
  'currently available for application',
  'no matching record',
  'no information available about domain name',
  'not been registered',
  'no match!!',
  'status: available',
  ' is free',
  'no object found',
  'nothing found',
  'status: free',
  // 'pendingdelete',
  ' has been blocked by '
]);

// whois server can redirect, so whoiser might/will get info from multiple whois servers
// some servers (like TLD whois servers) might have cached/outdated results
// we can only make sure a domain is alive once all response from all whois servers demonstrate so
function noWhois(whois: whoiser.WhoisSearchResult): null | string {
  let empty = true;

  for (const key in whois) {
    if (Object.hasOwn(whois, key)) {
      empty = false;

      // if (key === 'error') {
      //   // if (
      //   //   (typeof whois.error === 'string' && whois.error)
      //   //   || (Array.isArray(whois.error) && whois.error.length > 0)
      //   // ) {
      //   //   console.error(whois);
      //   //   return true;
      //   // }
      //   continue;
      // }

      // if (key === 'text') {
      //   if (Array.isArray(whois.text)) {
      //     for (const value of whois.text) {
      //       if (whoisNotFoundKeywordTest(value.toLowerCase())) {
      //         return value;
      //       }
      //     }
      //   }
      //   continue;
      // }
      // if (key === 'Name Server') {
      //   // if (Array.isArray(whois[key]) && whois[key].length === 0) {
      //   //   return false;
      //   // }
      //   continue;
      // }

      // if (key === 'Domain Status') {
      //   if (Array.isArray(whois[key])) {
      //     for (const status of whois[key]) {
      //       if (status === 'free' || status === 'AVAILABLE') {
      //         return key + ': ' + status;
      //       }
      //       if (whoisNotFoundKeywordTest(status.toLowerCase())) {
      //         return key + ': ' + status;
      //       }
      //     }
      //   }

      //   continue;
      // }

      // if (typeof whois[key] === 'string' && whois[key]) {
      //   if (whoisNotFoundKeywordTest(whois[key].toLowerCase())) {
      //     return key + ': ' + whois[key];
      //   }

      //   continue;
      // }

      if (key === '__raw' && typeof whois.__raw === 'string') {
        const lines = whois.__raw.trim().toLowerCase().replaceAll(/[\t ]+/g, ' ').split(/\r?\n/);

        if (process.env.DEBUG) {
          console.log({ lines });
        }

        for (const line of lines) {
          if (whoisNotFoundKeywordTest(line)) {
            return line;
          }
        }
        continue;
      }

      if (typeof whois[key] === 'object' && !Array.isArray(whois[key])) {
        const tmp = noWhois(whois[key] as whoiser.WhoisSearchResult);
        if (tmp) {
          return tmp;
        }
        continue;
      }
    }
  }

  if (empty) {
    return 'whois is empty';
  }

  return null;
}

// 导出辅助函数供其他模块使用 - 移除泛型约束，直接使用 any
export function keyedAsyncMutexWithQueue(key: string, fn: () => Promise<any>): Promise<any> {
  return domainAliveMutex.acquire(key, fn);
}

// 保持向后兼容的旧 API
export async function isDomainAlive_legacy(domain: string, isSuffix = false): Promise<[string, boolean]> {
  const result = await isDomainAlive(domain, isSuffix);
  return [domain, result];
}

// 重新导出 getApexDomain 以保持兼容性
export function getApexDomain(domain: string): string | null {
  return tldts.getDomain(domain, looseTldtsOpt);
}
