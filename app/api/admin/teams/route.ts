import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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

    // 获取所有团队及其评审状态
    const { dbOperations } = await import('@/lib/database-adapter');
    const teams = await dbOperations.teams.findAll();
    
    // 为每个团队添加评审状态信息
    const teamsWithReviewStatus = await Promise.all((teams as any[]).map(async (team) => {
      // 获取团队的核心成员并解密敏感字段
      const coreMembers = await dbOperations.coreMembers.findByTeam(team.id);
      
      // 解密核心成员的敏感字段
      const { decryptData } = await import('@/lib/encryption');
      const decryptedCoreMembers = (coreMembers as any[]).map(member => {
        try {
          return {
            ...member,
            phone: member.phone ? decryptData(member.phone) : member.phone,
            id_number: member.id_number ? decryptData(member.id_number) : member.id_number
          };
        } catch (error) {
          console.error('解密核心成员数据失败:', error);
          return member;
        }
      });
      
      console.log(`🔍 团队 ${team.team_name} 的核心成员数据:`, decryptedCoreMembers.map(m => ({ 
        name: m.name, 
        nationality: m.nationality, 
        email: m.email,
        phone: m.phone,
        university: m.university,
        highest_degree: m.highest_degree,
        organization: m.organization
      })));
      
      // 获取团队的文档
      const documents = await dbOperations.teamDocuments.findByTeam(team.id);
      
      // 获取团队的图片
      const teamImages = await dbOperations.teamImages.findByTeam(team.id);
      
      // 解密团队信息
      let decryptedInfo: any = {};
      try {
        const { decryptData } = await import('@/lib/encryption');
        decryptedInfo = JSON.parse(decryptData(team.encrypted_info));
      } catch (error) {
        console.error('Failed to decrypt team info for team:', team.id, error);
      }
      
      // 计算评审完成状态（暂时设为未分配，因为新系统还没有评审分配）
      let reviewCompletionStatus = 'not_assigned';
      let reviewStatus = {
        totalAssignments: 0,
        completedAssignments: 0,
        averageScore: null,
        assignments: []
      };

      console.log(`🔍 团队 ${team.team_name} 的 is_enterprise 值:`, team.is_enterprise, typeof team.is_enterprise);
      console.log(`🔍 团队 ${team.team_name} 的国别信息:`, {
        nationality_type: team.nationality_type,
        selected_countries: team.selected_countries,
        nationality_others: team.nationality_others
      });
      
      return {
        ...team,
        // 添加解密后的字段
        project_name: decryptedInfo.basicInfo?.projectName || team.team_name,
        project_brief: decryptedInfo.basicInfo?.projectBrief,
        project_stage: decryptedInfo.basicInfo?.projectStage,
        project_stage_others: decryptedInfo.basicInfo?.projectStageOthers,
        contact_person_name: decryptedInfo.contactInfo?.contactPersonName,
        contact_person_position: decryptedInfo.contactInfo?.contactPersonPosition,
        contact_person_phone: decryptedInfo.contactInfo?.contactPersonPhone,
        contact_person_email: decryptedInfo.contactInfo?.contactPersonEmail,
        registration_country: decryptedInfo.basicInfo?.registrationCountry,
        // 企业信息
        enterprise_name: decryptedInfo.enterpriseInfo?.enterpriseName,
        unified_social_credit_code: decryptedInfo.enterpriseInfo?.unifiedSocialCreditCode,
        legal_representative: decryptedInfo.enterpriseInfo?.legalRepresentative,
        headquarters_location: decryptedInfo.enterpriseInfo?.headquartersLocation,
        registered_capital_usd: decryptedInfo.enterpriseInfo?.registeredCapitalUsd,
        website: decryptedInfo.enterpriseInfo?.website,
        enterprise_overview: decryptedInfo.enterpriseInfo?.enterpriseOverview,
        // 企业额外信息
        registration_year: decryptedInfo.enterpriseInfo?.registrationYear,
        enterprise_phone: decryptedInfo.enterpriseInfo?.phone,
        coreMembers: decryptedCoreMembers,
        documents,
        images: teamImages,
        reviewCompletionStatus,
        reviewStatus
      };
    }));

    return NextResponse.json({
      success: true,
      teams: teamsWithReviewStatus
    });

  } catch (error) {
    console.error('Failed to fetch teams:', error);
    return NextResponse.json(
      { error: '获取团队列表失败' },
      { status: 500 }
    );
  }
}
