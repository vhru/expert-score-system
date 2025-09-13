import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { encryptData } from '@/lib/encryption';
import { saveFileToDatabase } from '@/lib/fileUpload';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    // 验证用户权限
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: '无效的访问令牌' }, { status: 401 });
    }

    const formData = await request.formData();
    const photo = formData.get('photo') as File;
    const personalInfo = formData.get('personalInfo') as string;

    if (!photo) {
      return NextResponse.json({ error: '请选择照片' }, { status: 400 });
    }

    // 检查文件大小（10MB限制）
    if (photo.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '文件大小不能超过10MB' }, { status: 400 });
    }

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(photo.type)) {
      return NextResponse.json({ error: '只支持JPG、PNG、GIF格式的图片' }, { status: 400 });
    }

    // 创建上传目录
    const uploadDir = path.join(process.cwd(), 'uploads', 'photos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = path.extname(photo.name);
    const fileName = `${timestamp}_${randomString}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // 保存文件
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);

    // 加密个人信息
    const encryptedInfo = personalInfo ? encryptData(personalInfo) : null;

    // 保存到数据库
    const fileId = await saveFileToDatabase(
      photo.name,
      filePath,
      photo.size,
      photo.type,
      encryptedInfo,
      'photo_upload'
    );

    return NextResponse.json({
      success: true,
      message: '照片上传成功',
      fileId: fileId
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { error: '照片上传失败' },
      { status: 500 }
    );
  }
}
