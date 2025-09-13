import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // 获取所有专家
    const { dbOperations } = await import('@/lib/database-adapter');
    const allUsers = await dbOperations.users.findAll();
    
    // 过滤出专家用户
    const experts = allUsers.filter(user => user.role === 'expert');

    return NextResponse.json({
      success: true,
      experts: experts
    });

  } catch (error) {
    console.error('Failed to fetch experts:', error);
    return NextResponse.json(
      { error: '获取专家列表失败' },
      { status: 500 }
    );
  }
}
