import { NextRequest, NextResponse } from 'next/server';
import { getExpertAssignments } from '@/lib/reviewAssignment';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    const assignments = await getExpertAssignments(user.id);

    return NextResponse.json({
      success: true,
      assignments: assignments
    });

  } catch (error) {
    console.error('Get assignments error:', error);
    return NextResponse.json(
      { error: '获取评审任务失败' },
      { status: 500 }
    );
  }
}
