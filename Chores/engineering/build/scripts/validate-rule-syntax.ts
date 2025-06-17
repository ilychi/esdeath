/**
 * 规则语法验证脚本
 * 
 * 功能：
 * 1. 验证规则文件的语法正确性
 * 2. 检查规则类型、参数格式、IP地址等
 * 3. 输出详细的语法错误报告
 * 4. 支持GitHub Actions集成
 * 
 * 基于Surge lib/rules的验证逻辑
 */

import path from 'node:path';
import * as fs from 'node:fs/promises';
import * as net from 'node:net';
import { fdir as Fdir } from 'fdir';
import picocolors from 'picocolors';

interface RuleSyntaxError {
  file: string;
  line: number;
  content: string;
  ruleType: string;
  reason?: string;
  severity: 'error' | 'warning';
}

/**
 * 支持的规则类型及其验证配置
 */
const RULE_TYPES = {
  // 域名规则
  'DOMAIN': { validateValue: 'domain' },
  'DOMAIN-SUFFIX': { validateValue: 'domain' },
  'DOMAIN-KEYWORD': { validateValue: 'string' }, // 关键词，不需要完整域名格式
  'DOMAIN-WILDCARD': { validateValue: 'wildcard-domain' },
  'DOMAIN-SET': { validateValue: 'string' },
  
  // IP规则
  'IP-CIDR': { validateValue: 'ip-or-cidr' },
  'IP-CIDR6': { validateValue: 'ipv6-cidr' },
  'GEOIP': { validateValue: 'country-code' },
  'IP-ASN': { validateValue: 'asn' },
  
  // HTTP规则
  'USER-AGENT': { validateValue: 'string' },
  'URL-REGEX': { validateValue: 'regex' },
  
  // 进程规则
  'PROCESS-NAME': { validateValue: 'string' },
  
  // 杂项规则
  'DEST-PORT': { validateValue: 'port-range' },
  'DST-PORT': { validateValue: 'port-range' },
  'SRC-PORT': { validateValue: 'port-range' },
  'SRC-IP': { validateValue: 'ip-or-cidr' },
  'PROTOCOL': { validateValue: 'protocol' },
  'SCRIPT': { validateValue: 'string' },
  'CELLULAR-RADIO': { validateValue: 'string' },
  'DEVICE-NAME': { validateValue: 'string' },
  
  // 子网规则
  'SUBNET': { validateValue: 'string' },
  
  // 规则集
  'RULE-SET': { validateValue: 'string' },
  
  // 最终规则
  'FINAL': { validateValue: 'none' }
} as const;

/**
 * 支持的策略类型
 */
const POLICIES = new Set([
  'DIRECT', 'REJECT', 'REJECT-TINYGIF', 'REJECT-DROP', 'REJECT-NO-DROP',
  'PROXY', 'RULE-SET', 'DOMAIN-SET', 'SCRIPT'
]);

/**
 * 处理单行文本，移除注释和空行 - 修复版本
 */
function processLine(line: string): string | null {
  let processed = line.trim();
  
  // 跳过空行
  if (!processed) return null;
  
  // 跳过纯注释行
  if (processed.startsWith('#') || processed.startsWith('//')) return null;
  
  // 移除行内注释 - 修复版本
  // 处理 // 注释
  const doubleSlashIndex = processed.indexOf('//');
  if (doubleSlashIndex !== -1) {
    processed = processed.substring(0, doubleSlashIndex).trim();
  }
  
  // 处理 # 注释（但要小心URL中的#）
  const hashIndex = processed.indexOf('#');
  if (hashIndex !== -1) {
    // 检查是否在URL中（简单检查：前面有://）
    const beforeHash = processed.substring(0, hashIndex);
    if (!beforeHash.includes('://') || beforeHash.lastIndexOf('://') < beforeHash.lastIndexOf(',')) {
      processed = processed.substring(0, hashIndex).trim();
    }
  }
  
  // 再次检查是否为空
  if (!processed) return null;
  
  return processed;
}

/**
 * 验证域名格式 - 改进版本
 */
function validateDomain(domain: string): boolean {
  if (!domain || domain.length === 0) return false;
  
  // 允许特殊标识域名（如 Sukka 的标识）
  if (domain.includes('_rule5et_1s_m4d3_by_') || 
      domain.includes('_ruleset_is_made_by_')) {
    return true;
  }
  
  // 基本域名格式检查
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain);
}

/**
 * 验证通配符域名模式
 */
