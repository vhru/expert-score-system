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
    if (!Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json({ error: '该团队没有上传任何文档' }, { status: 404 });
    }

    // 解密团队信息
    const { decryptData } = await import('@/lib/encryption');
    const teamInfo = JSON.parse(decryptData(team.encrypted_info));

    // 生成ZIP文件名
    const teamTypeSuffix = team.is_enterprise ? '企业组' : '团队组';
    const safeTeamName = team.team_name.replace(/[^\w\u4e00-\u9fa5]/g, '_');
    const safeContact = team.contact_email.replace(/[^\w@.-]/g, '_');
    const zipFileName = `${safeTeamName}_${safeContact}_${teamTypeSuffix}.zip`;

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

    // 直接扫描团队文件夹，不需要数据库查询
    const teamName = team.team_name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_');
    const contactEmail = team.contact_email.replace(/[^a-zA-Z0-9@.-]/g, '_');
    const teamFolder = path.join(process.env.UPLOAD_DIR || './uploads', 'team_data', `${teamName}_${contactEmail}_${teamTypeSuffix}`);
    
    console.log('扫描团队文件夹:', teamFolder);
    
    // 检查团队文件夹是否存在
    if (fs.existsSync(teamFolder)) {
      // 添加文档文件夹中的所有文件
      const documentsFolder = path.join(teamFolder, 'documents');
      if (fs.existsSync(documentsFolder)) {
        const documentFiles = fs.readdirSync(documentsFolder);
        console.log('找到文档文件:', documentFiles);
        
        for (const fileName of documentFiles) {
          const filePath = path.join(documentsFolder, fileName);
          if (fs.statSync(filePath).isFile()) {
            // 生成友好的文件名
            let friendlyName = fileName;
            if (fileName.includes('commitmentLetter')) friendlyName = fileName.replace(/.*commitmentLetter.*/, '承诺书.pdf');
            else if (fileName.includes('technicalInfoChinese')) friendlyName = fileName.replace(/.*technicalInfoChinese.*/, '技术信息_中文.pdf');
            else if (fileName.includes('technicalInfoEnglish')) friendlyName = fileName.replace(/.*technicalInfoEnglish.*/, '技术信息_英文.pdf');
            else if (fileName.includes('presentation')) friendlyName = fileName.replace(/.*presentation.*/, '项目展示.pdf');
            else if (fileName.includes('supplementaryMaterials')) friendlyName = fileName.replace(/.*supplementaryMaterials.*/, '补充材料.pdf');
            else if (fileName.includes('team_info')) friendlyName = fileName.replace(/.*team_info.*/, '团队信息.xlsx');
            
            archive.file(filePath, { name: `documents/${friendlyName}` });
            console.log('添加文档到ZIP:', fileName, '->', friendlyName);
          }
        }
      }
      
      // 添加图片文件夹中的所有文件
      const imagesFolder = path.join(teamFolder, 'images');
      if (fs.existsSync(imagesFolder)) {
        const imageFiles = fs.readdirSync(imagesFolder);
        console.log('找到图片文件:', imageFiles);
        
        for (const fileName of imageFiles) {
          const filePath = path.join(imagesFolder, fileName);
          if (fs.statSync(filePath).isFile()) {
            // 生成友好的文件名
            let friendlyName = fileName;
            if (fileName.includes('idPhoto')) {
              const match = fileName.match(/idPhoto_(\d+)/);
              if (match) {
                friendlyName = `身份证照片_${match[1]}${path.extname(fileName)}`;
              }
            }
            
            archive.file(filePath, { name: `images/${friendlyName}` });
            console.log('添加图片到ZIP:', fileName, '->', friendlyName);
          }
        }
      }
    } else {
      console.warn('团队文件夹不存在:', teamFolder);
    }

    // 添加团队信息文件
    const teamInfoContent = `团队信息
================

团队名称: ${team.team_name}
联系邮箱: ${team.contact_email}
团队类型: ${teamTypeSuffix}
注册时间: ${new Date(team.created_at).toLocaleString()}
审核状态: ${team.audit_status || 'pending'}

团队详细信息:
${JSON.stringify(teamInfo, null, 2)}

文档列表:
${(documents as any[]).map(doc => `- ${doc.document_type}: ${doc.document_name} (${doc.file_size} bytes)`).join('\n')}

图片列表:
${(await dbOperations.teamImages.findByTeam(teamId) as any[]).map((img: any) => `- ${img.image_name}: ${img.image_name} (${img.image_size} bytes)`).join('\n')}
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
