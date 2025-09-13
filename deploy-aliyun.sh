#!/bin/bash
set -e

echo "=== 专家盲审系统 Docker 部署 ==="

# 安装Docker (如果未安装)
if ! command -v docker &> /dev/null; then
    echo "安装Docker..."
    curl -fsSL https://get.docker.com | bash -s docker
    systemctl start docker
    systemctl enable docker
fi

# 安装Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "安装Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 创建生产环境配置
cat > .env << EOF
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

# 创建上传目录
mkdir -p uploads

# 停止旧容器
echo "停止旧容器..."
docker-compose down || true

# 构建并启动服务
echo "构建并启动服务..."
docker-compose up -d --build

# 等待服务启动
sleep 30

# 检查服务状态
docker-compose ps

echo "=== 部署完成 ==="
echo "访问地址: http://$(curl -s ifconfig.me):3000"
echo "管理员登录: admin@example.com / admin123"
