/**
 * IP验证器 - 用于验证IP规则的有效性
 */

import net from 'node:net';

/**
 * 从规则文件中提取IP规则
 * @param {string} content 文件内容
 * @returns {string[]} IP规则数组
 */
export function extractIPRulesFromFile(content) {
  const lines = content.split(/\r?\n/);
  const ipRules = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 跳过注释和空行
    if (trimmedLine.startsWith('#') || trimmedLine === '') {
      continue;
    }

    // 匹配IP规则类型
    if (
      trimmedLine.startsWith('IP-CIDR,') ||
      trimmedLine.startsWith('IP-CIDR6,') ||
      trimmedLine.startsWith('GEOIP,') ||
      trimmedLine.startsWith('IP-ASN,')
    ) {
      ipRules.push(trimmedLine);
    }
  }

  return ipRules;
}

/**
 * 验证IPv4 CIDR格式是否正确
 * @param {string} cidr IPv4 CIDR字符串
 * @returns {boolean} 是否有效
 */
function isValidIPv4CIDR(cidr) {
  const parts = cidr.split('/');
  if (parts.length !== 2) return false;

  const [ip, prefix] = parts;

  // 验证IP地址格式
  if (!net.isIPv4(ip)) return false;

  // 验证前缀长度
  const prefixNum = parseInt(prefix, 10);
  if (isNaN(prefixNum) || prefixNum < 0 || prefixNum > 32) return false;

  return true;
}

/**
 * 验证IPv6 CIDR格式是否正确
 * @param {string} cidr IPv6 CIDR字符串
 * @returns {boolean} 是否有效
 */
function isValidIPv6CIDR(cidr) {
  const parts = cidr.split('/');
  if (parts.length !== 2) return false;

  const [ip, prefix] = parts;

  // 验证IP地址格式
  if (!net.isIPv6(ip)) return false;

  // 验证前缀长度
  const prefixNum = parseInt(prefix, 10);
  if (isNaN(prefixNum) || prefixNum < 0 || prefixNum > 128) return false;

  return true;
}

/**
 * 验证ASN格式是否正确
 * @param {string} asn ASN字符串
 * @returns {boolean} 是否有效
 */
function isValidASN(asn) {
  // ASN格式为AS后跟数字，如AS15169
  return /^AS\d+$/.test(asn);
}

/**
 * 验证IP规则是否有效
 * @param {string} rule IP规则
 * @returns {boolean} 是否有效
 */
function isValidIPRule(rule) {
  const parts = rule.split(',');
  if (parts.length < 2) return false;

  const [ruleType, value] = parts;

  switch (ruleType) {
    case 'IP-CIDR':
      return isValidIPv4CIDR(value);
    case 'IP-CIDR6':
      return isValidIPv6CIDR(value);
    case 'GEOIP':
      // GEOIP通常是两个字母的国家代码
      return /^[A-Z]{2}$/.test(value);
    case 'IP-ASN':
      return isValidASN(value);
    default:
      return false;
  }
}

/**
 * 批量验证IP规则
 * @param {string[]} rules IP规则数组
 * @returns {Promise<{valid: string[], invalid: string[]}>} 验证结果
 */
export async function validateIPRules(rules) {
  const valid = [];
  const invalid = [];

  for (const rule of rules) {
    if (isValidIPRule(rule)) {
      valid.push(rule);
    } else {
      invalid.push(rule);
    }
  }

  return { valid, invalid };
}
