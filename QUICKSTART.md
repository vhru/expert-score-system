# 🚀 快速启动指南

## 1. 安装依赖

```bash
npm install
```

## 2. 环境配置

```bash
# 运行设置脚本
npm run setup

# 编辑 .env.local 文件，配置数据库连接
# 主要配置项：
# - DB_HOST: 数据库主机
# - DB_PASSWORD: 数据库密码
# - JWT_SECRET: JWT密钥
# - AES_SECRET_KEY: AES加密密钥（32位）
```

## 3. 数据库设置

```sql
-- 创建数据库
CREATE DATABASE expert_review CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 4. 启动项目

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

## 5. 初始化系统

```bash
# 方法1: 使用API
curl -X POST http://localhost:3000/api/init

# 方法2: 创建演示数据（可选）
npm run demo
```

## 6. 登录测试

### 管理员账号
- 用户名: `admin@example.com`
- 密码: `admin123`

### 专家账号（如果运行了演示数据）
- 用户名: `expert1` 到 `expert5`
- 密码: `password123`

## 功能测试流程

### 管理员操作
1. 登录管理员账号
2. 上传测试文件
3. 创建专家账号
4. 分配评审任务
5. 查看统计报告

### 专家操作
1. 登录专家账号
2. 查看分配的评审任务
3. 提交评分和意见

## 常见问题

### 数据库连接失败
- 检查MySQL服务是否启动
- 确认数据库配置正确
- 检查数据库用户权限

### 文件上传失败
- 检查uploads目录权限
- 确认文件大小不超过10MB
- 检查文件类型是否支持

### 登录失败
- 确认已初始化数据库
- 检查用户名密码是否正确
- 查看控制台错误信息

## 生产环境部署

```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

## 技术支持

如遇问题，请检查：
1. 控制台错误信息
2. 数据库连接状态
3. 环境变量配置
4. 文件权限设置
