import { NextRequest, NextResponse } from 'next/server';
import { getReviewStatistics } from '@/lib/reviewAssignment';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const statistics = await getReviewStatistics();

    if (!statistics) {
      return NextResponse.json(
        { error: '获取统计数据失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      statistics: statistics
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    );
  }
}