function validateWildcardDomain(pattern: string): boolean {
  if (!pattern || pattern.length === 0) {
    return false;
  }

  // 基本格式检查 - 通配符域名应该包含至少一个点
  if (!pattern.includes('.')) {
    return false;
  }

  // 不能以点开头或结尾
  if (pattern.startsWith('.') || pattern.endsWith('.')) {
    return false;
  }

  // 检查是否包含通配符
  if (!pattern.includes('*') && !pattern.includes('?')) {
    return false; // DOMAIN-WILDCARD 必须包含通配符
  }

  // 分解域名部分
  const parts = pattern.split('.');
  if (parts.length < 2) {
    return false;
  }

  // TLD部分（最后一部分）不应包含通配符
  const tld = parts[parts.length - 1];
  if (tld.includes('*') || tld.includes('?')) {
    return false;
  }

  // TLD应该是有效的（至少2个字符的字母）
  if (!/^[a-zA-Z]{2,}$/.test(tld)) {
    return false;
  }

  // 检查每个部分是否合理
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    
    // 不能为空
    if (part === '') {
      return false;
    }

    // 检查字符是否合法（字母、数字、连字符、通配符）
    if (!/^[a-zA-Z0-9\-*?]+$/.test(part)) {
      return false;
    }

    // 不能以连字符开头或结尾（除非是通配符）
    if ((part.startsWith('-') || part.endsWith('-')) && 
        !part.includes('*') && !part.includes('?')) {
      return false;
    }
  }

  return true;
}

/**
 * 验证IP CIDR格式
 */
function validateIPCIDR(cidr: string, version: 4 | 6 = 4): boolean {
  if (!cidr.includes('/')) {
    // 单个IP地址
    return net.isIP(cidr) === version;
  }
  
  const [ip, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr, 10);
  
  if (net.isIP(ip) !== version) return false;
  
  if (version === 4) {
    return prefix >= 0 && prefix <= 32;
  } else {
    return prefix >= 0 && prefix <= 128;
  }
}

/**
 * 验证端口范围
 */
function validatePortRange(portRange: string): boolean {
  if (portRange.includes('-')) {
    const [start, end] = portRange.split('-');
    const startPort = parseInt(start, 10);
    const endPort = parseInt(end, 10);
    
    return startPort >= 1 && startPort <= 65535 && 
           endPort >= 1 && endPort <= 65535 && 
           startPort <= endPort;
  } else {
    const port = parseInt(portRange, 10);
    return port >= 1 && port <= 65535;
  }
}

/**
 * 验证ASN格式
 */
function validateASN(asn: string): boolean {
  const asnRegex = /^(AS)?(\d+)$/i;
  const match = asn.match(asnRegex);
  if (!match) return false;
  
  const asnNumber = parseInt(match[2], 10);
  return asnNumber >= 1 && asnNumber <= 4294967295; // 32-bit ASN
}

/**
 * 验证国家代码 - 改进版本
 */
function validateCountryCode(code: string): boolean {
  if (!code || code.length === 0) return false;
  
  // 支持特殊的 GEOIP 代码
  const specialCodes = new Set(['NETFLIX', 'CN', 'US', 'JP', 'KR', 'TW', 'HK', 'SG']);
  if (specialCodes.has(code.toUpperCase())) {
    return true;
  }
  
  // 标准的两字母国家代码
  return /^[A-Z]{2}$/i.test(code);
}

/**
 * 验证正则表达式
 */
