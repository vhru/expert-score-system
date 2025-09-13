#!/bin/bash

echo "=== 专家盲审系统部署 (简单修复版) ==="

# 解压zip文件（忽略警告）
echo "解压zip文件..."
unzip -o *.zip 2>/dev/null || unzip -o *.zip

# 检查关键文件
if [ ! -f "package.json" ]; then
    echo "错误: 未找到 package.json"
    exit 1
fi

echo "文件解压成功 ✓"

# 安装Docker
echo "安装Docker..."
curl -fsSL https://get.docker.com | bash -s docker
systemctl start docker
systemctl enable docker

# 安装Docker Compose
echo "安装Docker Compose..."
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 创建环境配置
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

# 创建目录
mkdir -p uploads

# 停止旧容器
docker-compose down || true

# 启动服务
echo "启动服务..."
docker-compose up -d --build

# 等待启动
sleep 30

# 检查状态
docker-compose ps

echo "=== 部署完成 ==="
echo "访问地址: http://$(curl -s ifconfig.me):3000"
