#!/bin/bash
set -e

echo "=== 专家盲审系统 Docker 部署 (修复版) ==="

# 设置错误处理
trap 'echo "脚本执行失败，退出码: $?"; exit 1' ERR

# 检查系统环境
echo "检查系统环境..."
echo "操作系统: $(uname -a)"
echo "当前用户: $(whoami)"
echo "当前目录: $(pwd)"
echo "可用空间: $(df -h . | tail -1)"

# 检查项目文件
echo "检查项目文件..."
if [ ! -f "package.json" ]; then
    echo "错误: 未找到 package.json"
    exit 1
fi

if [ ! -f "Dockerfile" ]; then
    echo "错误: 未找到 Dockerfile"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo "错误: 未找到 docker-compose.yml"
    exit 1
fi

echo "项目文件检查通过 ✓"

# 安装Docker (如果未安装)
if ! command -v docker &> /dev/null; then
    echo "安装Docker..."
    curl -fsSL https://get.docker.com | bash -s docker
    systemctl start docker
    systemctl enable docker
    echo "Docker安装完成 ✓"
else
    echo "Docker已安装 ✓"
fi

# 安装Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "安装Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose安装完成 ✓"
else
    echo "Docker Compose已安装 ✓"
fi

# 验证Docker安装
echo "验证Docker安装..."
docker --version
docker-compose --version

# 创建生产环境配置
echo "创建生产环境配置..."
cat > .env << 'EOF'
DB_HOST=mysql
DB_PORT=3306
DB_NAME=expert_review
DB_USER=expert_user
DB_PASSWORD=expert_password_2024
JWT_SECRET=expert_review_jwt_secret_2024_production
AES_SECRET_KEY=expert_review_aes_key_32_chars_2024
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
EOF

echo "环境配置创建完成 ✓"

# 创建上传目录
echo "创建上传目录..."
mkdir -p uploads/team-documents
mkdir -p uploads/team-images
chmod 755 uploads
chmod 755 uploads/team-documents
chmod 755 uploads/team-images

echo "上传目录创建完成 ✓"

# 停止旧容器
echo "停止旧容器..."
docker-compose down || true
docker system prune -f || true

echo "旧容器清理完成 ✓"

# 构建并启动服务
echo "构建并启动服务..."
docker-compose up -d --build

echo "服务启动命令执行完成 ✓"

# 等待服务启动
echo "等待服务启动..."
sleep 30

# 检查服务状态
echo "检查服务状态..."
docker-compose ps

# 检查容器日志
echo "检查容器日志..."
docker-compose logs --tail=20

# 检查服务健康状态
echo "检查服务健康状态..."
for i in {1..10}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "服务启动成功 ✓"
        break
    else
        echo "等待服务启动... ($i/10)"
        sleep 10
    fi
done

# 获取公网IP
PUBLIC_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "无法获取公网IP")

echo
echo "=== 部署完成 ==="
echo "访问地址: http://$PUBLIC_IP:3000"
echo "本地访问: http://localhost:3000"
echo "管理员登录: admin@example.com / admin123"
echo "=== 部署完成 ==="
