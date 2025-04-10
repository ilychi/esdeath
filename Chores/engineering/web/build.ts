/** @format */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promises as fs, Dirent } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 修正仓库 URL
const REPO_URL = 'https://raw.githubusercontent.com/ilychi/esdeath/main/';
const ROOT_DIR = path.join(__dirname, '../../..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'public');

// 自定义域名，用于生成链接
const CUSTOM_DOMAIN = 'https://ruleset.chichi.sh';

// 允许的文件类型和目录
const allowedExtensions = ['.list', '.mmdb', '.sgmodule'];
const allowedDirectories = ['Surge', 'GeoIP', 'Ruleset', 'Module'];

const prioritySorter = (a: Dirent, b: Dirent) => {
  if (a.isDirectory() && !b.isDirectory()) return -1;
  if (!a.isDirectory() && b.isDirectory()) return 1;
  return a.name.localeCompare(b.name);
};

// 复制文件函数
async function copyFile(source: string, destination: string) {
  try {
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
    console.log(`Copied: ${source} -> ${destination}`);
  } catch (error) {
    console.error(`Error copying file: ${source}`, error);
  }
}

// 复制目录函数
async function copyDirectory(source: string, destination: string) {
  try {
    const entries = await fs.readdir(source, { withFileTypes: true });

    await fs.mkdir(destination, { recursive: true });

    for (const entry of entries) {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);

      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else if (allowedExtensions.includes(path.extname(entry.name).toLowerCase())) {
        await copyFile(srcPath, destPath);
      }
    }
  } catch (error) {
    console.error(`Error copying directory: ${source}`, error);
  }
}

// 定义文件树项目类型接口
interface FileTreeItem {
  id: string;
  name: string;
  isSelectable: boolean;
  children?: FileTreeItem[];
  url?: string;
  fileType?: string;
}

// 转换目录结构为File Tree组件所需的格式
async function buildFileTreeData(dir: string, relativePath = ''): Promise<FileTreeItem[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    entries.sort(prioritySorter);

    const elements: FileTreeItem[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const entryRelativePath = path.join(relativePath, entry.name);

      if (entry.name === 'src' || entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }

      if (entry.isDirectory()) {
        if (
          allowedDirectories.includes(entry.name) ||
          relativePath.startsWith('Surge/Module') ||
          relativePath.startsWith('Surge/Ruleset') ||
          relativePath.startsWith('GeoIP')
        ) {
          const children: FileTreeItem[] = await buildFileTreeData(fullPath, entryRelativePath);
          if (children.length > 0) {
            elements.push({
              id: entryRelativePath,
              name: entry.name,
              isSelectable: true,
              children: children,
            });
          }
        }
      } else if (allowedExtensions.includes(path.extname(entry.name).toLowerCase())) {
        // 生成完整的自定义域名URL
        const url = `${CUSTOM_DOMAIN}/${entryRelativePath}`;
        const fileType = path.extname(entry.name).substring(1);

        elements.push({
          id: entryRelativePath,
          name: entry.name,
          isSelectable: true,
          url: url,
          fileType: fileType,
        });
      }
    }

    return elements;
  } catch (error) {
    console.error(`Error building file tree data for ${dir}:`, error);
    return [];
  }
}

