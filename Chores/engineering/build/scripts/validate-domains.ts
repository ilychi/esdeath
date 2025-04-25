/**
 * 域名存活验证脚本
 *
 * 此脚本会：
 * 1. 扫描规则文件中的所有域名
 * 2. 检查域名是否存活
 * 3. 将失效域名写入缓存文件
 * 4. 输出结果用于GitHub Actions
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { readFileByLine } from '../lib/fetch-text-by-line.js';
import { processLine } from '../lib/process-line.js';
import { isDomainAlive } from '../lib/is-domain-alive.js';

// 使用异步队列控制并发
class Queue {
  private queue: (() => Promise<any>)[] = [];
  private running = 0;
  private results: any[] = [];

  constructor(private concurrency = 20) {}

  add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          this.results.push(result);
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      });
      this.next();
    });
  }

  private async next() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const fn = this.queue.shift()!;

    try {
      await fn();
    } catch (error) {
      console.error('队列执行错误:', error);
    } finally {
      this.running--;
      this.next();
    }
  }

  async waitForAll(): Promise<any[]> {
    if (this.queue.length === 0 && this.running === 0) {
      return this.results;
    }

    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (this.queue.length === 0 && this.running === 0) {
          clearInterval(checkInterval);
          resolve(this.results);
        }
      }, 100);
    });
  }
}

// 获取脚本目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 根目录和缓存目录
const ROOT_DIR = path.resolve(__dirname, '../../../..');
const CACHE_DIR = path.join(ROOT_DIR, '.cache');

// 规则目录
const RULE_DIRS = [
  path.join(ROOT_DIR, 'Surge', 'Rulesets'),
  path.join(ROOT_DIR, 'Dial'),
  path.join(ROOT_DIR, 'Chores', 'ruleset'),
];

// domainset目录(如果有)
const DOMAINSET_DIRS = [path.join(ROOT_DIR, 'Surge', 'domainset')];

// 缓存文件
const DEAD_DOMAINS_CACHE = path.join(CACHE_DIR, 'dead-domains.json');

/**
 * 检查目录是否存在
 */
async function dirExists(dirPath: string): Promise<boolean> {
  try {
    await fs.access(dirPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 从Ruleset格式文件中提取域名
 */
async function extractDomainsFromRuleset(filePath: string): Promise<Map<string, string[]>> {
  const domains = new Map<string, string[]>();
  let lineNumber = 0;

  for await (const line of readFileByLine(filePath)) {
    lineNumber++;
    const processedLine = processLine(line);
    if (!processedLine) continue;

    // 解析规则类型和域名
    const parts = processedLine.split(',');
    if (parts.length < 2) continue;

    const type = parts[0];
    const domain = parts[1];

    if (type === 'DOMAIN' || type === 'DOMAIN-SUFFIX' || type === 'DOMAIN-KEYWORD') {
      const source = `${filePath}:${lineNumber}`;
      if (!domains.has(domain)) {
        domains.set(domain, []);
      }
      domains.get(domain)!.push(source);
    }
  }

  return domains;
}

/**
 * 从Domainset格式文件中提取域名
 */
async function extractDomainsFromDomainset(filePath: string): Promise<Map<string, string[]>> {
  const domains = new Map<string, string[]>();
  let lineNumber = 0;

  for await (const line of readFileByLine(filePath)) {
    lineNumber++;
    const processedLine = processLine(line);
    if (!processedLine) continue;

    // domainset中的每一行都是一个域名
    const domain = processedLine;
    const source = `${filePath}:${lineNumber}`;

    if (!domains.has(domain)) {
      domains.set(domain, []);
    }
    domains.get(domain)!.push(source);
  }

  return domains;
}

/**
 * 判断文件是否是规则集
 */
function isRulesetFile(filePath: string): boolean {
  const ext = path.extname(filePath);
  return ext === '.list' || ext === '.conf';
}

/**
 * 从目录中收集所有域名
 */
async function collectDomainsFromDirectories(): Promise<Map<string, string[]>> {
  const allDomains = new Map<string, string[]>();

  // 扫描Ruleset目录
  for (const dir of RULE_DIRS) {
    if (await dirExists(dir)) {
      await scanRulesetDirectory(dir);
    } else {
      console.log(`目录不存在，跳过: ${dir}`);
    }
  }

  // 扫描Domainset目录
  for (const dir of DOMAINSET_DIRS) {
    if (await dirExists(dir)) {
      await scanDomainsetDirectory(dir);
    } else {
      console.log(`目录不存在，跳过: ${dir}`);
    }
  }

  // 合并域名和来源
  function mergeDomains(domainMap: Map<string, string[]>) {
    for (const [domain, sources] of domainMap.entries()) {
      if (!allDomains.has(domain)) {
        allDomains.set(domain, []);
      }
      allDomains.get(domain)!.push(...sources);
    }
  }

  // 扫描规则集目录
  async function scanRulesetDirectory(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await scanRulesetDirectory(fullPath);
        } else if (entry.isFile() && isRulesetFile(fullPath)) {
          const domains = await extractDomainsFromRuleset(fullPath);
          mergeDomains(domains);
        }
      }
    } catch (error) {
      console.error(`扫描目录失败: ${dir}`, error);
    }
  }

  // 扫描域名集目录
  async function scanDomainsetDirectory(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await scanDomainsetDirectory(fullPath);
        } else if (entry.isFile() && isRulesetFile(fullPath)) {
          const domains = await extractDomainsFromDomainset(fullPath);
          mergeDomains(domains);
        }
      }
    } catch (error) {
      console.error(`扫描目录失败: ${dir}`, error);
    }
  }

  return allDomains;
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('开始验证域名存活性...');

    // 确保缓存目录存在
    await fs.mkdir(CACHE_DIR, { recursive: true });

    // 收集所有域名
    console.log('收集规则文件中的域名...');
    const domains = await collectDomainsFromDirectories();
    console.log(`共发现 ${domains.size} 个域名`);

    // 验证域名存活性
    console.log('验证域名存活性...');
    const queue = new Queue(30); // 使用30个并发限制
    const domainResults: Array<[string, boolean]> = [];

    for (const domain of domains.keys()) {
      const isSuffix = domain.startsWith('.');
      queue.add(async () => {
        const result = await isDomainAlive(domain, isSuffix);
        domainResults.push(result);
        return result;
      });
    }

    await queue.waitForAll();

    // 筛选失效的域名
    const deadDomains: Record<string, string[]> = {};
    for (const [domain, alive] of domainResults) {
      if (!alive && domains.has(domain)) {
        deadDomains[domain] = domains.get(domain)!;
      }
    }

    // 输出结果
    console.log(`验证完成！发现 ${Object.keys(deadDomains).length} 个失效域名`);

    // 写入缓存文件
    await fs.writeFile(DEAD_DOMAINS_CACHE, JSON.stringify(deadDomains, null, 2));

    // 设置GitHub Actions输出
    if (process.env.GITHUB_OUTPUT) {
      const outputPath = process.env.GITHUB_OUTPUT;
      await fs.appendFile(outputPath, `has_dead_domains=${Object.keys(deadDomains).length > 0}\n`);
    }

    // 如果发现失效域名，提示但不失败
    if (Object.keys(deadDomains).length > 0) {
      console.log('存在失效域名，但继续执行');
    }
  } catch (error) {
    console.error('域名验证失败:', error);
    process.exit(1);
  }
}

// 执行主函数
main().catch(error => {
  console.error('未捕获的错误:', error);
  process.exit(1);
});
