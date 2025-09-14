import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbOperations } from '@/lib/database-adapter';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const teamId = parseInt(params.id);
    if (decoded.id !== teamId) {
      return NextResponse.json({ error: '无权更新此团队信息' }, { status: 403 });
    }

    const formData = await request.formData();
    
    // 解析表单数据
    const basicInfo = JSON.parse(formData.get('basicInfo') as string);
    const contactInfo = JSON.parse(formData.get('contactInfo') as string);
    const coreMembers = JSON.parse(formData.get('coreMembers') as string);

    // 更新团队基本信息
    await dbOperations.teams.update(teamId, {
      project_name: basicInfo.projectName,
      project_brief: basicInfo.projectBrief,
      project_stage: basicInfo.projectStage,
      project_stage_others: basicInfo.projectStageOthers,
      core_members_nationality: basicInfo.coreMembersNationality,
      nationality_type: basicInfo.nationalityType,
      selected_countries: JSON.stringify(basicInfo.selectedCountries),
      nationality_others: basicInfo.nationalityOthers,
      contact_person_name: contactInfo.contactPersonName,
      contact_person_position: contactInfo.contactPersonPosition,
      contact_person_phone: contactInfo.contactPersonPhone,
      contact_person_email: contactInfo.contactPersonEmail
    });

    // 更新核心成员信息
    await dbOperations.coreMembers.deleteByTeam(teamId);
    for (let i = 0; i < coreMembers.length; i++) {
      const member = coreMembers[i];
      // 注意：这里需要根据数据库类型调用不同的方法
      // 由于数据库适配器的方法签名不统一，我们需要直接调用
      if (process.env.DATABASE_URL) {
        // MySQL
        await dbOperations.coreMembers.create(
          teamId,
          member.name,
          member.position || '',
          member.nationality || '',
          member.idType || 'id_card',
          member.idNumber || '',
          undefined // cvPath
        );
      } else {
        // SQLite - 需要更多参数
        const { sqliteOperations } = await import('@/lib/simple-sqlite');
        await sqliteOperations.coreMembers.create(
          teamId,
          i + 1, // memberOrder
          member.name,
          member.nationality || '',
          member.gender || '',
          member.birthDate || '',
          member.idType || 'id_card',
          member.idNumber || '',
          member.phone || '',
          member.email || '',
          member.university || '',
          member.highestDegree || '',
          member.organization || '',
          member.position || ''
        );
      }
    }

    // 处理文档更新
    const documentTypes = [
      'commitmentLetter',
      'technicalInfoChinese',
      'technicalInfoEnglish',
      'presentation',
      'supplementaryMaterials'
    ];

    for (const docType of documentTypes) {
      const file = formData.get(docType) as File;
      if (file) {
        // 删除旧文档
        await dbOperations.teamDocuments.deleteByTeamAndType(teamId, docType);
        
        // 保存新文档
        const teamDir = path.join(process.env.UPLOAD_DIR || './uploads', 'team-documents', `team_${teamId}`);
        await mkdir(teamDir, { recursive: true });
        const fileExtension = path.extname(file.name);
        const emailPrefix = contactInfo.contactPersonEmail.split('@')[0];
        const fileName = `${teamId}_${emailPrefix}_${docType}_${Date.now()}${fileExtension}`;
        const filePath = path.join(teamDir, fileName);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        await dbOperations.teamDocuments.create(
          teamId,
          docType,
          filePath,
          file.size,
          file.name,
          file.type
        );
      }
    }

    // 处理成员CV更新
    coreMembers.forEach(async (member: any, index: number) => {
      const cvFile = formData.get(`memberCv_${index}`) as File;
      if (cvFile) {
        // 这里可以添加CV文件处理逻辑
        // 暂时跳过，因为CV不是必需的文档类型
      }
    });

    return NextResponse.json({
      success: true,
      message: '团队信息更新成功'
    });

  } catch (error) {
    console.error('Update team error:', error);
    return NextResponse.json(
      { error: '更新团队信息失败' },
      { status: 500 }
    );
  }
}
