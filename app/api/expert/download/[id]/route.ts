import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getFileById } from '@/lib/fileUpload';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证专家权限
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);
    
    if (!user || user.role !== 'expert') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const fileId = parseInt(params.id);
    if (isNaN(fileId)) {
      return NextResponse.json({ error: '无效的文件ID' }, { status: 400 });
    }

    // 检查专家是否有权限下载这个文件
    const { dbOperations } = await import('@/lib/database-adapter');
    const assignments = await dbOperations.assignments.findByExpert(user.id);
    const hasPermission = assignments.some(assignment => assignment.file_id === fileId);

    if (!hasPermission) {
      return NextResponse.json({ error: '无权限下载此文件' }, { status: 403 });
    }

    // 获取文件信息
    const file = await getFileById(fileId);
    if (!file) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    // 检查文件是否存在
    if (!fs.existsSync(file.file_path)) {
      return NextResponse.json({ error: '文件已丢失' }, { status: 404 });
    }

    // 读取文件
    const fileBuffer = fs.readFileSync(file.file_path);
    
    // 设置响应头
    const headers = new Headers();
    headers.set('Content-Type', file.mime_type);
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
    headers.set('Content-Length', fileBuffer.length.toString());

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error('Failed to download file:', error);
    return NextResponse.json(
      { error: '文件下载失败' },
      { status: 500 }
    );
  }
}
