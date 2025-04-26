import { RuleFormat, RuleType, ParsedRule, RuleFlags } from './rule-types.js';

interface ConverterOptions {
  enableNoResolve?: boolean;
  enablePreMatching?: boolean;
  enableExtended?: boolean;
  preserveComments?: boolean;
}

export class RuleConverter {
  private format: RuleFormat;
  private options: ConverterOptions;

  constructor(format: RuleFormat) {
    this.format = format;
    this.options = {};
  }

  setOptions(options: ConverterOptions) {
    this.options = { ...this.options, ...options };
  }

  // 判断是否为有效的IPv4地址（可能包含CIDR掩码）
  private isValidIPv4(value: string): boolean {
    // IPv4地址格式：x.x.x.x 或 x.x.x.x/yy
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(\/\d{1,2})?$/;
    if (!ipv4Pattern.test(value)) return false;

    // 验证每个数字都在0-255范围内
    const octets = value.split('/')[0].split('.').map(Number);
    return octets.every(octet => octet >= 0 && octet <= 255);
  }

  // 判断是否为有效的IPv6地址（可能包含CIDR掩码）
  private isValidIPv6(value: string): boolean {
    // 分离IP和掩码
    const [ipPart, maskPart] = value.split('/');

    // 如果有掩码，检查掩码是否为有效数字
    if (maskPart !== undefined) {
      const mask = parseInt(maskPart, 10);
      if (isNaN(mask) || mask < 0 || mask > 128) return false;
    }

    // IPv6地址验证
    // 1. 检查是否包含至少一个冒号
    if (!ipPart.includes(':')) return false;

    // 2. 检查冒号数量和格式
    const segments = ipPart.split(':');

    // IPv6地址最多有8个段，双冒号可以代表一个或多个0段
    if (segments.length > 8) return false;

    // 检查是否有多个双冒号（::）
    const doubleColonCount = (ipPart.match(/::/g) || []).length;
    if (doubleColonCount > 1) return false;

    // 检查每个段是否为有效的十六进制数（0-FFFF）
    for (const segment of segments) {
      // 空段是由于双冒号产生的，这是允许的
      if (segment === '') continue;

      // 每个段必须是1-4位的十六进制数
      if (!/^[0-9A-Fa-f]{1,4}$/.test(segment)) return false;
    }

    return true;
  }

