# 系统维护操作指南

## 🔧 维护模式操作

### 开启维护模式

1. **修改环境变量**：
   ```bash
   # 在 docker-compose.yml 中修改
   - MAINTENANCE_MODE=true
   - MAINTENANCE_MESSAGE=系统正在维护中，预计维护时间：2小时。给您带来的不便敬请谅解。
   - MAINTENANCE_START_TIME=2024-01-15 10:00:00
   - MAINTENANCE_END_TIME=2024-01-15 12:00:00
   ```

2. **重启服务**：
   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. **访问维护页面**：
   - 用户访问任何页面都会自动重定向到 `/maintenance`
   - 维护页面会显示维护信息和预计结束时间

### 关闭维护模式

1. **修改环境变量**：
   ```bash
   # 在 docker-compose.yml 中修改
   - MAINTENANCE_MODE=false
   ```

2. **重启服务**：
   ```bash
   docker-compose down
   docker-compose up -d
   ```

## 📋 维护期间的行为

### 被禁用的功能
- 团队注册 (`/api/teams/register-team`)
- 企业注册 (`/api/teams/register-enterprise`)
- 所有用户页面（自动重定向到维护页面）

### 仍然可用的功能
- 管理员登录 (`/admin-dashboard`)
- 管理员审核 (`/admin-audit`)
- 系统状态检查 (`/api/system/status`)
- 维护页面 (`/maintenance`)

## 🔍 检查维护状态

### API检查
```bash
curl https://yourdomain.com/api/system/status
```

### 响应示例
```json
{
  "success": true,
  "maintenance": {
    "isMaintenance": true,
    "message": "系统正在维护中，预计维护时间：2小时。给您带来的不便敬请谅解。",
    "startTime": "2024-01-15 10:00:00",
    "endTime": "2024-01-15 12:00:00"
  }
}
```

## 🚀 系统迁移配置

### 路径配置修改

所有文件路径配置都在 `lib/paths-config.ts` 中，修改以下配置即可：

```typescript
export const PATHS_CONFIG = {
  // 修改基础路径
  UPLOAD_BASE_DIR: '/new/path/to/team_data',
  
  // 修改子目录结构
  SUBDIRS: {
    DOCUMENTS: 'docs',
    IMAGES: 'imgs',
    // ...
  }
};
```

### 环境变量配置

在 `docker-compose.yml` 中修改：
```yaml
environment:
  - UPLOAD_DIR=/new/path/to/team_data
  - DB_HOST=new_mysql_host
  - DB_PASSWORD=new_password
```

## 📝 维护日志

建议在维护期间记录以下信息：
- 维护开始时间
- 维护原因
- 影响的功能
- 维护结束时间
- 遇到的问题和解决方案

## ⚠️ 注意事项

1. **数据备份**：维护前务必备份数据库和文件
2. **通知用户**：提前通知用户维护时间
3. **测试验证**：维护后测试关键功能
4. **监控日志**：维护期间监控系统日志
