import { RuleConverter } from './rule-converter.js';
import { RuleMerger } from './rule-merger.js';
import { RuleFile, SpecialRuleConfig } from './rule-types.js';
import fs from 'node:fs';
import path from 'node:path';
import { downloadFile, cleanAndSort, addRuleHeader } from './utils.js';

export class RuleProcessor {
  constructor(
    private repoPath: string,
    private converter: RuleConverter,
    private merger: RuleMerger
  ) {}

  async process(rule: RuleFile): Promise<void> {
    try {
      const filePath = path.join(this.repoPath, rule.path);
      const fileExt = path.extname(filePath).toLowerCase();

      // 1. Download file if URL is provided
      if (rule.url) {
        await downloadFile(rule.url, filePath);
      }

      // 对于二进制文件（如.mmdb），只下载但不进行文本处理
      if (fileExt === '.mmdb') {
        console.log(`跳过二进制文件的文本处理: ${rule.path}`);
        return;
      }

      // 2. Read file content
      let content = await fs.promises.readFile(filePath, 'utf-8');

      // 3. Convert rules
      content = content
        .split('\n')
        .map(line => this.converter.convert(line))
        //.filter(Boolean)
        //.filter(line => line !== null && line !== undefined)
        .join('\n');

      // 4. Clean and sort based on rule.cleanup
      content = cleanAndSort(content, this.converter, rule.cleanup ?? false);

      // 5. Add header based on rule.header
      if (rule.header?.enable === true) {
        const headerInfo = {
          title: rule.title,
          description: rule.description,
          url: rule.url,
        };
        content = addRuleHeader(content, headerInfo);
      }

      // 6. Write the processed content back to the file
      await fs.promises.writeFile(filePath, content);
    } catch (error) {
      console.error(`Error processing ${rule.path}:`, error);
      throw error;
    }
  }

  async processSpecialRules(rules: SpecialRuleConfig[]): Promise<void> {
    for (const rule of rules) {
      await this.merger.mergeSpecialRules(rule);
    }
  }
}
