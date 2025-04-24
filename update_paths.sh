#!/bin/bash

# 更新所有模块文件中的脚本路径
find Surge/Modules -type f -name "*.sgmodule" -exec sed -i '' 's|Chores/js|Surge/Scripts|g' {} \;

# 更新 rule-sources.ts 和其他可能的配置文件中的路径
find Chores/engineering -type f -name "*.ts" -exec sed -i '' 's|Chores/js|Surge/Scripts|g' {} \;
find Chores/engineering -type f -name "*.js" -exec sed -i '' 's|Chores/js|Surge/Scripts|g' {} \;

echo "所有文件中的路径已更新"

# 最后确保目录存在
mkdir -p Surge/Scripts
mkdir -p Surge/Modules/Rules/dns

echo "目录结构已创建" 
