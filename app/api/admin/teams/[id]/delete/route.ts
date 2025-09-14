import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(
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
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    } catch (error) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 });
    }

    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const teamId = parseInt(params.id);
    if (isNaN(teamId)) {
      return NextResponse.json({ error: '无效的团队ID' }, { status: 400 });
    }

    const { dbOperations } = await import('@/lib/database-adapter');

    // 获取团队信息
    const team = await dbOperations.teams.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: '团队不存在' }, { status: 404 });
    }

    console.log(`🗑️ 开始删除团队: ${team.team_name} (ID: ${teamId})`);

    // 1. 删除团队文件夹
    try {
      const teamTypeSuffix = team.is_enterprise ? 'enterprise' : 'team';
      const safeTeamName = team.team_name.replace(/[^\w\u4e00-\u9fa5]/g, '_');
      const safeContact = team.contact_email.replace(/[^\w@.-]/g, '_');
      const teamFolder = path.join('/opt/team_data/team_data', `${safeTeamName}_${safeContact}_${teamTypeSuffix}`);
      
      console.log(`🗑️ 删除团队文件夹: ${teamFolder}`);
      
      // 检查文件夹是否存在
      try {
        await fs.access(teamFolder);
        await fs.rm(teamFolder, { recursive: true, force: true });
        console.log(`✅ 团队文件夹删除成功: ${teamFolder}`);
      } catch (error) {
        console.log(`⚠️ 团队文件夹不存在或删除失败: ${teamFolder}`, error);
      }
    } catch (error) {
      console.error('删除团队文件夹失败:', error);
    }

    // 2. 删除数据库中的关联数据
    try {
      // 删除团队图片
      const teamImages = await dbOperations.teamImages.findByTeamId(teamId);
      for (const image of teamImages) {
        await dbOperations.teamImages.delete(image.id);
      }
      console.log(`✅ 删除团队图片记录: ${teamImages.length} 个`);

      // 删除团队文档
      const teamDocuments = await dbOperations.teamDocuments.findByTeamId(teamId);
      for (const document of teamDocuments) {
        await dbOperations.teamDocuments.delete(document.id);
      }
      console.log(`✅ 删除团队文档记录: ${teamDocuments.length} 个`);

      // 删除核心成员
      const coreMembers = await dbOperations.coreMembers.findByTeamId(teamId);
      for (const member of coreMembers) {
        await dbOperations.coreMembers.delete(member.id);
      }
      console.log(`✅ 删除核心成员记录: ${coreMembers.length} 个`);

      // 删除评审记录
      const reviews = await dbOperations.reviews.findByTeamId(teamId);
      for (const review of reviews) {
        await dbOperations.reviews.delete(review.id);
      }
      console.log(`✅ 删除评审记录: ${reviews.length} 个`);

    } catch (error) {
      console.error('删除关联数据失败:', error);
      return NextResponse.json({ error: '删除关联数据失败' }, { status: 500 });
    }

    // 3. 删除团队主记录
    try {
      await dbOperations.teams.delete(teamId);
      console.log(`✅ 团队主记录删除成功: ${team.team_name}`);
    } catch (error) {
      console.error('删除团队主记录失败:', error);
      return NextResponse.json({ error: '删除团队失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `团队 "${team.team_name}" 及其所有相关数据已成功删除`
    });

  } catch (error) {
    console.error('删除团队错误:', error);
    return NextResponse.json(
      { error: '删除团队失败' },
      { status: 500 }
    );
  }
}
