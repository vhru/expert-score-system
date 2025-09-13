#!/bin/bash

echo "=== 专家盲审系统分步部署 ==="

# 第一步：解压文件
echo "第一步：解压文件"
unzip -o *.zip
if [ $? -eq 0 ]; then
    echo "✓ 解压成功"
else
    echo "✗ 解压失败"
    exit 1
fi

# 第二步：检查文件
echo "第二步：检查文件"
if [ -f "package.json" ]; then
    echo "✓ package.json 存在"
else
    echo "✗ package.json 不存在"
    exit 1
fi

if [ -f "Dockerfile" ]; then
    echo "✓ Dockerfile 存在"
else
    echo "✗ Dockerfile 不存在"
    exit 1
fi

if [ -f "docker-compose.yml" ]; then
    echo "✓ docker-compose.yml 存在"
else
    echo "✗ docker-compose.yml 不存在"
    exit 1
fi

# 第三步：安装Docker
echo "第三步：安装Docker"
curl -fsSL https://get.docker.com | bash -s docker
if [ $? -eq 0 ]; then
    echo "✓ Docker 安装成功"
else
    echo "✗ Docker 安装失败"
    exit 1
fi

systemctl start docker
if [ $? -eq 0 ]; then
    echo "✓ Docker 启动成功"
else
    echo "✗ Docker 启动失败"
    exit 1
fi

systemctl enable docker
echo "✓ Docker 设置开机自启"

# 第四步：安装Docker Compose
echo "第四步：安装Docker Compose"
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
if [ $? -eq 0 ]; then
    echo "✓ Docker Compose 下载成功"
else
    echo "✗ Docker Compose 下载失败"
    exit 1
fi

chmod +x /usr/local/bin/docker-compose
echo "✓ Docker Compose 设置执行权限"

# 第五步：创建环境配置
echo "第五步：创建环境配置"
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

if [ -f ".env" ]; then
    echo "✓ 环境配置创建成功"
else
    echo "✗ 环境配置创建失败"
    exit 1
fi

# 第六步：创建目录
echo "第六步：创建目录"
mkdir -p uploads
if [ -d "uploads" ]; then
    echo "✓ 上传目录创建成功"
else
    echo "✗ 上传目录创建失败"
    exit 1
fi

# 第七步：启动服务
echo "第七步：启动服务"
docker-compose up -d --build
if [ $? -eq 0 ]; then
    echo "✓ 服务启动成功"
else
    echo "✗ 服务启动失败"
    echo "查看错误日志："
    docker-compose logs
    exit 1
fi

# 第八步：等待服务
echo "第八步：等待服务启动"
sleep 30

# 第九步：检查状态
echo "第九步：检查服务状态"
docker-compose ps

echo "=== 部署完成 ==="
echo "访问地址: http://$(curl -s ifconfig.me):3000"
