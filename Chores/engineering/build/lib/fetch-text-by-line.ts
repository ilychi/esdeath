/**
 * 文件读取工具 - 提供按行读取文件的能力
 */
import * as fs from 'fs';
import * as readline from 'readline';
import { processLine } from './process-line.js';

/**
 * 按行读取文本文件
 * @param filePath 文件路径
 * @returns 异步可迭代对象，每次迭代返回一行
 */
export function readFileByLine(filePath: string): AsyncIterable<string> {
  return readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });
}

/**
 * 读取文件，处理每行，并返回处理后的非空行数组
 * @param filePath 文件路径
 * @returns 处理后的行数组
 */
export async function readFileIntoProcessedArray(filePath: string): Promise<string[]> {
  const results: string[] = [];

  for await (const line of readFileByLine(filePath)) {
    const processedLine = processLine(line);
    if (processedLine) {
      results.push(processedLine);
    }
  }

  return results;
}
