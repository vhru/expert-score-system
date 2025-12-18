import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbOperations } from '@/lib/database-adapter';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';
import { PathBuilder, PATHS_CONFIG } from '@/lib/paths-config';

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
    console.log('ZIP: 收到的token长度:', token.length);
    console.log('ZIP: token前50字符:', token.substring(0, 50));
    console.log('ZIP: JWT_SECRET存在:', !!process.env.JWT_SECRET);
    
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'expert_review_jwt_secret_2024_production');
    console.log('ZIP: JWT验证成功, 用户角色:', decoded.role);

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'expert')) {
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
    const teamTypeSuffix = team.is_enterprise ? 'enterprise' : 'team';
    const safeTeamName = team.team_name.replace(/[^\w\u4e00-\u9fa5]/g, '_');
    const safeContact = team.contact_email.replace(/[^\w@.-]/g, '_');
    const zipFileName = `${safeTeamName}_${safeContact}_${teamTypeSuffix}.zip`;

    // 方法1：从数据库路径中提取实际文件夹路径（最可靠）
    // 因为团队名称可能被更新过，但文件系统路径是基于注册时的名称
    let teamFolder: string | null = null;
    let actualTeamDirName: string | null = null;
    
    // 从第一个文档路径中提取团队文件夹名称
    if (documents && documents.length > 0) {
      const firstDoc = documents[0] as any;
      if (firstDoc && firstDoc.document_path) {
        // document_path格式：uploads/team_data/{团队文件夹名}/documents/{文件名}
        const pathMatch = firstDoc.document_path.match(/uploads\/team_data\/([^\/]+)\//);
        if (pathMatch) {
          actualTeamDirName = pathMatch[1];
          teamFolder = path.join(PATHS_CONFIG.UPLOAD_BASE_DIR, PATHS_CONFIG.SUBDIRS.TEAM_DATA, actualTeamDirName);
          console.log('📦 从数据库路径提取的团队文件夹:', teamFolder);
        }
      }
    }
    
    // 方法2：如果方法1失败，尝试从图片路径提取
    if (!teamFolder || !fs.existsSync(teamFolder)) {
      const teamImages = await dbOperations.teamImages.findByTeam(teamId) as any[];
      if (teamImages && teamImages.length > 0) {
        const firstImage = teamImages[0];
        if (firstImage && firstImage.image_path) {
          const pathMatch = firstImage.image_path.match(/uploads\/team_data\/([^\/]+)\//);
          if (pathMatch) {
            actualTeamDirName = pathMatch[1];
            teamFolder = path.join(PATHS_CONFIG.UPLOAD_BASE_DIR, PATHS_CONFIG.SUBDIRS.TEAM_DATA, actualTeamDirName);
            console.log('📦 从图片路径提取的团队文件夹:', teamFolder);
          }
        }
      }
    }
    
    // 方法3：如果前两种方法都失败，使用当前团队名构建路径（备用方案）
    if (!teamFolder || !fs.existsSync(teamFolder)) {
      const teamDirName = PathBuilder.getTeamDir(team.team_name, team.contact_email, teamTypeSuffix);
      teamFolder = path.join(PATHS_CONFIG.UPLOAD_BASE_DIR, PATHS_CONFIG.SUBDIRS.TEAM_DATA, teamDirName);
      actualTeamDirName = teamDirName;
      console.log('📦 使用当前团队名构建的文件夹:', teamFolder);
    }
    
    console.log('📦 ZIP下载调试信息:');
    console.log('   团队ID:', teamId);
    console.log('   当前团队名称:', team.team_name);
    console.log('   联系邮箱:', team.contact_email);
    console.log('   团队类型:', teamTypeSuffix);
    console.log('   实际团队目录名:', actualTeamDirName);
    console.log('   团队文件夹路径:', teamFolder);
    console.log('   文件夹是否存在:', fs.existsSync(teamFolder));
    
    // 检查团队文件夹是否存在
    if (!fs.existsSync(teamFolder)) {
      console.error('❌ 团队文件夹不存在:', teamFolder);
      console.error('   提示：团队名称可能被更新过，但文件系统路径仍使用注册时的名称');
      console.error('   请检查数据库中的document_path或image_path来确定实际文件夹名称');
      return NextResponse.json(
        { error: `团队文件夹不存在: ${teamFolder}` },
        { status: 404 }
      );
    }

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

    // 直接打包整个团队文件夹，保持目录结构
    // archiver.directory() 会自动递归打包所有子文件夹和文件
    // 第二个参数 false 表示不包含根目录名，ZIP内直接包含 documents/, images/, member-cvs/ 等子文件夹
    const absoluteTeamFolder = path.isAbsolute(teamFolder) ? teamFolder : path.resolve(teamFolder);
    
    // 验证文件夹内容（用于调试）
    try {
      const folderContents = fs.readdirSync(absoluteTeamFolder, { withFileTypes: true });
      const subDirs = folderContents.filter(entry => entry.isDirectory()).map(entry => entry.name);
      const files = folderContents.filter(entry => entry.isFile()).map(entry => entry.name);
      console.log(`📂 团队文件夹内容: ${subDirs.length}个子文件夹 (${subDirs.join(', ')})`);
      if (files.length > 0) {
        console.log(`   根目录文件: ${files.length}个`);
      }
    } catch (listError: any) {
      console.error('❌ 无法列出文件夹内容:', listError.message);
    }
    
    // 直接打包整个文件夹
    archive.directory(absoluteTeamFolder, false);
    console.log(`✅ 已添加整个团队文件夹到ZIP: ${absoluteTeamFolder}`);

    // 添加团队信息文件（可选，用于记录元数据）
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
    console.log('✅ ZIP打包完成，开始传输');

    return new Response(stream, { headers });

  } catch (error) {
    console.error('ZIP下载错误:', error);
    return NextResponse.json(
      { error: '下载失败' },
      { status: 500 }
    );
  }
}
