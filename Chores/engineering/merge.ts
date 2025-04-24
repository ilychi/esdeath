import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import fetch from 'node-fetch';
import yaml from 'js-yaml';

interface SgmoduleInfo {
  url: string;
  header: string;
}

interface Sections {
  'URL Rewrite': string[];
  'Map Local': string[];
  Script: string[];
  MITM: string[];
  Rule: string[];
}

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

const MAX_DIVIDER_LENGTH = 30; // Maximum divider length (excluding header length)

async function mergeSgmodules() {
  try {
    // Read sgmodules.yaml
    const sgmoduleContent = await readFile('Chores/engineering/data/sgmodules.yaml', 'utf8');
    const sgmoduleInfo = yaml.load(sgmoduleContent) as SgmoduleInfo[];

    const sections: Sections = {
      'URL Rewrite': [],
      'Map Local': [],
      Script: [],
      MITM: [],
      Rule: [],
    };

    const headers: string[] = [];
    const sectionPattern = /\[(.*?)\]\s*\n(.*?)(?=\n\[|$)/gs;
    const hostnamePattern = /hostname\s*=\s*(.*)/i;

    // Process each URL in sgmodules.yaml
    for (const info of sgmoduleInfo) {
      try {
        const response = await fetch(info.url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const content = await response.text();
        console.log(`[Debug] Parsing content from ${info.header}`);

        headers.push(info.header);

        // Calculate dynamic divider
        const leftDashCount = Math.floor((MAX_DIVIDER_LENGTH - info.header.length) / 2);
        const rightDashCount = MAX_DIVIDER_LENGTH - info.header.length - leftDashCount;
        const divider = `# ${'-'.repeat(leftDashCount)} ${info.header} ${'-'.repeat(
          rightDashCount
        )}`;

        // Process each section
        let match;
        while ((match = sectionPattern.exec(content)) !== null) {
          const [, section, text] = match;
          if (section in sections && section !== 'MITM') {
            if (section === 'Rule') {
              // 清理注释和空行，只保留有效规则和模块头
              const cleanedLines = text
                .trim()
                .split('\n')
                .filter(line => {
                  const trimmedLine = line.trim();
                  // 保留非空行，且要么是模块头（以 # >> 开头）要么不是注释
                  return (
                    trimmedLine && (!trimmedLine.startsWith('#') || trimmedLine.startsWith('# >> '))
                  );
                })
                .join('\n');
              // 添加模块头时使用正确的格式
              sections.Rule.push(`# >> ${info.header}\n${cleanedLines}`);
            } else {
              // Remove comment lines and empty lines, but keep divider
              const cleanedLines = text
                .trim()
                .split('\n')
                .filter(line => line.trim() && !line.trim().startsWith('#'))
                .join('\n');
              sections[section as keyof Sections].push(`${divider}\n${cleanedLines}`);
            }
          } else if (section === 'MITM') {
            const hostnameMatch = text.match(hostnamePattern);
            if (hostnameMatch) {
              const hostnames = hostnameMatch[1]
                .replace('%APPEND%', '')
                .split(',')
                .map(h => h.trim())
                .filter(Boolean);
              sections.MITM.push(...hostnames);
            }
          }
        }

        console.log(`Successfully merged: ${info.header}`);
      } catch (error) {
        console.error(`Failed to download ${info.header} file:`, error);
      }
    }

    const headersCombined = headers.join(', ');

    // Process and save rules
    if (sections.Rule.length > 0) {
    } else {
      console.log('[Warning] No Rule content extracted');
    }

    // Create ruleset directory if it doesn't exist
    await mkdir('Surge/Modules/Rules', { recursive: true });
    await mkdir('Surge/Scripts', { recursive: true });

    // Process rules with comments and deduplication
    const processedRules = processRules(sections.Rule);
    await writeFile('Surge/Modules/Rules/reject.list', processedRules.rejectRules);
    await writeFile('Surge/Modules/Rules/direct.list', processedRules.directRules);
    await writeFile('Surge/Modules/Rules/reject-drop.list', processedRules.rejectDropRules);
    await writeFile('Surge/Modules/Rules/reject-tinygif.list', processedRules.rejectTinyRules);
    await writeFile('Surge/Modules/Rules/reject-no-drop.list', processedRules.rejectNoDropRules);

    // Process MITM hostnames
    const uniqueHostnames = Array.from(new Set(sections.MITM));
    const hostnameAppendContent = uniqueHostnames.join(', ');

    const currentDate = new Date().toLocaleDateString('en-US');

    // Read and process template
    const templateContent = await readFile(
      'Chores/engineering/templates/All-in-One-2.x.sgmodule.template',
      'utf8'
    );

    let outputContent = templateContent;
    for (const [section, contents] of Object.entries(sections)) {
      const placeholder = `{${section}}`;
      const sectionContent = section !== 'MITM' ? contents.join('\n\n') : contents;
      outputContent = outputContent.replace(placeholder, sectionContent);
    }

    outputContent = outputContent
      .replace('{headers}', headersCombined)
      .replace('{hostname_append}', hostnameAppendContent)
      .replace('{{currentDate}}', currentDate);

    await writeFile('Surge/Modules/All-in-One-2.x.sgmodule', outputContent);
    console.log('File successfully merged and saved to: Surge/Modules/All-in-One-2.x.sgmodule');
  } catch (error) {
    console.error('Error in mergeSgmodules:', error);
  }
}

interface ProcessedRules {
  rejectRules: string;
  directRules: string;
  rejectDropRules: string;
  rejectTinyRules: string;
  rejectNoDropRules: string;
}

function processRules(rules: string[]): ProcessedRules {
  const ruleMap = new Map<string, { rule: string }>();
  const rejectRules: string[] = [];
  const directRules: string[] = [];
  const rejectDropRules: string[] = [];
  const rejectTinyRules: string[] = [];
  const rejectNoDropRules: string[] = [];

  let currentModuleHeader: string | null = null;
  let isFirstModule = {
    reject: true,
    direct: true,
    rejectDrop: true,
    rejectTiny: true,
    rejectNoDrop: true,
  };

  rules.forEach(ruleBlock => {
    const lines = ruleBlock.split('\n');
    currentModuleHeader = null;

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      if (trimmedLine.startsWith('# >> ')) {
        currentModuleHeader = trimmedLine;
        return;
      }

      if (trimmedLine && !trimmedLine.startsWith('#')) {
        // 处理逻辑规则 (AND, OR 等)
        if (trimmedLine.startsWith('AND,') || trimmedLine.startsWith('OR,')) {
          // 清理规则中的参数和策略组
          const cleanedRule = trimmedLine
            .replace(/,extended-matching|,pre-matching/g, '')
            .replace(/,(REJECT|DIRECT)(-[A-Z]+)?$/g, '');

          if (!ruleMap.has(cleanedRule)) {
            // 根据原始规则内容判断类别
            if (trimmedLine.includes('DIRECT')) {
              addRuleToList(directRules, currentModuleHeader, cleanedRule, isFirstModule, 'direct');
            } else {
              // 默认归类到 REJECT
              addRuleToList(rejectRules, currentModuleHeader, cleanedRule, isFirstModule, 'reject');
            }
            ruleMap.set(cleanedRule, { rule: cleanedRule });
          }
          return;
        }

        // 处理普通规则
        const ruleParts = trimmedLine.split(',');
        const ruleType = ruleParts[0];
        const ruleValue = ruleParts[1];

        // 只保留 no-resolve 参数
        const ruleParams = ruleParts.slice(2).filter(param => param.toLowerCase() === 'no-resolve');

        const newRule = [ruleType, ruleValue, ...ruleParams].join(',');
        const ruleWithoutPolicy = newRule.replace(/,(REJECT|DIRECT)(-[A-Z]+)?$/, '');

        if (!ruleMap.has(ruleWithoutPolicy)) {
          // 根据策略类型分类
          if (trimmedLine.includes('REJECT-DROP')) {
            addRuleToList(
              rejectDropRules,
              currentModuleHeader,
              newRule,
              isFirstModule,
              'rejectDrop'
            );
          } else if (trimmedLine.includes('REJECT-TINY')) {
            addRuleToList(
              rejectTinyRules,
              currentModuleHeader,
              newRule,
              isFirstModule,
              'rejectTiny'
            );
          } else if (trimmedLine.includes('REJECT-NO-DROP')) {
            addRuleToList(
              rejectNoDropRules,
              currentModuleHeader,
              newRule,
              isFirstModule,
              'rejectNoDrop'
            );
          } else if (trimmedLine.includes('REJECT')) {
            addRuleToList(rejectRules, currentModuleHeader, newRule, isFirstModule, 'reject');
          } else if (trimmedLine.includes('DIRECT')) {
            addRuleToList(directRules, currentModuleHeader, newRule, isFirstModule, 'direct');
          }

          ruleMap.set(ruleWithoutPolicy, { rule: ruleWithoutPolicy });
        }
      }
    });
  });

  return {
    rejectRules: rejectRules.join('\n'),
    directRules: directRules.join('\n'),
    rejectDropRules: rejectDropRules.join('\n'),
    rejectTinyRules: rejectTinyRules.join('\n'),
    rejectNoDropRules: rejectNoDropRules.join('\n'),
  };
}

// 辅助函数：添加规则到对应列表
function addRuleToList(
  ruleList: string[],
  header: string | null,
  rule: string,
  isFirstModule: { [key: string]: boolean },
  type: string
) {
  if (header && !ruleList.includes(header)) {
    if (!isFirstModule[type]) {
      ruleList.push('');
    }
    ruleList.push(header);
    isFirstModule[type] = false;
  }
  ruleList.push(rule);
}

// Execute the merge
mergeSgmodules().catch(console.error);
