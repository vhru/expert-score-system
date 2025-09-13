import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { teamId, status, notes } = await request.json();

    if (!teamId || !status) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: '无效的审核状态' }, { status: 400 });
    }

    const { dbOperations } = await import('@/lib/database-adapter');
    
    // 更新团队审核状态
    const result = await dbOperations.teams.updateAuditStatus(
      teamId,
      status,
      notes || '',
      user.username || 'admin'
    );

    if (result) {
      return NextResponse.json({
        success: true,
        message: '审核完成'
      });
    } else {
      return NextResponse.json({ error: '审核失败' }, { status: 500 });
    }

  } catch (error) {
    console.error('Audit team error:', error);
    return NextResponse.json(
      { error: '审核失败' },
      { status: 500 }
    );
  }
}
