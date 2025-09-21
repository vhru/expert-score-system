# 天翼云部署指南

## 系统选择建议

### 推荐配置
- **操作系统**: Ubuntu 22.04 LTS 64位
- **实例规格**: 2核4GB 或以上
- **存储**: 40GB 系统盘 + 100GB 数据盘（可选）

### 备选配置
- **操作系统**: CentOS 7.9 或 Rocky Linux 8
- **实例规格**: 2核4GB 或以上

## 安全组配置

### 必需端口
```
端口 22   - SSH访问
端口 3000 - 应用访问
端口 3306 - MySQL数据库（可选，仅内网访问）
```

### 安全组规则示例
```
方向: 入方向
协议: TCP
端口: 22
源: 0.0.0.0/0
描述: SSH访问

方向: 入方向
协议: TCP
端口: 3000
源: 0.0.0.0/0
描述: 应用访问

方向: 出方向
协议: ALL
端口: ALL
源: 0.0.0.0/0
描述: 出站访问
```

## 部署步骤

### 1. 创建天翼云ECS实例
1. 登录天翼云控制台
2. 选择ECS服务
3. 创建实例，选择Ubuntu 22.04 LTS
4. 配置安全组（开放22和3000端口）
5. 设置SSH密钥对

### 2. 连接服务器
```bash
ssh root@<天翼云公网IP>
```

### 3. 上传项目文件
```bash
# 方法1: 使用scp
scp -r ./expert-score-system root@<天翼云公网IP>:/opt/

# 方法2: 使用git
cd /opt
git clone https://github.com/vhru/expert-score-system.git
```

### 4. 执行部署脚本
```bash
cd /opt/expert-score-system
chmod +x deploy-ctyun.sh
./deploy-ctyun.sh
```

### 5. 验证部署
```bash
# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 测试访问
curl http://localhost:3000/api/init -X POST
```

## 常见问题

### 1. Docker安装失败
```bash
# 手动安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker
```

### 2. 端口访问问题
- 检查安全组是否开放3000端口
- 检查防火墙设置
- 确认服务是否正常启动

### 3. 数据库连接问题
```bash
# 检查MySQL容器状态
docker-compose logs mysql

# 重启数据库
docker-compose restart mysql
```

## 性能优化建议

### 1. 系统优化
```bash
# 更新系统
apt update && apt upgrade -y

# 安装必要工具
apt install -y curl wget git vim
```

### 2. Docker优化
```bash
# 配置Docker镜像加速
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
EOF
systemctl restart docker
```

### 3. 应用优化
- 定期清理Docker镜像: `docker system prune -f`
- 监控资源使用: `docker stats`
- 设置日志轮转

## 备份策略

### 1. 数据库备份
```bash
# 创建备份脚本
cat > backup-db.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
docker exec expert_review_mysql mysqldump -u expert_user -p expert_password expert_review > backup_\$DATE.sql
EOF
chmod +x backup-db.sh
```

### 2. 文件备份
```bash
# 备份上传文件
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## 监控和维护

### 1. 服务监控
```bash
# 查看服务状态
docker-compose ps

# 查看资源使用
docker stats

# 查看日志
docker-compose logs -f app
```

### 2. 定期维护
- 每周检查服务状态
- 每月更新系统补丁
- 定期清理日志文件
- 监控磁盘空间使用

## 联系支持

如遇到问题，请提供以下信息：
1. 系统版本: `cat /etc/os-release`
2. Docker版本: `docker --version`
3. 服务状态: `docker-compose ps`
4. 错误日志: `docker-compose logs`


