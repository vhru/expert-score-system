import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 验证专家权限
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);
    
    if (!user || user.role !== 'expert') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { assignmentId, score, comments } = await request.json();

    if (!assignmentId || score === undefined || !comments) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    if (score < 0 || score > 100) {
      return NextResponse.json({ error: '分数必须在0-100之间' }, { status: 400 });
    }

    // 更新评审结果
    const { dbOperations } = await import('@/lib/simple-sqlite');
    const result = await dbOperations.assignments.updateScore(assignmentId, score, comments);

    if (result.changes > 0) {
      return NextResponse.json({
        success: true,
        message: '评审提交成功'
      });
    } else {
      return NextResponse.json({ error: '评审提交失败' }, { status: 500 });
    }

  } catch (error) {
    console.error('Failed to submit review:', error);
    return NextResponse.json(
      { error: '评审提交失败' },
      { status: 500 }
    );
  }
}
