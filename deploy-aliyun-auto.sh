#!/bin/bash

echo "=== 专家盲审系统部署 (阿里云自动解压版) ==="

# 记录开始信息
echo "开始时间: $(date)"
echo "当前用户: $(whoami)"
echo "当前目录: $(pwd)"
echo "工作目录: $PWD"

# 检查系统环境
echo "系统信息: $(uname -a)"
echo "可用空间: $(df -h . | tail -1)"

# 列出当前目录内容
echo "当前目录内容:"
ls -la

# 检查关键文件
echo "检查关键文件..."
if [ -f "package.json" ]; then
    echo "✓ 找到 package.json"
    echo "package.json 内容预览:"
    head -5 package.json
else
    echo "✗ 未找到 package.json"
    echo "当前目录内容:"
    ls -la
    echo "尝试查找 package.json..."
    find . -name "package.json" -type f 2>/dev/null
    exit 1
fi

if [ -f "Dockerfile" ]; then
    echo "✓ 找到 Dockerfile"
else
    echo "✗ 未找到 Dockerfile"
    echo "尝试查找 Dockerfile..."
    find . -name "Dockerfile" -type f 2>/dev/null
    exit 1
fi

if [ -f "docker-compose.yml" ]; then
    echo "✓ 找到 docker-compose.yml"
else
    echo "✗ 未找到 docker-compose.yml"
    echo "尝试查找 docker-compose.yml..."
    find . -name "docker-compose.yml" -type f 2>/dev/null
    exit 1
fi

# 检查解压工具
echo "检查解压工具..."
if command -v unzip &> /dev/null; then
    echo "✓ unzip 已安装: $(unzip -v | head -1)"
else
    echo "✗ unzip 未安装，正在安装..."
    if command -v apt &> /dev/null; then
        apt update && apt install -y unzip
    elif command -v yum &> /dev/null; then
        yum install -y unzip
    else
        echo "无法安装 unzip，请手动安装"
        exit 1
    fi
fi

# 安装Docker
echo "安装Docker..."
if ! command -v docker &> /dev/null; then
    echo "Docker 未安装，正在安装..."
    curl -fsSL https://get.docker.com | bash -s docker
    systemctl start docker
    systemctl enable docker
    echo "Docker 安装完成"
else
    echo "Docker 已安装: $(docker --version)"
fi

# 验证Docker安装
echo "验证Docker安装..."
docker --version
systemctl status docker --no-pager -l

# 安装Docker Compose
echo "安装Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose 未安装，正在安装..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose 安装完成"
else
    echo "Docker Compose 已安装: $(docker-compose --version)"
fi

# 验证Docker Compose安装
echo "验证Docker Compose安装..."
docker-compose --version

# 创建环境配置
echo "创建环境配置..."
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

echo "环境配置创建完成"
echo "环境配置内容:"
cat .env

# 创建上传目录
echo "创建上传目录..."
mkdir -p uploads/team-documents
mkdir -p uploads/team-images
chmod 755 uploads
chmod 755 uploads/team-documents
chmod 755 uploads/team-images

echo "上传目录创建完成"
echo "上传目录结构:"
ls -la uploads/

# 停止旧容器
echo "停止旧容器..."
docker-compose down || true

# 清理Docker缓存
echo "清理Docker缓存..."
docker system prune -f || true

# 构建并启动服务
echo "构建并启动服务..."
docker-compose up -d --build

echo "服务启动命令执行完成"

# 等待服务启动
echo "等待服务启动..."
sleep 30

# 检查服务状态
echo "检查服务状态..."
docker-compose ps

# 检查容器日志
echo "检查容器日志..."
docker-compose logs --tail=20

# 检查端口监听
echo "检查端口监听..."
netstat -tlnp | grep :3000 || echo "3000端口未监听"
netstat -tlnp | grep :3306 || echo "3306端口未监听"

# 测试服务健康状态
echo "测试服务健康状态..."
for i in {1..5}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✓ 服务启动成功"
        break
    else
        echo "等待服务启动... ($i/5)"
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
echo "结束时间: $(date)"
echo "=== 部署完成 ==="
