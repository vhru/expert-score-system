import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { dbOperations } from '@/lib/database-adapter';

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
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'expert_review_jwt_secret_2024_production') as any;
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

    // dbOperations 已通过静态导入

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
      console.log(`🗑️ 开始删除团队 ${team.team_name} 的数据库记录...`);
      
      // 删除团队图片
      console.log(`🔍 查找团队图片记录...`);
      const teamImagesResult = await dbOperations.teamImages.findByTeam(teamId);
      const teamImages = Array.isArray(teamImagesResult) ? teamImagesResult : [];
      console.log(`📸 找到 ${teamImages.length} 个团队图片记录`);
      for (const image of teamImages) {
        console.log(`🗑️ 删除图片记录 ID: ${image.id}`);
        await dbOperations.teamImages.delete(image.id);
      }
      console.log(`✅ 删除团队图片记录: ${teamImages.length} 个`);

      // 删除团队文档
      console.log(`🔍 查找团队文档记录...`);
      const teamDocumentsResult = await dbOperations.teamDocuments.findByTeam(teamId);
      const teamDocuments = Array.isArray(teamDocumentsResult) ? teamDocumentsResult : [];
      console.log(`📄 找到 ${teamDocuments.length} 个团队文档记录`);
      for (const document of teamDocuments) {
        console.log(`🗑️ 删除文档记录 ID: ${document.id}`);
        await dbOperations.teamDocuments.delete(document.id);
      }
      console.log(`✅ 删除团队文档记录: ${teamDocuments.length} 个`);

      // 删除核心成员
      console.log(`🔍 查找核心成员记录...`);
      const coreMembersResult = await dbOperations.coreMembers.findByTeam(teamId);
      const coreMembers = Array.isArray(coreMembersResult) ? coreMembersResult : [];
      console.log(`👥 找到 ${coreMembers.length} 个核心成员记录`);
      for (const member of coreMembers) {
        console.log(`🗑️ 删除核心成员记录 ID: ${member.id}`);
        await dbOperations.coreMembers.delete(member.id);
      }
      console.log(`✅ 删除核心成员记录: ${coreMembers.length} 个`);

      // 删除评审分配记录
      console.log(`🔍 查找团队文件记录...`);
      const teamFilesResult = await dbOperations.files.findByTeam(team.team_name);
      const teamFiles = Array.isArray(teamFilesResult) ? teamFilesResult : [];
      console.log(`📁 找到 ${teamFiles.length} 个团队文件记录`);
      let totalAssignments = 0;
      
      for (const file of teamFiles) {
        console.log(`🔍 查找文件 ${file.id} 的评审分配...`);
        const assignmentsResult = await dbOperations.assignments.findByFile(file.id);
        const assignments = Array.isArray(assignmentsResult) ? assignmentsResult : [];
        console.log(`📝 找到 ${assignments.length} 个评审分配记录`);
        for (const assignment of assignments) {
          console.log(`🗑️ 删除评审分配记录 ID: ${assignment.id}`);
          await dbOperations.assignments.delete(assignment.id);
          totalAssignments++;
        }
      }
      console.log(`✅ 删除评审分配记录: ${totalAssignments} 个`);
      
      // 删除团队文件记录
      for (const file of teamFiles) {
        console.log(`🗑️ 删除文件记录 ID: ${file.id}`);
        await dbOperations.files.delete(file.id);
      }
      console.log(`✅ 删除团队文件记录: ${teamFiles.length} 个`);

      // 3. 删除团队主记录（在同一个事务中）
      console.log(`🗑️ 准备删除团队主记录 ID: ${teamId}`);
      console.log(`🔍 检查 dbOperations.teams.delete 方法是否存在:`, typeof dbOperations.teams.delete);
      console.log(`🔍 检查 dbOperations 对象:`, Object.keys(dbOperations));
      console.log(`🔍 检查 dbOperations.teams 对象:`, Object.keys(dbOperations.teams));
      
      await dbOperations.teams.delete(teamId);
      console.log(`✅ 团队主记录删除成功: ${team.team_name}`);

    } catch (error) {
      console.error('❌ 删除团队数据失败:', error);
      console.error('❌ 错误堆栈:', error.stack);
      console.error('❌ 错误类型:', typeof error);
      console.error('❌ 错误消息:', error.message);
      return NextResponse.json({ 
        error: '删除团队失败', 
        details: error.message,
        stack: error.stack
      }, { status: 500 });
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
