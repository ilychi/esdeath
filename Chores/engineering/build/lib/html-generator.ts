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

        // 特殊处理GeoIP文件的文件类型标签
        let fileTypeDisplay = item.fileType || '';

        // 为GeoIP数据库文件显示更友好的文字说明
        if (item.fileType === 'mmdb') {
          fileTypeDisplay = 'GeoIP Database';
        }

        const isPreviewable = item.fileType === 'list' || item.fileType === 'sgmodule';
        const fileRowAttributes = isPreviewable ? `data-preview-url="${item.url}"` : '';

        html += `
          <li class="tree-file" ${fileRowAttributes}>
            <div class="file-icon">
              <iconify-icon icon="${fileIcon}" width="16"></iconify-icon>
            </div>
            <div class="file-name">${item.name}</div>
            <div class="tree-file-actions">
              ${
                item.fileType
                  ? `<span class="file-type-tag ${fileTypeClass}">${fileTypeDisplay}</span>`
                  : ''
              }
              ${
                item.fileType === 'sgmodule'
                  ? `
                <div class="tree-file-action" data-tooltip-text="导入到 Surge" data-module-url="${item.url}">
                  <iconify-icon icon="tabler:plug" width="16"></iconify-icon>
                </div>
              `
                  : ''
              }
              <div class="tree-file-action" data-tooltip-text="复制链接" data-copy-url="${
                item.url
              }">
                <iconify-icon icon="tabler:clipboard" width="16"></iconify-icon>
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
      <!-- 多尺寸图标 -->
      <link rel="icon" href="images/favicon-32x32.png" sizes="32x32" type="image/png">
      <link rel="icon" href="images/favicon-192x192.png" sizes="192x192" type="image/png">
      <link rel="apple-touch-icon" href="images/apple-touch-icon.png">
      <link rel="icon" href="images/favicon-512x512.png" sizes="512x512" type="image/png">
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
        }
        
        .tree-folder-header, .tree-file[data-preview-url] {
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
          padding: 0.175rem;
          border-radius: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          background-color: rgba(17, 24, 39, 0.05);
          cursor: pointer;
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
        
        /* Animated Tooltip */
        #animated-tooltip {
            position: fixed;
            padding: 0.35rem 0.6rem;
            border-radius: 0.375rem;
            background-color: #111827;
            color: white;
            font-size: 0.8rem;
            white-space: nowrap;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
            z-index: 100;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transform: translate(-50%, -100%); /* Center tooltip above cursor */
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

        /* iPhone Mockup Modal */
        #preview-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        #preview-modal.show {
            opacity: 1;
            pointer-events: auto;
        }
        .modal-content {
            position: relative;
        }
        .iphone-mockup {
            --iphone-width: 300px;
            --iphone-height: calc(var(--iphone-width) * 2.037);
            width: var(--iphone-width);
            height: var(--iphone-height);
            position: relative;
            z-index: 1;
            transform: scale(0.95);
            transition: transform 0.3s ease;
        }
        #preview-modal.show .iphone-mockup {
            transform: scale(1);
        }
        .iphone-bezel {
            width: 100%;
            height: 100%;
            border-radius: 50px;
            background: linear-gradient(145deg, #2a2a2c, #161618);
            padding: 12px;
            box-shadow: inset 0 0 3px 2px #000, 0 25px 35px rgba(0,0,0,0.45);
            box-sizing: border-box;
            position: relative;
        }
        .iphone-side-button {
            position: absolute;
            background: linear-gradient(to right, #4a4a4e, #3a3a3c);
            border-radius: 4px;
        }
        .action-button {
            top: 110px;
            left: -3px;
            width: 3px;
            height: 22px;
        }
        .volume-up-button {
            top: 150px;
            left: -3px;
            width: 3px;
            height: 45px;
        }
        .volume-down-button {
            top: 205px;
            left: -3px;
            width: 3px;
            height: 45px;
        }
        .power-button {
            top: 170px;
            right: -3px;
            width: 3px;
            height: 70px;
        }
        .iphone-screen {
            width: 100%;
            height: 100%;
            background: #fff;
            border-radius: 38px;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .dynamic-island {
            position: absolute;
            top: 12px;
            left: 50%;
            transform: translateX(-50%);
            width: 110px;
            height: 28px;
            background: #000;
            border-radius: 20px;
            z-index: 2;
        }
        #iphone-screen-content {
            flex-grow: 1;
            overflow-y: auto;
            color: #333;
            font-family: monospace;
            font-size: 0.8rem;
            white-space: pre-wrap;
            word-wrap: break-word;
            padding: 45px 15px 15px 15px;
            scrollbar-width: thin;
            scrollbar-color: #aaa #f1f1f1;
        }
        #iphone-screen-content::-webkit-scrollbar {
          width: 5px;
        }
        #iphone-screen-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        #iphone-screen-content::-webkit-scrollbar-thumb {
          background: #aaa;
          border-radius: 10px;
        }
        #iphone-screen-content::-webkit-scrollbar-thumb:hover {
          background: #888;
        }
        .close-modal-btn {
            position: absolute;
            top: -15px;
            right: -15px;
            background: white;
            border: none;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            transition: transform 0.2s ease;
        }
        .close-modal-btn:hover {
            transform: scale(1.1);
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
            <span>Made by <a href="https://github.com/lucking7" class="text-blue-600 hover:underline">${author}</a></span>
            <span class="text-gray-400">•</span>
            <span><a href="https://github.com/lucking7/esdeath" class="text-blue-600 hover:underline">Source @ GitHub</a></span>
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

        <div id="animated-tooltip"></div>

        <div id="preview-modal">
            <div class="modal-content">
                <div class="iphone-mockup">
                    <div class="iphone-bezel">
                        <div class="iphone-side-button action-button"></div>
                        <div class="iphone-side-button volume-up-button"></div>
                        <div class="iphone-side-button volume-down-button"></div>
                        <div class="iphone-side-button power-button"></div>
                        <div class="iphone-screen">
                            <div class="dynamic-island"></div>
                            <pre id="iphone-screen-content"></pre>
                        </div>
                    </div>
                </div>
                <button id="close-modal-btn" class="close-modal-btn">
                    <iconify-icon icon="tabler:x" width="20"></iconify-icon>
                </button>
            </div>
        </div>
      </div>

      <script>
        document.addEventListener('DOMContentLoaded', function() {
          // --- Animated Tooltip ---
          const tooltip = document.getElementById('animated-tooltip');
          document.querySelectorAll('[data-tooltip-text]').forEach(el => {
            el.addEventListener('mousemove', e => {
              tooltip.style.left = e.clientX + 'px';
              tooltip.style.top = e.clientY + 'px';
            });
            el.addEventListener('mouseenter', e => {
              tooltip.textContent = el.getAttribute('data-tooltip-text');
              tooltip.style.opacity = '1';
            });
            el.addEventListener('mouseleave', () => {
              tooltip.style.opacity = '0';
            });
          });

          // --- File tree interaction ---
          document.querySelectorAll('.tree-folder-header').forEach(header => {
            header.addEventListener('click', function() {
              this.parentElement.classList.toggle('open');
            });
          });
          
          document.querySelectorAll('.file-tree > ul > li.folder').forEach(folder => {
            folder.classList.add('open');
          });
          
          // --- Action buttons ---
          document.querySelectorAll('[data-copy-url]').forEach(button => {
            button.addEventListener('click', function(e) {
              e.stopPropagation();
              const url = this.getAttribute('data-copy-url');
              navigator.clipboard.writeText(url)
                .then(() => showAlert('链接已复制到剪贴板'))
                .catch(() => showAlert('复制失败，请手动复制'));
            });
          });
          
          document.querySelectorAll('[data-module-url]').forEach(button => {
            button.addEventListener('click', function(e) {
              e.stopPropagation();
              const url = this.getAttribute('data-module-url');
              window.open('surge:///install-module?url=' + encodeURIComponent(url), '_blank');
              showAlert('正在打开 Surge 安装模块');
            });
          });
          
          // --- Search ---
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

          // --- iPhone Preview Modal ---
          const modal = document.getElementById('preview-modal');
          const screen = document.getElementById('iphone-screen-content');
          const closeModalBtn = document.getElementById('close-modal-btn');

          document.querySelectorAll('.tree-file[data-preview-url]').forEach(row => {
            row.addEventListener('click', async e => {
              // Only trigger preview if not clicking on an action button
              if (e.target.closest('.tree-file-action')) {
                  return;
              }
              e.preventDefault();
              const url = row.getAttribute('data-preview-url');
              screen.textContent = 'Loading...';
              modal.classList.add('show');
              
              try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Network response was not ok');
                const text = await response.text();
                screen.textContent = text;
              } catch (error) {
                screen.textContent = 'Error loading file content.';
                console.error('Fetch error:', error);
              }
            });
          });

          const closeModal = () => modal.classList.remove('show');
          closeModalBtn.addEventListener('click', closeModal);
          modal.addEventListener('click', e => {
            if (e.target === modal) {
              closeModal();
            }
          });
          
          // --- Alert Box ---
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
