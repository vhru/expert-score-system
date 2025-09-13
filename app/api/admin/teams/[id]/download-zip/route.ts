import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbOperations } from '@/lib/database-adapter';
import archiver from 'archiver';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs';

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
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const teamId = parseInt(params.id);
    if (isNaN(teamId)) {
      return NextResponse.json({ error: '无效的团队ID' }, { status: 400 });
    }

    // 获取团队信息
    const team = await dbOperations.teams.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: '团队不存在' }, { status: 404 });
    }

    // 获取团队文档
    const documents = await dbOperations.teamDocuments.findByTeam(teamId);
    if (documents.length === 0) {
      return NextResponse.json({ error: '该团队没有上传任何文档' }, { status: 404 });
    }

    // 解密团队信息
    const { decryptData } = await import('@/lib/encryption');
    const teamInfo = JSON.parse(decryptData(team.encrypted_info));

    // 生成ZIP文件名
    const teamType = team.is_enterprise ? '企业组' : '团队组';
    const safeTeamName = team.team_name.replace(/[^\w\u4e00-\u9fa5]/g, '_');
    const safeContact = team.contact_email.replace(/[^\w@.-]/g, '_');
    const zipFileName = `${safeTeamName}_${safeContact}_${teamType}.zip`;

    // 创建ZIP流
    const archive = archiver('zip', {
      zlib: { level: 9 } // 最高压缩级别
    });

    // 设置响应头
    const headers = new Headers({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(zipFileName)}"`,
      'Cache-Control': 'no-cache'
    });

    // 创建响应流
    const stream = new ReadableStream({
      start(controller) {
        archive.on('data', (chunk) => {
          controller.enqueue(chunk);
        });

        archive.on('end', () => {
          controller.close();
        });

        archive.on('error', (err) => {
          console.error('Archive error:', err);
          controller.error(err);
        });
      }
    });

    // 添加文档到ZIP
    for (const doc of documents) {
      // 处理路径：统一处理为正确的文件路径
      let filePath;
      if (doc.document_path.startsWith('uploads/')) {
        // 相对路径，直接拼接
        filePath = path.join(process.cwd(), doc.document_path);
      } else if (path.isAbsolute(doc.document_path)) {
        // 绝对路径，直接使用
        filePath = doc.document_path;
      } else {
        // 其他情况，尝试直接拼接
        filePath = path.join(process.env.UPLOAD_DIR || './uploads', 'team-documents', doc.document_path);
      }
      
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        console.warn(`文件不存在: ${filePath}`);
        continue;
      }

      // 生成规范的文件名
      const documentTypeMap: { [key: string]: string } = {
        'commitmentLetter': '承诺书',
        'presentation': '项目展示',
        'supplementaryMaterials': '补充材料',
        'technicalInfo': '技术信息',
        'businessLicense': '营业执照',
        'businessPlan': '商业计划书'
      };

      const typeName = documentTypeMap[doc.document_type] || doc.document_type;
      const fileExtension = path.extname(doc.document_name);
      const newFileName = `${typeName}_${doc.id}${fileExtension}`;

      // 添加文件到ZIP
      archive.file(filePath, { name: newFileName });
    }

    // 添加团队信息文件
    const teamInfoContent = `团队信息
================

团队名称: ${team.team_name}
联系邮箱: ${team.contact_email}
团队类型: ${teamType}
注册时间: ${new Date(team.created_at).toLocaleString()}
审核状态: ${team.audit_status || 'pending'}

团队详细信息:
${JSON.stringify(teamInfo, null, 2)}

文档列表:
${documents.map(doc => `- ${documentTypeMap[doc.document_type] || doc.document_type}: ${doc.document_name} (${doc.file_size} bytes)`).join('\n')}
`;

    archive.append(teamInfoContent, { name: '团队信息.txt' });

    // 完成ZIP创建
    archive.finalize();

    return new Response(stream, { headers });

  } catch (error) {
    console.error('ZIP下载错误:', error);
    return NextResponse.json(
      { error: '下载失败' },
      { status: 500 }
    );
  }
}
