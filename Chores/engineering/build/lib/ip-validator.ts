// IP规则验证工具
// 用于验证IP-CIDR、IP-CIDR6、GEOIP和IP-ASN规则的有效性

import { networkInterfaces } from 'node:os';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import https from 'node:https';

// 定义规则类型
export enum IPRuleType {
  IP_CIDR = 'IP-CIDR',
  IP_CIDR6 = 'IP-CIDR6',
  GEOIP = 'GEOIP',
  IP_ASN = 'IP-ASN',
  UNKNOWN = 'UNKNOWN',
}

// 国家代码和自治系统号缓存
const validCountryCodes = new Set<string>();
const validASNs = new Map<number, boolean>();

// 规则解析缓存
const ipRuleCache = new Map<string, boolean>();

/**
 * 验证IPv4 CIDR格式
 */
export function isValidIPv4CIDR(cidr: string): boolean {
  // 先检查缓存
  if (ipRuleCache.has(cidr)) {
    return ipRuleCache.get(cidr)!;
  }

  try {
    // 分割为IP和前缀
    const [ip, prefix] = cidr.split('/');

    // 验证前缀部分
    const prefixNum = parseInt(prefix, 10);
    if (isNaN(prefixNum) || prefixNum < 0 || prefixNum > 32) {
      ipRuleCache.set(cidr, false);
      return false;
    }

    // 验证IP部分
    const parts = ip.split('.');
    if (parts.length !== 4) {
      ipRuleCache.set(cidr, false);
      return false;
    }

    for (const part of parts) {
      const num = parseInt(part, 10);
      if (isNaN(num) || num < 0 || num > 255) {
        ipRuleCache.set(cidr, false);
        return false;
      }
    }

    ipRuleCache.set(cidr, true);
    return true;
  } catch (error) {
    console.error(`Error validating IPv4 CIDR ${cidr}:`, error);
    ipRuleCache.set(cidr, false);
    return false;
  }
}

/**
 * 验证IPv6 CIDR格式
 */
export function isValidIPv6CIDR(cidr: string): boolean {
  // 先检查缓存
  if (ipRuleCache.has(cidr)) {
    return ipRuleCache.get(cidr)!;
  }

  try {
    // 分割为IP和前缀
    const [ip, prefix] = cidr.split('/');

    // 验证前缀部分
    const prefixNum = parseInt(prefix, 10);
    if (isNaN(prefixNum) || prefixNum < 0 || prefixNum > 128) {
      ipRuleCache.set(cidr, false);
      return false;
    }

    // 基本IPv6格式验证
    const ipv6Regex =
      /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

    const isValid = ipv6Regex.test(ip);
    ipRuleCache.set(cidr, isValid);
    return isValid;
  } catch (error) {
    console.error(`Error validating IPv6 CIDR ${cidr}:`, error);
    ipRuleCache.set(cidr, false);
    return false;
  }
}

/**
 * 加载有效的国家代码
 */
