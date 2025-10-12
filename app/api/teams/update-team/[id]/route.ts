import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbOperations } from '@/lib/database-adapter';
import { writeFile, mkdir } from 'fs/promises';
import fs from 'fs';
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
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'expert_review_jwt_secret_2024_production') as any;
    } catch (error) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 });
    }

    if (!decoded || decoded.role !== 'team') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const teamId = parseInt(params.id);
    console.log('🔍 团队更新鉴权调试:');
    console.log('   URL参数teamId:', teamId);
    console.log('   Token中的id:', decoded.id);
    console.log('   Token中的role:', decoded.role);
    console.log('   ID匹配:', decoded.id === teamId);
    
    if (decoded.id !== teamId) {
      console.log('❌ 团队ID不匹配，拒绝更新');
      return NextResponse.json({ error: '无权更新此团队信息' }, { status: 403 });
    }

    const formData = await request.formData();
    
    // 解析表单数据
    const basicInfo = JSON.parse(formData.get('basicInfo') as string);
    const contactInfo = JSON.parse(formData.get('contactInfo') as string);
    const coreMembers = JSON.parse(formData.get('coreMembers') as string);

    // 获取现有团队信息
    const existingTeam = await dbOperations.teams.findById(teamId);
    if (!existingTeam) {
      return NextResponse.json({ error: '团队不存在' }, { status: 404 });
    }

    // 解密现有信息
    let existingInfo: any = {};
    try {
      const { decryptData } = await import('@/lib/encryption');
      existingInfo = JSON.parse(decryptData(existingTeam.encrypted_info));
    } catch (error) {
      console.error('解密现有团队信息失败:', error);
    }

    // 合并更新信息
    const updatedInfo = {
      ...existingInfo,
      basicInfo: {
        ...(existingInfo.basicInfo || {}),
        projectName: basicInfo.projectName,
        projectBrief: basicInfo.projectBrief,
        projectStage: basicInfo.projectStage,
        projectStageOthers: basicInfo.projectStageOthers,
        coreMembersNationality: basicInfo.coreMembersNationality,
        nationalityType: basicInfo.nationalityType,
        selectedCountries: basicInfo.selectedCountries,
        nationalityOthers: basicInfo.nationalityOthers
      },
      contactInfo: {
        ...(existingInfo.contactInfo || {}),
        contactPersonName: contactInfo.contactPersonName,
        contactPersonPosition: contactInfo.contactPersonPosition,
        contactPersonPhone: contactInfo.contactPersonPhone,
        contactPersonEmail: contactInfo.contactPersonEmail
      }
    };

    // 加密更新后的信息
    const { encryptData } = await import('@/lib/encryption');
    const encryptedInfo = encryptData(JSON.stringify(updatedInfo));

    console.log('🔍 团队更新调试信息:');
    console.log('   团队ID:', teamId);
    console.log('   团队名称:', existingTeam.team_name);
    console.log('   联系邮箱:', existingTeam.contact_email);
    console.log('   更新前basicInfo:', existingInfo.basicInfo);
    console.log('   更新后basicInfo:', updatedInfo.basicInfo);
    console.log('   国籍类型变化:', existingInfo.basicInfo?.nationalityType, '->', basicInfo.nationalityType);
    console.log('   选择的国家变化:', existingInfo.basicInfo?.selectedCountries, '->', basicInfo.selectedCountries);
    console.log('   加密后的encrypted_info长度:', encryptedInfo.length);

    // 更新团队基本信息（更新team_name、encrypted_info和selected_countries）
    const updateResult = await dbOperations.teams.update(teamId, {
      team_name: basicInfo.projectName, // 项目名称作为团队名称
      encrypted_info: encryptedInfo,
      selected_countries: JSON.stringify(basicInfo.selectedCountries || []), // 单独更新selected_countries字段
      nationality_type: basicInfo.nationalityType || 'single' // 同时更新国籍类型
    });
    
    console.log('   数据库更新结果:', updateResult);

    // 更新核心成员信息
    await dbOperations.coreMembers.deleteByTeam(teamId);
    if (coreMembers && Array.isArray(coreMembers)) {
      for (let i = 0; i < coreMembers.length; i++) {
      const member = coreMembers[i];
      // 注意：这里需要根据数据库类型调用不同的方法
      // 由于数据库适配器的方法签名不统一，我们需要直接调用
      // 使用与数据库适配器一致的判断逻辑
      const useMySQL = process.env.NODE_ENV === 'production' 
        ? process.env.DB_TYPE !== 'sqlite'
        : !!(process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD);
      
      if (useMySQL) {
        // MySQL - 加密敏感字段
        const { encryptData } = await import('@/lib/encryption');
        await dbOperations.coreMembers.create(
          teamId,
          member.name,
          member.position || '',
          member.nationality || '',
          member.idType || 'id_card',
          member.idNumber ? encryptData(member.idNumber) : '', // 加密身份证号
          undefined, // cvPath
          i + 1, // memberOrder
          member.gender || '',
          member.birthDate || '',
          member.phone ? encryptData(member.phone) : '', // 加密电话号码
          member.email || '', // 邮箱通常不需要加密
          member.university || '',
          member.highestDegree || '',
          member.organization || ''
        );
      } else {
        // SQLite - 需要更多参数，也要加密敏感字段
        const sqliteDb = await import('@/lib/simple-sqlite');
        const { encryptData } = await import('@/lib/encryption');
        await sqliteDb.dbOperations.coreMembers.create(
          teamId,
          i + 1, // memberOrder - 现在是第2个参数
          member.name,
          member.position || '',
          member.nationality || '',
          member.idType || 'id_card',
          member.idNumber ? encryptData(member.idNumber) : '', // 加密身份证号
          undefined, // cvPath
          member.gender || '',
          member.birthDate || '',
          member.phone ? encryptData(member.phone) : '', // 加密电话号码
          member.email || '', // 邮箱通常不需要加密
          member.university || '',
          member.highestDegree || '',
          member.organization || ''
        );
      }
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
        
        // 保存新文档 - 使用团队目录结构
        const currentTeam = await dbOperations.teams.findById(teamId);
        const teamName = currentTeam?.team_name || `team_${teamId}`;
        const safeTeamName = teamName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_');
        const safeContactEmail = contactInfo.contactPersonEmail.replace(/[^a-zA-Z0-9@.-]/g, '_');
        const teamDir = path.join('/opt/team_data/team_data', `${safeTeamName}_${safeContactEmail}_team`);
        const documentsDir = path.join(teamDir, 'documents');
        await mkdir(documentsDir, { recursive: true });
        const fileExtension = path.extname(file.name);
        const emailPrefix = contactInfo.contactPersonEmail.split('@')[0];
        const fileName = `${teamId}_${emailPrefix}_${docType}_${Date.now()}${fileExtension}`;
        const filePath = path.join(documentsDir, fileName);
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
    if (coreMembers && Array.isArray(coreMembers)) {
      coreMembers.forEach(async (member: any, index: number) => {
        const cvFile = formData.get(`memberCv_${index}`) as File;
        if (cvFile) {
          // 这里可以添加CV文件处理逻辑
          // 暂时跳过，因为CV不是必需的文档类型
        }
      });
    }

    // 生成更新的Excel文件
    try {
      const XLSX = await import('xlsx');
      
      // 获取团队信息用于Excel生成
      const currentTeam = await dbOperations.teams.findById(teamId);
      const teamName = currentTeam?.team_name || `team_${teamId}`;
      const safeTeamName = teamName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_');
      const safeContactEmail = contactInfo.contactPersonEmail.replace(/[^a-zA-Z0-9@.-]/g, '_');
      
      // 创建工作簿
      const workbook = XLSX.utils.book_new();
      
      // 团队信息数据
      const teamInfoData = [
        // 1. 参赛项目信息
        ['=== 1. 参赛项目信息 ===', ''],
        ['项目名称', basicInfo.projectName || ''],
        ['核心成员国籍', basicInfo.coreMembersNationality || ''],
        ['国籍类型', basicInfo.nationalityType === 'single' ? '单一国家' : '多国'],
        ['选择的国家', basicInfo.selectedCountries?.map(country => {
          const countryMap = {
            'china': '中国',
            'thailand': '泰国',
            'cambodia': '柬埔寨',
            'vietnam': '越南',
            'laos': '老挝',
            'myanmar': '缅甸'
          };
          return countryMap[country] || country;
        }).join(', ') || ''],
        ['其他国籍', basicInfo.nationalityOthers || ''],
        ['项目简介', basicInfo.projectBrief || ''],
        ['项目阶段', basicInfo.projectStage || ''],
        ['项目阶段其他', basicInfo.projectStageOthers || ''],
        ['', ''],
        // 2. 联系人信息
        ['=== 2. 联系人信息 ===', ''],
        ['联系人姓名', contactInfo.contactPersonName || ''],
        ['联系人职务', contactInfo.contactPersonPosition || ''],
        ['联系电话', contactInfo.contactPersonPhone || ''],
        ['联系邮箱', contactInfo.contactPersonEmail || ''],
        ['', ''],
        // 3. 核心成员信息
        ['=== 3. 核心成员信息 ===', ''],
        ['姓名', '国籍', '性别', '出生日期', '证件类型', '证件号码', '电话', '电子邮箱', '毕业院校', '学历', '组织', '职位']
      ];
      
      // 添加核心成员数据（解密后）
      const { decryptData } = await import('@/lib/encryption');
      coreMembers.forEach((member: any) => {
        teamInfoData.push([
          member.name || '',
          member.nationality || '',
          member.gender || '',
          member.birthDate || '',
          member.idType || '',
          member.idNumber ? decryptData(member.idNumber) : '', // 解密身份证号
          member.phone ? decryptData(member.phone) : '', // 解密电话号码
          member.email || '',
          member.university || '',
          member.highestDegree || '',
          member.organization || '',
          member.position || ''
        ]);
      });
      
      // 创建工作表
      const teamSheet = XLSX.utils.aoa_to_sheet(teamInfoData);
      XLSX.utils.book_append_sheet(workbook, teamSheet, '团队信息');
      
      // 保存Excel文件到documents文件夹
      const teamDir = path.join('/opt/team_data/team_data', `${safeTeamName}_${safeContactEmail}_team`);
      const documentsDir = path.join(teamDir, 'documents');
      await mkdir(documentsDir, { recursive: true });
      
      const excelFileName = `${teamId}_${contactInfo.contactPersonEmail.split('@')[0]}_team_info_${Date.now()}.xlsx`;
      const excelFilePath = path.join(documentsDir, excelFileName);
      
      // 生成Excel文件
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      await writeFile(excelFilePath, excelBuffer);
      
      console.log(`📊 更新Excel信息保存成功: ${excelFilePath}`);
      console.log(`📊 Excel文件大小: ${excelBuffer.length} bytes`);
      console.log(`📊 Excel文件是否存在: ${fs.existsSync(excelFilePath)}`);
      
      // 删除旧的Excel文件记录
      await dbOperations.teamDocuments.deleteByTeamAndType(teamId, 'teamInfo');
      
      // 将新Excel文件保存到数据库
      const relativeExcelPath = `uploads/team_data/${safeTeamName}_${safeContactEmail}_team/documents/${excelFileName}`;
      await dbOperations.teamDocuments.create(
        teamId,
        'teamInfo',
        relativeExcelPath,
        excelBuffer.length,
        excelFileName,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    } catch (error) {
      console.error('❌ 更新Excel信息失败:', error);
    }

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
