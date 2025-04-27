#!/bin/bash

# 脚本用于生成各种尺寸的favicon
# 需要安装ImageMagick: brew install imagemagick

# 源文件路径
SOURCE_SVG="Chores/engineering/data/images/favicon/favicon.svg"
OUTPUT_DIR="public"

# 确保输出目录存在
mkdir -p "$OUTPUT_DIR"

# 生成ICO文件
echo "生成favicon.ico..."
convert -background transparent "$SOURCE_SVG" -define icon:auto-resize=16,32,48,64 "$OUTPUT_DIR/favicon.ico"

# 生成各种尺寸的PNG图标
echo "生成不同尺寸的PNG图标..."
for size in 16 32 64 96 128 192 512; do
  echo "- 生成 ${size}x${size} 图标..."
  convert -background transparent "$SOURCE_SVG" -resize ${size}x${size} "$OUTPUT_DIR/favicon-${size}x${size}.png"
done

# 创建Apple Touch Icon
echo "创建Apple Touch Icon..."
convert -background transparent "$SOURCE_SVG" -resize 180x180 "$OUTPUT_DIR/apple-touch-icon.png"

# 复制SVG到输出目录
echo "复制SVG图标..."
cp "$SOURCE_SVG" "$OUTPUT_DIR/favicon.svg"

# 创建网站清单文件
echo "创建网站清单文件..."
cat > "$OUTPUT_DIR/site.webmanifest" << EOL
{
  "name": "Luck's Surge Rules & Modules Hub",
  "short_name": "Luck's Rules",
  "icons": [
    {
      "src": "/favicon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/favicon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#c9211e",
  "background_color": "#ffffff",
  "display": "standalone"
}
EOL

echo "图标生成完成！" 
