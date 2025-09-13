import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { encryptData } from '@/lib/encryption';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const teamInfoStr = formData.get('teamInfo') as string;
    
    if (!teamInfoStr) {
      return NextResponse.json({ error: '团队信息不能为空' }, { status: 400 });
    }
    
    const teamInfo = JSON.parse(teamInfoStr);
    const { teamName, contactPerson, contactPhone, contactEmail, teamDescription, password, isEnterprise, enterpriseName, enterpriseLicense } = teamInfo;

    // 输入验证
    if (!teamName || !teamName.trim()) {
      return NextResponse.json({ error: '团队名称不能为空' }, { status: 400 });
    }

    if (!contactEmail || !contactEmail.trim()) {
      return NextResponse.json({ error: '联系邮箱不能为空' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: '密码长度至少6位' }, { status: 400 });
    }

    // 企业团队验证
    if (isEnterprise && (!enterpriseName || !enterpriseName.trim())) {
      return NextResponse.json({ error: '企业团队必须填写企业名称' }, { status: 400 });
    }

    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
    }

    // 清理输入数据
    const sanitizedData = {
      teamName: teamName.trim().substring(0, 100),
      contactPerson: contactPerson ? contactPerson.trim().substring(0, 50) : '',
      contactPhone: contactPhone ? contactPhone.trim().substring(0, 20) : '',
      contactEmail: contactEmail.trim().substring(0, 100),
      teamDescription: teamDescription ? teamDescription.trim().substring(0, 1000) : '',
      isEnterprise: Boolean(isEnterprise),
      enterpriseName: enterpriseName ? enterpriseName.trim().substring(0, 100) : '',
      enterpriseLicense: enterpriseLicense ? enterpriseLicense.trim().substring(0, 100) : ''
    };

    const { dbOperations } = await import('@/lib/database-adapter');
    
    // 检查团队名称是否已存在
    const existingTeam = await dbOperations.teams.findByName(sanitizedData.teamName);
    if (existingTeam) {
      return NextResponse.json({ error: '团队名称已存在' }, { status: 400 });
    }

    // 检查邮箱是否已注册
    const existingEmail = await dbOperations.teams.findByEmail(sanitizedData.contactEmail);
    if (existingEmail) {
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 400 });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 加密团队信息
    const encryptedInfo = encryptData(JSON.stringify(sanitizedData));

    // 创建团队账号
    const result = await dbOperations.teams.create(
      sanitizedData.teamName,
      hashedPassword,
      sanitizedData.contactEmail,
      encryptedInfo,
      sanitizedData.isEnterprise,
      sanitizedData.enterpriseName,
      sanitizedData.enterpriseLicense
    );

    if (result.changes > 0) {
      const teamId = result.lastInsertRowid;
      
      // 处理图片上传
      const imageResults = [];
      for (let i = 0; i < 5; i++) {
        const imageFile = formData.get(`image_${i}`) as File;
        if (imageFile) {
          try {
            // 创建上传目录
            const uploadDir = path.join(process.env.UPLOAD_DIR || './uploads', 'team-images');
            await mkdir(uploadDir, { recursive: true });
            
            // 生成唯一文件名
            const fileExtension = path.extname(imageFile.name);
            const fileName = `${teamId}_${Date.now()}_${i}${fileExtension}`;
            const filePath = path.join(uploadDir, fileName);
            
            // 保存文件
            const bytes = await imageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(filePath, buffer);
            
            // 保存到数据库
            const imageResult = await dbOperations.teamImages.create(
              teamId,
              imageFile.name,
              filePath,
              imageFile.size,
              imageFile.type,
              encryptData(JSON.stringify({
                originalName: imageFile.name,
                uploadedAt: new Date().toISOString()
              }))
            );
            
            imageResults.push(imageResult);
          } catch (error) {
            console.error(`Failed to save image ${i}:`, error);
          }
        }
      }
      
      return NextResponse.json({
        success: true,
        message: '团队注册成功',
        teamId: teamId,
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
