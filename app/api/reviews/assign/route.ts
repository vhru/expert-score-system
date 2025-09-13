import { NextRequest, NextResponse } from 'next/server';
import { assignReviewsToExperts } from '@/lib/reviewAssignment';
import { verifyToken } from '@/lib/auth';

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

    const result = await assignReviewsToExperts();

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      assignments: result.assignments
    });

  } catch (error) {
    console.error('Review assignment error:', error);
    return NextResponse.json(
      { error: '分配评审失败' },
      { status: 500 }
    );
  }
}
