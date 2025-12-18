import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { decryptData } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '邮箱和密码不能为空' }, { status: 400 });
    }

    const { dbOperations } = await import('@/lib/database-adapter');
    
    // 查找团队 - 使用邮箱查找
    const team = await dbOperations.teams.findByEmail(email);
    if (!team) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, team.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    // 解密团队信息
    let teamInfo;
    try {
      teamInfo = JSON.parse(decryptData(team.encrypted_info));
    } catch (error) {
      teamInfo = { teamName: team.team_name };
    }

    // 生成JWT token
    const token = jwt.sign(
      { 
        id: team.id, 
        teamName: team.team_name, 
        role: 'team' 
      },
      process.env.JWT_SECRET || 'expert_review_jwt_secret_2024_production',
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      token: token,
      team: {
        id: team.id,
        teamName: team.team_name,
        contactEmail: team.contact_email,
        audit_status: team.audit_status,
        ...teamInfo
      }
    });

  } catch (error) {
    console.error('Team login error:', error);
    return NextResponse.json(
      { error: '登录失败' },
      { status: 500 }
    );
  }
}
