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

  convert(rule: string, cleanup: boolean = false): string {
    let line = rule;

    // 只在cleanup时移除空格和注释
    if (cleanup) {
      line = line.trim();
      if (line.startsWith('#') || line.startsWith(';') || line.startsWith('//')) {
        return '';
      }
    } else {
      // 非cleanup模式保留空格和注释
      if (!line.trim() || line.startsWith('#') || line.startsWith(';') || line.startsWith('//')) {
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
      // 3. 全数字的 IP 地址，处理为 IP 类型
      else if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) {
        // 纯 IPv4 地址
        if (this.format === 'Surge' || this.format === 'Quantumult X') {
          type = 'IP-CIDR';
          value += '/32';
        } else if (this.format === 'Clash') {
          type = 'IP-CIDR';
        } else {
          type = 'IP-CIDR';
          value += '/32';
        }
      } else if (value.includes(':')) {
        // 纯 IPv6 地址
        if (this.format === 'Surge' || this.format === 'Quantumult X') {
          type = 'IP-CIDR6';
          value += '/128';
        } else if (this.format === 'Clash') {
          type = 'IP-CIDR6';
        } else {
          type = 'IP-CIDR6';
          value += '/128';
        }
      }
      // 4. 正则表达式，匹配以 '/' 开头和结尾的
      else if (/^\/.*\/$/.test(value)) {
        type = 'USER-AGENT'; // 或者其他合适的类型
      }
      // 5. 默认处理为 DOMAIN
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
