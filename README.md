# 专家盲审系统

一个基于Next.js的专家盲审评分系统，支持文件上传、专家管理、盲审分配和评分功能。

## 功能特点

- ✅ **文件上传**: 支持PDF、DOC、DOCX、图片等格式
- ✅ **专家管理**: 支持单个和批量创建专家账号
- ✅ **盲审分配**: 自动分配每个方案给至少2个专家评审
- ✅ **评分系统**: 0-100分评分，支持评审意见
- ✅ **数据加密**: 个人信息AES加密存储
- ✅ **权限控制**: 管理员和专家角色分离
- ✅ **统计报告**: 实时查看评审进度和统计

## 技术栈

- **前端**: Next.js 14, React 18, TypeScript
- **后端**: Next.js API Routes
- **数据库**: MySQL
- **加密**: AES加密, JWT认证
- **文件处理**: Multer, Sharp

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制 `env.example` 为 `.env.local` 并配置：

```bash
cp env.example .env.local
```

编辑 `.env.local` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=expert_review
DB_USER=root
DB_PASSWORD=your_password

# JWT密钥
JWT_SECRET=your_jwt_secret_key_here

# AES加密密钥（32位）
AES_SECRET_KEY=your_aes_secret_key_32_chars

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# 管理员配置
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

### 3. 数据库设置

创建MySQL数据库：

```sql
CREATE DATABASE expert_review CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 初始化数据库

启动开发服务器后，访问：
```
POST http://localhost:3000/api/init
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 使用说明

### 管理员功能

1. **登录**: 使用配置的管理员账号登录
2. **文件上传**: 上传需要评审的文件，可附加个人信息
3. **专家管理**: 创建专家账号（单个或批量）
4. **分配评审**: 自动分配每个文件给至少2个专家
5. **查看结果**: 实时查看评审进度和统计

### 专家功能

1. **登录**: 使用分配的专家账号登录
2. **查看任务**: 查看分配给自己的评审任务
3. **下载文件**: 下载需要评审的文件
4. **提交评分**: 给出0-100分评分和评审意见

## 数据库结构

### 用户表 (users)
- id: 用户ID
- username: 用户名
- password: 密码（加密）
- role: 角色（admin/expert）
- encrypted_info: 加密的个人信息
- created_at: 创建时间
- updated_at: 更新时间

### 文件表 (files)
- id: 文件ID
- original_name: 原始文件名
- file_path: 文件路径
- file_size: 文件大小
- mime_type: 文件类型
- encrypted_info: 加密的个人信息
- upload_status: 上传状态
- created_at: 创建时间
- updated_at: 更新时间

### 评审分配表 (review_assignments)
- id: 分配ID
- file_id: 文件ID
- expert_id: 专家ID
- assignment_status: 分配状态
- score: 评分
- comments: 评审意见
- created_at: 创建时间
- updated_at: 更新时间

## API接口

### 认证相关
- `POST /api/auth/login` - 用户登录

### 文件管理
- `POST /api/upload` - 文件上传

### 专家管理
- `POST /api/experts/create` - 创建单个专家
- `POST /api/experts/batch-create` - 批量创建专家

### 评审管理
- `POST /api/reviews/assign` - 分配评审任务
- `GET /api/reviews/my-assignments` - 获取我的评审任务
- `POST /api/reviews/submit` - 提交评审
- `GET /api/reviews/all-assignments` - 获取所有评审任务
- `GET /api/reviews/statistics` - 获取统计数据

### 系统管理
- `POST /api/init` - 初始化数据库

## 安全特性

- **数据加密**: 个人信息使用AES加密存储
- **权限控制**: JWT token认证，角色权限分离
- **文件安全**: 文件路径混淆，类型验证
- **输入验证**: 严格的输入验证和错误处理

## 部署说明

### 生产环境部署

1. **构建项目**:
```bash
npm run build
```

2. **启动生产服务器**:
```bash
npm start
```

### 阿里云部署

- **ECS**: 1核2G配置
- **RDS MySQL**: 基础版
- **OSS**: 标准存储（可选，用于文件存储）

## 开发计划

- [x] Day 1-2: 项目搭建 + 文件上传
- [x] Day 3-4: 专家登录 + 权限控制
- [x] Day 5-6: 盲审分配 + 评分界面
- [x] Day 7-8: 数据加密 + 结果统计
- [x] Day 9-10: 测试部署 + 优化

## 注意事项

1. 确保MySQL服务正在运行
2. 检查文件上传目录权限
3. 生产环境请修改默认密码
4. 定期备份数据库
5. 监控系统日志

## 许可证

MIT License
