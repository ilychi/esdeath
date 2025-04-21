#!/usr/bin/env node

/**
 * 简易构建启动脚本
 * 用于在web目录下直接使用 node build.js 命令
 */

const { exec } = require('child_process');
const path = require('path');

// 获取当前脚本所在目录
const currentDir = __dirname;

// 构建 tsx 命令
const command = `NODE_OPTIONS="--experimental-specifier-resolution=node" npx tsx ${path.join(
  currentDir,
  'build.ts'
)}`;

console.log(`执行命令: ${command}`);

// 执行构建命令
const child = exec(command);

// 将子进程的输出传递到当前进程
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

// 处理退出
child.on('exit', code => {
  process.exit(code);
});
