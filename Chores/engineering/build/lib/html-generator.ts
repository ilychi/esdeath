// HTML生成器 - 为项目创建现代化的索引页面
import { TreeTypeArray, TreeType, TreeFileType } from './tree-builder.js';

// 生成HTML的函数
export function generateHtml(
  tree: TreeTypeArray,
  options: {
    title?: string;
    description?: string;
    author?: string;
    updateTime?: string;
    customDomain?: string;
  } = {}
): string {
  const {
    title = "Luck's Surge Rules & Modules Hub",
    description = 'Everything that happens is good for me.',
    author = 'IKE IKE',
    updateTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    customDomain = '',
  } = options;

  // 将favicon编码为base64，直接嵌入HTML中
  const faviconBase64 = `data:image/png;base64,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`;

  // 遍历树生成HTML
  function renderTree(tree: TreeTypeArray): string {
    let html = '';

    for (const item of tree) {
      if (item.type === TreeFileType.DIRECTORY) {
        html += `
          <li class="folder">
            <div class="tree-folder-header">
              <div class="folder-toggle">
                <iconify-icon icon="tabler:chevron-right" width="14"></iconify-icon>
              </div>
              <div class="folder-icon">
                <iconify-icon icon="tabler:folder" width="18"></iconify-icon>
              </div>
              <div class="folder-name">${item.name}</div>
            </div>
            <ul class="tree-folder-content">
              ${renderTree(item.children)}
            </ul>
          </li>
        `;
      } else {
        // 获取文件类型标签样式
        const fileTypeClass = item.fileType ? `file-type-${item.fileType}` : '';

        // 获取文件图标
        let fileIcon = 'tabler:file';
        if (item.fileType === 'sgmodule') fileIcon = 'tabler:plug';
        else if (item.fileType === 'list') fileIcon = 'tabler:list';
        else if (item.fileType === 'js') fileIcon = 'tabler:brand-javascript';
        else if (item.fileType === 'conf') fileIcon = 'tabler:settings';
        else if (item.fileType === 'mmdb') fileIcon = 'tabler:database';

        html += `
          <li class="tree-file">
            <div class="file-icon">
              <iconify-icon icon="${fileIcon}" width="16"></iconify-icon>
            </div>
            <div class="file-name">${item.name}</div>
            <div class="tree-file-actions">
              ${
                item.fileType
                  ? `<span class="file-type-tag ${fileTypeClass}">${item.fileType}</span>`
                  : ''
              }
              ${
                item.fileType === 'sgmodule'
                  ? `
                <div class="tree-file-action tooltip" data-module-url="${item.url}">
                  <iconify-icon icon="tabler:plug" width="16"></iconify-icon>
                  <div class="tooltip-content">导入到 Surge</div>
                </div>
              `
                  : ''
              }
              <div class="tree-file-action copy-button tooltip" data-copy-url="${item.url}">
                <iconify-icon icon="tabler:clipboard" width="16"></iconify-icon>
                <div class="tooltip-content">复制链接</div>
              </div>
            </div>
          </li>
        `;
      }
    }

    return html;
  }

  // 完整的HTML模板
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <link rel="icon" href="${faviconBase64}" type="image/png">
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <link rel="stylesheet" href="styles/main.css">
      <!-- Iconify for icons -->
      <script src="https://cdn.jsdelivr.net/npm/iconify-icon@1.0.8/dist/iconify-icon.min.js"></script>
      <!-- VueJS -->
      <script src="https://cdn.jsdelivr.net/npm/vue@3.3.4/dist/vue.global.prod.js"></script>
      <style>
        /* 样式内容 - 这里会非常长，包含所有CSS样式 */
        :root {
          --background: 0 0% 100%;
          --foreground: 240 10% 3.9%;
          --card: 0 0% 100%;
          --card-foreground: 240 10% 3.9%;
          --primary: 240 5.9% 10%;
          --primary-foreground: 0 0% 98%;
          --secondary: 240 4.8% 95.9%;
          --secondary-foreground: 240 5.9% 10%;
          --border: 240 5.9% 90%;
          --radius: 0.5rem;
          --radiant-anim-duration: 10s;
          --radiant-width: 100px;
          --copy-button-color: #4f46e5;
          --copy-button-hover-color: #4338ca;
        }
        
        /* 基础样式 */
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: hsl(var(--foreground));
          background: hsl(var(--background));
          background-image: 
            radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 0.04) 0px, transparent 50%),
            radial-gradient(at 97% 21%, hsla(125, 98%, 72%, 0.04) 0px, transparent 50%),
            radial-gradient(at 52% 99%, hsla(354, 98%, 61%, 0.04) 0px, transparent 50%),
            radial-gradient(at 10% 29%, hsla(256, 96%, 67%, 0.04) 0px, transparent 50%),
            radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 0.04) 0px, transparent 50%),
            radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 0.04) 0px, transparent 50%),
            radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 0.04) 0px, transparent 50%);
        }
        
        /* 文件树样式 */
        .file-tree {
          font-family: ui-monospace, SFMono-Regular, 'Cascadia Code', 'Source Code Pro', Menlo, Monaco, Consolas, monospace;
          font-size: 0.95rem;
          line-height: 1.6;
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
        
        .folder-icon,
        .file-icon {
          margin-right: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(17, 24, 39, 0.7);
        }
        
        .folder-name,
        .file-name {
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
          display: none;
        }
        
        .folder.open > .tree-folder-content {
          display: block;
        }
        
        .folder-toggle {
          width: 0.95rem;
          height: 0.95rem;
          margin-right: 0.35rem;
          transition: transform 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .folder.open > .tree-folder-header .folder-toggle {
          transform: rotate(90deg);
        }
        
        /* 文件操作按钮 */
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
          padding: 0.275rem;
          border-radius: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          background-color: rgba(17, 24, 39, 0.05);
          position: relative;
        }
        
        .tree-file-action:hover {
          background-color: rgba(17, 24, 39, 0.1);
          transform: scale(1.1);
        }

        .copy-button {
          color: var(--copy-button-color);
        }
        
        .copy-button:hover {
          color: var(--copy-button-hover-color);
          box-shadow: 0 0 8px rgba(79, 70, 229, 0.4);
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
        
        .file-type-js {
          background-color: rgba(251, 191, 36, 0.15);
          color: rgba(146, 64, 14, 0.9);
        }
        
        .file-type-conf {
          background-color: rgba(167, 139, 250, 0.15);
          color: rgba(76, 29, 149, 0.9);
        }
        
        .file-type-mmdb {
          background-color: rgba(251, 146, 60, 0.15);
          color: rgba(154, 52, 18, 0.9);
        }
        
        /* 工具提示 */
        .tooltip {
          position: relative;
        }
        
        .tooltip-content {
          position: absolute;
          bottom: 120%;
          left: 50%;
          transform: translateX(-50%) translateY(0);
          padding: 0.4rem 0.6rem;
          border-radius: 0.25rem;
          background-color: #111827;
          color: white;
          font-size: 0.75rem;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: all 0.2s ease;
          z-index: 100;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          visibility: hidden;
          min-width: 80px;
          text-align: center;
        }
        
        .tooltip:hover .tooltip-content {
          opacity: 1;
          transform: translateX(-50%) translateY(-0.25rem);
          visibility: visible;
        }

        /* 箭头指示器 */
        .tooltip-content::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: #111827 transparent transparent transparent;
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
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
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
        
        /* 警告框 */
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
          z-index: 200;
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

        /* 标题区域 */
        .title-container {
          text-align: center;
          margin-bottom: 2rem;
          padding: 2rem 1rem;
          border-radius: 1rem;
          background-color: rgba(255, 255, 255, 0.8);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
          backdrop-filter: blur(8px);
        }
        
        @keyframes bg-position {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        
        @keyframes radiant {
          0%,
          90%,
          100% {
            background-position: calc(-100% - var(--radiant-width)) 0;
          }
          30%,
          60% {
            background-position: calc(100% + var(--radiant-width)) 0;
          }
        }
        
        .main-title {
          font-size: 2.8rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          display: inline-block;
          background: linear-gradient(to right, #d4af37, #b8860b, #cd5c5c, #c41e3a, #d4af37);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: bg-position 6s infinite alternate linear;
          text-shadow: 0 2px 10px rgba(153, 101, 21, 0.15);
          letter-spacing: 0.5px;
        }
        
        .subtitle {
          font-size: 1.2rem;
          max-width: 36rem;
          margin: 0 auto 1rem;
          font-style: italic;
          position: relative;
          display: inline-block;
          background: linear-gradient(to right, transparent, #333, transparent);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: radiant var(--radiant-anim-duration) infinite;
          background-size: var(--radiant-width) 100%;
          background-repeat: no-repeat;
          background-position: 0 0;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .radiant-animation {
          animation: radiant var(--radiant-anim-duration) infinite;
        }
        
        /* Card styles */
        .esdeath-card {
          background-color: white;
          border-radius: 1rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          overflow: hidden;
        }
        
        .esdeath-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        /* 3D Depth effect */
        .depth-effect {
          position: relative;
        }
        
        .depth-effect::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: inherit;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
          z-index: 2;
          pointer-events: none;
        }

        /* 复制成功动画 */
        @keyframes copy-success {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        .copy-success {
          animation: copy-success 0.5s ease;
          color: #10b981;
        }
      </style>
    </head>
    <body class="bg-white text-gray-900 min-h-screen">
      <div id="app" class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header>
          <div class="title-container depth-effect">
            <h1 class="main-title">${title}</h1>
            <p class="subtitle">${description}</p>
          </div>
          
          <div class="flex flex-wrap items-center justify-center gap-2 mb-8 text-sm text-gray-600">
            <span>Made by <a href="https://github.com/ilychi" class="text-blue-600 hover:underline">${author}</a></span>
            <span class="text-gray-400">•</span>
            <span><a href="https://github.com/ilychi/esdeath" class="text-blue-600 hover:underline">Source @ GitHub</a></span>
            <span class="text-gray-400">•</span>
            <span>更新于: ${updateTime}</span>
          </div>
        </header>

        <div class="search-container">
          <iconify-icon icon="tabler:search" class="search-icon"></iconify-icon>
          <input 
            type="text" 
            id="searchInput"
            placeholder="搜索文件和文件夹..." 
            class="search-input"
          >
        </div>

        <div class="esdeath-card depth-effect p-5">
          <div class="file-tree">
            <ul>
              ${renderTree(tree)}
            </ul>
          </div>
        </div>
        
        <div class="alert" id="alertBox">
          <iconify-icon icon="tabler:check" width="18"></iconify-icon>
          <span id="alertMessage"></span>
        </div>
      </div>

      <script>
        // 文件树交互逻辑
        document.addEventListener('DOMContentLoaded', function() {
          // 文件夹展开/折叠
          document.querySelectorAll('.tree-folder-header').forEach(header => {
            header.addEventListener('click', function() {
              const folder = this.parentElement;
              folder.classList.toggle('open');
            });
          });
          
          // 默认展开第一级文件夹
          document.querySelectorAll('.file-tree > ul > li.folder').forEach(folder => {
            folder.classList.add('open');
          });
          
          // 复制链接
          document.querySelectorAll('[data-copy-url]').forEach(button => {
            button.addEventListener('click', function(e) {
              e.stopPropagation();
              const url = this.getAttribute('data-copy-url');
              const icon = this.querySelector('iconify-icon');
              
              navigator.clipboard.writeText(url)
                .then(() => {
                  showAlert('链接已复制到剪贴板');
                  // 修改图标为成功状态
                  icon.setAttribute('icon', 'tabler:check');
                  this.classList.add('copy-success');
                  
                  // 2秒后恢复原状
                  setTimeout(() => {
                    icon.setAttribute('icon', 'tabler:clipboard');
                    this.classList.remove('copy-success');
                  }, 2000);
                })
                .catch(() => showAlert('复制失败，请手动复制'));
            });
          });
          
          // 导入模块
          document.querySelectorAll('[data-module-url]').forEach(button => {
            button.addEventListener('click', function(e) {
              e.stopPropagation();
              const url = this.getAttribute('data-module-url');
              window.open('surge:///install-module?url=' + encodeURIComponent(url), '_blank');
              showAlert('正在打开 Surge 安装模块');
            });
          });
          
          // 搜索功能
          const searchInput = document.getElementById('searchInput');
          searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            if (!searchTerm) {
              // 显示所有项
              document.querySelectorAll('.tree-file, .folder').forEach(item => {
                item.style.display = '';
              });
              return;
            }
            
            // 搜索文件
            document.querySelectorAll('.tree-file').forEach(file => {
              const fileName = file.querySelector('.file-name').textContent.toLowerCase();
              if (fileName.includes(searchTerm)) {
                file.style.display = '';
                // 确保父文件夹显示
                let parent = file.parentElement;
                while (parent) {
                  if (parent.classList.contains('tree-folder-content')) {
                    parent.style.display = 'block';
                    parent = parent.parentElement;
                    if (parent.classList.contains('folder')) {
                      parent.classList.add('open');
                    }
                  } else {
                    parent = parent.parentElement;
                  }
                }
              } else {
                file.style.display = 'none';
              }
            });
            
            // 处理文件夹
            document.querySelectorAll('.folder').forEach(folder => {
              const folderName = folder.querySelector('.folder-name').textContent.toLowerCase();
              const hasVisibleChildren = folder.querySelector('.tree-folder-content').querySelectorAll('.tree-file, .folder').length > 0 && 
                                        Array.from(folder.querySelector('.tree-folder-content').querySelectorAll('.tree-file, .folder'))
                                          .some(el => el.style.display !== 'none');
              
              if (folderName.includes(searchTerm) || hasVisibleChildren) {
                folder.style.display = '';
                folder.classList.add('open');
                
                // 确保父文件夹显示
                let parent = folder.parentElement;
                while (parent) {
                  if (parent.classList.contains('tree-folder-content')) {
                    parent.style.display = 'block';
                    parent = parent.parentElement;
                    if (parent.classList.contains('folder')) {
                      parent.classList.add('open');
                    }
                  } else {
                    parent = parent.parentElement;
                  }
                }
              } else if (!hasVisibleChildren) {
                folder.style.display = 'none';
              }
            });
          });
          
          // 显示提示框
          function showAlert(message) {
            const alertBox = document.getElementById('alertBox');
            const alertMessage = document.getElementById('alertMessage');
            
            alertMessage.textContent = message;
            alertBox.classList.add('show');
            
            setTimeout(() => {
              alertBox.classList.remove('show');
            }, 3000);
          }
        });
      </script>
    </body>
    </html>
  `;
}
