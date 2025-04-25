/**
 * 域名验证器 - 用于验证域名规则的有效性
 */

import dns from 'node:dns/promises';

/**
 * 从规则行中提取域名
 * @param {string} rule 规则行
 * @returns {string[]} 提取到的域名数组
 */
export function extractDomainsFromRule(rule) {
  // 跳过注释行和空行
  if (rule.startsWith('#') || rule.trim() === '') {
    return [];
  }

  // 处理不同类型的规则
  if (
    rule.includes('DOMAIN,') ||
    rule.includes('DOMAIN-SUFFIX,') ||
    rule.includes('DOMAIN-KEYWORD,')
  ) {
    const parts = rule.split(',');
    if (parts.length >= 2) {
      // 提取域名部分
      const domain = parts[1].trim();
      if (domain) {
        return [domain];
      }
    }
  } else if (/^(?:https?:\/\/)?([a-zA-Z0-9][-a-zA-Z0-9]*\.)+[a-zA-Z][-a-zA-Z0-9]*/.test(rule)) {
    // 直接是域名或URL
    try {
      const url = rule.startsWith('http') ? new URL(rule) : new URL('http://' + rule);
      return [url.hostname];
    } catch {
      // 如果无法解析为URL，尝试直接作为域名
      if (/^([a-zA-Z0-9][-a-zA-Z0-9]*\.)+[a-zA-Z][-a-zA-Z0-9]*$/.test(rule)) {
        return [rule];
      }
    }
  }

  return [];
}

/**
 * 验证域名是否有效（可解析）
 * @param {string} domain 域名
 * @returns {Promise<boolean>} 域名是否有效
 */
async function isDomainValid(domain) {
  try {
    // 尝试解析域名
    await dns.resolve(domain);
    return true;
  } catch {
    try {
      // 再次尝试使用lookupService
      await dns.lookup(domain);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * 批量验证域名
 * @param {string[]} domains 域名数组
 * @returns {Promise<{valid: string[], dead: string[]}>} 验证结果
 */
export async function validateDomains(domains) {
  const uniqueDomains = [...new Set(domains)];
  const results = await Promise.allSettled(
    uniqueDomains.map(async domain => {
      const isValid = await isDomainValid(domain);
      return { domain, isValid };
    })
  );

  const valid = [];
  const dead = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { domain, isValid } = result.value;
      if (isValid) {
        valid.push(domain);
      } else {
        dead.push(domain);
      }
    }
  }

  return { valid, dead };
}