// 生成HTML
function generateHtml(treeData: FileTreeItem[]) {
  const treeDataJson = JSON.stringify(treeData);
  const updateTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

  return `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Surge Rules & Modules</title>
  <link rel="icon" href="https://raw.githubusercontent.com/ilychi/esdeath/main/favicon.ico" type="image/x-icon">
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link rel="stylesheet" href="styles/main.css">
  <!-- Iconify for icons -->
  <script src="https://cdn.jsdelivr.net/npm/iconify-icon@1.0.8/dist/iconify-icon.min.js"></script>
  <!-- VueJS -->
  <script src="https://cdn.jsdelivr.net/npm/vue@3.3.4/dist/vue.global.prod.js"></script>
            <style>
    /* Tailwind 兼容性基础样式 - 浅色主题 */
    :root {
      --background: 0 0% 100%;
      --foreground: 240 10% 3.9%;
      --card: 0 0% 100%;
      --card-foreground: 240 10% 3.9%;
      --popover: 0 0% 100%;
      --popover-foreground: 240 10% 3.9%;
      --primary: 240 5.9% 10%;
      --primary-foreground: 0 0% 98%;
      --secondary: 240 4.8% 95.9%;
      --secondary-foreground: 240 5.9% 10%;
      --muted: 240 4.8% 95.9%;
      --muted-foreground: 240 3.8% 46.1%;
      --accent: 240 4.8% 95.9%;
      --accent-foreground: 240 5.9% 10%;
      --destructive: 0 84.2% 60.2%;
      --destructive-foreground: 0 0% 98%;
      --border: 240 5.9% 90%;
      --input: 240 5.9% 90%;
      --ring: 240 5.9% 10%;
      --radius: 0.5rem;
    }
    
    /* Inspira UI Pattern Background CSS */
    @keyframes pattern-movement {
      0% { background-position: 0% 0%; }
      100% { background-position: 0% 100%; }
    }
    
    @keyframes pattern-movement-reverse {
      0% { background-position: 0% 100%; }
      100% { background-position: 0% 0%; }
    }
    
    .pattern-bg {
      position: fixed;
      inset: 0;
      z-index: -10;
      pointer-events: none;
      overflow: hidden;
    }
    
    .pattern-bg-grid {
      width: 100%;
      height: 100%;
      background-image: 
        linear-gradient(to right, rgba(17, 24, 39, 0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(17, 24, 39, 0.05) 1px, transparent 1px);
      background-size: 24px 24px;
      animation: pattern-movement 50s linear infinite;
    }
    
    .pattern-bg-dots {
      width: 100%;
      height: 100%;
      background-image: radial-gradient(rgba(17, 24, 39, 0.08) 1px, transparent 1px);
      background-size: 18px 18px;
      animation: pattern-movement-reverse 40s linear infinite;
    }
    
    .pattern-mask {
      position: absolute;
      inset: 0;
      z-index: -5;
      background: radial-gradient(circle at center, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.95) 70%);
    }
    
    /* Inspira UI File Tree CSS */
    .file-tree {
      font-family: ui-monospace, SFMono-Regular, 'Cascadia Code', 'Source Code Pro', Menlo, Monaco, Consolas, monospace;
      font-size: 0.95rem;
      line-height: 1.6;
      color: #111827;
    }
    
    .tree-item {
      position: relative;
      transition: all 0.2s ease;
    }
    
    .tree-folder-header,
    .tree-file {
      display: flex;
      align-items: center;
      padding: 0.275rem 0.5rem;
      border-radius: 0.375rem;
      transition: background-color 0.15s ease;
                    cursor: pointer;
    }
    
    .tree-folder-header:hover,
    .tree-file:hover {
      background-color: rgba(17, 24, 39, 0.04);
    }
    
    .tree-folder-header .folder-icon,
    .tree-file .file-icon {
      margin-right: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-icon, rgba(17, 24, 39, 0.7));
    }
    
    .tree-folder-header .folder-name,
    .tree-file .file-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .tree-folder-content {
      margin-left: 0.75rem;
      padding-left: 1rem;
      border-left: 1px dashed rgba(17, 24, 39, 0.15);
      overflow: hidden;
                    transition: all 0.3s ease;
                }
    
    .tree-file-actions {
      display: flex;
      gap: 0.5rem;
      opacity: 0.7;
      transition: opacity 0.15s ease;
    }
    
    .tree-file:hover .tree-file-actions {
      opacity: 1;
    }
    
    .tree-file-action {
      padding: 0.175rem;
      border-radius: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      background-color: rgba(17, 24, 39, 0.05);
    }
    
    .tree-file-action:hover {
      background-color: rgba(17, 24, 39, 0.1);
    }
    
    /* 文件类型标签 */
    .file-type-tag {
      font-size: 0.65rem;
      padding: 0.1rem 0.3rem;
      border-radius: 0.25rem;
      margin-right: 0.5rem;
      text-transform: uppercase;
      opacity: 0.7;
    }
    
    .file-type-sgmodule {
      background-color: rgba(56, 189, 248, 0.15);
      color: rgba(3, 105, 161, 0.9);
    }
    
    .file-type-list {
      background-color: rgba(52, 211, 153, 0.15);
      color: rgba(6, 95, 70, 0.9);
    }
    
    .file-type-mmdb {
      background-color: rgba(251, 146, 60, 0.15);
      color: rgba(154, 52, 18, 0.9);
    }
    
    /* 折叠指示器 */
    .folder-toggle {
      width: 0.95rem;
      height: 0.95rem;
      margin-right: 0.35rem;
      transition: transform 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .folder-toggle-open {
      transform: rotate(90deg);
    }
    
    /* Tooltip */
    .tooltip {
      position: relative;
    }
    
    .tooltip-content {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(-0.25rem);
      padding: 0.35rem 0.5rem;
      border-radius: 0.25rem;
      background-color: hsl(var(--popover));
      color: hsl(var(--popover-foreground));
      font-size: 0.75rem;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: all 0.2s ease;
      z-index: 50;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .tooltip:hover .tooltip-content {
      opacity: 1;
      transform: translateX(-50%) translateY(-0.5rem);
    }
    
    /* 顶部导航栏 */
    .header-navigation {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.4rem 0.7rem;
      margin-bottom: 1rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(17, 24, 39, 0.1);
      font-size: 0.875rem;
      color: #4b5563;
    }
    
    .header-navigation-separator {
      color: rgba(17, 24, 39, 0.3);
    }
    
    /* 提示框 */
    .alert {
      position: fixed;
      top: 1rem;
      right: 1rem;
      padding: 0.75rem 1rem;
      border-radius: 0.375rem;
      background-color: rgb(240, 253, 244);
      color: rgb(6, 95, 70);
      transform: translateY(-1rem);
      opacity: 0;
      transition: all 0.3s ease;
      z-index: 50;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1px solid rgb(187, 247, 208);
    }
    
    .alert.show {
      transform: translateY(0);
      opacity: 1;
    }
    
    /* 搜索框 */
    .search-container {
      position: relative;
      margin-bottom: 1.25rem;
    }
    
    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.5rem;
      border-radius: 0.5rem;
      background-color: white;
      border: 1px solid rgba(17, 24, 39, 0.1);
      color: #111827;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    
    .search-input::placeholder {
      color: rgba(17, 24, 39, 0.4);
    }
    
    .search-input:focus {
                    outline: none;
      border-color: rgba(17, 24, 39, 0.2);
      background-color: white;
      box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.05);
    }
    
    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: rgba(17, 24, 39, 0.4);
      pointer-events: none;
    }
    
    /* 信息卡片 */
    .info-card {
      margin-bottom: 1.5rem;
      padding: 1.25rem;
      border-radius: 0.5rem;
      background-color: white;
      border: 1px solid rgba(17, 24, 39, 0.07);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
      overflow: hidden;
    }
    
    .info-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 0.75rem;
      cursor: pointer;
      user-select: none;
    }
    
    .info-card-title-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .info-card-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
    }
    
    .info-card-content {
      max-height: 0;
      opacity: 0;
      transition: max-height 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
      margin-top: 0;
    }
    
    .info-card-content.expanded {
      max-height: 500px;
      opacity: 1;
      margin-top: 0.75rem;
      border-top: 1px solid rgba(17, 24, 39, 0.07);
      padding-top: 0.75rem;
    }
    
    .info-feature {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    
    .info-feature-icon {
      flex-shrink: 0;
      color: rgba(17, 24, 39, 0.7);
    }
    
    .info-feature-text {
      color: #4b5563;
      font-size: 0.95rem;
      line-height: 1.5;
    }
    
    /* 文件预览模态框 */
    .file-preview-modal {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 0, 0, 0.5);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    
    .file-preview-modal.show {
      opacity: 1;
      pointer-events: auto;
    }
    
    .file-preview-content {
      width: 90%;
      max-width: 1000px;
      max-height: 80vh;
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .file-preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid rgba(17, 24, 39, 0.1);
    }
    
    .file-preview-title {
      font-weight: 600;
      font-size: 1.125rem;
      color: #111827;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .file-preview-close {
      background: transparent;
      border: none;
      color: rgba(17, 24, 39, 0.5);
      cursor: pointer;
      width: 2rem;
      height: 2rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    
    .file-preview-close:hover {
      background-color: rgba(17, 24, 39, 0.05);
      color: rgba(17, 24, 39, 0.8);
    }
    
    .file-preview-body {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }
    
    .file-preview-content-text {
      font-family: ui-monospace, SFMono-Regular, 'Cascadia Code', 'Source Code Pro', Menlo, Monaco, Consolas, monospace;
      font-size: 0.875rem;
      line-height: 1.7;
      white-space: pre-wrap;
      color: #111827;
    }
    
    .file-preview-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border-top: 1px solid rgba(17, 24, 39, 0.1);
    }
    
    .file-preview-button {
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .file-preview-button-primary {
      background-color: rgba(17, 24, 39, 0.9);
      color: white;
      border: none;
    }
    
    .file-preview-button-primary:hover {
      background-color: rgba(17, 24, 39, 1);
    }
    
    .file-preview-button-secondary {
      background-color: white;
      color: rgba(17, 24, 39, 0.8);
      border: 1px solid rgba(17, 24, 39, 0.2);
    }
    
    .file-preview-button-secondary:hover {
      background-color: rgba(17, 24, 39, 0.05);
    }
    
    .file-preview-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 200px;
    }

    /* Hyper Text 特效 */
    .hyper-text {
      display: inline-block;
      position: relative;
    }
    
    .hyper-text-char {
      display: inline-block;
      position: relative;
      transition: transform 0.3s, color 0.3s;
      transition-timing-function: cubic-bezier(0.2, 0.6, 0.4, 1);
    }
    
    .hyper-text:hover .hyper-text-char {
      color: #4299e1;
    }
    
    /* Text Generate Effect 特效 */
    .text-generate-effect {
      display: inline-block;
    }
    
    .text-generate-effect span {
      opacity: 0;
      filter: blur(5px);
      animation: textGenerateAppear 0.5s forwards;
    }
    
    @keyframes textGenerateAppear {
      to {
        opacity: 1;
        filter: blur(0);
      }
    }
    
    /* Neon Border 特效 */
    .neon-border {
      position: relative;
      overflow: hidden;
      border-radius: 0.5rem;
    }

    .neon-border::before {
      content: "";
      position: absolute;
      inset: -2px;
      z-index: -1;
      background: linear-gradient(90deg, #0496ff, #ff0a54, #0496ff);
      background-size: 200% 200%;
      animation: neonGradient 6s linear infinite;
    }
    
    @keyframes neonGradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    /* Text Hover Effect 特效 */
    .text-hover-effect {
      display: inline-block;
      position: relative;
      white-space: nowrap;
    }
    
    .text-hover-effect-mask {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      mask-image: linear-gradient(
        to bottom,
        transparent,
        black 25%,
        black 75%,
        transparent
      );
      mask-size: 100% 100%;
      mask-repeat: no-repeat;
      background: linear-gradient(
        to right,
        #ff0080,
        #7928ca,
        #ff0080
      );
      background-size: 200% 100%;
      animation: shimmer 2s linear infinite;
      opacity: 0;
      transition: opacity 200ms ease;
    }
    
    .text-hover-effect:hover .text-hover-effect-mask {
      opacity: 1;
    }
    
    @keyframes shimmer {
      from {
        background-position: 0 0;
      }
      to {
        background-position: -200% 0;
      }
    }
    
    /* 标题区域样式 */
    .title-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 2rem;
    }
    
    .main-title {
      font-size: 3rem;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 0.5rem;
      background: linear-gradient(to right, #0f172a, #334155);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .subtitle {
      font-size: 1.25rem;
      max-width: 36rem;
      line-height: 1.5;
      color: #64748b;
      margin-bottom: 1.5rem;
    }
            </style>
        </head>
<body class="bg-white text-gray-900 min-h-screen">
  <!-- Inspira UI Pattern Background -->
  <div class="pattern-bg">
    <div class="pattern-bg-grid"></div>
    <div class="pattern-bg-dots"></div>
  </div>
  <div class="pattern-mask"></div>
  
  <div id="app" class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <header class="text-center mb-8">
      <div class="title-container">
        <!-- 混合使用特效：Text Hover Effect外层，内部为Text Generate Effect -->
        <h1 class="main-title">
          <div class="text-hover-effect">
            <span>Surge Rules & Modules</span>
            <div class="text-hover-effect-mask"></div>
          </div>
        </h1>
        <p class="subtitle">
          <div class="text-generate-effect" id="generateSubtitle"></div>
        </p>
      </div>
      
      <div class="header-navigation justify-center">
        <span>Made by <a href="https://github.com/ilychi" class="text-blue-600 hover:underline">IKE IKE</a></span>
        <span class="header-navigation-separator">•</span>
        <span><a href="https://github.com/ilychi/esdeath" class="text-blue-600 hover:underline">Source @ GitHub</a></span>
        <span class="header-navigation-separator">•</span>
        <span>Fork from <a href="https://github.com/SukkaW/Surge" class="text-blue-600 hover:underline">Sukka</a></span>
        <span class="header-navigation-separator">•</span>
        <span>更新于: ${updateTime}</span>
      </div>
    </header>

    <!-- 使用Neon Border 特效 -->
    <div class="search-container neon-border">
      <iconify-icon icon="tabler:search" class="search-icon"></iconify-icon>
      <input 
        type="text" 
        v-model="searchTerm" 
        placeholder="搜索文件和文件夹..." 
        class="search-input"
        @input="handleSearch"
      >
    </div>

    <!-- 可折叠的使用说明卡片 -->
    <div class="info-card">
      <div class="info-card-header" @click="toggleInfoCard">
        <div class="info-card-title-wrapper">
          <iconify-icon icon="tabler:info-circle" width="22" class="text-blue-600"></iconify-icon>
          <h2 class="info-card-title">使用说明</h2>
        </div>
        <div class="folder-toggle" :class="{ 'folder-toggle-open': infoCardExpanded }">
          <iconify-icon icon="tabler:chevron-right" width="18"></iconify-icon>
        </div>
      </div>
      <div class="info-card-content" :class="{ expanded: infoCardExpanded }">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div class="info-feature">
            <iconify-icon icon="tabler:clipboard" width="20" class="info-feature-icon"></iconify-icon>
            <span class="info-feature-text">点击文件可以预览内容</span>
          </div>
          <div class="info-feature">
            <iconify-icon icon="tabler:plug" width="20" class="info-feature-icon"></iconify-icon>
            <span class="info-feature-text">sgmodule 文件支持一键导入到 Surge</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Inspira UI File Tree -->
    <div class="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
      <div class="file-tree">
        <template v-for="item in filteredTreeData" :key="item.id">
          <!-- 文件夹 -->
          <div v-if="item.children" class="tree-item">
            <div class="tree-folder-header" @click="toggleFolder(item.id)">
              <div class="folder-toggle" :class="{ 'folder-toggle-open': isExpanded(item.id) }">
                <iconify-icon icon="tabler:chevron-right" width="14"></iconify-icon>
              </div>
              <div class="folder-icon">
                <iconify-icon :icon="isExpanded(item.id) ? 'tabler:folder-open' : 'tabler:folder'" width="18"></iconify-icon>
              </div>
              <div class="folder-name">{{ item.name }}</div>
            </div>
            <div class="tree-folder-content" v-show="isExpanded(item.id)" :key="'content-'+item.id">
              <template v-for="child in item.children" :key="child.id">
                <!-- 嵌套文件夹 -->
                <div v-if="child.children" class="tree-item">
                  <div class="tree-folder-header" @click="toggleFolder(child.id)">
                    <div class="folder-toggle" :class="{ 'folder-toggle-open': isExpanded(child.id) }">
                      <iconify-icon icon="tabler:chevron-right" width="14"></iconify-icon>
                    </div>
                    <div class="folder-icon">
                      <iconify-icon :icon="isExpanded(child.id) ? 'tabler:folder-open' : 'tabler:folder'" width="18"></iconify-icon>
                    </div>
                    <div class="folder-name">{{ child.name }}</div>
                  </div>
                  <div class="tree-folder-content" v-show="isExpanded(child.id)" :key="'content-'+child.id">
                    <template v-for="subChild in child.children" :key="subChild.id">
                      <!-- 文件 -->
                      <div v-if="!subChild.children" class="tree-file" @click="previewFile(subChild)">
                        <div class="file-icon">
                          <iconify-icon :icon="getFileIcon(subChild)" width="16"></iconify-icon>
                        </div>
                        <div class="file-name">
                          {{ subChild.name }}
                        </div>
                        <div class="tree-file-actions">
                          <span v-if="subChild.fileType" class="file-type-tag" :class="'file-type-'+subChild.fileType">
                            {{ subChild.fileType }}
                          </span>
                          <div v-if="subChild.fileType === 'sgmodule'" 
                               class="tree-file-action tooltip" 
                               @click.stop="installModule(subChild.url)">
                            <iconify-icon icon="tabler:plug" width="16"></iconify-icon>
                            <div class="tooltip-content">导入到 Surge</div>
                          </div>
                          <div class="tree-file-action tooltip" @click.stop="copyToClipboard(subChild.url)">
                            <iconify-icon icon="tabler:clipboard" width="16"></iconify-icon>
                            <div class="tooltip-content">复制链接</div>
                          </div>
                        </div>
                      </div>
                      <!-- 第三级文件夹 -->
                      <div v-else class="tree-item">
                        <div class="tree-folder-header" @click="toggleFolder(subChild.id)">
                          <div class="folder-toggle" :class="{ 'folder-toggle-open': isExpanded(subChild.id) }">
                            <iconify-icon icon="tabler:chevron-right" width="14"></iconify-icon>
                          </div>
                          <div class="folder-icon">
                            <iconify-icon :icon="isExpanded(subChild.id) ? 'tabler:folder-open' : 'tabler:folder'" width="18"></iconify-icon>
                          </div>
                          <div class="folder-name">{{ subChild.name }}</div>
                        </div>
                        <div class="tree-folder-content" v-show="isExpanded(subChild.id)" :key="'content-'+subChild.id">
                          <div v-for="fileItem in subChild.children" :key="fileItem.id" 
                               class="tree-file" @click="previewFile(fileItem)">
                            <div class="file-icon">
                              <iconify-icon :icon="getFileIcon(fileItem)" width="16"></iconify-icon>
                            </div>
                            <div class="file-name">{{ fileItem.name }}</div>
                            <div class="tree-file-actions">
                              <span v-if="fileItem.fileType" class="file-type-tag" :class="'file-type-'+fileItem.fileType">
                                {{ fileItem.fileType }}
                              </span>
                              <div v-if="fileItem.fileType === 'sgmodule'" 
                                   class="tree-file-action tooltip" 
                                   @click.stop="installModule(fileItem.url)">
                                <iconify-icon icon="tabler:plug" width="16"></iconify-icon>
                                <div class="tooltip-content">导入到 Surge</div>
                              </div>
                              <div class="tree-file-action tooltip" @click.stop="copyToClipboard(fileItem.url)">
                                <iconify-icon icon="tabler:clipboard" width="16"></iconify-icon>
                                <div class="tooltip-content">复制链接</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
                <!-- 文件 -->
                <div v-else class="tree-file" @click="previewFile(child)">
                  <div class="file-icon">
                    <iconify-icon :icon="getFileIcon(child)" width="16"></iconify-icon>
                  </div>
                  <div class="file-name">{{ child.name }}</div>
                  <div class="tree-file-actions">
                    <span v-if="child.fileType" class="file-type-tag" :class="'file-type-'+child.fileType">
                      {{ child.fileType }}
                    </span>
                    <div v-if="child.fileType === 'sgmodule'" 
                         class="tree-file-action tooltip" 
                         @click.stop="installModule(child.url)">
                      <iconify-icon icon="tabler:plug" width="16"></iconify-icon>
                      <div class="tooltip-content">导入到 Surge</div>
                    </div>
                    <div class="tree-file-action tooltip" @click.stop="copyToClipboard(child.url)">
                      <iconify-icon icon="tabler:clipboard" width="16"></iconify-icon>
                      <div class="tooltip-content">复制链接</div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
          <!-- 文件 -->
          <div v-else class="tree-file" @click="previewFile(item)">
            <div class="file-icon">
              <iconify-icon :icon="getFileIcon(item)" width="16"></iconify-icon>
            </div>
            <div class="file-name">{{ item.name }}</div>
            <div class="tree-file-actions">
              <span v-if="item.fileType" class="file-type-tag" :class="'file-type-'+item.fileType">
                {{ item.fileType }}
              </span>
              <div v-if="item.fileType === 'sgmodule'" 
                   class="tree-file-action tooltip" 
                   @click.stop="installModule(item.url)">
                <iconify-icon icon="tabler:plug" width="16"></iconify-icon>
                <div class="tooltip-content">导入到 Surge</div>
              </div>
              <div class="tree-file-action tooltip" @click.stop="copyToClipboard(item.url)">
                <iconify-icon icon="tabler:clipboard" width="16"></iconify-icon>
                <div class="tooltip-content">复制链接</div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 文件预览模态框 -->
    <div class="file-preview-modal" :class="{ show: showPreview }">
      <div class="file-preview-content" v-if="showPreview">
        <div class="file-preview-header">
          <div class="file-preview-title">
            <iconify-icon :icon="getFileIcon(previewingFile)" width="20"></iconify-icon>
            <span>{{ previewingFile.name }}</span>
          </div>
          <button class="file-preview-close" @click="closePreview">
            <iconify-icon icon="tabler:x" width="20"></iconify-icon>
          </button>
        </div>
        <div class="file-preview-body">
          <div v-if="previewLoading" class="file-preview-loading">
            <iconify-icon icon="tabler:loader-2" width="32" class="animate-spin text-gray-400"></iconify-icon>
          </div>
          <pre v-else class="file-preview-content-text">{{ previewContent }}</pre>
        </div>
        <div class="file-preview-footer">
          <button class="file-preview-button file-preview-button-secondary" @click="closePreview">
            关闭
          </button>
          <button class="file-preview-button file-preview-button-primary" @click="copyToClipboard(previewingFile.url)">
            <iconify-icon icon="tabler:clipboard" width="16"></iconify-icon>
            <span>复制链接</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 提示框 -->
    <div class="alert" :class="{ show: showAlert }">
      <iconify-icon icon="tabler:check" width="18"></iconify-icon>
      <span>{{ alertMessage }}</span>
    </div>
            </div>

        <script>
    const app = Vue.createApp({
      data() {
        return {
          treeData: ${treeDataJson},
          expandedFolders: [],
          searchTerm: '',
          filteredTreeData: [],
          showAlert: false,
          alertMessage: '',
          // 文件预览相关
          showPreview: false,
          previewingFile: null,
          previewContent: '',
          previewLoading: false,
          // 使用说明折叠状态
          infoCardExpanded: false
        }
      },
      mounted() {
        // 默认展开第一级文件夹
        this.expandedFolders = this.treeData.map(item => item.id);
        this.filteredTreeData = this.treeData;
        
        // 初始化副标题动画效果
        this.initTextGenerateEffect();
      },
      methods: {
        // 副标题特效 - Text Generate Effect
        initTextGenerateEffect() {
          const subtitle = "高效管理网络规则和模块的集合";
          let html = '';
          
          for (let i = 0; i < subtitle.length; i++) {
            const char = subtitle[i] === ' ' ? '&nbsp;' : subtitle[i];
            const delay = i * 40;
            html += \`<span style="animation-delay: \${delay}ms">\${char}</span>\`;
          }
          
          document.getElementById('generateSubtitle').innerHTML = html;
        },
        
        // 切换使用说明卡片的展开状态
        toggleInfoCard() {
          this.infoCardExpanded = !this.infoCardExpanded;
        },
        
        toggleFolder(id) {
          const index = this.expandedFolders.indexOf(id);
          if (index === -1) {
            this.expandedFolders.push(id);
                        } else {
            this.expandedFolders.splice(index, 1);
          }
        },
        isExpanded(id) {
          return this.expandedFolders.includes(id);
        },
        getFileIcon(item) {
          if (item.fileType === 'list') return 'tabler:list';
          if (item.fileType === 'sgmodule') return 'tabler:plug';
          if (item.fileType === 'mmdb') return 'tabler:database';
          return 'tabler:file';
        },
        handleSearch() {
          if (!this.searchTerm.trim()) {
            this.filteredTreeData = this.treeData;
            return;
          }
          
          const term = this.searchTerm.toLowerCase();
          this.filteredTreeData = this.searchInTree(this.treeData, term);
        },
        searchInTree(tree, term) {
          return tree.filter(item => {
            // 名称匹配
            const nameMatch = item.name.toLowerCase().includes(term);
            
            // 如果是文件夹，递归搜索子项
            if (item.children && item.children.length) {
              const matchedChildren = this.searchInTree(item.children, term);
              
              if (matchedChildren.length > 0) {
                // 确保文件夹已展开
                if (!this.isExpanded(item.id)) {
                  this.expandedFolders.push(item.id);
                }
                
                // 返回修改后的文件夹及其匹配的子项
                return {
                  ...item,
                  children: matchedChildren
                };
              }
            }
            
            return nameMatch;
          });
        },
        copyToClipboard(text) {
          if (!text) return;
          
          navigator.clipboard.writeText(text)
            .then(() => {
              this.showAlertMessage('链接已复制到剪贴板');
            })
            .catch(err => {
              this.showAlertMessage('复制失败，请手动复制');
              console.error('复制失败:', err);
            });
        },
        installModule(url) {
          if (!url) return;
          window.open('surge:///install-module?url=' + encodeURIComponent(url), '_blank');
          this.showAlertMessage('正在打开 Surge 安装模块');
        },
        showAlertMessage(message) {
          this.alertMessage = message;
          this.showAlert = true;
          
          // 3秒后隐藏提示
          setTimeout(() => {
            this.showAlert = false;
          }, 3000);
        },
        
        // 文件预览相关功能
        previewFile(file) {
          if (!file || !file.url) return;
          
          this.previewingFile = file;
          this.previewContent = '';
          this.previewLoading = true;
          this.showPreview = true;
          
          // 请求文件内容
          fetch(file.url)
            .then(response => {
              if (!response.ok) {
                throw new Error('网络请求失败');
              }
              return response.text();
            })
            .then(content => {
              this.previewContent = content;
              this.previewLoading = false;
            })
            .catch(error => {
              console.error('预览文件失败:', error);
              this.previewContent = '加载文件内容失败，请稍后再试或直接下载文件。';
              this.previewLoading = false;
            });
        },
        closePreview() {
          this.showPreview = false;
          this.previewingFile = null;
          this.previewContent = '';
        }
      }
    }).mount('#app');
        </script>
        </body>
        </html>
    `;
}

