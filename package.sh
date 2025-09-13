#!/bin/bash
set -e

# 专家盲审系统 - 统一打包脚本
# 支持Windows和Linux环境

echo "========================================"
echo "专家盲审系统 - 统一打包脚本"
echo "========================================"
echo

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "错误: 请在项目根目录执行此脚本"
    echo "当前目录: $(pwd)"
    exit 1
fi

# 检查项目结构
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
    rm -f specialist_score_system.zip
fi

# 创建临时目录
if [ -d "temp_package" ]; then
    echo "清理临时目录..."
    rm -rf temp_package
fi
mkdir temp_package

echo "开始打包项目文件..."
echo

# 复制源代码目录
echo "复制源代码目录..."
cp -r app components lib scripts temp_package/

# 复制配置文件
echo "复制配置文件..."
cp package.json package-lock.json Dockerfile docker-compose.yml init.sql env.example temp_package/
cp tailwind.config.js next.config.js tsconfig.json postcss.config.js temp_package/

# 复制文档文件
echo "复制文档文件..."
cp *.md temp_package/ 2>/dev/null || true

# 创建上传目录结构
echo "创建上传目录结构..."
mkdir -p temp_package/uploads/team-documents
mkdir -p temp_package/uploads/team-images

# 压缩文件
echo "压缩文件..."
cd temp_package

# 检查是否有zip命令
if command -v zip &> /dev/null; then
    zip -r ../specialist_score_system.zip . -q
elif command -v tar &> /dev/null; then
    tar -czf ../specialist_score_system.tar.gz .
    echo "注意: 使用tar压缩，文件名为 specialist_score_system.tar.gz"
else
    echo "错误: 未找到zip或tar命令"
    exit 1
fi

cd ..

# 清理临时文件
echo "清理临时文件..."
rm -rf temp_package

echo
echo "========================================"
echo "打包完成！"
echo "========================================"

# 显示文件信息
if [ -f "specialist_score_system.zip" ]; then
    echo "文件名: specialist_score_system.zip"
    echo "位置: $(pwd)/specialist_score_system.zip"
    if command -v ls &> /dev/null; then
        ls -lh specialist_score_system.zip
    fi
elif [ -f "specialist_score_system.tar.gz" ]; then
    echo "文件名: specialist_score_system.tar.gz"
    echo "位置: $(pwd)/specialist_score_system.tar.gz"
    if command -v ls &> /dev/null; then
        ls -lh specialist_score_system.tar.gz
    fi
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
