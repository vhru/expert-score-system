import { NextRequest, NextResponse } from 'next/server';
import { createExpert } from '@/lib/auth';
import { verifyToken } from '@/lib/auth';
import { encryptData } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { experts } = await request.json();

    // 批量创建逻辑
    if (!experts || !Array.isArray(experts)) {
      return NextResponse.json(
        { error: '专家数据格式错误' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const expert of experts) {
      try {
        const { username, password, personalInfo } = expert;
        
        if (!username || !password) {
          errors.push({ username: username || 'unknown', error: '用户名和密码不能为空' });
          continue;
        }

        // 加密个人信息
        const encryptedInfo = personalInfo ? encryptData(personalInfo) : null;

        // 默认expert_type为'team'
        const success = await createExpert(username, password, encryptedInfo, 'team');
        
        if (success) {
          results.push({ username, status: 'success' });
        } else {
          errors.push({ username, error: '创建失败' });
        }
      } catch (error) {
        errors.push({ username: expert.username || 'unknown', error: '创建失败' });
      }
    }

    return NextResponse.json({
      success: true,
      experts: results,
      errors: errors,
      message: `成功创建 ${results.length} 个专家，失败 ${errors.length} 个`
    });

  } catch (error) {
    console.error('Batch create experts error:', error);
    return NextResponse.json(
      { error: '批量创建专家失败' },
      { status: 500 }
    );
  }
}