  convert(rule: string, cleanup: boolean = false): string {
    let line = rule;

    // 只在cleanup时移除空格和注释
    if (cleanup) {
      line = line.trim();
      if (line.startsWith('#') || line.startsWith(';') || line.startsWith('//')) {
        return '';
      }
    } else {
      // 非cleanup模式保留注释，但将分号(;)开头的注释转换为井号(#)开头的注释
      if (!line.trim()) {
        return line;
      }

      // 将分号(;)开头的注释转换为井号(#)开头的注释
      if (line.startsWith(';')) {
        return line.replace(/^;/, '#');
      }

      // 其他注释类型保持不变
      if (line.startsWith('#') || line.startsWith('//')) {
        return line;
      }
    }

    // 处理Clash规则格式: TYPE,VALUE
    // 例如: - DOMAIN,example.com
    if (line.startsWith('- ')) {
      line = line.substring(2).trim();
    }

    // 处理Clash yaml中的纯规则格式，例如: - example.com
    if (line.startsWith('-') && !line.substring(1).trim().includes(',')) {
      const domainValue = line.substring(1).trim();
      // 根据规则特征判断类型
      if (domainValue.startsWith('*.') || domainValue.includes('*')) {
        line = `DOMAIN-WILDCARD,${domainValue}`;
      } else {
        line = `DOMAIN,${domainValue}`;
      }
    }

    // 解析规则及参数
    let type = '';
    let value = '';
    let policy: string | undefined;
    let flags: string[] = [];

    // 处理规则行，提取类型、值、策略和标志
    let components = line.split(',');

    if (components.length >= 2) {
      type = components[0].trim().toUpperCase();
      value = components[1].trim();

      // 检查DOMAIN类型但实际是IP-CIDR的情况
      if (type === 'DOMAIN' && this.isValidIPv4(value)) {
        // 如果是IP CIDR格式，修正类型为IP-CIDR
        type = 'IP-CIDR';
        // 确保IP CIDR有掩码
        if (!value.includes('/')) {
          value += '/32';
        }
      } else if (type === 'DOMAIN' && this.isValidIPv6(value)) {
        // 如果是IPv6 CIDR格式，修正类型为IP-CIDR6
        type = 'IP-CIDR6';
        // 确保IPv6 CIDR有掩码
        if (!value.includes('/')) {
          value += '/128';
        }
      }

      // 可能的策略或标志
      let possiblePolicyOrFlag = components[2]?.trim();

      // 定义有效的策略集合
      const validPolicies = new Set([
        'REJECT',
        'DIRECT',
        'PROXY',
        'REJECT-DROP',
        'REJECT-TINYGIF',
        'REJECT-DICT',
        'REJECT-ARRAY',
      ]);

      // 检查可能的策略或标志是否为有效策略
      if (possiblePolicyOrFlag && validPolicies.has(possiblePolicyOrFlag.toUpperCase())) {
        policy = possiblePolicyOrFlag.toUpperCase();
        // 剩余的部分作为标志
        if (components.length > 3) {
          flags = components.slice(3).map(flag => flag.trim());
        }
      } else {
        // 没有有效的策略，可能是标志或未指定
        policy = undefined;
        flags = components.slice(2).map(flag => flag.trim());
      }
    } else {
      // 无类型的规则自动判断类型
      value = components[0].trim();

      // 处理域名规则
      // 1. 包含 '*' 的为 DOMAIN-WILDCARD
      if (value.includes('*')) {
        type = 'DOMAIN-WILDCARD';
      }
      // 2. 以 '.' 开头的为 DOMAIN-SUFFIX，去掉开头的 '.'
      else if (value.startsWith('.')) {
        type = 'DOMAIN-SUFFIX';
        value = value.substring(1);
      }
      // 3. 检查是否为有效的IPv4地址
      else if (this.isValidIPv4(value)) {
        // IPv4 CIDR格式
        type = 'IP-CIDR';
        // 确保IP CIDR有掩码
        if (!value.includes('/')) {
          value += '/32';
        }
      }
      // 4. 检查是否为有效的IPv6地址
      else if (this.isValidIPv6(value)) {
        // IPv6 CIDR格式
        type = 'IP-CIDR6';
        // 确保IPv6 CIDR有掩码
        if (!value.includes('/')) {
          value += '/128';
        }
      }
      // 5. 正则表达式，匹配以 '/' 开头和结尾的
      else if (/^\/.*\/$/.test(value)) {
        type = 'USER-AGENT'; // 或者其他合适的类型
      }
      // 6. 默认处理为 DOMAIN
      else {
        type = 'DOMAIN';
      }
    }

    // 基础类型转换
    type = type
      .replace(/^HOST-WILDCARD$/i, 'DOMAIN-WILDCARD')
      .replace(/^HOST-SUFFIX$/i, 'DOMAIN-SUFFIX')
      .replace(/^HOST-KEYWORD$/i, 'DOMAIN-KEYWORD')
      .replace(/^HOST$/i, 'DOMAIN')
      .replace(/^IP6-CIDR$/i, 'IP-CIDR6')
      .replace(/^GEOIP$/i, 'GEOIP')
      .replace(/^IP-ASN$/i, 'IP-ASN')
      .replace(/^DEST-PORT$/i, 'DST-PORT');

    // Clash特有规则转换为Surge规则
    if (type === 'MATCH') {
      type = 'FINAL';
    } else if (type === 'SRC-IP-CIDR') {
      type = 'SRC-IP';
    } else if (type === 'SRC-PORT') {
      type = 'SRC-PORT';
    } else if (type === 'PROCESS-NAME') {
      type = 'PROCESS-NAME';
    } else if (type === 'RULE-SET') {
      // 对于RULE-SET需要特殊处理
      type = 'RULE-SET';
    }

    // 检查是否为Surge不支持的规则类型
    const surgeUnsupportedTypes = ['MATCH-PROVIDER', 'SCRIPT', 'CLASSIC', 'RULE-SET-PROVIDER'];

    if (surgeUnsupportedTypes.includes(type)) {
      console.warn(`跳过不支持的规则类型: ${type} - ${value}`);
      return ''; // 返回空字符串，这个规则将被过滤掉
    }

    // 处理策略转换
    if (policy) {
      policy = policy.toUpperCase();
    } else {
      // 当策略缺失时，不自动添加默认策略
      policy = undefined;
    }

    // 添加flags，避免重复
    if (this.options.enableNoResolve && ['IP-CIDR', 'IP-CIDR6', 'GEOIP', 'IP-ASN'].includes(type)) {
      if (!flags.includes('no-resolve')) {
        flags.push('no-resolve');
      }
    }

    if (this.options.enablePreMatching && policy === 'REJECT') {
      // 仅当策略为 REJECT 时，才添加 pre-matching
      if (!flags.includes('pre-matching')) {
        flags.push('pre-matching');
      }
    }

    if (
      this.options.enableExtended &&
      ['DOMAIN', 'DOMAIN-SUFFIX', 'DOMAIN-KEYWORD', 'DOMAIN-WILDCARD'].includes(type)
    ) {
      if (!flags.includes('extended-matching')) {
        flags.push('extended-matching');
      }
    }

    // 避免重复添加相同的标志
    flags = Array.from(new Set(flags));

    // 重组规则
    let convertedRule = [type, value];

    if (policy) {
      convertedRule.push(policy);
    }

    if (flags.length > 0) {
      convertedRule = convertedRule.concat(flags);
    }

    return convertedRule.join(',');
  }
}
