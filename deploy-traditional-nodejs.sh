#!/bin/bash

echo "=== 专家盲审系统传统部署 (绕过Docker) ==="

# 显示当前环境
echo "当前目录: $(pwd)"
echo "当前用户: $(whoami)"
echo "目录内容:"
ls -la

# 检查关键文件
echo "检查关键文件..."
if [ ! -f "package.json" ]; then
    echo "错误: 未找到 package.json"
    echo "当前目录内容:"
    ls -la
    exit 1
fi

echo "✓ 找到 package.json"

# 更新系统包
echo "更新系统包..."
if command -v apt &> /dev/null; then
    apt update
elif command -v yum &> /dev/null; then
    yum update -y
fi

# 安装Node.js 18
echo "安装Node.js 18..."
if ! command -v node &> /dev/null; then
    echo "Node.js 未安装，正在安装..."
    if command -v apt &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        apt-get install -y nodejs
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        yum install -y nodejs
    else
        echo "无法安装 Node.js，请手动安装"
        exit 1
    fi
else
    echo "Node.js 已安装: $(node --version)"
fi

# 验证Node.js安装
echo "验证Node.js安装..."
node --version
npm --version

# 安装MySQL
echo "安装MySQL..."
if ! command -v mysql &> /dev/null; then
    echo "MySQL 未安装，正在安装..."
    if command -v apt &> /dev/null; then
        apt install -y mysql-server
    elif command -v yum &> /dev/null; then
        yum install -y mysql-server
    else
        echo "无法安装 MySQL，请手动安装"
        exit 1
    fi
else
    echo "MySQL 已安装: $(mysql --version)"
fi

# 启动MySQL服务
echo "启动MySQL服务..."
if command -v apt &> /dev/null; then
    systemctl start mysql
    systemctl enable mysql
elif command -v yum &> /dev/null; then
    systemctl start mysqld
    systemctl enable mysqld
fi

# 检查MySQL状态
echo "检查MySQL状态..."
if command -v apt &> /dev/null; then
    systemctl status mysql --no-pager -l
elif command -v yum &> /dev/null; then
    systemctl status mysqld --no-pager -l
fi

# 配置MySQL
echo "配置MySQL..."
mysql -e "CREATE DATABASE IF NOT EXISTS expert_review CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || true
mysql -e "CREATE USER IF NOT EXISTS 'expert_user'@'localhost' IDENTIFIED BY 'expert_password_2024';" || true
mysql -e "GRANT ALL PRIVILEGES ON expert_review.* TO 'expert_user'@'localhost';" || true
mysql -e "FLUSH PRIVILEGES;" || true

# 导入数据库结构
if [ -f "init.sql" ]; then
    echo "导入数据库结构..."
    mysql expert_review < init.sql
    echo "数据库结构导入完成"
else
    echo "未找到 init.sql 文件"
fi

# 安装PM2
echo "安装PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo "PM2 安装完成"
else
    echo "PM2 已安装: $(pm2 --version)"
fi

# 安装项目依赖
echo "安装项目依赖..."
npm install --production

# 构建项目
echo "构建项目..."
npm run build

# 创建环境配置
echo "创建环境配置..."
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
echo "创建上传目录..."
mkdir -p uploads/team-documents
mkdir -p uploads/team-images
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

# 检查端口监听
echo "检查端口监听..."
netstat -tlnp | grep :3000 || echo "3000端口未监听"

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
echo
echo "重要提醒:"
echo "1. 请修改 .env 文件中的密码"
echo "2. 确保安全组开放3000端口"
echo "3. 使用 'pm2 logs' 查看日志"
echo "4. 使用 'pm2 restart expert-review-system' 重启服务"
echo "=== 部署完成 ==="
