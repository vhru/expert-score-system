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
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'expert_review_jwt_secret_2024_production') as any;
    } catch (error) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 });
    }

    if (!decoded || decoded.role !== 'team') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { dbOperations } = await import('@/lib/database-adapter');
    
    // 获取团队信息
    const team = await dbOperations.teams.findById(decoded.id);
    if (!team) {
      return NextResponse.json({ error: '团队不存在' }, { status: 404 });
    }

    // 检查团队是否已通过审核 - 已审核团队不能更新任何文档
    if (team.audit_status === 'approved') {
      return NextResponse.json({ error: '团队已通过审核，无法更新文档' }, { status: 403 });
    }

    // 先解析formData（只能解析一次）
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;

    // 获取原文档信息（如果存在）
    const originalDocument = await dbOperations.teamDocuments.findById(parseInt(params.id));
    
    // 如果文档不存在，说明是创建新文档
    if (!originalDocument) {
      // 创建新文档的逻辑

      if (!file) {
        return NextResponse.json({ error: '未选择文件' }, { status: 400 });
      }

      if (!documentType) {
        return NextResponse.json({ error: '未指定文档类型' }, { status: 400 });
      }

      // 检查文件类型
      if (file.type !== 'application/pdf') {
        return NextResponse.json({ error: '只支持PDF格式文件' }, { status: 400 });
      }

      // 检查文件大小 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: '文件大小不能超过10MB' }, { status: 400 });
      }

      // 构建团队文件夹路径
      const safeTeamName = team.team_name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_');
      const safeContactEmail = team.contact_email.replace(/[^a-zA-Z0-9@.-]/g, '_');
      const teamType = team.is_enterprise ? 'enterprise' : 'team';
      const teamDir = path.join('/opt/team_data/team_data', `${safeTeamName}_${safeContactEmail}_${teamType}`);
      const documentsDir = path.join(teamDir, 'documents');
      
      // 确保目录存在
      await mkdir(documentsDir, { recursive: true });

      // 生成文件名
      const fileExtension = path.extname(file.name);
      const emailPrefix = team.contact_email.split('@')[0];
      const fileName = `${team.id}_${emailPrefix}_${documentType}_${Date.now()}${fileExtension}`;
      const filePath = path.join(documentsDir, fileName);

      // 保存文件
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // 保存相对路径到数据库
      const relativePath = `uploads/team_data/${safeTeamName}_${safeContactEmail}_${teamType}/documents/${fileName}`;
      
      // 创建团队文档记录
      const docResult = await dbOperations.teamDocuments.create(
        team.id,
        documentType,
        relativePath,
        file.size,
        file.name,
        file.type
      );

      // 同时创建files记录用于评审分配
      const fileResult = await dbOperations.files.create(
        file.name,
        relativePath,
        file.size,
        file.type,
        null, // encryptedInfo
        team.team_name // teamName
      );

      return NextResponse.json({
        success: true,
        message: '文档创建成功',
        document: docResult,
        file: fileResult
      });
    }

    // 验证文档属于当前团队
    if (originalDocument.team_id !== decoded.id) {
      return NextResponse.json({ error: '无权访问此文档' }, { status: 403 });
    }

    // 使用已解析的文件数据
    const newFile = file;

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

    // 构建文件路径 - 修复路径嵌套问题
    let filePath;
    if (originalDocument.document_path.startsWith('uploads/team_data/')) {
      // 数据库中的相对路径，需要转换为绝对路径
      // 从 uploads/team_data/项目名_邮箱_team/documents/文件名 转换为 /opt/team_data/team_data/项目名_邮箱_team/documents/文件名
      const relativePath = originalDocument.document_path.replace('uploads/team_data/', '');
      filePath = path.join('/opt/team_data/team_data', relativePath);
      console.log('🔄 文档路径转换:', originalDocument.document_path, '->', filePath);
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
