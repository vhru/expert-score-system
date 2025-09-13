# 🚀 阿里云Docker部署方案

## 部署架构

```
阿里云ECS (1核2G)
├── Docker Engine
├── Docker Compose
├── MySQL容器
├── Next.js应用容器
└── Nginx反向代理 (可选)
```

## 部署步骤

### 1. 准备ECS实例
```bash
# 安装Docker
curl -fsSL https://get.docker.com | bash -s docker
sudo systemctl start docker
sudo systemctl enable docker

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. 上传项目文件
```bash
# 使用scp上传项目
scp -r ./specialist_score_system root@your-server-ip:/opt/

# 或使用git克隆
git clone your-repo-url /opt/specialist_score_system
```

### 3. 配置生产环境
```bash
# 创建生产环境配置
cp .env.example .env.production

# 编辑生产配置
vim .env.production
```

### 4. 启动服务
```bash
cd /opt/specialist_score_system
docker-compose up -d
```

### 5. 配置域名和SSL
```bash
# 使用Nginx反向代理
# 配置SSL证书
# 设置域名解析
```

## 优势
- ✅ 环境一致性
- ✅ 易于扩展
- ✅ 快速部署
- ✅ 版本管理
- ✅ 回滚方便

## 成本
- ECS: ¥100/月
- 带宽: ¥50/月
- 总计: ¥150/月
