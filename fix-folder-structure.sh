#!/bin/bash
set -e

echo "=== 修复GitHub拉取后的文件夹结构 ==="

# 检查当前目录结构
echo "当前目录: $(pwd)"
echo "目录内容:"
ls -la

# 检查是否存在嵌套的expert-score-system目录
if [ -d "expert-score-system" ]; then
    echo "发现嵌套的expert-score-system目录"
    
    # 检查嵌套目录中是否有项目文件
    if [ -f "expert-score-system/package.json" ]; then
        echo "嵌套目录包含项目文件，开始修复..."
        
        # 备份当前目录（除了嵌套目录）
        echo "备份当前目录..."
        mkdir -p ../backup-$(date +%Y%m%d-%H%M%S)
        cp -r . ../backup-$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
        
        # 移动嵌套目录中的文件到当前目录
        echo "移动文件到正确位置..."
        mv expert-score-system/* . 2>/dev/null || true
        mv expert-score-system/.* . 2>/dev/null || true
        
        # 删除空的嵌套目录
        rmdir expert-score-system 2>/dev/null || true
        
        echo "文件夹结构修复完成"
    else
        echo "嵌套目录不包含项目文件，跳过修复"
    fi
else
    echo "未发现嵌套目录，结构正常"
fi

# 验证修复结果
echo "验证修复结果..."
echo "当前目录内容:"
ls -la

# 检查关键文件
if [ -f "package.json" ] && [ -f "Dockerfile" ] && [ -f "docker-compose.yml" ]; then
    echo "✅ 项目文件结构正确"
else
    echo "❌ 项目文件结构异常"
    exit 1
fi

echo "=== 修复完成 ==="
