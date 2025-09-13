import { NextRequest, NextResponse } from 'next/server';
import { submitReview } from '@/lib/reviewAssignment';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 验证专家权限
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'expert') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { assignmentId, score, comments } = await request.json();

    if (!assignmentId || score === undefined || score === null) {
      return NextResponse.json(
        { error: '分配ID和评分不能为空' },
        { status: 400 }
      );
    }

    if (score < 0 || score > 100) {
      return NextResponse.json(
        { error: '评分必须在0-100之间' },
        { status: 400 }
      );
    }

    const success = await submitReview(assignmentId, score, comments || '');

    if (!success) {
      return NextResponse.json(
        { error: '提交评审失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '评审提交成功'
    });

  } catch (error) {
    console.error('Submit review error:', error);
    return NextResponse.json(
      { error: '提交评审失败' },
      { status: 500 }
    );
  }
}