function validateRegex(regex: string): boolean {
  try {
    new RegExp(regex);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证协议类型
 */
function validateProtocol(protocol: string): boolean {
  const validProtocols = new Set([
    'HTTP', 'HTTPS', 'TCP', 'UDP', 'ICMP', 'DOH', 'DOH3', 'DOQ', 'QUIC'
  ]);
  return validProtocols.has(protocol.toUpperCase());
}

/**
 * 根据类型验证规则值
 */
function validateRuleValue(value: string, validateType: string): { valid: boolean; reason?: string } {
  switch (validateType) {
    case 'domain': {
      const isValid = validateDomain(value);
      return isValid ? { valid: true } : { valid: false, reason: '域名格式无效' };
    }
      
    case 'wildcard-domain': {
      const isValid = validateWildcardDomain(value);
      return isValid ? { valid: true } : { valid: false, reason: '通配符域名格式无效' };
    }
      
    case 'ipv4-cidr': {
      const isValid = validateIPCIDR(value, 4);
      return isValid ? { valid: true } : { valid: false, reason: 'IPv4 CIDR格式无效' };
    }
      
    case 'ipv6-cidr': {
      const isValid = validateIPCIDR(value, 6);
      return isValid ? { valid: true } : { valid: false, reason: 'IPv6 CIDR格式无效' };
    }
      
    case 'ip-or-cidr': {
      const isValidIPv4 = validateIPCIDR(value, 4);
      const isValidIPv6 = validateIPCIDR(value, 6);
      const isValid = isValidIPv4 || isValidIPv6;
      return isValid ? { valid: true } : { valid: false, reason: 'IP地址或CIDR格式无效' };
    }
      
    case 'port-range': {
      const isValid = validatePortRange(value);
      return isValid ? { valid: true } : { valid: false, reason: '端口范围无效（1-65535）' };
    }
      
    case 'asn': {
      const isValid = validateASN(value);
      return isValid ? { valid: true } : { valid: false, reason: 'ASN格式无效' };
    }
      
    case 'country-code': {
      const isValid = validateCountryCode(value);
      return isValid ? { valid: true } : { valid: false, reason: '国家代码格式无效' };
    }
      
    case 'regex': {
      const isValid = validateRegex(value);
      return isValid ? { valid: true } : { valid: false, reason: '正则表达式格式无效' };
    }
      
    case 'protocol': {
      const isValid = validateProtocol(value);
      return isValid ? { valid: true } : { valid: false, reason: '不支持的协议类型' };
    }
      
    case 'string':
    default: {
      const isValid = value.length > 0;
      return isValid ? { valid: true } : { valid: false, reason: '值不能为空' };
    }
  }
}

/**
 * 检查是否为复合逻辑规则（AND/OR/NOT）
 */
function isLogicalRule(ruleType: string): boolean {
  return ['AND', 'OR', 'NOT'].includes(ruleType);
}

/**
 * 解析复合逻辑规则 - 彻底修复版本
 */
function parseLogicalRule(rule: string): { valid: boolean; reason?: string } {
  const trimmed = rule.trim();
  
  // 检查基本格式
  if (!trimmed.includes(',')) {
    return { valid: false, reason: '复合规则格式错误，应为 AND,((rule1),(rule2)) 格式' };
  }
  
  const [ruleType, ...rest] = trimmed.split(',');
  const rulesContent = rest.join(',');
  
  // 检查规则类型
  if (!isLogicalRule(ruleType)) {
    return { valid: false, reason: `不支持的逻辑规则类型: ${ruleType}` };
  }
  
  // 检查是否有规则内容
  if (!rulesContent || rulesContent.trim().length === 0) {
    return { valid: false, reason: `${ruleType}规则缺少子规则` };
  }
  
  // 解析子规则 - 修复版本
  let subRulesStr = rulesContent.trim();
  
  // 移除最外层的双括号 ((rule1),(rule2))
  if (subRulesStr.startsWith('((') && subRulesStr.endsWith('))')) {
    subRulesStr = subRulesStr.slice(2, -2);
  } else if (subRulesStr.startsWith('(') && subRulesStr.endsWith(')')) {
    subRulesStr = subRulesStr.slice(1, -1);
  }
  
  // 解析子规则
  const subRules = parseNestedRules(subRulesStr);
  
  // 调试信息
  // console.log(`[debug] 解析 ${ruleType} 规则: ${rule}`);
  // console.log(`[debug] 子规则内容: ${subRulesStr}`);
  // console.log(`[debug] 解析出的子规则:`, subRules);
  
  // 检查子规则数量
  if (ruleType === 'NOT' && subRules.length !== 1) {
    return { valid: false, reason: 'NOT规则只能包含一个子规则' };
  }
  
  if ((ruleType === 'AND' || ruleType === 'OR') && subRules.length < 2) {
    return { valid: false, reason: `${ruleType}规则至少需要两个子规则` };
  }
  
  // 验证每个子规则
  for (const subRule of subRules) {
    const validation = validateSubRule(subRule);
    if (!validation.valid) {
      return { 
        valid: false, 
        reason: `子规则格式错误: ${subRule.split(',')[0]} - ${validation.reason}` 
      };
    }
  }
  
  return { valid: true };
}

/**
 * 解析嵌套的规则字符串
 */
function parseNestedRules(rulesStr: string): string[] {
  const rules: string[] = [];
  let current = '';
  let depth = 0;
  let inQuotes = false;
  
  for (let i = 0; i < rulesStr.length; i++) {
    const char = rulesStr[i];
    
    if (char === '"' && rulesStr[i - 1] !== '\\') {
      inQuotes = !inQuotes;
    }
    
    if (!inQuotes) {
      if (char === '(') {
        depth++;
      } else if (char === ')') {
        depth--;
      } else if (char === ',' && depth === 0) {
        // 在最外层遇到逗号时分割
        if (current.trim()) {
          rules.push(current.trim());
          current = '';
          continue;
        }
      }
    }
    
    current += char;
  }
  
  if (current.trim()) {
    rules.push(current.trim());
  }
  
  // 清理每个规则的外层括号
  return rules.map(rule => {
    let cleaned = rule.trim();
    // 移除最外层的单个括号对
    while (cleaned.startsWith('(') && cleaned.endsWith(')') && 
           isMatchingParentheses(cleaned)) {
      cleaned = cleaned.slice(1, -1).trim();
    }
    return cleaned;
  });
}

/**
 * 检查括号是否匹配（用于安全移除外层括号）
 */
function isMatchingParentheses(str: string): boolean {
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')') depth--;
    if (depth === 0 && i < str.length - 1) return false; // 中间就平衡了，说明不是单层包围
  }
  return depth === 0;
}

