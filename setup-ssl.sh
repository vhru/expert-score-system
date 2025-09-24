#!/bin/bash
set -e

echo "=== SSL证书配置脚本 ==="

# 检查域名参数
if [ -z "$1" ]; then
    echo "用法: $0 <域名>"
    echo "例如: $0 expert-review.example.com"
    exit 1
fi

DOMAIN=$1

# 安装certbot
echo "安装certbot..."
apt update
apt install -y certbot python3-certbot-nginx

# 申请SSL证书
echo "申请SSL证书..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# 设置自动续期
echo "设置自动续期..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# 测试续期
echo "测试证书续期..."
certbot renew --dry-run

echo
echo "=== SSL证书配置完成 ==="
echo "现在可以通过HTTPS访问："
echo "https://$DOMAIN"
echo
echo "证书将自动续期"
echo "=== 配置完成 ==="
