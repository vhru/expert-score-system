# 🚀 专家盲审系统 - 阿里云ECS部署指南

## 📦 第一步：打包项目

### Windows环境
```cmd
# 双击运行打包脚本
package.bat
```

### Linux/Mac环境
```bash
# 使用zip命令打包
zip -r specialist_score_system.zip . -x "node_modules/*" ".git/*" "*.log" "uploads/*"
```

## 🖥️ 第二步：ECS控制台部署

### 1. 登录阿里云ECS控制台
- 访问：https://ecs.console.aliyun.com/
- 选择对应地域和资源组

### 2. 进入构建部署页面
- 单击目标ECS实例ID
- 选择 **定时与自动化任务** > **构建部署**
- 单击 **创建执行**

### 3. 配置代码源
- **上传本地代码**：上传 `specialist_score_system.zip`
- **下载路径**：留空（使用默认路径）

### 4. 配置构建部署脚本

#### 方案A：Docker部署（推荐）
```bash
#!/bin/bash
set -e

echo "=== 开始部署专家盲审系统 ==="

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

# 停止旧容器
echo "停止旧容器..."
docker-compose down || true

# 创建生产环境配置
echo "创建生产环境配置..."
cat > .env << EOF
# Database Configuration
DB_HOST=mysql
DB_PORT=3306
DB_NAME=expert_review
DB_USER=expert_user
DB_PASSWORD=expert_password_2024

# JWT Secret (生产环境请修改)
JWT_SECRET=expert_review_jwt_secret_2024_production

# AES Encryption Key (生产环境请修改)
AES_SECRET_KEY=expert_review_aes_key_32_chars_2024

# File Upload Configuration
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760

# Admin Configuration
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
EOF

# 创建上传目录
mkdir -p uploads

# 构建并启动服务
echo "构建并启动服务..."
docker-compose up -d --build

# 等待服务启动
echo "等待服务启动..."
sleep 30

# 检查服务状态
echo "检查服务状态..."
docker-compose ps

echo "=== 部署完成 ==="
echo "访问地址: http://$(curl -s ifconfig.me):3000"
echo "管理员登录: admin@example.com / admin123"
```

#### 方案B：传统Node.js部署
```bash
#!/bin/bash
set -e

echo "=== 开始部署专家盲审系统 ==="

# 安装Node.js 18
if ! command -v node &> /dev/null; then
    echo "安装Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
fi

# 安装MySQL
if ! command -v mysql &> /dev/null; then
    echo "安装MySQL..."
    apt update
    apt install mysql-server
    systemctl start mysql
    systemctl enable mysql
fi

# 配置MySQL
echo "配置MySQL数据库..."
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
if ! command -v pm2 &> /dev/null; then
    echo "安装PM2..."
    npm install -g pm2
fi

# 安装项目依赖
echo "安装项目依赖..."
npm install --production

# 构建项目
echo "构建项目..."
npm run build

# 创建环境配置
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
mkdir -p uploads

# 停止旧进程
pm2 stop expert-review-system || true
pm2 delete expert-review-system || true

# 启动应用
echo "启动应用..."
pm2 start npm --name "expert-review-system" -- start
pm2 save
pm2 startup

echo "=== 部署完成 ==="
echo "访问地址: http://$(curl -s ifconfig.me):3000"
echo "管理员登录: admin@example.com / admin123"
```

### 5. 执行部署
- 检查 **基本信息** 和 **任务信息**
- 单击 **确定**，开始执行部署

## 🔧 第三步：配置安全组

### 开放端口
- **端口3000**: 开放给公网访问（HTTP）
- **端口3306**: 仅内网访问（MySQL，可选）

### 安全组规则
```
类型: 自定义TCP
端口范围: 3000/3000
授权对象: 0.0.0.0/0
描述: 专家盲审系统HTTP访问
```

## ✅ 第四步：验证部署

### 1. 检查服务状态
```bash
# Docker部署
docker-compose ps

# 传统部署
pm2 status
```

### 2. 访问系统
- 浏览器访问：`http://你的ECS公网IP:3000`
- 系统门户：`http://你的ECS公网IP:3000/portal`

### 3. 测试登录
- **管理员**: admin@example.com / admin123
- **专家**: expert1 / password123

## 🔒 第五步：安全配置

### 1. 修改默认密码
```bash
# 编辑环境配置
vim .env

# 修改以下配置：
JWT_SECRET=你的新JWT密钥
AES_SECRET_KEY=你的新AES密钥32位
ADMIN_PASSWORD=你的新管理员密码
```

### 2. 重启服务
```bash
# Docker部署
docker-compose restart

# 传统部署
pm2 restart expert-review-system
```

## 📊 系统监控

### 查看日志
```bash
# Docker部署
docker-compose logs -f

# 传统部署
pm2 logs expert-review-system
```

### 查看资源使用
```bash
# Docker部署
docker stats

# 传统部署
pm2 monit
```

## 🚨 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查看端口占用
   netstat -tlnp | grep :3000
   
   # 杀死进程
   kill -9 PID
   ```

2. **数据库连接失败**
   ```bash
   # 检查MySQL状态
   systemctl status mysql
   
   # 重启MySQL
   systemctl restart mysql
   ```

3. **文件权限问题**
   ```bash
   # 设置上传目录权限
   chmod 755 uploads
   chmod 755 uploads/*
   ```

## 📈 性能优化

### 1. 数据库优化
- 定期清理日志文件
- 优化数据库查询
- 设置合适的缓存策略

### 2. 应用优化
- 启用Gzip压缩
- 配置CDN加速
- 使用负载均衡

## 💰 成本预估

- **ECS (1核2G)**: ¥100/月
- **带宽**: ¥50/月
- **总计**: ¥150/月

---

**部署完成后，您的专家盲审系统就可以正常使用了！**

如有问题，请检查日志文件或联系技术支持。
