# 🐳 Docker容器部署指南

## 部署架构

```
服务器
├── Docker Engine
├── Docker Compose
├── MySQL容器 (expert_review_mysql)
└── Next.js应用容器 (expert_review_app)
```

## 前置要求

- Linux服务器（推荐Ubuntu 20.04+）
- Docker Engine 20.10+
- Docker Compose 2.0+
- 至少2GB可用内存
- 至少10GB可用磁盘空间

## 快速部署

### 1. 安装Docker和Docker Compose

```bash
# 安装Docker
curl -fsSL https://get.docker.com | bash -s docker
sudo systemctl start docker
sudo systemctl enable docker

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 2. 准备项目文件

```bash
# 方式1: 使用git克隆
git clone <your-repo-url> /opt/specialist_score_system
cd /opt/specialist_score_system

# 方式2: 上传项目文件
# 使用scp或其他方式上传项目到服务器
scp -r ./specialist_score_system root@your-server-ip:/opt/
cd /opt/specialist_score_system
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp env.example .env

# 编辑环境变量（重要：生产环境必须修改密码）
vim .env
```

**必须修改的配置项：**

```env
# 数据库配置
DB_HOST=mysql
DB_PORT=3306
DB_NAME=expert_review
DB_USER=expert_user
DB_PASSWORD=你的强密码  # ⚠️ 必须修改

# JWT密钥（生产环境必须修改）
JWT_SECRET=你的JWT密钥  # ⚠️ 必须修改

# AES加密密钥（32位字符，生产环境必须修改）
AES_SECRET_KEY=你的32位AES密钥  # ⚠️ 必须修改

# 文件上传配置
UPLOAD_DIR=/opt/team_data
MAX_FILE_SIZE=10485760

# 管理员配置（生产环境必须修改）
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=你的管理员密码  # ⚠️ 必须修改

# 维护模式配置
MAINTENANCE_MODE=false
MAINTENANCE_MESSAGE=系统正在维护中，预计维护时间：1小时。给您带来的不便敬请谅解。
```

### 4. 创建文件存储目录

```bash
# 创建文件存储目录
sudo mkdir -p /opt/team_data
sudo chown -R 1000:1000 /opt/team_data
sudo chmod -R 755 /opt/team_data

# 创建子目录
sudo mkdir -p /opt/team_data/{team-documents,member-cvs,team-images,photos}
sudo chown -R 1000:1000 /opt/team_data
```

### 5. 启动服务

```bash
# 使用快速部署脚本（推荐）
chmod +x deploy-docker.sh
./deploy-docker.sh

# 或手动启动
docker-compose up -d --build
```

### 6. 初始化数据库

```bash
# 等待服务启动（约30秒）
sleep 30

# 初始化数据库
curl -X POST http://localhost:3000/api/init

# 或使用docker exec
docker exec expert_review_app curl -X POST http://localhost:3000/api/init
```

### 7. 验证部署

```bash
# 检查容器状态
docker-compose ps

# 查看应用日志
docker-compose logs -f app

# 检查服务健康
curl http://localhost:3000/api/health
```

## 常用操作

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看应用日志
docker-compose logs -f app

# 查看数据库日志
docker-compose logs -f mysql

# 查看最近100行日志
docker-compose logs --tail=100 app
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启应用服务
docker-compose restart app

# 使用重启脚本（推荐，会清理并重建）
chmod +x restart-docker.sh
./restart-docker.sh
```

### 停止服务

```bash
# 停止所有服务（保留数据）
docker-compose stop

# 停止并删除容器（保留数据卷）
docker-compose down

# 停止并删除所有（包括数据卷，危险操作）
docker-compose down -v
```

### 更新部署

```bash
# 1. 拉取最新代码
git pull

# 2. 停止服务
docker-compose down

# 3. 重新构建并启动
docker-compose up -d --build

# 4. 检查服务状态
docker-compose ps
docker-compose logs -f app
```

## 数据管理

### 数据库备份

```bash
# 备份数据库
docker exec expert_review_mysql mysqldump -u expert_user -p expert_review > backup_$(date +%Y%m%d_%H%M%S).sql

# 或使用docker-compose
docker-compose exec mysql mysqldump -u expert_user -p expert_review > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 数据库恢复

```bash
# 恢复数据库
docker exec -i expert_review_mysql mysql -u expert_user -p expert_review < backup_20240101_120000.sql

# 或使用docker-compose
docker-compose exec -T mysql mysql -u expert_user -p expert_review < backup_20240101_120000.sql
```

### 文件备份

```bash
# 备份文件存储目录
tar -czf team_data_backup_$(date +%Y%m%d_%H%M%S).tar.gz /opt/team_data

