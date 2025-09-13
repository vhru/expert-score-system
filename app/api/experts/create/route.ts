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

    const { username, password, personalInfo, expertType } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    // 加密个人信息
    const encryptedInfo = personalInfo ? encryptData(personalInfo) : null;

    const success = await createExpert(username, password, encryptedInfo, expertType);

    if (!success) {
      return NextResponse.json(
        { error: '创建专家失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '专家创建成功'
    });

  } catch (error) {
    console.error('Create expert error:', error);
    return NextResponse.json(
      { error: '创建专家失败' },
      { status: 500 }
    );
  }
}
