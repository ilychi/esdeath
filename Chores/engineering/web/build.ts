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

// 生成目录树
async function walk(dir: string, baseUrl: string) {
  let tree = '';
  const entries = await fs.readdir(dir, { withFileTypes: true });
  entries.sort(prioritySorter);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(ROOT_DIR, fullPath);
    // 使用相对路径而不是GitHub仓库URL
    const relativeUrl = `/${relativePath}`;
    // 创建完整的自定义域名URL用于复制
    const fullUrl = `${CUSTOM_DOMAIN}${relativeUrl}`;

    if (entry.name === 'src' || entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }

    if (entry.isDirectory()) {
      if (
        allowedDirectories.includes(entry.name) ||
        path.dirname(relativePath).startsWith('Surge/Module') ||
        path.dirname(relativePath).startsWith('Surge/Ruleset')
      ) {
        const subEntries = await walk(fullPath, baseUrl);
        if (subEntries) {
          tree += `
                        <li class="folder">
                            ${entry.name}
                            <ul>
                                ${subEntries}
                            </ul>
                        </li>
                    `;
        }
      }
    } else if (allowedExtensions.includes(path.extname(entry.name).toLowerCase())) {
      const buttons = entry.name.endsWith('.sgmodule')
        ? `<a style="border-bottom: none" href="surge:///install-module?url=${encodeURIComponent(
            fullUrl
          )}" target="_blank">
                       <img alt="导入 Surge(远程模块)" title="导入 Surge(远程模块)" style="height: 22px" src="https://raw.githubusercontent.com/xream/scripts/refs/heads/main/scriptable/surge/surge-transparent.png"/>
                   </a>
                   <a style="border-bottom: none" href="scriptable:///run/SurgeModuleTool?url=${encodeURIComponent(
                     fullUrl
                   )}" target="_blank">
                       <img alt="导入 Surge(本地模块)" title="导入 Surge(本地模块 需配合 Scriptable + Script Hub)" style="height: 22px" src="https://raw.githubusercontent.com/Script-Hub-Org/Script-Hub/refs/heads/main/assets/icon512x512.png"/>
                   </a>`
        : `<a style="border-bottom: none" class="copy-button" data-url="${fullUrl}">
                       <img alt="复制规则链接" title="复制规则链接" style="height: 22px" src="https://raw.githubusercontent.com/xream/scripts/refs/heads/main/scriptable/surge/surge-transparent.png"/>
                   </a>`;

      tree += `
                <li>
                    <a class="file" href="${relativeUrl}" target="_blank">${entry.name}
                        ${buttons}
                    </a>
                </li>
            `;
    }
  }
  return tree;
}

