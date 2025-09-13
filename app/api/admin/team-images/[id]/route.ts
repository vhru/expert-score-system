import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const imageId = parseInt(params.id);
    if (isNaN(imageId)) {
      return NextResponse.json({ error: '无效的图片ID' }, { status: 400 });
    }

    const { dbOperations } = await import('@/lib/simple-sqlite');
    
    // 获取图片信息
    const image = await dbOperations.teamImages.findById(imageId);
    if (!image) {
      return NextResponse.json({ error: '图片不存在' }, { status: 404 });
    }

    // 读取图片文件
    try {
      const imageBuffer = await readFile(image.image_path);
      
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': image.mime_type,
          'Content-Length': imageBuffer.length.toString(),
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (fileError) {
      console.error('Failed to read image file:', fileError);
      return NextResponse.json({ error: '图片文件读取失败' }, { status: 500 });
    }

  } catch (error) {
    console.error('Failed to get team image:', error);
    return NextResponse.json(
      { error: '获取图片失败' },
      { status: 500 }
    );
  }
}
