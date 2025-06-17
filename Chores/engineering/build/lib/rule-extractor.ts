/**
 * 改进的规则提取器
 * 
 * 基于Surge-master的run-against-source-file逻辑，增强了：
 * 1. IP过滤（使用net.isIP和tldts双重检查）
 * 2. 统一的域名归一化
 * 3. 更严格的规则类型过滤
 * 4. 行号记录支持
 */

import * as fs from 'node:fs/promises';
import * as net from 'node:net';
import { parse } from 'tldts';
import picocolors from 'picocolors';

export interface DomainRule {
  domain: string;
  includeAllSubdomain: boolean;
  ruleType: 'DOMAIN' | 'DOMAIN-SUFFIX' | 'DOMAIN-KEYWORD' | 'DOMAIN-WILDCARD';
  filePath: string;
  lineNumber: number;
  originalLine: string;
}

export interface RuleExtractionOptions {
  includeKeywords?: boolean;
  recordLineNumbers?: boolean;
  validateDomains?: boolean;
}

/**
 * 处理单行文本，移除注释和空行
 */
function processLine(line: string): string | null {
  const trimmed = line.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const line_0 = trimmed.charCodeAt(0);

  // 跳过注释行
  if (
    line_0 === 33 /** ! */ ||
    (line_0 === 47 /** / */ && trimmed.charCodeAt(1) === 47 /** / */)
  ) {
    return null;
  }

  if (line_0 === 35 /** # */) {
    if (trimmed.charCodeAt(1) !== 35 /** # */) {
      // # Comment
      return null;
    }
    if (trimmed.charCodeAt(2) === 35 /** # */ && trimmed.charCodeAt(3) === 35 /** # */) {
      // ################## EOF ##################
      return null;
    }
  }

  return trimmed;
}

/**
 * 验证域名是否为有效的FQDN（排除IP）
 */
function isValidDomain(domain: string): boolean {
  // 检查是否为IP地址
  if (net.isIP(domain) !== 0) {
    return false;
  }

  // 对于通配符域名，先移除通配符进行基础验证
  let cleanDomain = domain;
  if (domain.includes('*') || domain.includes('?')) {
    // 移除通配符，用占位符替换进行基础验证
    cleanDomain = domain.replace(/\*/g, 'a').replace(/\?/g, 'b');
  }

  // 使用tldts进行更严格的验证
  const parsed = parse(cleanDomain);
  if (parsed.isIp || !parsed.domain) {
    return false;
  }

  // 排除保留域名
  if (cleanDomain.endsWith('.local') || cleanDomain.endsWith('.test') || 
      cleanDomain.endsWith('.invalid') || cleanDomain.endsWith('.localhost')) {
    return false;
  }

  return true;
}

/**
 * 验证通配符域名模式是否合法
 */
function isValidWildcardPattern(pattern: string): boolean {
  // 基本格式检查
  if (!pattern || pattern.length === 0) {
    return false;
  }

  // 通配符只能在域名部分，不能在TLD部分
  const parts = pattern.split('.');
  if (parts.length < 2) {
    return false;
  }

  // 最后一部分（TLD）不应包含通配符
  const tld = parts[parts.length - 1];
  if (tld.includes('*') || tld.includes('?')) {
    return false;
  }

  // 检查通配符使用是否合理
  for (const part of parts) {
    // 不能为空（除非是通配符）
    if (part === '' && !pattern.includes('*') && !pattern.includes('?')) {
      return false;
    }
  }

  return true;
}

/**
 * 从规则文件中提取域名规则
 */
