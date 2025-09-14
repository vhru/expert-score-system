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
    const contactInfoStr = formData.get('contactInfo') as string;
    const coreMembersStr = formData.get('coreMembers') as string;
    
    if (!basicInfoStr || !contactInfoStr || !coreMembersStr) {
      return NextResponse.json({ error: '缺少必要信息' }, { status: 400 });
    }

    const basicInfo = JSON.parse(basicInfoStr);
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
    if (!basicInfo.projectName || !contactInfo.contactPersonEmail) {
      return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 });
    }

    // 验证核心成员数量
    if (coreMembers.length < 2 || coreMembers.length > 6) {
      return NextResponse.json({ error: '核心成员数量必须在2-6人之间' }, { status: 400 });
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
      basicInfo.projectName, // 使用项目名称作为团队名称
      hashedPassword,
      contactInfo.contactPersonEmail,
      encryptedInfo,
      false, // is_enterprise = false
      '', // 企业名称为空
      '', // 企业许可证为空
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
        'commitmentLetter', 
        'technicalInfoChinese',
        'technicalInfoEnglish',
        'presentation',
        'supplementaryMaterials'
      ];

      const documentResults = [];
      console.log('📁 开始处理文档上传...');
      for (const docType of documentTypes) {
        const file = formData.get(docType) as File;
        if (file) {
          console.log(`📄 处理文档: ${docType}, 文件名: ${file.name}, 大小: ${file.size}`);
          try {
            // 为每个团队创建单独的子文件夹
            const teamDir = path.join(process.env.UPLOAD_DIR || './uploads', 'team-documents', `team_${teamId}`);
            await mkdir(teamDir, { recursive: true });
            const fileExtension = path.extname(file.name);
            // 文件名包含团队ID、文档类型、邮箱前缀和时间戳
            const emailPrefix = contactInfo.contactPersonEmail.split('@')[0];
            const fileName = `${teamId}_${emailPrefix}_${docType}_${Date.now()}${fileExtension}`;
            const filePath = path.join(teamDir, fileName);
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(filePath, buffer);

            console.log(`💾 文件保存成功: ${filePath}`);

            const docResult = await dbOperations.teamDocuments.create(
              teamId,
              docType,
              filePath,
              file.size,
              file.name,
              file.type
            );
            console.log(`🗄️ 数据库记录创建成功:`, docResult);
            documentResults.push(docResult);
          } catch (error) {
            console.error(`❌ 保存文档失败 ${docType}:`, error);
          }
        } else {
          console.log(`⚠️ 未找到文档: ${docType}`);
        }
      }
      console.log(`✅ 文档处理完成，共处理 ${documentResults.length} 个文档`);

      // 处理表单中的图片文件（成员证件照、CV等）
      const imageResults = [];
      console.log('🖼️ 开始处理表单中的图片文件...');
      
      // 收集所有图片文件
      const imageFiles: { file: File; type: string; memberIndex?: number }[] = [];
      
      // 1. 核心成员证件照
      coreMembers.forEach((member, index) => {
        if (member.idPhoto) {
          imageFiles.push({ file: member.idPhoto, type: 'idPhoto', memberIndex: index });
        }
        if (member.cv) {
          imageFiles.push({ file: member.cv, type: 'cv', memberIndex: index });
        }
      });
      
      // 2. 处理收集到的图片
      for (const { file, type, memberIndex } of imageFiles) {
        console.log(`📷 处理图片: ${type}_${memberIndex}, 文件名: ${file.name}, 大小: ${file.size}`);
        try {
          // 为每个团队创建单独的子文件夹
          const teamDir = path.join(process.env.UPLOAD_DIR || './uploads', 'team-images', `team_${teamId}`);
          await mkdir(teamDir, { recursive: true });
          const fileExtension = path.extname(file.name);
          // 文件名包含团队ID、邮箱前缀、类型和成员索引
          const emailPrefix = contactInfo.contactPersonEmail.split('@')[0];
          const fileName = `${teamId}_${emailPrefix}_${type}_${memberIndex}_${Date.now()}${fileExtension}`;
          const filePath = path.join(teamDir, fileName);
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          await writeFile(filePath, buffer);

          console.log(`💾 图片保存成功: ${filePath}`);

          const imageResult = await dbOperations.teamImages.create(
            teamId,
            file.name,
            filePath,
            file.size
          );
          console.log(`🗄️ 图片数据库记录创建成功:`, imageResult);
          imageResults.push(imageResult);
        } catch (error) {
          console.error(`❌ 保存图片失败 ${type}_${memberIndex}:`, error);
        }
      }
      console.log(`✅ 图片处理完成，共处理 ${imageResults.length} 个图片`);

      // 保存团队表单信息到Excel文件
      console.log('📊 开始保存团队表单信息到Excel...');
      try {
        const teamDir = path.join(process.env.UPLOAD_DIR || './uploads', 'team-documents', `team_${teamId}`);
        await mkdir(teamDir, { recursive: true });
        
        // 创建Excel数据
        const excelData = {
          teamInfo: {
            projectName: basicInfo.projectName,
            projectBrief: basicInfo.projectBrief,
            projectStage: basicInfo.projectStage,
            projectStageOthers: basicInfo.projectStageOthers,
            coreMembersNationality: basicInfo.coreMembersNationality,
            nationalityType: basicInfo.nationalityType,
            selectedCountries: basicInfo.selectedCountries,
            nationalityOthers: basicInfo.nationalityOthers,
            teamType: 'team'
          },
          contactInfo: contactInfo,
          coreMembers: coreMembers.map((member, index) => ({
            memberIndex: index + 1,
            name: member.name,
            nationality: member.nationality,
            gender: member.gender,
            birthDate: member.birthDate,
            idType: member.idType,
            idNumber: member.idNumber,
            phone: member.phone,
            email: member.email,
            university: member.university,
            highestDegree: member.highestDegree,
            organization: member.organization,
            position: member.position
          })),
          documents: documentResults.map(doc => ({
            type: doc.document_type,
            name: doc.document_name,
            size: doc.file_size,
            path: doc.document_path
          })),
          images: imageResults.map(img => ({
            name: img.image_name,
            size: img.image_size,
            path: img.image_path
          })),
          registrationTime: new Date().toISOString()
        };
        
        const excelFileName = `${teamId}_${contactInfo.contactPersonEmail.split('@')[0]}_team_info_${Date.now()}.json`;
        const excelFilePath = path.join(teamDir, excelFileName);
        await writeFile(excelFilePath, JSON.stringify(excelData, null, 2));
        
        console.log(`📊 Excel信息保存成功: ${excelFilePath}`);
      } catch (error) {
        console.error('❌ 保存Excel信息失败:', error);
      }

      return NextResponse.json({
        success: true,
        message: '团队注册成功',
        teamId: teamId,
        documentsUploaded: documentResults.length,
        imagesUploaded: imageResults.length
      });
    } else {
      return NextResponse.json({ error: '注册失败' }, { status: 500 });
    }
  } catch (error) {
    console.error('Team registration error:', error);
    return NextResponse.json(
      { error: '团队注册失败' },
      { status: 500 }
    );
  }
}