// 主函数
async function main() {
  try {
    // 清理 output 目录
    await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.mkdir(path.join(OUTPUT_DIR, 'styles'), { recursive: true });

    // 复制CSS
    const sourceDir = path.join(__dirname, 'styles');
    const targetDir = path.join(OUTPUT_DIR, 'styles');
    await copyDirectory(sourceDir, targetDir);

    // 复制规则文件
    for (const dir of allowedDirectories) {
      const source = path.join(ROOT_DIR, dir);
      const destination = path.join(OUTPUT_DIR, dir);

      try {
        await fs.access(source);
        console.log(`Copying directory: ${dir}`);
        await copyDirectory(source, destination);
      } catch {
        console.log(`Directory not found: ${dir}`);
      }
    }

    // 构建File Tree数据
    const treeData = [];
    for (const dir of allowedDirectories) {
      const dirPath = path.join(ROOT_DIR, dir);
      try {
        await fs.access(dirPath);
        const data = await buildFileTreeData(dirPath, dir);
        if (data.length > 0) {
          treeData.push({
            id: dir,
            name: dir,
            isSelectable: true,
            children: data,
          });
        }
      } catch {
        console.log(`Directory not found: ${dir}`);
      }
    }

    // 生成索引页面
    const html = generateHtml(treeData);
    await fs.writeFile(path.join(OUTPUT_DIR, 'index.html'), html);

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

main();