# 恢复文件
tar -xzf team_data_backup_20240101_120000.tar.gz -C /
```

### 查看数据卷

```bash
# 查看数据卷
docker volume ls

# 查看数据卷详情
docker volume inspect specialist_score_system_mysql_data

# 备份数据卷
docker run --rm -v specialist_score_system_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_data_backup.tar.gz /data
```

## 网络配置

### 端口映射

默认配置：
- **3000**: Next.js应用端口（HTTP）
- **3306**: MySQL数据库端口（仅内网访问）

修改端口映射（编辑 `docker-compose.yml`）：

```yaml
services:
  app:
    ports:
      - "8080:3000"  # 将容器3000端口映射到主机8080端口
```

### 安全组配置（阿里云/腾讯云）

**必须开放的端口：**
- **3000** (TCP): 应用访问端口
- **22** (TCP): SSH管理端口

**不建议开放的端口：**
- **3306** (TCP): MySQL端口，仅内网访问

### 使用Nginx反向代理（推荐生产环境）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 监控和维护

### 资源监控

```bash
# 查看容器资源使用
docker stats

# 查看磁盘使用
df -h
docker system df

# 查看文件存储空间
du -sh /opt/team_data
```

### 日志管理

```bash
# 配置日志轮转（编辑docker-compose.yml）
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 健康检查

```bash
# 检查应用健康状态
curl http://localhost:3000/api/health

# 检查容器健康状态
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## 故障排除

### 容器无法启动

```bash
# 查看详细错误日志
docker-compose logs app

# 检查端口占用
netstat -tlnp | grep :3000
ss -tlnp | grep :3000

# 检查磁盘空间
df -h

# 检查Docker服务
systemctl status docker
```

### 数据库连接失败

```bash
# 检查MySQL容器状态
docker-compose ps mysql

# 查看MySQL日志
docker-compose logs mysql

# 测试数据库连接
docker exec expert_review_mysql mysql -u expert_user -p -e "SHOW DATABASES;"
```

### 文件上传失败

```bash
# 检查目录权限
ls -la /opt/team_data

# 修复权限
sudo chown -R 1000:1000 /opt/team_data
sudo chmod -R 755 /opt/team_data

# 检查磁盘空间
df -h /opt/team_data
```

### 应用无法访问

```bash
# 检查容器是否运行
docker-compose ps

# 检查端口监听
netstat -tlnp | grep :3000

# 检查防火墙
sudo ufw status
sudo iptables -L -n

# 检查安全组规则（云服务器）
```

## 性能优化

### 资源限制

编辑 `docker-compose.yml` 添加资源限制：

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 数据库优化

```bash
# 进入MySQL容器
docker exec -it expert_review_mysql mysql -u expert_user -p

# 优化配置（在MySQL中执行）
SET GLOBAL innodb_buffer_pool_size = 256M;
SET GLOBAL max_connections = 200;
```

## 安全建议

1. **修改默认密码**：所有默认密码必须修改
2. **使用强密码**：数据库、JWT、AES密钥使用强密码
3. **限制端口访问**：MySQL端口不对外开放
4. **定期备份**：设置自动备份脚本
5. **更新镜像**：定期更新Docker镜像
6. **使用HTTPS**：生产环境配置SSL证书
7. **日志审计**：定期检查日志文件
8. **权限控制**：文件目录权限最小化

## 自动备份脚本

创建自动备份脚本 `/opt/backup.sh`：

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
docker exec expert_review_mysql mysqldump -u expert_user -p你的密码 expert_review > $BACKUP_DIR/db_$DATE.sql

# 备份文件
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /opt/team_data

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "备份完成: $DATE"
```

添加到crontab（每天凌晨2点备份）：

```bash
crontab -e
# 添加以下行
0 2 * * * /opt/backup.sh >> /var/log/backup.log 2>&1
```

## 生产环境检查清单

- [ ] 修改所有默认密码
- [ ] 配置强密码策略
- [ ] 设置文件存储目录权限
- [ ] 配置防火墙和安全组
- [ ] 设置自动备份
- [ ] 配置日志轮转
- [ ] 配置域名和SSL
- [ ] 设置监控告警
- [ ] 测试备份恢复流程
- [ ] 文档化部署流程

## 联系支持

如有问题，请检查：
1. 容器日志：`docker-compose logs -f`
2. 系统日志：`journalctl -u docker`
3. 应用日志：查看容器内日志文件

---

**部署完成后，系统访问地址：**
- HTTP: `http://your-server-ip:3000`
- 管理员登录: 使用 `.env` 中配置的账号密码