function generateHtml(tree: string) {
  return `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Surge Rules & Modules Repository</title>
            <link rel="stylesheet" href="styles/main.css" />
            <link rel="icon" href="https://raw.githubusercontent.com/ilychi/esdeath/main/favicon.ico" type="image/x-icon">
            <style>
                .folder {
                    cursor: pointer;
                    font-weight: bold;
                    list-style-type: none;
                    padding-left: 0
                }
                .folder ul {
                    display: block;
                    border-left: 1px dashed #ddd;
                    margin-left: 10px;
                    padding-left: 20px
                }
                .folder.collapsed ul {
                    display: none;
                }
                .hidden {
                    display: none;
                }
                #search {
                    width: 100%;
                    padding: 10px 15px;
                    margin: 20px 0;
                    font-size: 1rem;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                }
                #search:focus {
                    border-color: #007bff;
                    outline: none;
                    box-shadow: 0px 4px 12px rgba(0, 123, 255, 0.4);
                }
                .container {
                    padding: 20px;
                }
                .search-section {
                    margin-bottom: 30px;
                }
                .directory-list {
                    margin-top: 20px;
                    padding-left: 0;
                }

                .header-title {
                    font-size: 2.2rem;
                    font-weight: 700;
                    margin-bottom: 10px;
                    color: #333;
                }
                
                .header-subtitle {
                    font-size: 1rem;
                    color: #666;
                    margin-bottom: 20px;
                }
                
                .header-info {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-bottom: 15px;
                    font-size: 0.9rem;
                }
                
                .header-info a {
                    color: #007bff;
                    text-decoration: none;
                }
                
                .header-info a:hover {
                    text-decoration: underline;
                }
                
                .last-updated {
                    font-size: 0.85rem;
                    color: #777;
                    margin-bottom: 25px;
                }
                
                .instruction-section {
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 20px;
                }
                
                .instruction-title {
                    font-weight: 600;
                    margin-bottom: 10px;
                }
                
                .instruction-item {
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                }
                
                .instruction-item img {
                    margin-right: 10px;
                }
                
                @media (prefers-color-scheme: dark) {
                    .header-title {
                        color: #e0e0e0;
                    }
                    
                    .header-subtitle, .last-updated {
                        color: #bbb;
                    }
                    
                    .instruction-section {
                        background-color: #2a2a2a;
                    }
                }
            </style>
        </head>
        <body>
        <main class="container">
            <header>
                <h1 class="header-title">Surge Rules & Modules</h1>
                <p class="header-subtitle">高效管理网络规则和模块的集合</p>
                
                <div class="header-info">
                    <span>Made by <a href="https://github.com/ilychi">IKE IKE</a></span> | 
                    <span><a href="https://github.com/ilychi/esdeath">Source @ GitHub</a></span> | 
                    <span>Fork from <a href="https://github.com/SukkaW/Surge">Sukka</a></span>
                </div>
                
                <div class="header-info">
                    <span>Thanks to <a href="https://github.com/luestr">iKeLee</a> for her great work</span>
                    <span>Thanks to all Surge contributors</span>
                </div>
                
                <p class="last-updated">Last Updated: ${new Date().toLocaleString('zh-CN', {
                  timeZone: 'Asia/Shanghai',
                })}</p>
            </header>

            <div class="search-section">
                <input type="text" id="search" placeholder="🔍 搜索文件和文件夹..."/>
                
                <div class="instruction-section">
                    <div class="instruction-title">ℹ️ 操作说明</div>
                    <div class="instruction-item">
                        <img alt="复制链接" title="复制链接" style="height: 22px" src="https://raw.githubusercontent.com/xream/scripts/refs/heads/main/scriptable/surge/surge-transparent.png"/>
                        <span>点击此图标可复制文件链接（使用 ${CUSTOM_DOMAIN} 域名）</span>
                    </div>
                    <div class="instruction-item">
                        <img alt="安装模块" title="安装模块" style="height: 22px" src="https://raw.githubusercontent.com/Script-Hub-Org/Script-Hub/refs/heads/main/assets/icon512x512.png"/>
                        <span>点击此图标可一键安装 Surge 模块</span>
                    </div>
                </div>
            </div>

            <ul class="directory-list">
                ${tree}
            </ul>
        </main>
        <script>
            document.addEventListener("DOMContentLoaded", () => {
                // 初始时将所有文件夹都设为折叠状态
                document.querySelectorAll('.folder').forEach(folder => {
                    folder.classList.add('collapsed');
                });

                // 搜索功能
                const searchInput = document.getElementById('search');
                searchInput.addEventListener('input', (event) => {
                    const searchTerm = event.target.value.toLowerCase();
                    const items = document.querySelectorAll('.directory-list li');
                    const foldersToExpand = new Set();
                
                    items.forEach(item => {
                        const text = item.textContent.toLowerCase();
                        if (text.includes(searchTerm)) {
                            item.classList.remove('hidden');
                            let currentItem = item.closest('ul').parentElement;
                            while (currentItem && currentItem.classList.contains('folder')) {
                                foldersToExpand.add(currentItem);
                                currentItem = currentItem.closest('ul').parentElement;
                            }
                        } else {
                            item.classList.add('hidden');
                        }
                    });
                
                    foldersToExpand.forEach(folder => {
                        folder.classList.remove('collapsed');
                    });
                });

                // 复制功能
                document.querySelectorAll('.copy-button').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const url = button.getAttribute('data-url');
                        try {
                            await navigator.clipboard.writeText(url);
                            const img = button.querySelector('img');
                            const originalTitle = img.title;
                            img.title = '复制成功!';
                            setTimeout(() => {
                                img.title = originalTitle;
                            }, 2000);
                        } catch (err) {
                            console.error('复制失败:', err);
                            const img = button.querySelector('img');
                            img.title = '复制失败';
                        }
                    });
                });

                // 文件夹折叠功能
                document.querySelectorAll('.folder').forEach(folder => {
                    folder.addEventListener('click', (event) => {
                        if (event.target.classList.contains('file')) {
                            return;
                        }
                        event.stopPropagation();
                        folder.classList.toggle('collapsed');
                    });
                });
            });
        </script>
        </body>
        </html>
    `;
}

async function writeHtmlFile(html: string) {
  const htmlFilePath = path.join(OUTPUT_DIR, 'index.html');
  await fs.writeFile(htmlFilePath, html, 'utf8');
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

    // 生成索引页面
    const tree = await walk(ROOT_DIR, '/');
    const html = generateHtml(tree);
    await fs.writeFile(path.join(OUTPUT_DIR, 'index.html'), html);

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

main();
