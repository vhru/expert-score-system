import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    // 验证管理员权限
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);
    
    if (!user || (user.role !== 'admin' && user.role !== 'expert')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const teamName = decodeURIComponent(params.name);
    
    const { dbOperations } = await import('@/lib/database-adapter');
    const team = await dbOperations.teams.findByName(teamName);

    if (!team) {
      return NextResponse.json({ error: '团队不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      team: team
    });

  } catch (error) {
    console.error('Failed to find team by name:', error);
    return NextResponse.json(
      { error: '查找团队失败' },
      { status: 500 }
    );
  }
}
