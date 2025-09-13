#!/bin/bash
set -e

echo "========================================"
echo "专家盲审系统 - ECS自动部署脚本"
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

# 安装Docker (如果未安装)
if ! command -v docker &> /dev/null; then
    echo "安装Docker..."
    curl -fsSL https://get.docker.com | bash -s docker
    systemctl start docker
    systemctl enable docker
    echo "Docker安装完成 ✓"
fi

# 安装Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "安装Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose安装完成 ✓"
fi

# 停止旧容器
echo "停止旧容器..."
docker-compose down || true

# 创建生产环境配置
echo "创建生产环境配置..."
cat > .env << EOF
# Database Configuration
DB_HOST=mysql
DB_PORT=3306
DB_NAME=expert_review
DB_USER=expert_user
DB_PASSWORD=expert_password_2024

# JWT Secret (生产环境请修改)
JWT_SECRET=expert_review_jwt_secret_2024_production

# AES Encryption Key (生产环境请修改)
AES_SECRET_KEY=expert_review_aes_key_32_chars_2024

# File Upload Configuration
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760

# Admin Configuration
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
EOF

# 创建上传目录
echo "创建上传目录..."
mkdir -p uploads/team-documents
mkdir -p uploads/team-images

# 设置目录权限
chmod 755 uploads
chmod 755 uploads/team-documents
chmod 755 uploads/team-images

# 构建并启动服务
echo "构建并启动服务..."
docker-compose up -d --build

# 等待服务启动
echo "等待服务启动..."
sleep 30

# 检查服务状态
echo "检查服务状态..."
docker-compose ps

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
echo "========================================"
echo "部署完成！"
echo "========================================"
echo "访问地址: http://$PUBLIC_IP:3000"
echo "本地访问: http://localhost:3000"
echo
echo "测试账号:"
echo "管理员: admin@example.com / admin123"
echo "专家: expert1 / password123"
echo
echo "重要提醒:"
echo "1. 请修改 .env 文件中的密码"
echo "2. 确保安全组开放3000端口"
echo "3. 定期备份数据库和上传文件"
echo "========================================"