export async function loadValidCountryCodes(): Promise<void> {
  // 如果已加载，直接返回
  if (validCountryCodes.size > 0) {
    return;
  }

  try {
    // ISO 3166-1 alpha-2 国家代码
    const commonCodes = [
      'AD',
      'AE',
      'AF',
      'AG',
      'AI',
      'AL',
      'AM',
      'AO',
      'AQ',
      'AR',
      'AS',
      'AT',
      'AU',
      'AW',
      'AX',
      'AZ',
      'BA',
      'BB',
      'BD',
      'BE',
      'BF',
      'BG',
      'BH',
      'BI',
      'BJ',
      'BL',
      'BM',
      'BN',
      'BO',
      'BQ',
      'BR',
      'BS',
      'BT',
      'BV',
      'BW',
      'BY',
      'BZ',
      'CA',
      'CC',
      'CD',
      'CF',
      'CG',
      'CH',
      'CI',
      'CK',
      'CL',
      'CM',
      'CN',
      'CO',
      'CR',
      'CU',
      'CV',
      'CW',
      'CX',
      'CY',
      'CZ',
      'DE',
      'DJ',
      'DK',
      'DM',
      'DO',
      'DZ',
      'EC',
      'EE',
      'EG',
      'EH',
      'ER',
      'ES',
      'ET',
      'FI',
      'FJ',
      'FK',
      'FM',
      'FO',
      'FR',
      'GA',
      'GB',
      'GD',
      'GE',
      'GF',
      'GG',
      'GH',
      'GI',
      'GL',
      'GM',
      'GN',
      'GP',
      'GQ',
      'GR',
      'GS',
      'GT',
      'GU',
      'GW',
      'GY',
      'HK',
      'HM',
      'HN',
      'HR',
      'HT',
      'HU',
      'ID',
      'IE',
      'IL',
      'IM',
      'IN',
      'IO',
      'IQ',
      'IR',
      'IS',
      'IT',
      'JE',
      'JM',
      'JO',
      'JP',
      'KE',
      'KG',
      'KH',
      'KI',
      'KM',
      'KN',
      'KP',
      'KR',
      'KW',
      'KY',
      'KZ',
      'LA',
      'LB',
      'LC',
      'LI',
      'LK',
      'LR',
      'LS',
      'LT',
      'LU',
      'LV',
      'LY',
      'MA',
      'MC',
      'MD',
      'ME',
      'MF',
      'MG',
      'MH',
      'MK',
      'ML',
      'MM',
      'MN',
      'MO',
      'MP',
      'MQ',
      'MR',
      'MS',
      'MT',
      'MU',
      'MV',
      'MW',
      'MX',
      'MY',
      'MZ',
      'NA',
      'NC',
      'NE',
      'NF',
      'NG',
      'NI',
      'NL',
      'NO',
      'NP',
      'NR',
      'NU',
      'NZ',
      'OM',
      'PA',
      'PE',
      'PF',
      'PG',
      'PH',
      'PK',
      'PL',
      'PM',
      'PN',
      'PR',
      'PS',
      'PT',
      'PW',
      'PY',
      'QA',
      'RE',
      'RO',
      'RS',
      'RU',
      'RW',
      'SA',
      'SB',
      'SC',
      'SD',
      'SE',
      'SG',
      'SH',
      'SI',
      'SJ',
      'SK',
      'SL',
      'SM',
      'SN',
      'SO',
      'SR',
      'SS',
      'ST',
      'SV',
      'SX',
      'SY',
      'SZ',
      'TC',
      'TD',
      'TF',
      'TG',
      'TH',
      'TJ',
      'TK',
      'TL',
      'TM',
      'TN',
      'TO',
      'TR',
      'TT',
      'TV',
      'TW',
      'TZ',
      'UA',
      'UG',
      'UM',
      'US',
      'UY',
      'UZ',
      'VA',
      'VC',
      'VE',
      'VG',
      'VI',
      'VN',
      'VU',
      'WF',
      'WS',
      'YE',
      'YT',
      'ZA',
      'ZM',
      'ZW',
    ];

    // 将常见国家代码添加到集合中
    for (const code of commonCodes) {
      validCountryCodes.add(code);
    }

    // 可以选择从外部API加载更完整的国家代码列表
    // 或者从本地文件加载
    console.log(`Loaded ${validCountryCodes.size} valid country codes`);
  } catch (error) {
    console.error('Error loading valid country codes:', error);
  }
}

/**
 * 验证国家代码
 */
export async function isValidCountryCode(code: string): Promise<boolean> {
  await loadValidCountryCodes();
  return validCountryCodes.has(code.toUpperCase());
}

/**
 * 验证ASN号
 */
export async function isValidASN(asn: number): Promise<boolean> {
  // 先检查缓存
  if (validASNs.has(asn)) {
    return validASNs.get(asn)!;
  }

  try {
    // 简单验证ASN范围 (合法ASN范围是1-4294967295)
    if (asn < 1 || asn > 4294967295) {
      validASNs.set(asn, false);
      return false;
    }

    // 对于更精确的验证，可以实现查询ASN数据库
    // 但简单起见，我们假设在有效范围内的ASN都是有效的
    validASNs.set(asn, true);
    return true;
  } catch (error) {
    console.error(`Error validating ASN ${asn}:`, error);
    validASNs.set(asn, false);
    return false;
  }
}