/**
 * 验证子规则格式 - 最终修复版本
 */
function validateSubRule(rule: string): { valid: boolean; reason?: string } {
  // 移除外层括号并清理空格
  let cleaned = rule.trim();
  
  // 如果规则被括号包围，移除最外层括号
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  
  // 检查是否为嵌套的复合规则
  if (cleaned.startsWith('AND,') || cleaned.startsWith('OR,') || cleaned.startsWith('NOT,')) {
    return parseLogicalRule(cleaned);
  }
  
  // 检查基本规则格式：TYPE,VALUE[,POLICY][,PARAMS...]
  const parts = cleaned.split(',');
  if (parts.length < 2) {
    return { valid: false, reason: '规则至少需要类型和值' };
  }
  
  const [ruleType, value, ...extraParts] = parts.map(p => p.trim());
  
  // 检查规则类型
  if (!(ruleType in RULE_TYPES) && !isLogicalRule(ruleType)) {
    return { valid: false, reason: `不支持的规则类型: ${ruleType}` };
  }
  
  // 检查值是否为空
  if (!value || value.length === 0) {
    return { valid: false, reason: '规则值不能为空' };
  }
  
  // 验证可选参数（如 no-resolve, extended-matching 等）
  const validParams = new Set([
    'no-resolve', 'extended-matching', 'pre-matching', 'dns-failed'
  ]);
  
  for (const part of extraParts) {
    if (part && !POLICIES.has(part) && !validParams.has(part)) {
      // 如果不是已知策略或参数，给出警告而不是错误
      // console.log(`[debug] 未知参数或策略: ${part} in rule: ${cleaned}`);
    }
  }
  
  return { valid: true };
}

/**
 * 验证单条规则的语法
 */
function validateRuleLine(line: string, lineNumber: number, filePath: string): RuleSyntaxError[] {
  const errors: RuleSyntaxError[] = [];
  
  // 优先检查是否为复合逻辑规则
  if (line.startsWith('AND,') || line.startsWith('OR,') || line.startsWith('NOT,')) {
    const logicalRuleValidation = parseLogicalRule(line);
    if (!logicalRuleValidation.valid) {
      errors.push({
        file: filePath,
        line: lineNumber,
        content: line,
        ruleType: line.split(',')[0],
        reason: logicalRuleValidation.reason || '复合规则格式无效',
        severity: 'error'
      });
    }
    return errors; // 复合规则处理完毕，直接返回
  }
  
  // 处理普通规则
  const parts = line.split(',');
  if (parts.length < 2) {
    errors.push({
      file: filePath,
      line: lineNumber,
      content: line,
      ruleType: 'UNKNOWN',
      reason: '规则格式错误：至少需要规则类型和值',
      severity: 'error'
    });
    return errors;
  }
  
  const [ruleType, value, policy, ...extraArgs] = parts.map(p => p.trim());
  
  // 检查规则类型是否支持
  if (!(ruleType in RULE_TYPES)) {
    errors.push({
      file: filePath,
      line: lineNumber,
      content: line,
      ruleType,
      reason: `不支持的规则类型: ${ruleType}`,
      severity: 'warning' // 改为警告，因为可能是新增的规则类型
    });
    return errors;
  }
  
  const ruleConfig = RULE_TYPES[ruleType as keyof typeof RULE_TYPES];
  
  // 检查参数数量
  if (!value || value.length === 0) {
    errors.push({
      file: filePath,
      line: lineNumber,
      content: line,
      ruleType,
      reason: '规则值不能为空',
      severity: 'error'
    });
    return errors;
  }
  
  // 验证规则值
  const valueValidation = validateRuleValue(value, ruleConfig.validateValue);
  if (!valueValidation.valid) {
    errors.push({
      file: filePath,
      line: lineNumber,
      content: line,
      ruleType,
      reason: valueValidation.reason || '规则值格式无效',
      severity: 'error'
    });
  }
  
  // 检查策略和参数
  const validParams = new Set([
    'no-resolve', 'extended-matching', 'pre-matching', 'dns-failed'
  ]);
  
  for (const arg of [policy, ...extraArgs].filter(Boolean)) {
    if (!POLICIES.has(arg) && !validParams.has(arg)) {
      errors.push({
        file: filePath,
        line: lineNumber,
        content: line,
        ruleType,
        reason: `未知参数或策略: ${arg}`,
        severity: 'warning'
      });
    }
  }
  
  return errors;
}

