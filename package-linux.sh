#!/bin/bash

echo "========================================"
echo "专家盲审系统 - Linux打包脚本"
echo "========================================"
echo

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "错误: 请在项目根目录执行此脚本"
    echo "当前目录: $(pwd)"
    exit 1
fi

echo "正在检查项目结构..."
if [ ! -d "app" ]; then
    echo "错误: 未找到 app 目录"
    exit 1
fi

echo "项目结构检查通过 ✓"
echo

# 删除旧的压缩包
if [ -f "specialist_score_system.zip" ]; then
    echo "删除旧的压缩包..."
    rm -f "specialist_score_system.zip"
fi

echo "开始打包项目文件..."
echo

# 创建临时目录
if [ -d "temp_package" ]; then
    rm -rf "temp_package"
fi
mkdir "temp_package"

echo "复制源代码目录..."
cp -r app temp_package/
cp -r components temp_package/
cp -r lib temp_package/
cp -r scripts temp_package/

echo "复制配置文件..."
cp package.json temp_package/
cp package-lock.json temp_package/
cp Dockerfile temp_package/
cp docker-compose.yml temp_package/
cp init.sql temp_package/
cp env.example temp_package/
cp tailwind.config.js temp_package/
cp next.config.js temp_package/
cp tsconfig.json temp_package/
cp postcss.config.js temp_package/

echo "复制文档文件..."
cp *.md temp_package/ 2>/dev/null || true

echo "创建上传目录结构..."
mkdir -p temp_package/uploads/team-documents
mkdir -p temp_package/uploads/team-images

echo "使用zip命令压缩文件..."
cd temp_package
zip -r ../specialist_score_system.zip . -x "*.log" "*.tmp"
cd ..

if [ $? -ne 0 ]; then
    echo "错误: 压缩失败"
    exit 1
fi

echo "清理临时文件..."
rm -rf "temp_package"

echo
echo "========================================"
echo "打包完成！"
echo "========================================"
echo "文件名: specialist_score_system.zip"
echo "位置: $(pwd)/specialist_score_system.zip"

# 显示文件大小
if [ -f "specialist_score_system.zip" ]; then
    echo "文件大小: $(du -h specialist_score_system.zip | cut -f1)"
    echo "文件校验: $(md5sum specialist_score_system.zip | cut -d' ' -f1)"
fi

echo
echo "包含的文件:"
echo "✓ 源代码 (app, components, lib, scripts)"
echo "✓ 配置文件 (package.json, Dockerfile, etc.)"
echo "✓ 数据库脚本 (init.sql)"
echo "✓ 环境配置模板 (env.example)"
echo "✓ 文档文件 (*.md)"
echo "✓ 上传目录结构"
echo
echo "排除的文件:"
echo "✗ node_modules (依赖包)"
echo "✗ .git (版本控制)"
echo "✗ uploads/* (用户上传文件)"
echo "✗ *.log (日志文件)"
echo
echo "现在可以上传到阿里云ECS了！"
echo "========================================"
