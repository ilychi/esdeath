import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 递归创建目录
export async function mkdirp(dir: string): Promise<void> {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory: ${dir}`, error);
    throw error;
  }
}

// 将文件内容读入数组并处理
export async function readFileIntoArray(filepath: string): Promise<string[]> {
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    return content.split(/\r?\n/).filter(line => line.trim() !== '');
  } catch (error) {
    console.error(`Error reading file: ${filepath}`, error);
    return [];
  }
}

// 写入文件
export async function writeFile(filepath: string, content: string | string[]): Promise<void> {
  try {
    await mkdirp(path.dirname(filepath));
    const fileContent = Array.isArray(content) ? content.join('\n') : content;
    await fs.writeFile(filepath, fileContent);
    console.log(`File written: ${filepath}`);
  } catch (error) {
    console.error(`Error writing file: ${filepath}`, error);
    throw error;
  }
}

// 比较并写入文件（仅当内容变化时）
export async function compareAndWriteFile(
  filepath: string,
  content: string | string[]
): Promise<boolean> {
  try {
    const fileContent = Array.isArray(content) ? content.join('\n') : content;
    let currentContent: string;

    try {
      currentContent = await fs.readFile(filepath, 'utf-8');
    } catch (error) {
      // 文件不存在，直接写入
      await writeFile(filepath, fileContent);
      return true;
    }

    if (currentContent !== fileContent) {
      await writeFile(filepath, fileContent);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error comparing/writing file: ${filepath}`, error);
    throw error;
  }
}

// 递归复制目录内容
export async function copyDirectory(source: string, destination: string): Promise<void> {
  try {
    await mkdirp(destination);

    const entries = await fs.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);

      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
        console.log(`Copied: ${srcPath} -> ${destPath}`);
      }
    }
  } catch (error) {
    console.error(`Error copying directory: ${source} -> ${destination}`, error);
    throw error;
  }
}

// 快速目录扫描函数
export async function scanDirectory(directory: string): Promise<string[]> {
  const result: string[] = [];

  async function scan(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await scan(fullPath);
      } else {
        result.push(fullPath);
      }
    }
  }

  await scan(directory);
  return result;
}
