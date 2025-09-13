import { NextRequest, NextResponse } from 'next/server';
import { upload, saveFileToDatabase } from '@/lib/fileUpload';
import { encryptData } from '@/lib/encryption';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const personalInfo = formData.get('personalInfo') as string;

    if (!file) {
      return NextResponse.json({ error: '未选择文件' }, { status: 400 });
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

    // 保存到数据库
    const fileId = await saveFileToDatabase(
      file.name,
      filePath,
      file.size,
      file.type,
      encryptedInfo
    );

    return NextResponse.json({
      success: true,
      fileId: fileId,
      message: '文件上传成功'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '文件上传失败' },
      { status: 500 }
    );
  }
}
