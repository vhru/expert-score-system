import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbOperations } from '@/lib/database-adapter';

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'expert_review_jwt_secret_2024_production');

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'expert')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    // 获取所有active且通过审核的团队
    const allTeams = await dbOperations.teams.findAll() as any[];
    const validTeams = allTeams.filter(t => t.status === 'active' && t.audit_status === 'approved');
    
    // 获取所有分配记录
    const allAssignments = await dbOperations.assignments.findAll() as any[];
    
    // 统计每个团队的分配记录数
    // 方法1：通过team_name统计（从assignment中获取）
    const teamAssignmentCountsByName = new Map<string, number>();
    for (const assignment of allAssignments) {
      if (assignment.team_name) {
        const count = teamAssignmentCountsByName.get(assignment.team_name) || 0;
        teamAssignmentCountsByName.set(assignment.team_name, count + 1);
      }
    }
    
    // 方法2：通过files表关联team_documents表，再关联teams表统计
    // 这样可以更准确地统计每个team_id的分配记录数
    const teamAssignmentCountsById = new Map<number, number>();
    
    // 获取所有files记录和team_documents记录（一次性获取，避免循环查询）
    const allFiles = await dbOperations.files.findAll() as any[];
    
    // 获取所有team_documents记录（一次性获取）
    // 注意：这里需要直接查询数据库，因为dbOperations可能没有findAll方法
    // 我们通过遍历所有团队来获取team_documents
    const allTeamDocuments: any[] = [];
    for (const team of validTeams) {
      const teamDocs = await dbOperations.teamDocuments.findByTeam(team.id) as any[];
      allTeamDocuments.push(...teamDocs);
    }
    
    // 创建file_path到team_id的映射（通过team_documents）
    const filePathToTeamIdMap = new Map<string, number>();
    for (const doc of allTeamDocuments) {
      if (doc.document_path) {
        filePathToTeamIdMap.set(doc.document_path, doc.team_id);
      }
    }
    
    // 创建file_id到team_id的映射
    const fileToTeamMap = new Map<number, number>();
    for (const file of allFiles) {
      if (file.file_path) {
        const teamId = filePathToTeamIdMap.get(file.file_path);
        if (teamId) {
          fileToTeamMap.set(file.id, teamId);
        }
      }
    }
    
    // 统计每个team_id的分配记录数
    for (const assignment of allAssignments) {
      const teamId = fileToTeamMap.get(assignment.file_id);
      if (teamId) {
        const count = teamAssignmentCountsById.get(teamId) || 0;
        teamAssignmentCountsById.set(teamId, count + 1);
      }
    }
    
    // 构建团队分配状态列表
    const teamStatusList = validTeams.map(team => {
      const assignmentCountByName = teamAssignmentCountsByName.get(team.team_name) || 0;
      const assignmentCountById = teamAssignmentCountsById.get(team.id) || 0;
      
      // 使用两种方法中较大的值（更准确）
      const assignmentCount = Math.max(assignmentCountByName, assignmentCountById);
      
      return {
        team_id: team.id,
        team_name: team.team_name,
        contact_email: team.contact_email,
        is_enterprise: team.is_enterprise,
        assignment_count: assignmentCount,
        is_assigned: assignmentCount >= 2,
        status: assignmentCount >= 2 ? '已分配' : assignmentCount === 0 ? '未分配' : `部分分配(${assignmentCount}/2)`,
        assignment_count_by_name: assignmentCountByName,
        assignment_count_by_id: assignmentCountById
      };
    });
    
    // 找出未分配的团队
    const unassignedTeams = teamStatusList.filter(t => t.assignment_count < 2);
    
    return NextResponse.json({
      success: true,
      total_teams: validTeams.length,
      assigned_teams: teamStatusList.filter(t => t.is_assigned).length,
      unassigned_teams: unassignedTeams.length,
      teams: teamStatusList,
      unassigned_teams_detail: unassignedTeams
    });

  } catch (error: any) {
    console.error('获取团队分配状态失败:', error);
    return NextResponse.json(
      { error: '获取失败', details: error.message },
      { status: 500 }
    );
  }
}

