import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { readFile } from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证专家权限
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'expert') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const fileId = parseInt(params.id);
    if (isNaN(fileId)) {
      return NextResponse.json({ error: '无效的文件ID' }, { status: 400 });
    }

    const { dbOperations } = await import('@/lib/database-adapter');
    
    // 检查专家是否有权限查看此文件
    const assignment = await dbOperations.assignments.findByExpertAndFile(user.id, fileId);
    if (!assignment) {
      return NextResponse.json({ error: '您没有权限查看此文件' }, { status: 403 });
    }

    // 获取文件信息
    const file = await dbOperations.files.findById(fileId);
    if (!file) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    // 检查文件类型是否为PDF
    if (file.mime_type !== 'application/pdf') {
      return NextResponse.json({ error: '只能查看PDF文件' }, { status: 400 });
    }

    // 读取PDF文件
    try {
      const pdfBuffer = await readFile(file.file_path);
      
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': pdfBuffer.length.toString(),
          'Content-Disposition': `inline; filename="${file.original_name}"`,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (fileError) {
      console.error('Failed to read PDF file:', fileError);
      return NextResponse.json({ error: 'PDF文件读取失败' }, { status: 500 });
    }

  } catch (error) {
    console.error('Failed to get PDF file:', error);
    return NextResponse.json(
      { error: '获取PDF文件失败' },
      { status: 500 }
    );
  }
}
