import { NextRequest, NextResponse } from 'next/server';
import { saveFileToDatabase } from '@/lib/fileUpload';
import { encryptData } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const personalInfo = formData.get('personalInfo') as string;

    if (!file) {
      return NextResponse.json({ error: '未选择文件' }, { status: 400 });
    }

    // 检查文件类型
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '不支持的文件类型' }, { status: 400 });
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

    // 加密个人信息
    const encryptedInfo = personalInfo ? encryptData(personalInfo) : null;

    // 保存到数据库，状态设为completed
    const fileId = await saveFileToDatabase(
      file.name,
      filePath,
      file.size,
      file.type,
      encryptedInfo
    );

    // 更新文件状态为completed
    const { dbOperations } = await import('@/lib/database-adapter');
    await dbOperations.files.updateStatus(fileId, 'completed');

    return NextResponse.json({
      success: true,
      fileId: fileId,
      message: '作品提交成功'
    });

  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json(
      { error: '作品提交失败' },
      { status: 500 }
    );
  }
}
