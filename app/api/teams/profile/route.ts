import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbOperations } from '@/lib/database-adapter';

export const dynamic = 'force-dynamic';

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
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'expert_review_jwt_secret_2024_production') as any;
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
    
    // 解密团队信息
    let decryptedInfo: any = {};
    try {
      const { decryptData } = await import('@/lib/encryption');
      decryptedInfo = JSON.parse(decryptData(team.encrypted_info));
    } catch (error) {
      console.error('解密团队信息失败:', error);
      // 如果解密失败，使用数据库中的基本信息
      decryptedInfo = {
        basicInfo: {
          projectName: team.team_name || '',
          projectBrief: team.project_brief || '',
          projectStage: team.project_stage || '',
          projectStageOthers: team.project_stage_others || '',
          coreMembersNationality: team.core_members_nationality || '',
          nationalityType: team.nationality_type || 'single',
          selectedCountries: team.selected_countries ? JSON.parse(team.selected_countries) : [],
          nationalityOthers: team.nationality_others || ''
        },
        contactInfo: {
          contactPersonName: team.contact_person_name || '',
          contactPersonPosition: team.contact_person_position || '',
          contactPersonPhone: team.contact_person_phone || '',
          contactPersonEmail: team.contact_person_email || team.contact_email || ''
        }
      };
    }
    
    console.log('👥 获取团队信息调试:');
    console.log('   团队ID:', decoded.id);
    console.log('   团队名称:', team.team_name);
    console.log('   核心成员数量:', Array.isArray(coreMembers) ? coreMembers.length : 0);
    console.log('   解密信息:', decryptedInfo);

    return NextResponse.json({
      success: true,
      team: {
        ...team,
        core_members: Array.isArray(coreMembers) ? coreMembers : [],
        decryptedInfo: decryptedInfo
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
