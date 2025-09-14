import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证团队token - 支持URL参数或Header
    let token;
    const authHeader = request.headers.get('authorization');
    const url = new URL(request.url);
    const tokenParam = url.searchParams.get('token');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (tokenParam) {
      token = tokenParam;
    } else {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
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

    // 构建文件路径 - 修复路径问题
    let filePath = image.image_path;
    
    console.log('🖼️ 图片下载调试信息:');
    console.log('   原始路径:', filePath);
    console.log('   图片ID:', image.id);
    console.log('   图片名称:', image.image_name);
    console.log('   团队ID:', image.team_id);
    
    // 如果路径包含 /app/uploads/，替换为 /opt/team_data/team_data/
    if (filePath.includes('/app/uploads/')) {
      filePath = filePath.replace('/app/uploads/', '/opt/team_data/team_data/');
      console.log('   替换/app/uploads/后:', filePath);
    }
    
    // 如果路径包含 /uploads/，替换为 /opt/team_data/team_data/
    if (filePath.includes('/uploads/')) {
      filePath = filePath.replace('/uploads/', '/opt/team_data/team_data/');
      console.log('   替换/uploads/后:', filePath);
    }
    
    // 如果不是绝对路径，使用当前工作目录
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(process.cwd(), filePath);
      console.log('   添加工作目录后:', filePath);
    }
    
    console.log('   最终文件路径:', filePath);
    console.log('   文件是否存在:', fs.existsSync(filePath));
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.log('❌ 文件不存在，返回404');
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }
    
    console.log('✅ 文件存在，开始读取');

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
