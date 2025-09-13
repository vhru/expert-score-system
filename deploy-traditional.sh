#!/bin/bash
set -e

echo "========================================"
echo "专家盲审系统 - 传统部署脚本"
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

# 安装Node.js 18
if ! command -v node &> /dev/null; then
    echo "安装Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
    echo "Node.js安装完成 ✓"
fi

# 安装MySQL
if ! command -v mysql &> /dev/null; then
    echo "安装MySQL..."
    apt update
    apt install -y mysql-server
    systemctl start mysql
    systemctl enable mysql
    echo "MySQL安装完成 ✓"
fi

# 配置MySQL
echo "配置MySQL数据库..."
mysql -e "CREATE DATABASE IF NOT EXISTS expert_review CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || true
mysql -e "CREATE USER IF NOT EXISTS 'expert_user'@'localhost' IDENTIFIED BY 'expert_password_2024';" || true
mysql -e "GRANT ALL PRIVILEGES ON expert_review.* TO 'expert_user'@'localhost';" || true
mysql -e "FLUSH PRIVILEGES;" || true

# 导入数据库结构
if [ -f "init.sql" ]; then
    echo "导入数据库结构..."
    mysql expert_review < init.sql
    echo "数据库结构导入完成 ✓"
fi

# 安装PM2
if ! command -v pm2 &> /dev/null; then
    echo "安装PM2..."
    npm install -g pm2
    echo "PM2安装完成 ✓"
fi

# 安装项目依赖
echo "安装项目依赖..."
npm install --production
echo "依赖安装完成 ✓"

# 构建项目
echo "构建项目..."
npm run build
echo "项目构建完成 ✓"

# 创建环境配置
echo "创建环境配置..."
cat > .env << EOF
DB_HOST=localhost
DB_PORT=3306
DB_NAME=expert_review
DB_USER=expert_user
DB_PASSWORD=expert_password_2024
JWT_SECRET=expert_review_jwt_secret_2024_production
AES_SECRET_KEY=expert_review_aes_key_32_chars_2024
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
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

# 停止旧进程
echo "停止旧进程..."
pm2 stop expert-review-system || true
pm2 delete expert-review-system || true

# 启动应用
echo "启动应用..."
pm2 start npm --name "expert-review-system" -- start
pm2 save
pm2 startup

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查服务状态
echo "检查服务状态..."
pm2 status

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
echo "4. 使用 'pm2 logs' 查看日志"
echo "5. 使用 'pm2 restart expert-review-system' 重启服务"
echo "========================================"
