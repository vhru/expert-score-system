import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(
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
    
    // 获取原文档信息
    const originalDocument = await dbOperations.teamDocuments.findById(parseInt(params.id));
    
    if (!originalDocument) {
      return NextResponse.json({ error: '文档不存在' }, { status: 404 });
    }

    // 验证文档属于当前团队
    if (originalDocument.team_id !== decoded.id) {
      return NextResponse.json({ error: '无权访问此文档' }, { status: 403 });
    }

    // 获取新文件
    const formData = await request.formData();
    const newFile = formData.get('file') as File;

    if (!newFile) {
      return NextResponse.json({ error: '未选择文件' }, { status: 400 });
    }

    // 检查文件类型
    if (newFile.type !== 'application/pdf') {
      return NextResponse.json({ error: '只支持PDF格式文件' }, { status: 400 });
    }

    // 检查文件大小 (10MB)
    if (newFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '文件大小不能超过10MB' }, { status: 400 });
    }

    // 构建文件路径 - 保持原有路径结构
    let filePath;
    if (originalDocument.document_path.startsWith('uploads/')) {
      // 相对路径，直接拼接
      filePath = path.join(process.cwd(), originalDocument.document_path);
    } else if (path.isAbsolute(originalDocument.document_path)) {
      // 绝对路径，直接使用
      filePath = originalDocument.document_path;
    } else {
      // 其他情况，尝试直接拼接
      filePath = path.join('/opt/team_data/team_data', originalDocument.document_path);
    }
    
    // 确保目录存在
    const uploadDir = path.dirname(filePath);
    await mkdir(uploadDir, { recursive: true });

    // 保存新文件
    const bytes = await newFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 更新数据库记录 - 保持原有路径，只更新文件大小和名称
    const updatedDocument = await dbOperations.teamDocuments.update(
      parseInt(params.id),
      originalDocument.document_path, // 保持原有路径
      newFile.size,
      newFile.name,
      newFile.type
    );

    return NextResponse.json({
      success: true,
      message: '文档更新成功',
      document: updatedDocument
    });

  } catch (error) {
    console.error('Update document error:', error);
    return NextResponse.json(
      { error: '更新文档失败' },
      { status: 500 }
    );
  }
}
