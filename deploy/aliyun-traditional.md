# 🚀 阿里云传统部署方案

## 部署架构

```
阿里云ECS (1核2G)
├── Node.js 18
├── MySQL 8.0
├── Nginx
├── PM2进程管理
└── SSL证书
```

## 部署步骤

### 1. 准备ECS实例
```bash
# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装MySQL
sudo apt update
sudo apt install mysql-server

# 安装Nginx
sudo apt install nginx

# 安装PM2
sudo npm install -g pm2
```

### 2. 配置MySQL
```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE expert_review CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'expert_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON expert_review.* TO 'expert_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 部署应用
```bash
# 上传项目文件
scp -r ./specialist_score_system root@your-server-ip:/opt/

# 安装依赖
cd /opt/specialist_score_system
npm install --production

# 构建项目
npm run build
```

### 4. 配置PM2
```bash
# 创建PM2配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'expert-review-system',
    script: 'npm',
    args: 'start',
    cwd: '/opt/specialist_score_system',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# 启动应用
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. 配置Nginx
```bash
# 创建Nginx配置
cat > /etc/nginx/sites-available/expert-review << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 启用配置
ln -s /etc/nginx/sites-available/expert-review /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 优势
- ✅ 直接控制
- ✅ 性能优化
- ✅ 成本较低
- ✅ 灵活配置

## 成本
- ECS: ¥100/月
- RDS MySQL: ¥150/月
- 带宽: ¥50/月
- 总计: ¥300/月
