#!/bin/bash
set -e

echo "=== 专家盲审系统 天翼云部署脚本 ==="

# 检查系统
echo "检查系统信息..."
cat /etc/os-release

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "错误: 请在项目根目录执行此脚本"
    exit 1
fi

# 安装Docker (Ubuntu/CentOS通用)
echo "安装Docker..."
if ! command -v docker &> /dev/null; then
    echo "安装Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
    usermod -aG docker $USER
    echo "Docker安装完成"
else
    echo "Docker已安装"
fi

# 安装Docker Compose
echo "安装Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose安装完成"
else
    echo "Docker Compose已安装"
fi

# 检查Dockerfile
echo "检查Dockerfile..."
if [ ! -f "Dockerfile" ]; then
    echo "错误: 未找到Dockerfile"
    exit 1
fi

# 检查docker-compose.yml
echo "检查docker-compose.yml..."
if [ ! -f "docker-compose.yml" ]; then
    echo "错误: 未找到docker-compose.yml"
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

# 停止旧容器
echo "停止旧容器..."
docker-compose down || true

# 清理旧镜像
echo "清理旧镜像..."
docker system prune -f || true

# 重新构建并启动
echo "重新构建并启动..."
docker-compose up -d --build

# 等待启动
echo "等待服务启动..."
sleep 30

# 检查状态
echo "检查容器状态..."
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
echo "=== 天翼云部署完成 ==="
echo "访问地址: http://$PUBLIC_IP:3000"
echo "本地访问: http://localhost:3000"
echo
echo "测试账号:"
echo "管理员: admin@example.com / admin123"
echo "专家: expert1 / password123"
echo
echo "重要提醒:"
echo "1. 请修改 .env 文件中的密码"
echo "2. 确保天翼云安全组开放3000端口"
echo "3. 使用 'docker-compose logs -f' 查看实时日志"
echo "4. 使用 'docker-compose restart' 重启服务"
echo "=== 部署完成 ==="