export async function extractDomainRules(
  filePath: string,
  options: RuleExtractionOptions = {}
): Promise<DomainRule[]> {
  const {
    includeKeywords = false,
    recordLineNumbers = true,
    validateDomains = true
  } = options;

  const rules: DomainRule[] = [];
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    let lineNumber = 0;
    let fileType: 'ruleset' | 'domainset' | null = null;

    for (const rawLine of lines) {
      lineNumber++;
      
      const line = processLine(rawLine);
      if (!line) {
        continue;
      }

      // 自动检测文件类型
      if (fileType === null) {
        if (line.includes(',')) {
          fileType = 'ruleset';
        } else {
          fileType = 'domainset';
        }
      }

      if (fileType === 'ruleset') {
        // 解析规则集格式：RULE-TYPE,domain,policy
        const parts = line.split(',');
        if (parts.length < 2) continue;

        const [ruleType, rawDomain] = parts;
        
        if (!['DOMAIN', 'DOMAIN-SUFFIX', 'DOMAIN-KEYWORD', 'DOMAIN-WILDCARD'].includes(ruleType)) {
          continue;
        }

        const domain = rawDomain.trim();
        
        // DOMAIN-KEYWORD特殊处理
        if (ruleType === 'DOMAIN-KEYWORD') {
          if (includeKeywords) {
            rules.push({
              domain,
              includeAllSubdomain: false,
              ruleType: ruleType as 'DOMAIN-KEYWORD',
              filePath,
              lineNumber: recordLineNumbers ? lineNumber : 0,
              originalLine: rawLine
            });
          }
          continue;
        }

        // DOMAIN-WILDCARD特殊处理
        if (ruleType === 'DOMAIN-WILDCARD') {
          // 验证通配符模式
          if (validateDomains && !isValidWildcardPattern(domain)) {
            continue;
          }

          rules.push({
            domain,
            includeAllSubdomain: false, // WILDCARD不使用此字段
            ruleType: ruleType as 'DOMAIN-WILDCARD',
            filePath,
            lineNumber: recordLineNumbers ? lineNumber : 0,
            originalLine: rawLine
          });
          continue;
        }

        // 验证域名
        if (validateDomains && !isValidDomain(domain)) {
          continue;
        }

        rules.push({
          domain,
          includeAllSubdomain: ruleType === 'DOMAIN-SUFFIX',
          ruleType: ruleType as 'DOMAIN' | 'DOMAIN-SUFFIX',
          filePath,
          lineNumber: recordLineNumbers ? lineNumber : 0,
          originalLine: rawLine
        });

      } else if (fileType === 'domainset') {
        // 解析域名集格式：domain 或 .domain
        let domain = line;
        let includeAllSubdomain = false;

        if (line.startsWith('.')) {
          domain = line.slice(1);
          includeAllSubdomain = true;
        }

        // 验证域名
        if (validateDomains && !isValidDomain(domain)) {
          continue;
        }

        rules.push({
          domain,
          includeAllSubdomain,
          ruleType: includeAllSubdomain ? 'DOMAIN-SUFFIX' : 'DOMAIN',
          filePath,
          lineNumber: recordLineNumbers ? lineNumber : 0,
          originalLine: rawLine
        });
      }
    }

    console.log(picocolors.green('[extracted]'), 
      `${rules.length} domain rules from`, 
      filePath.split('/').pop()
    );

    return rules;
    
  } catch (error) {
    console.error(picocolors.red('[error]'), 
      `Failed to extract rules from ${filePath}:`, error
    );
    return [];
  }
}

/**
 * 批量提取多个文件的域名规则
 */
export async function extractDomainRulesFromFiles(
  filePaths: string[],
  options: RuleExtractionOptions = {}
): Promise<DomainRule[]> {
  const allRules: DomainRule[] = [];
  
  for (const filePath of filePaths) {
    const rules = await extractDomainRules(filePath, options);
    allRules.push(...rules);
  }
  
  return allRules;
}

/**
 * 兼容旧版本的回调接口
 */
export async function runAgainstSourceFile(
  filePath: string,
  callback: (domain: string, includeAllSubdomain: boolean, originalLine?: string) => void,
  options: RuleExtractionOptions = {}
): Promise<void> {
  const rules = await extractDomainRules(filePath, options);
  
  for (const rule of rules) {
    if (rule.ruleType !== 'DOMAIN-KEYWORD') {
      callback(rule.domain, rule.includeAllSubdomain, rule.originalLine);
    }
  }
}
