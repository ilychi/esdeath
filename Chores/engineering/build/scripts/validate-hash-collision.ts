/**
 * 哈希冲突检测脚本
 * 
 * 功能：
 * 1. 扫描所有规则文件
 * 2. 计算每行规则的哈希值
 * 3. 检测并报告哈希冲突
 * 4. 支持GitHub Actions集成
 * 
 * 基于Surge-master的validate-hash-collision-test.ts改进
 */

import { SOURCE_DIR } from '../constants/dir.js';
import path from 'node:path';
import * as fs from 'node:fs/promises';
import { fdir as Fdir } from 'fdir';
import picocolors from 'picocolors';
import { xxhash3 } from 'hash-wasm';

interface HashCollision {
  hash: string;
  conflictingLines: {
    content: string;
    filePath: string;
    lineNumber: number;
  }[];
}

/**
 * 计算字符串的哈希值（使用xxhash3算法，与Surge保持一致）
 */
async function calculateHash(input: string): Promise<string> {
  return await xxhash3(input.trim());
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
 * 处理单个文件，提取规则内容用于哈希计算
 */
async function processRuleFile(filePath: string): Promise<{ content: string; lineNumber: number }[]> {
  const results: { content: string; lineNumber: number }[] = [];
  
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

      let hashContent: string;

      if (fileType === 'ruleset') {
        // 对于规则集，使用完整的规则行
        hashContent = line;
      } else if (fileType === 'domainset') {
        // 对于域名集，标准化处理（移除前导点）
        hashContent = line.startsWith('.') ? line.slice(1) : line;
      } else {
        hashContent = line;
      }

      results.push({
        content: hashContent,
        lineNumber
      });
    }

    console.log(picocolors.green('[processed]'), 
      `${results.length} rules from`, 
      path.relative(process.cwd(), filePath)
    );

    return results;
    
  } catch (error) {
    console.error(picocolors.red('[error]'), 
      `Failed to process ${filePath}:`, error
    );
    return [];
  }
}

/**
 * 扫描规则文件
 */
async function scanRuleFiles(): Promise<string[]> {
  const scanPaths = [
    path.join(SOURCE_DIR, '..', 'Dial'),
    path.join(SOURCE_DIR, '..', 'Chores', 'ruleset'),
    path.join(SOURCE_DIR, '..', 'Rulesets'),
    path.join(SOURCE_DIR, '..', 'Surge', 'Modules', 'Rules')
  ];

  const allFiles: string[] = [];

  for (const scanPath of scanPaths) {
    try {
      const ruleFiles = await new Fdir()
        .withFullPaths()
        .filter((filePath, isDirectory) => {
          if (isDirectory) return false;
          const extname = path.extname(filePath);
          return extname === '.list' || extname === '.conf' || extname === '.txt';
        })
        .crawl(scanPath)
        .withPromise();

      allFiles.push(...ruleFiles);
    } catch (error) {
      console.log(picocolors.yellow(`[skip] 目录不存在或无法访问: ${scanPath}`));
    }
  }

  return allFiles;
}

/**
 * 检测哈希冲突
 */
async function detectHashCollisions(files: string[]): Promise<HashCollision[]> {
  const hashMap = new Map<string, { content: string; filePath: string; lineNumber: number }[]>();
  
  // 处理所有文件
  for (const filePath of files) {
    const rules = await processRuleFile(filePath);
    
    for (const rule of rules) {
      const hash = await calculateHash(rule.content);
      
      if (!hashMap.has(hash)) {
        hashMap.set(hash, []);
      }
      
      hashMap.get(hash)!.push({
        content: rule.content,
        filePath,
        lineNumber: rule.lineNumber
      });
    }
  }

  // 找出冲突
  const collisions: HashCollision[] = [];
  
  for (const [hash, items] of hashMap.entries()) {
    if (items.length > 1) {
      // 检查是否为真正的冲突（内容不同但哈希相同）
      const uniqueContents = new Set(items.map(item => item.content));
      
      if (uniqueContents.size > 1) {
        collisions.push({
          hash,
          conflictingLines: items
        });
      }
    }
  }

  return collisions;
}

