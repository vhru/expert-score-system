#!/bin/bash

echo "=== 专家盲审系统简单部署 (Node.js) ==="

# 显示当前环境
echo "当前目录: $(pwd)"
echo "目录内容:"
ls -la

# 检查关键文件
if [ ! -f "package.json" ]; then
    echo "错误: 未找到 package.json"
    exit 1
fi

# 安装Node.js
echo "安装Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# 安装MySQL
echo "安装MySQL..."
apt update
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql

# 配置MySQL
echo "配置MySQL..."
mysql -e "CREATE DATABASE IF NOT EXISTS expert_review CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'expert_user'@'localhost' IDENTIFIED BY 'expert_password_2024';"
mysql -e "GRANT ALL PRIVILEGES ON expert_review.* TO 'expert_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# 导入数据库结构
if [ -f "init.sql" ]; then
    echo "导入数据库结构..."
    mysql expert_review < init.sql
fi

# 安装PM2
echo "安装PM2..."
npm install -g pm2

# 安装项目依赖
echo "安装项目依赖..."
npm install --production

# 构建项目
echo "构建项目..."
npm run build

# 创建环境配置
cat > .env << 'EOF'
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
mkdir -p uploads

# 启动应用
echo "启动应用..."
pm2 start npm --name "expert-review-system" -- start
pm2 save
pm2 startup

# 等待启动
sleep 10

# 检查状态
pm2 status

echo "=== 部署完成 ==="
echo "访问地址: http://$(curl -s ifconfig.me):3000"
