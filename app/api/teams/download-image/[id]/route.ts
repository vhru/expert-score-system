import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

export async function GET(
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
    
    // 获取图片信息
    const image = await dbOperations.teamImages.findById(parseInt(params.id));
    
    if (!image) {
      return NextResponse.json({ error: '图片不存在' }, { status: 404 });
    }

    // 验证图片是否属于当前团队
    if (image.team_id !== decoded.id) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    // 构建文件路径
    let filePath;
    if (image.image_path.startsWith('uploads/')) {
      filePath = path.join(process.cwd(), image.image_path);
    } else if (path.isAbsolute(image.image_path)) {
      filePath = image.image_path;
    } else {
      filePath = path.join(process.env.UPLOAD_DIR || './uploads', 'team-images', image.image_path);
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    // 读取文件
    const fileBuffer = fs.readFileSync(filePath);
    
    // 获取文件扩展名来确定MIME类型
    const ext = path.extname(image.image_name).toLowerCase();
    let mimeType = 'image/jpeg'; // 默认
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';

    // 返回图片
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="${encodeURIComponent(image.image_name)}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Download image error:', error);
    return NextResponse.json(
      { error: '下载图片失败' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
