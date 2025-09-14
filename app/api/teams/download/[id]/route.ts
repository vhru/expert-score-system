import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { readFile } from 'fs/promises';
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
    
    // 获取文档信息
    const document = await dbOperations.teamDocuments.findById(parseInt(params.id));
    
    if (!document) {
      return NextResponse.json({ error: '文档不存在' }, { status: 404 });
    }

    // 验证文档属于当前团队
    if (document.team_id !== decoded.id) {
      return NextResponse.json({ error: '无权访问此文档' }, { status: 403 });
    }

    // 读取文件 - 修复路径问题
    let filePath;
    if (document.document_path.startsWith('/')) {
      // 绝对路径
      filePath = document.document_path;
    } else {
      // 相对路径
      filePath = path.join(process.cwd(), document.document_path);
    }
    
    console.log('Downloading file from:', filePath);
    const fileBuffer = await readFile(filePath);

    // 返回文件
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': document.mime_type,
        'Content-Disposition': `attachment; filename="${document.document_name}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: '下载失败' },
      { status: 500 }
    );
  }
}
