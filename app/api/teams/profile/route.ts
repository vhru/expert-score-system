import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbOperations } from '@/lib/database-adapter';

export async function GET(request: NextRequest) {
  try {
    // 验证团队token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    } catch (error) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 });
    }

    if (!decoded || decoded.role !== 'team') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    // 获取团队信息
    const team = await dbOperations.teams.findById(decoded.id);
    if (!team) {
      return NextResponse.json({ error: '团队不存在' }, { status: 404 });
    }

    // 获取核心成员信息
    const coreMembers = await dbOperations.coreMembers.findByTeam(decoded.id);

    return NextResponse.json({
      success: true,
      team: {
        ...team,
        core_members: coreMembers
      }
    });

  } catch (error) {
    console.error('Get team profile error:', error);
    return NextResponse.json(
      { error: '获取团队信息失败' },
      { status: 500 }
    );
  }
}
