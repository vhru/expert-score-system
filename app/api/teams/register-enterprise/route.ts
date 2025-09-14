import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/database-adapter';
import { encryptData } from '@/lib/encryption';
import bcrypt from 'bcryptjs';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // 解析基本信息
    const basicInfoStr = formData.get('basicInfo') as string;
    const enterpriseInfoStr = formData.get('enterpriseInfo') as string;
    const contactInfoStr = formData.get('contactInfo') as string;
    const coreMembersStr = formData.get('coreMembers') as string;
    
    if (!basicInfoStr || !enterpriseInfoStr || !contactInfoStr || !coreMembersStr) {
      return NextResponse.json({ error: '缺少必要信息' }, { status: 400 });
    }

    const basicInfo = JSON.parse(basicInfoStr);
    const enterpriseInfo = JSON.parse(enterpriseInfoStr);
    const contactInfo = JSON.parse(contactInfoStr);
    const coreMembers = JSON.parse(coreMembersStr);

    // 验证密码
    if (basicInfo.password !== basicInfo.confirmPassword) {
      return NextResponse.json({ error: '密码确认不匹配' }, { status: 400 });
    }

    if (basicInfo.password.length < 6) {
      return NextResponse.json({ error: '密码长度至少6位' }, { status: 400 });
    }

    // 验证必填字段
    if (!basicInfo.projectName || !enterpriseInfo.enterpriseName || !contactInfo.contactPersonEmail) {
      return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 });
    }

    // 验证核心成员数量
    if (coreMembers.length < 3 || coreMembers.length > 6) {
      return NextResponse.json({ error: '核心成员数量必须在3-6人之间' }, { status: 400 });
    }

    // 验证所有核心成员信息 - 只检查最基本的必填项
    for (let i = 0; i < coreMembers.length; i++) {
      const member = coreMembers[i];
      if (!member.name || !member.email) {
        return NextResponse.json({ error: `成员${i + 1}信息不完整` }, { status: 400 });
      }
    }

    // 检查邮箱是否已存在
    const existingTeam = await dbOperations.teams.findByEmail(contactInfo.contactPersonEmail);
    if (existingTeam) {
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 400 });
    }

    // 加密敏感信息
    const encryptedInfo = encryptData(JSON.stringify({
      basicInfo,
      enterpriseInfo,
      contactInfo,
      coreMembers: coreMembers.map((member: any) => ({
        ...member,
        idNumber: encryptData(member.idNumber), // 加密身份证号
        phone: encryptData(member.phone) // 加密电话号码
      }))
    }));

    // 加密密码
    const hashedPassword = await bcrypt.hash(basicInfo.password, 10);

    // 创建团队记录
    const result = await dbOperations.teams.create(
      enterpriseInfo.enterpriseName, // 使用企业名称作为团队名称
      hashedPassword,
      contactInfo.contactPersonEmail,
      encryptedInfo,
      true, // is_enterprise = true
      enterpriseInfo.enterpriseName,
      enterpriseInfo.unifiedSocialCreditCode,
      basicInfo.projectStage, // 项目阶段
      basicInfo.projectStageOthers, // 其他项目阶段说明
      basicInfo.nationalityType, // 国籍类型
      JSON.stringify(basicInfo.selectedCountries), // 选择的国家（JSON格式）
      basicInfo.nationalityOthers // 其他国籍说明
    );

    if (result.changes > 0 || result.affectedRows > 0) {
      const teamId = result.lastInsertRowid || result.insertId;

      // 保存核心成员信息
      for (let i = 0; i < coreMembers.length; i++) {
        const member = coreMembers[i];
        await dbOperations.coreMembers.create(
          teamId,
          i + 1,
          member.name,
          member.nationality,
          member.gender,
          member.birthDate,
          member.idType,
          encryptData(member.idNumber), // 加密身份证号
          encryptData(member.phone), // 加密电话号码
          member.email,
          member.university,
          member.highestDegree,
          member.organization,
          member.position
        );

        // 保存成员CV
        const cvFile = formData.get(`memberCv_${i}`) as File;
        if (cvFile) {
          try {
            const uploadDir = path.join(process.env.UPLOAD_DIR || './uploads', 'member-cvs');
            await mkdir(uploadDir, { recursive: true });
            const fileExtension = path.extname(cvFile.name);
            const fileName = `${teamId}_member_${i + 1}_${Date.now()}${fileExtension}`;
            const filePath = path.join(uploadDir, fileName);
            const bytes = await cvFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(filePath, buffer);

            // 更新成员记录中的CV路径
            await dbOperations.coreMembers.updateCvPath(teamId, i + 1, filePath);
          } catch (error) {
            console.error(`Failed to save CV for member ${i + 1}:`, error);
          }
        }
      }

      // 保存文档
      const documentTypes = [
        'businessLicense',
        'commitmentLetter', 
        'businessPlan',
        'presentation',
        'supplementaryMaterials'
      ];

      const documentResults = [];
      for (const docType of documentTypes) {
        const file = formData.get(docType) as File;
        if (file) {
          try {
            const uploadDir = path.join(process.env.UPLOAD_DIR || './uploads', 'team-documents');
            await mkdir(uploadDir, { recursive: true });
            const fileExtension = path.extname(file.name);
            const fileName = `${teamId}_${docType}_${Date.now()}${fileExtension}`;
            const filePath = path.join(uploadDir, fileName);
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(filePath, buffer);

            const docResult = await dbOperations.teamDocuments.create(
              teamId,
              docType,
              filePath,
              file.size,
              file.name,
              file.type
            );
            documentResults.push(docResult);
          } catch (error) {
            console.error(`Failed to save document ${docType}:`, error);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: '企业注册成功',
        teamId: teamId,
        documentsUploaded: documentResults.length
      });
    } else {
      return NextResponse.json({ error: '注册失败' }, { status: 500 });
    }
  } catch (error) {
    console.error('Enterprise registration error:', error);
    return NextResponse.json(
      { error: '企业注册失败' },
      { status: 500 }
    );
  }
}
