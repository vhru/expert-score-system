#!/bin/bash
set -e

echo "=== Nginx反向代理配置脚本 ==="

# 安装nginx
echo "安装nginx..."
apt update
apt install -y nginx

# 创建SSL证书目录
echo "创建SSL证书目录..."
mkdir -p /etc/nginx/ssl

# 备份原配置
echo "备份原nginx配置..."
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# 创建新的nginx配置
echo "创建nginx配置..."
cat > /etc/nginx/sites-available/expert-review << 'EOF'
server {
    listen 80;
    server_name _;
    
    # 文件上传大小限制
    client_max_body_size 50M;
    
    # 代理到Next.js应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 缓存设置
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API路由特殊处理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # API超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # 日志配置
    access_log /var/log/nginx/expert-review-access.log;
    error_log /var/log/nginx/expert-review-error.log;
}
EOF

# 启用站点
echo "启用nginx站点..."
ln -sf /etc/nginx/sites-available/expert-review /etc/nginx/sites-enabled/

# 删除默认站点
echo "删除默认站点..."
rm -f /etc/nginx/sites-enabled/default

# 测试nginx配置
echo "测试nginx配置..."
nginx -t

# 启动nginx
echo "启动nginx服务..."
systemctl start nginx
systemctl enable nginx

# 更新防火墙规则
echo "更新防火墙规则..."
ufw allow 'Nginx Full'
ufw delete allow 'Nginx HTTP'

# 检查服务状态
echo "检查服务状态..."
systemctl status nginx --no-pager

echo
echo "=== Nginx配置完成 ==="
echo "现在可以通过以下方式访问："
echo "HTTP: http://您的域名"
echo "HTTP: http://您的服务器IP"
echo
echo "下一步："
echo "1. 配置域名解析到服务器IP"
echo "2. 申请SSL证书（可选）"
echo "3. 更新nginx配置中的域名"
echo "=== 配置完成 ==="
