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

// 允许的文件类型和目录
const allowedExtensions = ['.list', '.mmdb', '.sgmodule'];
const allowedDirectories = ['Surge', 'GeoIP', 'Ruleset', 'Module'];

const prioritySorter = (a: Dirent, b: Dirent) => {
  if (a.isDirectory() && !b.isDirectory()) return -1;
  if (!a.isDirectory() && b.isDirectory()) return 1;
  return a.name.localeCompare(b.name);
};

// 生成目录树
async function walk(dir: string, baseUrl: string) {
  let tree = '';
  const entries = await fs.readdir(dir, { withFileTypes: true });
  entries.sort(prioritySorter);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(ROOT_DIR, fullPath);
    const url = `${baseUrl}${encodeURIComponent(relativePath)}`;

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
            url
          )}" target="_blank">
                       <img alt="导入 Surge(远程模块)" title="导入 Surge(远程模块)" style="height: 22px" src="https://raw.githubusercontent.com/xream/scripts/refs/heads/main/scriptable/surge/surge-transparent.png"/>
                   </a>
                   <a style="border-bottom: none" href="scriptable:///run/SurgeModuleTool?url=${encodeURIComponent(
                     url
                   )}" target="_blank">
                       <img alt="导入 Surge(本地模块)" title="导入 Surge(本地模块 需配合 Scriptable + Script Hub)" style="height: 22px" src="https://raw.githubusercontent.com/Script-Hub-Org/Script-Hub/refs/heads/main/assets/icon512x512.png"/>
                   </a>`
        : `<a style="border-bottom: none" class="copy-button" data-url="${url}">
                       <img alt="复制规则链接" title="复制规则链接" style="height: 22px" src="https://raw.githubusercontent.com/xream/scripts/refs/heads/main/scriptable/surge/surge-transparent.png"/>
                   </a>`;

      tree += `
                <li>
                    <a class="file" href="${url}" target="_blank">${entry.name}
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
            <link rel="stylesheet" href="https://cdn.skk.moe/ruleset/css/21d8777a.css" />
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
                @media (prefers-color-scheme: dark) {
                    body {
                        background-color: #1f1f1f;
                        color: #e0e0e0;
                    }
                    #search {
                        background: #2a2a2a;
                        color: #e0e0e0;
                        border-color: #444;
                    }
                    .folder ul {
                        border-left-color: #444;
                    }
                }
            </style>
        </head>
        <body>
        <main class="container">
            <h1>Surge Rules & Modules Repository</h1>
            <p>
                Made by <a href="https://github.com/ilychi">IKE IKE</a> | 
                <a href="https://github.com/ilychi/esdeath">Source @ GitHub</a> | 
                Fork <a href="https://github.com/SukkaW/Surge">Sukka</a>
            </p>
            <p>
                Thanks To <a href="https://github.com/luestr">iKeLee</a> For Her Great Work
                <br>
                Thanks To All Surge Contributors
            </p>
            <p>Last Updated: ${new Date().toLocaleString('zh-CN', {
              timeZone: 'Asia/Shanghai',
            })}</p>
            <br>

            <div class="search-section">
                <input type="text" id="search" placeholder="🔍 搜索文件和文件夹..."/>
                <span>ℹ️ 操作说明</span>
                <br>
                <small>
                    <img alt="复制链接" title="复制链接" style="height: 22px" src="https://raw.githubusercontent.com/xream/scripts/refs/heads/main/scriptable/surge/surge-transparent.png"/>
                    点击此图标可复制文件链接
                </small>
                <br>
                <small>
                    <img alt="安装模块" title="安装模块" style="height: 22px" src="https://raw.githubusercontent.com/Script-Hub-Org/Script-Hub/refs/heads/main/assets/icon512x512.png"/>
                    点击此图标可一键安装 Surge 模块
                </small>
            </div>

            <ul class="directory-list">
                ${tree}
            </ul>
        </main>
        <script>
            document.addEventListener("DOMContentLoaded", () => {
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

// 构建
async function build() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(path.join(OUTPUT_DIR, 'styles'), { recursive: true });

  // 复制 CSS 文件
  await fs.copyFile(
    path.join(__dirname, 'styles', 'main.css'),
    path.join(OUTPUT_DIR, 'styles', 'main.css')
  );

  const tree = await walk(ROOT_DIR, REPO_URL);
  const html = generateHtml(tree);
  await writeHtmlFile(html);
}
build().catch(err => {
  console.error('Error during build:', err);
});
