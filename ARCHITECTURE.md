# 🏗️ 专家盲审系统 - 架构设计

## 📋 项目架构总览

```
专家盲审系统
├── 前端层 (Frontend Layer)
│   ├── Next.js 14 (App Router)
│   ├── React 18 + TypeScript
│   ├── Tailwind CSS
│   └── 响应式组件设计
│
├── 后端层 (Backend Layer)
│   ├── Next.js API Routes
│   ├── JWT认证中间件
│   ├── 文件上传处理
│   └── 业务逻辑层
│
├── 数据层 (Data Layer)
│   ├── MySQL数据库
│   ├── 连接池管理
│   ├── 数据加密存储
│   └── 事务处理
│
└── 基础设施层 (Infrastructure)
    ├── Docker容器化
    ├── 环境变量管理
    ├── 文件存储系统
    └── 安全配置
```

## 🔧 技术架构详解

### 1. 前端架构 (Frontend Architecture)

```
app/
├── layout.tsx          # 全局布局
├── page.tsx            # 主页面路由
├── globals.css         # 全局样式
└── test/page.tsx       # 测试页面

components/
├── LoginForm.tsx       # 登录组件
├── AdminDashboard.tsx  # 管理员控制台
├── ExpertDashboard.tsx # 专家控制台
├── FileUpload.tsx      # 文件上传组件
├── ExpertManagement.tsx # 专家管理组件
├── ReviewManagement.tsx # 评审管理组件
├── MyAssignments.tsx   # 我的任务组件
└── Statistics.tsx      # 统计报告组件
```

**设计原则:**
- 组件化设计，职责单一
- TypeScript类型安全
- 响应式布局
- 状态管理简洁

### 2. 后端架构 (Backend Architecture)

```
app/api/
├── auth/
│   └── login/route.ts          # 用户认证
├── upload/route.ts             # 文件上传
├── experts/
│   ├── create/route.ts         # 创建专家
│   └── batch-create/route.ts   # 批量创建
├── reviews/
│   ├── assign/route.ts         # 分配评审
│   ├── my-assignments/route.ts # 获取任务
│   ├── submit/route.ts         # 提交评审
│   ├── all-assignments/route.ts # 所有任务
│   └── statistics/route.ts     # 统计数据
└── init/route.ts               # 系统初始化
```

**设计原则:**
- RESTful API设计
- 统一的错误处理
- 权限验证中间件
- 数据验证和清理

### 3. 数据层架构 (Data Layer Architecture)

```
lib/
├── database.ts         # 数据库连接和初始化
├── auth.ts            # 认证和授权逻辑
├── encryption.ts      # 数据加密解密
├── fileUpload.ts      # 文件处理逻辑
└── reviewAssignment.ts # 评审分配算法
```

**数据库设计:**
```sql
-- 用户表
users (id, username, password, role, encrypted_info, created_at, updated_at)

-- 文件表  
files (id, original_name, file_path, file_size, mime_type, encrypted_info, upload_status, created_at, updated_at)

-- 评审分配表
review_assignments (id, file_id, expert_id, assignment_status, score, comments, created_at, updated_at)
```

**设计原则:**
- 数据规范化设计
- 外键约束保证数据完整性
- 索引优化查询性能
- 加密存储敏感信息

## 🔒 安全架构

### 1. 认证与授权
```
用户请求 → JWT验证 → 角色检查 → 业务逻辑
```

### 2. 数据加密
```
明文数据 → AES加密 → 数据库存储
数据库读取 → AES解密 → 业务使用
```

### 3. 文件安全
```
文件上传 → 类型验证 → 大小检查 → 路径混淆 → 安全存储
```

## 🚀 部署架构

### 1. 开发环境
```
本地开发 → npm run dev → 热重载开发
```

### 2. Docker环境
```
Docker Compose → MySQL容器 + Next.js容器 → 完整环境
```

### 3. 生产环境 (阿里云)
```
阿里云ECS → Nginx反向代理 → Next.js应用 → RDS MySQL
```

## 📊 性能架构

### 1. 数据库优化
- 连接池管理
- 索引优化
- 查询优化

### 2. 文件处理
- 异步文件上传
- 文件类型验证
- 大小限制

### 3. 前端优化
- 组件懒加载
- 图片优化
- 缓存策略

## 🔄 数据流架构

### 1. 用户登录流程
```
用户输入 → 密码验证 → JWT生成 → 状态存储 → 界面跳转
```

### 2. 文件上传流程
```
文件选择 → 类型验证 → 大小检查 → 服务器存储 → 数据库记录 → 返回结果
```

### 3. 评审分配流程
```
触发分配 → 获取文件列表 → 获取专家列表 → 随机分配算法 → 创建分配记录 → 更新状态
```

### 4. 评分提交流程
```
专家评分 → 数据验证 → 数据库更新 → 状态变更 → 统计更新
```

## 🛡️ 错误处理架构

### 1. 前端错误处理
- 组件级错误边界
- 网络请求错误处理
- 用户友好的错误提示

### 2. 后端错误处理
- 统一的错误响应格式
- 日志记录
- 异常捕获和恢复

### 3. 数据库错误处理
- 连接失败重试
- 事务回滚
- 数据一致性保证

## 📈 监控架构

### 1. 应用监控
- 请求响应时间
- 错误率统计
- 用户行为分析

### 2. 系统监控
- 服务器资源使用
- 数据库性能
- 文件存储状态

## 🔧 配置管理

### 1. 环境变量
```
.env.local (开发环境)
.env.production (生产环境)
docker-compose.yml (Docker环境)
```

### 2. 配置分类
- 数据库配置
- 安全配置
- 文件上传配置
- 业务配置

## ✅ 架构优势

1. **模块化设计**: 各层职责清晰，易于维护
2. **安全性**: 多层安全防护，数据加密存储
3. **可扩展性**: 组件化设计，易于功能扩展
4. **性能优化**: 数据库优化，前端缓存
5. **部署灵活**: 支持多种部署方式
6. **监控完善**: 完整的错误处理和日志记录

## 🎯 架构决策

1. **选择Next.js**: 全栈框架，开发效率高
2. **选择MySQL**: 关系型数据库，数据一致性保证
3. **选择JWT**: 无状态认证，易于扩展
4. **选择AES加密**: 对称加密，性能好
5. **选择Docker**: 容器化部署，环境一致
6. **选择Tailwind**: 原子化CSS，开发效率高
