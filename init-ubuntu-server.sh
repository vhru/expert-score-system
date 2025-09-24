#!/bin/bash
set -e

echo "=== Ubuntu 22.04 服务器初始化脚本 ==="

# 更新系统
echo "更新系统包..."
apt update && apt upgrade -y

# 安装基础工具
echo "安装基础工具..."
apt install -y \
    curl \
    wget \
    git \
    vim \
    nano \
    htop \
    tree \
    unzip \
    zip \
    net-tools \
    dnsutils \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common \
    apt-transport-https

# 安装Docker
echo "安装Docker..."
if ! command -v docker &> /dev/null; then
    echo "安装Docker..."
    
    # 添加Docker官方GPG密钥
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # 添加Docker仓库
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # 更新包索引
    apt update
    
    # 安装Docker
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # 启动Docker服务
    systemctl start docker
    systemctl enable docker
    
    # 将当前用户添加到docker组
    usermod -aG docker $USER
    
    echo "Docker安装完成"
else
    echo "Docker已安装"
fi

# 安装Docker Compose
echo "安装Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    # 下载最新版本的Docker Compose
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # 设置执行权限
    chmod +x /usr/local/bin/docker-compose
    
    # 创建软链接
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    echo "Docker Compose安装完成"
else
    echo "Docker Compose已安装"
fi

# 安装Node.js (可选，用于本地开发)
echo "安装Node.js..."
if ! command -v node &> /dev/null; then
    # 使用NodeSource仓库安装Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    
    echo "Node.js安装完成"
else
    echo "Node.js已安装"
fi

# 配置Docker镜像加速（中国用户）
echo "配置Docker镜像加速..."
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
EOF

# 重启Docker服务
systemctl restart docker

# 安装防火墙工具
echo "配置防火墙..."
apt install -y ufw

# 配置基础防火墙规则
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 3000/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# 创建项目目录
echo "创建项目目录..."
mkdir -p /opt/expert-score-system
mkdir -p /opt/team_data
mkdir -p /var/log/expert-review

# 设置目录权限
chown -R $USER:$USER /opt/expert-score-system
chown -R $USER:$USER /opt/team_data
chmod -R 755 /opt/expert-score-system
chmod -R 755 /opt/team_data

# 安装系统监控工具
echo "安装监控工具..."
apt install -y \
    iotop \
    nethogs \
    iftop \
    ncdu \
    jq

# 配置系统优化
echo "配置系统优化..."

# 优化文件描述符限制
cat >> /etc/security/limits.conf << EOF
* soft nofile 65536
* hard nofile 65536
EOF

# 优化内核参数
cat >> /etc/sysctl.conf << EOF
# 网络优化
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_congestion_control = bbr
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65536
EOF

# 应用内核参数
sysctl -p

# 创建常用别名
echo "配置常用别名..."
cat >> ~/.bashrc << EOF

# 常用别名
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias ...='cd ../..'
alias grep='grep --color=auto'
alias fgrep='fgrep --color=auto'
alias egrep='egrep --color=auto'

# Docker别名
alias dps='docker ps'
alias dpa='docker ps -a'
alias di='docker images'
alias dcu='docker-compose up'
alias dcd='docker-compose down'
alias dcb='docker-compose build'
alias dcl='docker-compose logs -f'

# 项目相关别名
alias cdproject='cd /opt/expert-score-system'
alias cddata='cd /opt/team_data'
alias cdlogs='cd /var/log/expert-review'
EOF

# 重新加载bashrc
source ~/.bashrc

# 显示系统信息
echo
echo "=== 系统初始化完成 ==="
echo "系统版本: $(lsb_release -d | cut -f2)"
echo "内核版本: $(uname -r)"
echo "Docker版本: $(docker --version)"
echo "Docker Compose版本: $(docker-compose --version)"
echo "Node.js版本: $(node --version 2>/dev/null || echo '未安装')"
echo "可用内存: $(free -h | awk '/^Mem:/ {print $2}')"
echo "可用磁盘: $(df -h / | awk 'NR==2 {print $4}')"
echo
echo "项目目录: /opt/expert-score-system"
echo "数据目录: /opt/team_data"
echo "日志目录: /var/log/expert-review"
echo
echo "防火墙状态:"
ufw status
echo
echo "=== 初始化完成 ==="
echo "请重新登录以应用用户组更改，或运行: newgrp docker"
echo "然后可以开始部署您的专家评审系统了！"