/**
 * 扫描规则文件
 */
async function scanRuleFiles(): Promise<string[]> {
  const ruleFiles: string[] = [];
  
  const directories = [
    'Surge/Rulesets',  // 只扫描 Surge/Rulesets 目录
    'Chores/ruleset'
  ];
  
  for (const dir of directories) {
    const dirPath = path.join(process.cwd(), dir);
    
    try {
      const files = await new Fdir()
        .withFullPaths()
        .filter((filePath, isDirectory) => {
          if (isDirectory) return false;
          const extname = path.extname(filePath);
          return extname === '.list' || extname === '.conf' || extname === '.txt';
        })
        .crawl(dirPath)
        .withPromise();
      
      ruleFiles.push(...files);
    } catch (error) {
      console.log(`⚠️  跳过目录 ${dir}：${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  return ruleFiles;
}

/**
 * 验证单个规则文件
 */
async function validateRuleFile(filePath: string): Promise<RuleSyntaxError[]> {
  const errors: RuleSyntaxError[] = [];
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    let lineNumber = 0;
    
    for (const rawLine of lines) {
      lineNumber++;
      
      const line = processLine(rawLine);
      if (!line) {
        continue;
      }
      
      const lineErrors = validateRuleLine(line, lineNumber, filePath);
      errors.push(...lineErrors);
    }
    
    console.log(picocolors.green('[validated]'), 
      `${path.relative(process.cwd(), filePath)} - ${errors.length} errors`
    );
    
    return errors;
    
  } catch (error) {
    console.error(picocolors.red('[error]'), 
      `Failed to validate ${filePath}:`, error
    );
    
    errors.push({
      file: filePath,
      line: 0,
      content: '',
      ruleType: 'FILE',
      reason: `文件读取失败: ${error}`,
      severity: 'error'
    });
    
    return errors;
  }
}

/**
 * 导出结果给GitHub Actions
 */
async function exportResultsForGitHub(errors: RuleSyntaxError[]): Promise<void> {
  const cacheDir = path.join(process.cwd(), '.cache');
  
  // 确保缓存目录存在
  await fs.mkdir(cacheDir, { recursive: true });

  // 按文件分组错误
  const errorsByFile: Record<string, RuleSyntaxError[]> = {};
  
  for (const error of errors) {
    const relativePath = path.relative(process.cwd(), error.file);
    if (!errorsByFile[relativePath]) {
      errorsByFile[relativePath] = [];
    }
    errorsByFile[relativePath].push(error);
  }

  // 写入缓存文件
  await fs.writeFile(
    path.join(cacheDir, 'rule-syntax-errors.json'),
    JSON.stringify(errorsByFile, null, 2)
  );

  // 输出GitHub Actions环境变量
  if (process.env.GITHUB_OUTPUT) {
    const errorCount = errors.filter(e => e.severity === 'error').length;
    const warningCount = errors.filter(e => e.severity === 'warning').length;
    
    const output = `has_syntax_errors=${errorCount > 0 ? 'true' : 'false'}\n` +
                  `syntax_errors_count=${errorCount}\n` +
                  `syntax_warnings_count=${warningCount}\n`;
    
    await fs.appendFile(process.env.GITHUB_OUTPUT, output);
  }

  console.log(picocolors.blue(`[github] 已导出 ${errors.length} 个语法问题到 .cache/rule-syntax-errors.json`));
}

/**
 * 主函数
 */
async function main() {
  const isCI = process.env.CI === 'true';

  console.log(picocolors.blue('🔍 开始规则语法验证...'));
  
  // 1. 扫描规则文件
  console.log(picocolors.yellow('📁 扫描规则文件...'));
  const files = await scanRuleFiles();
  console.log(picocolors.green(`✅ 扫描完成，共发现 ${files.length} 个规则文件`));

  if (files.length === 0) {
    console.log(picocolors.yellow('⚠️  没有找到任何规则文件，请检查规则文件路径'));
    return;
  }

  // 2. 验证规则语法
  console.log(picocolors.yellow('🔍 验证规则语法...'));
  const allErrors: RuleSyntaxError[] = [];
  
  for (const filePath of files) {
    const errors = await validateRuleFile(filePath);
    allErrors.push(...errors);
  }
  
  const errorCount = allErrors.filter(e => e.severity === 'error').length;
  const warningCount = allErrors.filter(e => e.severity === 'warning').length;
  
  console.log(picocolors.green(`✅ 验证完成，发现 ${errorCount} 个错误，${warningCount} 个警告`));

  if (allErrors.length === 0) {
    console.log(picocolors.green('🎉 所有规则语法都是正确的！'));
    
    // 即使没有错误，也需要导出用于GitHub Actions
    if (isCI) {
      await exportResultsForGitHub([]);
    }
    
    return;
  }

  // 3. 显示错误详情
  if (errorCount > 0) {
    console.log(picocolors.red('\n💥 语法错误:'));
    
    const errorsByType: Record<string, RuleSyntaxError[]> = {};
    for (const error of allErrors.filter(e => e.severity === 'error')) {
      const reason = error.reason || '未知错误';
      if (!errorsByType[reason]) {
        errorsByType[reason] = [];
      }
      errorsByType[reason].push(error);
    }
    
    for (const [reason, errors] of Object.entries(errorsByType)) {
      console.log(picocolors.red(`\n  ${reason} (${errors.length} 个):`));
      for (const error of errors.slice(0, 3)) { // 只显示前3个
        console.log(picocolors.gray(`    ${path.relative(process.cwd(), error.file)}:${error.line} - ${error.content}`));
      }
      if (errors.length > 3) {
        console.log(picocolors.gray(`    ... 还有 ${errors.length - 3} 个`));
      }
    }
  }
  
  if (warningCount > 0) {
    console.log(picocolors.yellow('\n⚠️  语法警告:'));
    
    const warningsByType: Record<string, RuleSyntaxError[]> = {};
    for (const warning of allErrors.filter(e => e.severity === 'warning')) {
      const reason = warning.reason || '未知警告';
      if (!warningsByType[reason]) {
        warningsByType[reason] = [];
      }
      warningsByType[reason].push(warning);
    }
    
    for (const [reason, warnings] of Object.entries(warningsByType)) {
      console.log(picocolors.yellow(`\n  ${reason} (${warnings.length} 个):`));
      for (const warning of warnings.slice(0, 2)) { // 只显示前2个
        console.log(picocolors.gray(`    ${path.relative(process.cwd(), warning.file)}:${warning.line} - ${warning.content}`));
      }
      if (warnings.length > 2) {
        console.log(picocolors.gray(`    ... 还有 ${warnings.length - 2} 个`));
      }
    }
  }

  // 4. 导出数据给GitHub Actions和本地JSON
  await exportResultsForGitHub(allErrors);
  
  // 5. 输出修复建议
  console.log(picocolors.yellow('\n💡 修复建议:'));
  console.log('   1. 检查规则类型拼写是否正确');
  console.log('   2. 验证IP地址和CIDR格式');
  console.log('   3. 确认端口范围在1-65535之间');
  console.log('   4. 检查域名格式是否符合标准');
  console.log('   5. 复合规则需要正确的括号格式：AND,((rule1),(rule2))');
  
  // 总是显示JSON文件路径
  const jsonPath = path.join(process.cwd(), '.cache', 'rule-syntax-errors.json');
  console.log(picocolors.blue(`\n📋 详细结果已保存到: ${jsonPath}`));

  // 如果有错误，退出码为1
  if (errorCount > 0) {
    process.exit(1);
  }
}

// 执行主函数
main().catch(error => {
  console.error(picocolors.red('💥 规则语法验证失败:'), error);
  process.exit(1);
});
