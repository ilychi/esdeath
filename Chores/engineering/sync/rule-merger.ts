import { SpecialRuleConfig } from './rule-types.js';
import { RuleConverter } from './rule-converter.js';
import fs from 'node:fs';
import path from 'node:path';
import {
  cleanAndSort,
  dedupRules,
  addRuleHeader,
  generateNoResolveVersion,
  removeNoResolveFromRules,
  isUrl,
  fetchContent,
} from './utils.js';
import { ruleGroups, specialRules } from './rule-sources.js';

export class RuleMerger {
  constructor(private repoPath: string, private converter: RuleConverter) {}

  async mergeSpecialRules(config: SpecialRuleConfig): Promise<boolean> {
    const {
      name,
      targetFile,
      sourceFiles,
      extraRules,
      cleanup = true,
      keepInlineComments = true,
      deleteSourceFiles = false,
      dedup,
      applyNoResolve,
      header,
    } = config;

    console.log(`合并特殊规则: ${name}`);

    try {
      // 1. 获取源文件的下载 URL (兼容旧版本)
      const sourceUrls = await this.getSourceUrls(sourceFiles);

      // 2. 读取目标文件的内容（如果存在）
      const targetPath = path.join(this.repoPath, targetFile);
      let targetContent = '';
      try {
        targetContent = await fs.promises.readFile(targetPath, 'utf-8');
        // 移除目标内容中的现有头部
        targetContent = targetContent.replace(/^#.*\n/gm, '').trim();
      } catch (error) {
        // 如果文件不存在，使用空字符串
        console.log(`目标文件 ${targetFile} 尚不存在，将创建它`);
      }

      // 3. 读取所有源文件内容
      const contents: string[] = [];

      for (const source of sourceFiles) {
        try {
          let content: string;

          // 检查source是否为URL
          if (isUrl(source)) {
            console.log(`从URL直接获取内容: ${source}`);
            const urlContent = await fetchContent(source);
            if (!urlContent) {
              console.warn(`无法从URL获取内容: ${source}，跳过`);
              continue;
            }
            content = urlContent;
          } else {
            // 作为本地文件路径处理
            const filePath = path.join(this.repoPath, source);
            if (!fs.existsSync(filePath)) {
              console.warn(`源文件 ${source} 不存在，跳过`);
              continue;
            }
            content = await fs.promises.readFile(filePath, 'utf-8');
          }

          // 处理可能以YAML格式开头的Clash规则文件
          let processedContent = content;
          if (content.startsWith('payload:') || content.includes('\npayload:')) {
            // 提取payload部分
            const payloadMatch = content.match(/payload:(.|\n)*?(?=\n[a-z]|$)/s);
            if (payloadMatch) {
              // 先获取payload部分内容
              let payloadContent = payloadMatch[0].replace('payload:', '').trim();

              // 处理每行前面的破折号并去除多余空格
              payloadContent = payloadContent
                .split('\n')
                .map(line => {
                  // 去除破折号并整理空格
                  if (line.trim().startsWith('-')) {
                    return line.trim().substring(1).trim();
                  }
                  return line.trim();
                })
                .join('\n');

              processedContent = payloadContent;
            }
          }

          // 移除现有头部
          contents.push(processedContent.replace(/^#.*\n/gm, '').trim());
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`读取源 ${source} 时出错: ${errorMessage}`);
          // 继续处理其他源
        }
      }

      // 如果没有成功读取任何源，记录警告但继续处理
      if (contents.length === 0) {
        console.warn(`没有成功读取 ${name} 的任何源，仅使用目标内容继续处理`);
      }

      // 4. 合并所有内容，包括目标文件的内容
      let mergedContent = [targetContent, ...contents].join('\n');

      // 5. 如果提供了额外规则，添加它们
      if (extraRules) {
        mergedContent += '\n' + extraRules.join('\n');
      }

      // 5.5 应用规则转换，处理不同格式的规则
      mergedContent = mergedContent
        .split('\n')
        .map(line => this.converter.convert(line))
        .filter(Boolean) // 过滤掉空行和不支持的规则
        .join('\n');

      // 6. 处理去重和清理排序
      let shouldDedup = true;
      if (dedup === false) {
        shouldDedup = false;
      }

      // 如果dedup为false，则创建一个临时的RuleConverter不执行去重
      const tempConverter = shouldDedup ? this.converter : null;

      // 进行清理和排序
      if (shouldDedup) {
        // 正常流程，允许去重
        mergedContent = cleanAndSort(
          mergedContent,
          this.converter,
          cleanup ?? true,
          keepInlineComments !== undefined ? keepInlineComments : true
        );
      } else {
        // 跳过去重，自定义处理
        if (cleanup) {
          // 只清理和排序，不去重
          const lines = mergedContent
            .split('\n')
            .map(line => line.trim())
            .filter(
              line =>
                line && !line.startsWith('#') && !line.startsWith(';') && !line.startsWith('//')
            );

          // 处理行内注释
          let processedLines = lines;
          if (!keepInlineComments) {
            processedLines = lines.map(line => {
              const commentIndex = line.indexOf('//');
              return commentIndex >= 0 ? line.substring(0, commentIndex).trim() : line;
            });
          }

          // 只排序，不去重
          mergedContent = processedLines.sort().join('\n');
        }
      }

      // 7. Apply no-resolve parameter if requested
      if (applyNoResolve !== undefined && applyNoResolve !== null) {
        if (applyNoResolve === true) {
          // 强制添加no-resolve参数
          mergedContent = generateNoResolveVersion(mergedContent);
          console.log(`Applied no-resolve parameter to ${name} rules`);
        } else if (applyNoResolve === false) {
          // 强制删除no-resolve参数
          mergedContent = removeNoResolveFromRules(mergedContent);
          console.log(`Removed no-resolve parameter from ${name} rules`);
        }
      }

      // 8. Add header if enabled (default is true)
      if (header?.enable !== false) {
        mergedContent = addRuleHeader(
          mergedContent,
          {
            title: header?.title || undefined,
            description: header?.description || undefined,
          },
          sourceUrls
        );
      }

      // 9. Write merged content to target file
      await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.promises.writeFile(targetPath, mergedContent);

      console.log(`Successfully merged ${name} rules to ${targetFile}`);

      // 10. Delete source files (optional, controlled by deleteSourceFiles option)
      if (deleteSourceFiles !== false) {
        // 默认为true，除非明确设置为false
        for (const file of sourceFiles) {
          try {
            const filePath = path.join(this.repoPath, file);
            if (fs.existsSync(filePath)) {
              await fs.promises.unlink(filePath);
              console.log(`Deleted source file: ${filePath}`);
            }
          } catch (error) {
            console.error(`Error deleting source file ${file}:`, error);
          }
        }
      }

      return true;
    } catch (error) {
      console.error(`Error merging ${name} rules:`, error);
      throw error;
    }
  }

  private async getSourceUrls(files: string[]): Promise<string[]> {
    // 收集所有URL
    const urls: string[] = [];

    for (const file of files) {
      // 检查文件本身是否为URL
      if (isUrl(file)) {
        urls.push(file);
        continue;
      }

      // 在所有规则组中查找
      let foundUrl = false;
      for (const group of ruleGroups) {
        const ruleFile = group.files.find((f: { path: string }) => f.path === file);
        if (ruleFile?.url) {
          urls.push(ruleFile.url);
          foundUrl = true;
          break;
        }
      }

      if (foundUrl) continue;

      // 如果在规则组中找不到，尝试在 specialRules 中查找
      const specialRule = specialRules.find(
        (rule: SpecialRuleConfig) => rule.targetFile === file || rule.sourceFiles.includes(file)
      );
      if (specialRule) {
        // 如果是目标文件，可以从规则组中查找对应的 URL
        const targetFileRule = ruleGroups
          .flatMap((g: any) => g.files)
          .find((f: { path: string }) => f.path === file);
        if (targetFileRule?.url) {
          urls.push(targetFileRule.url);
          continue;
        }
      }

      // 如果找不到URL，不添加到结果中
    }

    return urls;
  }
}
