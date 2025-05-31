#!/bin/bash

# Surge文件批量添加脚本
# 解决shell glob展开限制问题

echo "🔄 添加Surge模块文件..."
find Surge/Modules -name "*.sgmodule" -exec git add {} +

echo "🔄 添加Surge脚本文件..."
find Surge/Scripts -name "*.js" -exec git add {} +

echo "🔄 添加Surge规则文件..."
find Surge/Modules/Rules -name "*.list" -exec git add {} + 2>/dev/null || true
find Surge/Modules/Rules -name "*.conf" -exec git add {} + 2>/dev/null || true

echo "✅ Surge文件添加完成！"
echo "📊 当前状态："
git status --porcelain | grep "Surge/" | wc -l | xargs echo "  - Surge文件变更数量:" 
