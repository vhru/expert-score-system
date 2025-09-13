# 专家评审系统部署指南

## 文件存储配置

### 1. 创建文件存储目录

在服务器上创建专门的文件存储目录：

```bash
# 创建目录
sudo mkdir -p /opt/team_data

# 设置权限（确保Docker容器可以访问）
sudo chown -R 1000:1000 /opt/team_data
sudo chmod -R 755 /opt/team_data
```

### 2. 目录结构

系统会在 `/opt/team_data` 下自动创建以下子目录：

```
/opt/team_data/
├── team-documents/     # 团队提交的文档
├── member-cvs/         # 核心成员简历
├── team-images/        # 团队图片
└── photos/            # 其他照片
```

### 3. Docker部署

使用提供的 `docker-compose.yml` 文件部署：

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f app
```

### 4. 环境变量配置

确保在 `.env` 文件中设置正确的环境变量：

```env
# 文件存储配置
UPLOAD_DIR=/opt/team_data
MAX_FILE_SIZE=10485760

# 其他配置...
DB_HOST=mysql
DB_PORT=3306
DB_NAME=expert_review
DB_USER=expert_user
DB_PASSWORD=expert_password
JWT_SECRET=your_jwt_secret_key_here_change_in_production
AES_SECRET_KEY=your_aes_secret_key_32_chars_long
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

### 5. 备份策略

#### 数据库备份
```bash
# 备份MySQL数据库
docker exec expert_review_mysql mysqldump -u expert_user -p expert_review > backup_$(date +%Y%m%d).sql
```

#### 文件备份
```bash
# 备份文件存储目录
tar -czf team_data_backup_$(date +%Y%m%d).tar.gz /opt/team_data
```

### 6. 监控和维护

#### 检查服务状态
```bash
# 检查容器状态
docker-compose ps

# 检查文件存储空间
df -h /opt/team_data

# 检查文件数量
find /opt/team_data -type f | wc -l
```

#### 日志查看
```bash
# 查看应用日志
docker-compose logs -f app

# 查看数据库日志
docker-compose logs -f mysql
```

### 7. 故障排除

#### 文件上传失败
1. 检查目录权限：`ls -la /opt/team_data`
2. 检查磁盘空间：`df -h`
3. 检查容器日志：`docker-compose logs app`

#### 文件下载失败
1. 检查文件是否存在：`ls -la /opt/team_data/team-documents/`
2. 检查文件权限：`ls -la /opt/team_data/team-documents/文件名`
3. 检查应用日志：`docker-compose logs app`

### 8. 安全建议

1. **定期备份**：建议每日备份数据库和文件
2. **权限控制**：确保只有应用容器可以访问文件目录
3. **监控磁盘空间**：设置磁盘空间监控告警
4. **日志轮转**：配置日志轮转避免磁盘空间不足

### 9. 扩展部署

如果需要多服务器部署，可以考虑：

1. **共享存储**：使用NFS或其他共享存储系统
2. **负载均衡**：使用Nginx进行负载均衡
3. **数据库集群**：使用MySQL主从复制或集群

## 联系支持

如有问题，请联系系统管理员。
