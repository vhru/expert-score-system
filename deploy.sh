#!/bin/bash
set -e

# 专家盲审系统 - 统一部署脚本
# 支持Docker和传统部署两种方式

echo "========================================"
echo "专家盲审系统 - 统一部署脚本"
echo "========================================"
echo

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "错误: 请在项目根目录执行此脚本"
    echo "当前目录: $(pwd)"
    exit 1
fi

# 检查项目结构
echo "正在检查项目结构..."
if [ ! -d "app" ]; then
    echo "错误: 未找到 app 目录"
    exit 1
fi
echo "项目结构检查通过 ✓"
echo

# 选择部署方式
echo "请选择部署方式:"
echo "1) Docker部署 (推荐)"
echo "2) 传统部署 (Node.js + MySQL + PM2)"
echo "3) 仅打包项目"
read -p "请输入选择 (1-3): " choice

case $choice in
    1)
        echo "选择: Docker部署"
        deploy_docker
        ;;
    2)
        echo "选择: 传统部署"
        deploy_traditional
        ;;
    3)
        echo "选择: 仅打包项目"
        package_project
        ;;
    *)
        echo "无效选择，退出"
        exit 1
        ;;
esac

# Docker部署函数
deploy_docker() {
    echo "开始Docker部署..."
    
    # 安装Docker
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
    
    # 创建环境配置
    create_env_config
    
    # 创建上传目录
    echo "创建上传目录..."
    mkdir -p uploads/team-documents
    mkdir -p uploads/team-images
    chmod 755 uploads uploads/team-documents uploads/team-images
    
    # 构建并启动服务
    echo "构建并启动服务..."
    docker-compose up -d --build
    
    # 等待服务启动
    echo "等待服务启动..."
    sleep 30
    
    # 初始化数据库（如果需要）
    echo "检查并初始化数据库..."
    for i in {1..10}; do
        if curl -f http://localhost:3000/api/init -X POST > /dev/null 2>&1; then
            echo "数据库初始化完成 ✓"
            break
        else
            echo "等待服务启动... ($i/10)"
            sleep 10
        fi
    done
    
    # 检查服务状态
    check_service_status "docker"
    
    echo "Docker部署完成！"
}

# 传统部署函数
deploy_traditional() {
    echo "开始传统部署..."
    
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
    create_env_config "traditional"
    
    # 创建上传目录
    echo "创建上传目录..."
    mkdir -p uploads/team-documents
    mkdir -p uploads/team-images
    chmod 755 uploads uploads/team-documents uploads/team-images
    
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
    check_service_status "pm2"
    
    echo "传统部署完成！"
}

# 打包项目函数
package_project() {
    echo "开始打包项目..."
    
    # 删除旧的压缩包
    if [ -f "specialist_score_system.zip" ]; then
        echo "删除旧的压缩包..."
        rm -f specialist_score_system.zip
    fi
    
    # 创建临时目录
    if [ -d "temp_package" ]; then
        rm -rf temp_package
    fi
    mkdir temp_package
    
    # 复制源代码
    echo "复制源代码..."
    cp -r app components lib scripts temp_package/
    
    # 复制配置文件
    echo "复制配置文件..."
    cp package.json package-lock.json Dockerfile docker-compose.yml init.sql env.example temp_package/
    cp tailwind.config.js next.config.js tsconfig.json postcss.config.js temp_package/
    
    # 复制文档
    echo "复制文档..."
    cp *.md temp_package/ 2>/dev/null || true
    
    # 创建上传目录结构
    echo "创建上传目录结构..."
    mkdir -p temp_package/uploads/team-documents
    mkdir -p temp_package/uploads/team-images
    
    # 压缩文件
    echo "压缩文件..."
    cd temp_package
    zip -r ../specialist_score_system.zip . -q
    cd ..
    
    # 清理临时文件
    rm -rf temp_package
    
    echo "打包完成！"
    echo "文件名: specialist_score_system.zip"
    echo "位置: $(pwd)/specialist_score_system.zip"
    
    # 显示文件大小
    if command -v ls &> /dev/null; then
        ls -lh specialist_score_system.zip
    fi
}

# 创建环境配置函数
create_env_config() {
    local deploy_type=${1:-"docker"}
    
    echo "创建环境配置..."
    
    if [ "$deploy_type" = "traditional" ]; then
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
    else
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
    fi
    
    echo "环境配置创建完成 ✓"
}

# 检查服务状态函数
check_service_status() {
    local service_type=$1
    
    echo "检查服务状态..."
    
    if [ "$service_type" = "docker" ]; then
        docker-compose ps
        
        # 检查服务健康状态
        for i in {1..10}; do
            if curl -f http://localhost:3000 > /dev/null 2>&1; then
                echo "服务启动成功 ✓"
                break
            else
                echo "等待服务启动... ($i/10)"
                sleep 10
            fi
        done
    elif [ "$service_type" = "pm2" ]; then
        pm2 status
        
        # 检查服务健康状态
        for i in {1..10}; do
            if curl -f http://localhost:3000 > /dev/null 2>&1; then
                echo "服务启动成功 ✓"
                break
            else
                echo "等待服务启动... ($i/10)"
                sleep 10
            fi
        done
    fi
    
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
    if [ "$service_type" = "pm2" ]; then
        echo "4. 使用 'pm2 logs' 查看日志"
        echo "5. 使用 'pm2 restart expert-review-system' 重启服务"
    fi
    echo "========================================"
}

echo "脚本执行完成"