/**
 * 解析规则字符串，获取规则类型和值
 */
export function parseIPRule(rule: string): { type: IPRuleType; value: string } {
  const trimmedRule = rule.trim();

  if (trimmedRule.startsWith(IPRuleType.IP_CIDR + ',')) {
    return {
      type: IPRuleType.IP_CIDR,
      value: trimmedRule.substring(IPRuleType.IP_CIDR.length + 1).split(',')[0],
    };
  } else if (trimmedRule.startsWith(IPRuleType.IP_CIDR6 + ',')) {
    return {
      type: IPRuleType.IP_CIDR6,
      value: trimmedRule.substring(IPRuleType.IP_CIDR6.length + 1).split(',')[0],
    };
  } else if (trimmedRule.startsWith(IPRuleType.GEOIP + ',')) {
    return {
      type: IPRuleType.GEOIP,
      value: trimmedRule.substring(IPRuleType.GEOIP.length + 1).split(',')[0],
    };
  } else if (trimmedRule.startsWith(IPRuleType.IP_ASN + ',')) {
    return {
      type: IPRuleType.IP_ASN,
      value: trimmedRule.substring(IPRuleType.IP_ASN.length + 1).split(',')[0],
    };
  } else {
    return {
      type: IPRuleType.UNKNOWN,
      value: '',
    };
  }
}

/**
 * 验证单条IP规则
 */
export async function validateIPRule(rule: string): Promise<boolean> {
  const { type, value } = parseIPRule(rule);

  switch (type) {
    case IPRuleType.IP_CIDR:
      return isValidIPv4CIDR(value);

    case IPRuleType.IP_CIDR6:
      return isValidIPv6CIDR(value);

    case IPRuleType.GEOIP:
      return await isValidCountryCode(value);

    case IPRuleType.IP_ASN:
      const asnNum = parseInt(value, 10);
      if (isNaN(asnNum)) return false;
      return await isValidASN(asnNum);

    default:
      return false;
  }
}

/**
 * 批量验证IP规则
 */
export async function validateIPRules(
  rules: string[],
  concurrency: number = 20
): Promise<{ valid: string[]; invalid: string[] }> {
  const valid: string[] = [];
  const invalid: string[] = [];

  // 预加载国家代码
  await loadValidCountryCodes();

  // 并发控制
  const batchSize = concurrency;

  for (let i = 0; i < rules.length; i += batchSize) {
    const batch = rules.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async rule => {
        const isValid = await validateIPRule(rule);
        return { rule, isValid };
      })
    );

    for (const { rule, isValid } of results) {
      if (isValid) {
        valid.push(rule);
      } else {
        invalid.push(rule);
        const { type, value } = parseIPRule(rule);
        console.log(`Invalid IP rule found: ${rule} (Type: ${type}, Value: ${value})`);
      }
    }

    // 显示进度
    console.log(`Validated ${i + batch.length}/${rules.length} IP rules...`);
  }

  return { valid, invalid };
}

/**
 * 从规则文件中提取IP规则
 */
export function extractIPRulesFromFile(content: string): string[] {
  const lines = content.split(/\r?\n/);
  const ipRules: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 跳过注释和空行
    if (trimmedLine.startsWith('#') || trimmedLine === '') {
      continue;
    }

    // 检查是否是IP规则
    if (
      trimmedLine.startsWith(IPRuleType.IP_CIDR + ',') ||
      trimmedLine.startsWith(IPRuleType.IP_CIDR6 + ',') ||
      trimmedLine.startsWith(IPRuleType.GEOIP + ',') ||
      trimmedLine.startsWith(IPRuleType.IP_ASN + ',')
    ) {
      ipRules.push(trimmedLine);
    }
  }

  return ipRules;
}

/**
 * 从目录中收集所有IP规则
 */
export async function collectIPRulesFromDirectory(dirPath: string): Promise<string[]> {
  const ipRules: string[] = [];

  async function scanDir(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.list')) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const rules = extractIPRulesFromFile(content);
          ipRules.push(...rules);
        } catch (error) {
          console.error(`Error reading file ${fullPath}:`, error);
        }
      }
    }
  }

  await scanDir(dirPath);
  return ipRules;
}
