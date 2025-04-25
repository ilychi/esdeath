import fs from 'node:fs/promises';
import path from 'node:path';
import { DIRECTORY_PRIORITY } from '../constants/priority.js';

// 文件类型枚举
export enum TreeFileType {
  FILE = 1,
  DIRECTORY = 2,
}

// 文件节点接口
export interface TreeFile {
  type: TreeFileType.FILE;
  name: string;
  path: string;
  fileType?: string;
  url?: string;
}

// 目录节点接口
export interface TreeDirectory {
  type: TreeFileType.DIRECTORY;
  name: string;
  path: string;
  children: TreeTypeArray;
}

export type TreeType = TreeFile | TreeDirectory;
export type TreeTypeArray = TreeType[];

// 基于优先级的排序函数
export function prioritySorter(a: TreeType, b: TreeType): number {
  // 先按类型排序（目录在前）
  if (a.type !== b.type) {
    return a.type === TreeFileType.DIRECTORY ? -1 : 1;
  }

  // 再按优先级排序
  const aPriority = DIRECTORY_PRIORITY[a.name] || DIRECTORY_PRIORITY.default;
  const bPriority = DIRECTORY_PRIORITY[b.name] || DIRECTORY_PRIORITY.default;

  if (aPriority !== bPriority) {
    return aPriority - bPriority;
  }

  // 最后按名称字母顺序排序
  return a.name.localeCompare(b.name);
}

// 构建文件树函数
export async function buildFileTree(
  rootPath: string,
  customDomain?: string
): Promise<TreeTypeArray> {
  const tree: TreeTypeArray = [];

  const walk = async (
    dir: string,
    node: TreeTypeArray,
    dirRelativeToRoot: string = ''
  ): Promise<void> => {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        // 忽略隐藏文件和特定文件
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'CNAME') {
          continue;
        }

        const fullPath = path.join(dir, entry.name);
        const relativePath = dirRelativeToRoot
          ? path.join(dirRelativeToRoot, entry.name)
          : entry.name;

        if (entry.isDirectory()) {
          const newNode: TreeDirectory = {
            type: TreeFileType.DIRECTORY,
            name: entry.name,
            path: relativePath,
            children: [],
          };

          node.push(newNode);
          await walk(fullPath, newNode.children, relativePath);

          // 如果目录为空，则移除
          if (newNode.children.length === 0) {
            const index = node.indexOf(newNode);
            if (index !== -1) {
              node.splice(index, 1);
            }
          }
        } else if (entry.isFile() && entry.name !== 'index.html') {
          // 获取文件扩展名
          const extname = path.extname(entry.name).toLowerCase().substring(1);

          // 生成URL
          const url = customDomain ? `${customDomain}/${relativePath}` : `/${relativePath}`;

          // 使用条件属性而不是undefined值
          const newNode: TreeFile = {
            type: TreeFileType.FILE,
            name: entry.name,
            path: relativePath,
            url,
            ...(extname ? { fileType: extname } : {}),
          };

          node.push(newNode);
        }
      }

      // 按优先级排序
      node.sort(prioritySorter);
    } catch (error) {
      console.error(`Error building file tree for ${dir}:`, error);
    }
  };

  await walk(rootPath, tree);
  return tree;
}
