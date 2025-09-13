#!/bin/bash
set -e

echo "=== Docker服务重启流程 ==="

# 检查当前目录
echo "当前目录: $(pwd)"
if [ ! -f "docker-compose.yml" ]; then
    echo "错误: 未找到docker-compose.yml文件"
    exit 1
fi

# 停止所有相关容器
echo "停止所有相关容器..."
docker-compose down || true

# 清理旧镜像（可选）
echo "清理旧镜像..."
docker system prune -f || true

# 检查Dockerfile
echo "检查Dockerfile..."
if [ ! -f "Dockerfile" ]; then
    echo "错误: 未找到Dockerfile文件"
    exit 1
fi

# 创建环境配置
echo "创建环境配置..."
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
echo "创建上传目录..."
mkdir -p uploads/team-documents
mkdir -p uploads/team-images

# 重新构建并启动
echo "重新构建并启动服务..."
docker-compose up -d --build

# 等待服务启动
echo "等待服务启动..."
sleep 30

# 检查服务状态
echo "检查服务状态..."
docker-compose ps

# 检查容器日志
echo "检查容器日志..."
docker-compose logs app

# 检查端口监听
echo "检查端口监听..."
netstat -tlnp | grep :3000 || ss -tlnp | grep :3000 || echo "端口检查工具不可用"

# 获取公网IP
PUBLIC_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "无法获取公网IP")

echo
echo "=== 重启完成 ==="
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
echo "3. 使用 'docker-compose logs -f' 查看实时日志"
echo "4. 使用 'docker-compose restart' 重启服务"
echo "=== 重启完成 ==="
