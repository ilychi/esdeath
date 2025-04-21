#!/bin/bash

# 设置工作目录为仓库根目录
cd "$(git rev-parse --show-toplevel)" || exit

echo "=== 开始清理规则文件 ==="

# 删除目录
directories=(
  "Surge/Ruleset/anti-attribution"
  "Surge/Ruleset/apple"
  "Surge/Ruleset/cdn"
  "Surge/Ruleset/direct"
  "Surge/Ruleset/domestic"
  "Surge/Ruleset/extra"
  "Surge/Ruleset/google"
  "Surge/Ruleset/ipcidr"
  "Surge/Ruleset/ipcird"
  "Surge/Ruleset/microsoft"
  "Surge/Ruleset/proxy"
  "Surge/Ruleset/reject"
  "Surge/Ruleset/social"
  "Surge/Ruleset/stream"
  "Surge/Ruleset/streaming"
)

# 删除文件
files=(
  "Surge/Ruleset/aigc_connershua.list"
  "Surge/Ruleset/aigc_keli.list"
  "Surge/Ruleset/aigc.list"
  "Surge/Ruleset/Block.list"
  "Surge/Ruleset/blocked.list"
  "Surge/Ruleset/cdn.list"
  "Surge/Ruleset/chinaasn_missuo.list"
  "Surge/Ruleset/Direct.list"
  "Surge/Ruleset/domestic_sukka.list"
  "Surge/Ruleset/Domestic.list"
  "Surge/Ruleset/foreign.list"
  "Surge/Ruleset/gfw.list"
  "Surge/Ruleset/global.list"
  "Surge/Ruleset/lan.list"
  "Surge/Ruleset/LMFirefly_proxy.list"
  "Surge/Ruleset/proxy_lm.list"
  "Surge/Ruleset/proxy_tartarus.list"
  "Surge/Ruleset/proxy.list"
  "Surge/Ruleset/proxylite.list"
  "Surge/Ruleset/reject_drop_sukka.list"
  "Surge/Ruleset/reject_nodrop_sukka.list"
  "Surge/Ruleset/reject_sukka.list"
  "Surge/Ruleset/reject.list"
  "Surge/Ruleset/skk_aigc.list"
  "Surge/Ruleset/skk_direct.list"
  "Surge/Ruleset/skk_domestic.list"
  "Surge/Ruleset/skk_reject_drop.list"
  "Surge/Ruleset/skk_reject_nodrop.list"
  "Surge/Ruleset/skk_reject.list"
  "Surge/Ruleset/suk ka wreject_nodrop.list"
  "Surge/Ruleset/sukka_aigc.list"
  "Surge/Ruleset/sukka_direct.list"
  "Surge/Ruleset/sukka_domestic.list"
  "Surge/Ruleset/sukka_reject_drop.list"
  "Surge/Ruleset/sukka_reject.list"
  "Surge/Ruleset/telegram.list"
)

# 删除目录
for dir in "${directories[@]}"; do
  if [ -d "$dir" ]; then
    echo "删除目录: $dir"
    rm -rf "$dir"
  else
    echo "目录不存在: $dir"
  fi
done

# 删除文件
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "删除文件: $file"
    rm -f "$file"
  else
    echo "文件不存在: $file"
  fi
done

echo "=== 文件清理完成 ==="

# 提交更改
echo "=== 提交修改 ==="
git add .
git commit -m "清理规则文件"

# 推送到远程仓库
echo "=== 推送到diver分支 ==="
git push origin diver

echo "=== 推送到main分支 ==="
git checkout main
git merge diver
git push origin main
git checkout diver

echo "=== 操作完成 ===" 