/**
 * 导出结果给GitHub Actions
 */
async function exportResultsForGitHub(collisions: HashCollision[]): Promise<void> {
  const cacheDir = path.join(process.cwd(), '.cache');
  
  // 确保缓存目录存在
  await fs.mkdir(cacheDir, { recursive: true });

  // 转换为更友好的格式
  const results = collisions.map(collision => ({
    hash: collision.hash,
    conflictCount: collision.conflictingLines.length,
    conflicts: collision.conflictingLines.map(line => ({
      content: line.content,
      file: path.relative(process.cwd(), line.filePath),
      line: line.lineNumber
    }))
  }));

  // 写入缓存文件
  await fs.writeFile(
    path.join(cacheDir, 'hash-collisions.json'),
    JSON.stringify(results, null, 2)
  );

  // 输出GitHub Actions环境变量
  if (process.env.GITHUB_OUTPUT) {
    const output = `has_hash_collisions=${collisions.length > 0 ? 'true' : 'false'}\n` +
                  `hash_collisions_count=${collisions.length}\n`;
    
    await fs.appendFile(process.env.GITHUB_OUTPUT, output);
  }

  console.log(picocolors.blue(`[github] 已导出 ${collisions.length} 个哈希冲突到 .cache/hash-collisions.json`));
}

/**
 * 主函数
 */
async function main() {
  const isCI = process.env.CI === 'true';

  console.log(picocolors.blue('🔍 开始检测规则哈希冲突...'));
  
  // 1. 扫描规则文件
  console.log(picocolors.yellow('📁 扫描规则文件...'));
  const files = await scanRuleFiles();
  console.log(picocolors.green(`✅ 扫描完成，共发现 ${files.length} 个规则文件`));

  if (files.length === 0) {
    console.log(picocolors.yellow('⚠️  没有找到任何规则文件，请检查规则文件路径'));
    return;
  }

  // 2. 检测哈希冲突
  console.log(picocolors.yellow('🔍 检测哈希冲突...'));
  const collisions = await detectHashCollisions(files);
  
  console.log(picocolors.green(`✅ 检测完成，发现 ${collisions.length} 个哈希冲突`));

  if (collisions.length === 0) {
    console.log(picocolors.green('🎉 没有发现哈希冲突！'));
    
    // 即使没有冲突，也需要导出用于GitHub Actions
    if (isCI) {
      await exportResultsForGitHub([]);
    }
    
    return;
  }

  // 3. 显示冲突详情
  console.log(picocolors.red('\n💥 发现哈希冲突:'));
  
  for (const collision of collisions) {
    console.log(picocolors.red(`\n  哈希值: ${collision.hash}`));
    console.log(picocolors.yellow(`  冲突规则 (${collision.conflictingLines.length} 条):`));
    
    for (const line of collision.conflictingLines) {
      console.log(picocolors.gray(`    "${line.content}"`));
      console.log(picocolors.gray(`      位置: ${path.relative(process.cwd(), line.filePath)}:${line.lineNumber}`));
    }
  }

  // 4. 导出数据给GitHub Actions
  if (isCI) {
    await exportResultsForGitHub(collisions);
  }
  
  // 5. 输出修复建议
  console.log(picocolors.yellow('\n💡 修复建议:'));
  console.log('   1. 在冲突规则行末尾添加不同的注释');
  console.log('   2. 微调规则内容（如添加空格或调整格式）');
  console.log('   3. 检查是否为重复规则，可考虑合并或删除');
  
  if (!isCI) {
    console.log(picocolors.gray('\n📋 详细结果已保存到 .cache/hash-collisions.json'));
  }
}

// 执行主函数
main().catch(error => {
  console.error(picocolors.red('💥 哈希冲突检测失败:'), error);
  process.exit(1);
});
