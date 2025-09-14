import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
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

    const { dbOperations } = await import('@/lib/database-adapter');
    
    // 获取原始图片信息
    const originalImage = await dbOperations.teamImages.findById(parseInt(params.id));
    if (!originalImage) {
      return NextResponse.json({ error: '图片不存在' }, { status: 404 });
    }

    // 验证图片是否属于当前团队
    if (originalImage.team_id !== decoded.id) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    // 解析表单数据
    const formData = await request.formData();
    const newImage = formData.get('image') as File;
    
    if (!newImage) {
      return NextResponse.json({ error: '请选择要上传的图片' }, { status: 400 });
    }

    // 检查文件类型
    if (!newImage.type.startsWith('image/')) {
      return NextResponse.json({ error: '只能上传图片文件' }, { status: 400 });
    }

    // 检查文件大小 (5MB)
    if (newImage.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '图片大小不能超过5MB' }, { status: 400 });
    }

    // 构建文件路径 - 保持原有路径结构
    let filePath;
    if (originalImage.image_path.startsWith('uploads/')) {
      // 相对路径，直接拼接
      filePath = path.join(process.cwd(), originalImage.image_path);
    } else if (path.isAbsolute(originalImage.image_path)) {
      // 绝对路径，直接使用
      filePath = originalImage.image_path;
    } else {
      // 其他情况，尝试直接拼接
      filePath = path.join(process.env.UPLOAD_DIR || './uploads', 'team-images', originalImage.image_path);
    }
    
    // 确保目录存在
    const uploadDir = path.dirname(filePath);
    await mkdir(uploadDir, { recursive: true });

    // 保存新图片
    const bytes = await newImage.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 更新数据库记录 - 保持原有路径，只更新文件大小和名称
    const updatedImage = await dbOperations.teamImages.update(
      parseInt(params.id),
      originalImage.image_path, // 保持原有路径
      newImage.size,
      newImage.name
    );

    return NextResponse.json({
      success: true,
      message: '图片更新成功',
      image: updatedImage
    });

  } catch (error) {
    console.error('Update image error:', error);
    return NextResponse.json(
      { error: '更新图片失败' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
