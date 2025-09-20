# 系统路径结构说明

## 🗂️ **正确的路径结构**

### **团队数据目录结构**
```
/opt/team_data/team_data/{团队名}_{邮箱}_{类型}/
├── documents/          # 团队文档
│   ├── 1_test_commitmentLetter_1705123456789.pdf
│   ├── 1_test_presentation_1705123456790.pdf
│   └── ...
├── images/            # 团队图片（证件照等）
│   ├── 1_test_idPhoto_0_1705123456791.jpg
│   ├── 1_test_idPhoto_1_1705123456792.jpg
│   └── ...
└── member-cvs/        # 成员CV
    ├── 1_member_1_1705123456793.pdf
    ├── 1_member_2_1705123456794.pdf
    └── ...
```

### **路径拼接示例**

**团队信息：**
- 团队名：`创新团队`
- 邮箱：`test@qq.com`
- 类型：`team`

**最终路径：**
```
/opt/team_data/team_data/创新团队_test@qq.com_team/
├── documents/
│   └── 1_test_commitmentLetter_1705123456789.pdf
├── images/
│   └── 1_test_idPhoto_0_1705123456791.jpg
└── member-cvs/
    └── 1_member_1_1705123456793.pdf
```

## 🔧 **路径构建工具使用**

### **PathBuilder 类方法**

```typescript
import { PathBuilder } from '@/lib/paths-config';

// 团队文档路径
const docsPath = PathBuilder.getTeamDocumentsPath('创新团队', 'test@qq.com', 'team');
// 结果：/opt/team_data/team_data/创新团队_test@qq.com_team/documents

// 团队图片路径
const imagesPath = PathBuilder.getTeamImagesPath('创新团队', 'test@qq.com', 'team');
// 结果：/opt/team_data/team_data/创新团队_test@qq.com_team/images

// 成员CV路径
const cvsPath = PathBuilder.getMemberCvsPath('创新团队', 'test@qq.com', 'team');
// 结果：/opt/team_data/team_data/创新团队_test@qq.com_team/member-cvs
```

## 📦 **ZIP打包优势**

### **统一目录结构的好处：**

1. **打包简单**：只需要打包一个团队目录
2. **路径清晰**：所有文件都在团队目录下
3. **易于管理**：删除团队时直接删除整个目录
4. **避免混乱**：不会出现文件散落在不同目录的情况

### **ZIP文件结构：**
```
创新团队_test_team.zip
├── documents/
│   ├── 承诺书_1.pdf
│   ├── 项目展示_2.pdf
│   └── 补充材料_3.pdf
├── images/
│   ├── 证件照_1.jpg
│   ├── 证件照_2.jpg
│   └── 证件照_3.jpg
└── member-cvs/
    ├── 成员1_CV.pdf
    ├── 成员2_CV.pdf
    └── 成员3_CV.pdf
```

## ⚠️ **当前代码问题**

### **需要修复的问题：**

1. **CV路径问题**：
   - 当前：`/opt/team_data/team_data/member-cvs/`（全局目录）
   - 应该：`/opt/team_data/team_data/{团队目录}/member-cvs/`（团队目录下）

2. **图片路径不一致**：
   - `register/route.ts` 使用全局 `team-images/` 目录
   - 应该统一使用团队目录下的 `images/` 目录

3. **更新API路径问题**：
   - `update-team/[id]/route.ts` 使用 `team_${teamId}` 格式
   - 应该使用 `{团队名}_{邮箱}_{类型}` 格式

## 🚀 **修复建议**

1. **统一CV路径**：修改 `register-team/route.ts` 和 `register-enterprise/route.ts` 中的CV保存路径
2. **统一图片路径**：修改 `register/route.ts` 使用团队目录下的images目录
3. **统一更新API**：修改 `update-team/[id]/route.ts` 使用正确的团队目录格式
4. **使用PathBuilder**：在所有API中使用统一的路径构建工具

这样修改后，打包ZIP时只需要：
```typescript
const teamDir = PathBuilder.getTeamDir(teamName, contactEmail, teamType);
const zipPath = `${PATHS_CONFIG.UPLOAD_BASE_DIR}/${PATHS_CONFIG.SUBDIRS.TEAM_DATA}/${teamDir}`;
// 直接打包整个 teamDir 目录即可
```
