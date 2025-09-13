import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // 获取专家的评审任务
    const { dbOperations } = await import('@/lib/simple-sqlite');
    const assignments = await dbOperations.assignments.findByExpert(user.id);

    return NextResponse.json({
      success: true,
      assignments: assignments
    });

  } catch (error) {
    console.error('Failed to fetch expert assignments:', error);
    return NextResponse.json(
      { error: '获取评审任务失败' },
      { status: 500 }
    );
  }
}
