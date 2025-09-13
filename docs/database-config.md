# 数据库配置说明

## 概述

系统现在支持两种数据库：
- **SQLite**：本地开发和测试环境
- **MySQL**：生产环境

系统会根据环境变量自动选择使用哪种数据库。

## 环境变量配置

### 数据库选择逻辑

系统根据以下规则自动选择数据库：

1. **生产环境（NODE_ENV=production）**：默认使用MySQL，除非明确设置 `DB_TYPE=sqlite`
2. **开发环境**：如果设置了MySQL环境变量则使用MySQL，否则使用SQLite

### SQLite模式（本地开发）

**开发环境**下，如果以下MySQL环境变量**未设置**或**为空**，系统将自动使用SQLite：

```bash
# 不设置这些变量，或设置为空
# DB_HOST=
# DB_USER=
# DB_PASSWORD=
```

SQLite数据库文件位置：`./data/expert_review.db`

### MySQL模式（生产环境）

**生产环境**默认使用MySQL，设置以下环境变量：

```bash
# 生产环境配置
NODE_ENV=production

# MySQL配置
DB_HOST=your-mysql-host    # MySQL服务器地址
DB_PORT=3306              # MySQL端口
DB_USER=your-username     # MySQL用户名
DB_PASSWORD=your-password # MySQL密码
DB_NAME=expert_review     # 数据库名称
```

**强制使用SQLite（生产环境）**：
```bash
NODE_ENV=production
DB_TYPE=sqlite
```

## 部署配置

### 本地开发

1. 确保没有设置MySQL环境变量
2. 运行 `npm run dev`
3. 系统自动使用SQLite

### 生产环境（阿里云）

1. 设置MySQL环境变量：
   ```bash
   export DB_HOST=your-mysql-host
   export DB_USER=your-username
   export DB_PASSWORD=your-password
   export DB_NAME=expert_review
   ```

2. 确保MySQL服务器已创建数据库和表结构
3. 运行应用，系统自动使用MySQL

## 数据库初始化

系统启动时会自动检查并创建必要的表结构：

- **SQLite**：自动创建 `./data/expert_review.db` 和所有表
- **MySQL**：需要手动创建数据库，系统会自动创建表结构

### MySQL初始化步骤

1. 连接到MySQL服务器
2. 创建数据库：
   ```sql
   CREATE DATABASE expert_review CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. 设置环境变量
4. 启动应用，系统会自动创建所有表

## 表结构

两种数据库使用相同的表结构：

- `users` - 用户表（管理员、专家）
- `teams` - 团队表
- `files` - 文件表
- `review_assignments` - 评审分配表
- `team_images` - 团队图片表
- `core_members` - 核心成员表
- `team_documents` - 团队文档表

## 注意事项

1. **数据迁移**：从SQLite迁移到MySQL需要手动导出/导入数据
2. **性能**：MySQL在生产环境中性能更好
3. **备份**：MySQL支持更好的备份和恢复机制
4. **并发**：MySQL支持更高的并发访问

## 故障排除

### 常见问题

1. **连接失败**：检查MySQL服务是否运行，环境变量是否正确
2. **权限错误**：确保MySQL用户有创建表的权限
3. **字符编码**：确保MySQL数据库使用utf8mb4编码

### 调试

系统会在控制台输出当前使用的数据库类型：
```
Database type: MySQL
```
或
```
Database type: SQLite
```
