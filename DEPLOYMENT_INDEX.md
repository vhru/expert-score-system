# 📚 部署文档索引

本文档提供所有部署相关文档的快速索引，方便查找和使用。

## 📖 主要部署文档

### 1. Docker容器部署（推荐）⭐
**文件**: [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

**适用场景**: 生产环境部署，推荐使用

**包含内容**:
- 完整的Docker部署流程
- 环境配置说明
- 常用操作命令
- 数据备份和恢复
- 故障排除指南
- 性能优化建议
- 安全配置清单

**快速链接**: 
- 快速部署: 查看文档第2-6节
- 常用操作: 查看文档第7节
- 故障排除: 查看文档第15节

### 2. 文件存储配置
**文件**: [DEPLOYMENT.md](./DEPLOYMENT.md)

**适用场景**: 了解文件存储配置和备份策略

**包含内容**:
- 文件存储目录结构
- Docker部署配置
- 备份策略
- 监控和维护
- 故障排除

### 3. 阿里云ECS部署指南
**文件**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**适用场景**: 阿里云ECS服务器部署

**包含内容**:
- ECS控制台部署流程
- Docker部署脚本
- 传统Node.js部署脚本
- 安全组配置
- 验证和测试

### 4. 快速启动指南
**文件**: [QUICKSTART.md](./QUICKSTART.md)

**适用场景**: 本地开发环境快速启动

**包含内容**:
- 开发环境配置
- 数据库设置
- 功能测试流程
- 常见问题解决

## 🚀 部署方式选择

### 生产环境部署

**推荐方式**: Docker容器部署

**优势**:
- ✅ 环境一致性
- ✅ 易于扩展和维护
- ✅ 快速部署和回滚
- ✅ 资源隔离

**快速开始**:
```bash
# 1. 查看Docker部署文档
cat DOCKER_DEPLOYMENT.md

# 2. 使用快速部署脚本
./deploy-docker.sh
```

### 开发环境部署

**推荐方式**: 本地Node.js开发

**快速开始**:
```bash
# 1. 查看快速启动指南
cat QUICKSTART.md

# 2. 安装依赖并启动
npm install
npm run dev
```

## 📋 部署检查清单

### 首次部署前

- [ ] 阅读 [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)
- [ ] 准备服务器（至少1核2G）
- [ ] 安装Docker和Docker Compose
- [ ] 配置环境变量（修改所有默认密码）
- [ ] 创建文件存储目录
- [ ] 配置防火墙和安全组

### 部署后验证

- [ ] 检查容器状态: `docker-compose ps`
- [ ] 查看应用日志: `docker-compose logs -f app`
- [ ] 测试健康检查: `curl http://localhost:3000/api/health`
- [ ] 初始化数据库: `curl -X POST http://localhost:3000/api/init`
- [ ] 测试登录功能
- [ ] 测试文件上传功能

### 生产环境配置

- [ ] 修改所有默认密码
- [ ] 配置强密码策略
- [ ] 设置自动备份
- [ ] 配置日志轮转
- [ ] 配置域名和SSL（可选）
- [ ] 设置监控告警（可选）

## 🔧 常用命令速查

### Docker操作

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose stop

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f app

# 查看状态
docker-compose ps

# 更新部署
docker-compose down
docker-compose up -d --build
```

### 数据备份

```bash
# 备份数据库
docker exec expert_review_mysql mysqldump -u expert_user -p expert_review > backup.sql

# 备份文件
tar -czf files_backup.tar.gz /opt/team_data
```

### 故障排查

```bash
# 查看容器日志
docker-compose logs -f

# 检查容器状态
docker ps -a

# 检查端口占用
netstat -tlnp | grep :3000

# 检查磁盘空间
df -h
```

## 📞 获取帮助

### 文档查找

1. **部署问题**: 查看 [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) 第15节故障排除
2. **配置问题**: 查看 [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) 第3节环境配置
3. **开发问题**: 查看 [QUICKSTART.md](./QUICKSTART.md)
4. **文件存储**: 查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 日志检查

```bash
# 应用日志
docker-compose logs -f app

# 数据库日志
docker-compose logs -f mysql

# 系统日志
journalctl -u docker
```

## 📝 文档更新记录

- **2024-01**: 创建Docker部署文档
- **2024-01**: 更新README部署说明
- **2024-01**: 创建部署文档索引

---

**提示**: 首次部署建议完整阅读 [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)，确保理解所有配置项和操作步骤。
