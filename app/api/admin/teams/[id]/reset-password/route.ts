import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbOperations } from '@/lib/database-adapter';
import bcrypt from 'bcryptjs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const authResult = await verifyToken(request);
    if (!authResult.success || authResult.user?.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { password } = await request.json();
    
    if (!password || password.length < 6) {
      return NextResponse.json({ error: '密码长度至少6位' }, { status: 400 });
    }

    const teamId = parseInt(params.id);
    if (isNaN(teamId)) {
      return NextResponse.json({ error: '无效的团队ID' }, { status: 400 });
    }

    // 检查团队是否存在
    const team = await dbOperations.teams.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: '团队不存在' }, { status: 404 });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 更新团队密码
    await dbOperations.teams.updatePassword(teamId, hashedPassword);

    return NextResponse.json({ 
      success: true, 
      message: '密码重置成功',
      newPassword: password // 返回明文密码供管理员查看
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
