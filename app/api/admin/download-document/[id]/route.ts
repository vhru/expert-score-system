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
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { dbOperations } = await import('@/lib/database-adapter');
    
    // 获取文档信息
    const document = await dbOperations.teamDocuments.findById(parseInt(params.id));
    
    if (!document) {
      return NextResponse.json({ error: '文档不存在' }, { status: 404 });
    }

    // 读取文件
    const filePath = path.join(process.cwd(), document.document_path);
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
    console.error('Download document error:', error);
    return NextResponse.json(
      { error: '下载失败' },
      { status: 500 }
    );
  }
}
