import { NextRequest, NextResponse } from 'next/server';
import { saveFileToDatabase } from '@/lib/fileUpload';
import { encryptData } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const teamInfoStr = formData.get('teamInfo') as string;

    if (!file) {
      return NextResponse.json({ error: '未选择文件' }, { status: 400 });
    }

    if (!teamInfoStr) {
      return NextResponse.json({ error: '团队信息不能为空' }, { status: 400 });
    }

    let teamInfo;
    try {
      teamInfo = JSON.parse(teamInfoStr);
    } catch (error) {
      return NextResponse.json({ error: '团队信息格式错误' }, { status: 400 });
    }

    // 输入验证和清理
    if (!teamInfo.teamName || !teamInfo.teamName.trim()) {
      return NextResponse.json({ error: '团队名称不能为空' }, { status: 400 });
    }

    // 清理和验证输入数据
    const sanitizedTeamInfo = {
      teamName: teamInfo.teamName.trim().substring(0, 100), // 限制长度
      contactPerson: teamInfo.contactPerson ? teamInfo.contactPerson.trim().substring(0, 50) : '',
      contactPhone: teamInfo.contactPhone ? teamInfo.contactPhone.trim().substring(0, 20) : '',
      contactEmail: teamInfo.contactEmail ? teamInfo.contactEmail.trim().substring(0, 100) : '',
      teamDescription: teamInfo.teamDescription ? teamInfo.teamDescription.trim().substring(0, 1000) : ''
    };

    // 验证邮箱格式
    if (sanitizedTeamInfo.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedTeamInfo.contactEmail)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
    }

    // 验证手机号格式
    if (sanitizedTeamInfo.contactPhone && !/^1[3-9]\d{9}$/.test(sanitizedTeamInfo.contactPhone)) {
      return NextResponse.json({ error: '手机号格式不正确' }, { status: 400 });
    }

    // 检查文件类型 - 只允许PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: '只支持PDF格式文件' }, { status: 400 });
    }

    // 检查文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '文件大小不能超过10MB' }, { status: 400 });
    }

    // 创建临时文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // 生成唯一文件名
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
    
    // 保存文件到本地
    const fs = require('fs');
    const path = require('path');
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    // 加密团队信息
    const encryptedTeamInfo = encryptData(JSON.stringify(sanitizedTeamInfo));

    // 保存到数据库，使用团队名称作为显示名称
    const fileId = await saveFileToDatabase(
      sanitizedTeamInfo.teamName, // 使用清理后的团队名称
      filePath,
      file.size,
      file.type,
      encryptedTeamInfo,
      sanitizedTeamInfo.teamName // 传递清理后的团队名称
    );

    // 更新文件状态为completed
    const { dbOperations } = await import('@/lib/database-adapter');
    await dbOperations.files.updateStatus(fileId, 'completed');

    return NextResponse.json({
      success: true,
      fileId: fileId,
      teamName: teamInfo.teamName,
      message: '团队作品提交成功'
    });

  } catch (error) {
    console.error('Team submit error:', error);
    return NextResponse.json(
      { error: '团队作品提交失败' },
      { status: 500 }
    );
  }
}
