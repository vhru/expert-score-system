import { dbOperations } from './database-adapter';

export interface ReviewAssignment {
  id: number;
  file_id: number;
  expert_id: number;
  assignment_status: 'assigned' | 'in_progress' | 'completed';
  score?: number;
  comments?: string;
  created_at: Date;
  updated_at: Date;
}

export async function assignReviewsToExperts(): Promise<{ success: boolean; message: string; assignments: any[] }> {
  try {
    // 获取所有团队
    const allTeams = await dbOperations.teams.findAll();
    const teams = allTeams.filter(t => t.status === 'active' && t.audit_status === 'approved');

    // 获取所有专家
    const allUsers = await dbOperations.users.findAll();
    const experts = allUsers.filter(u => u.role === 'expert');

    if (teams.length === 0) {
      return { success: false, message: '没有待分配的团队', assignments: [] };
    }

    if (experts.length < 2) {
      return { success: false, message: '专家数量不足，至少需要2个专家', assignments: [] };
    }

    const assignments = [];

    // 为每个团队分配至少2个专家（根据团队类型匹配专家类型）
    for (const team of teams) {
      // 获取该团队的所有文件
      const teamFiles = await dbOperations.files.findByTeam(team.team_name);
      if (teamFiles.length === 0) {
        console.warn(`团队 ${team.team_name} 没有上传任何文档，跳过分配`);
        continue;
      }

      // 检查是否已经分配过
      const allAssignments = await dbOperations.assignments.findAll();
      const existingAssignments = allAssignments.filter(a => 
        teamFiles.some(file => file.id === a.file_id)
      );

      if (existingAssignments.length > 0) {
        continue; // 跳过已分配的团队
      }

      // 根据团队类型筛选专家
      const teamType = team.is_enterprise ? 'enterprise' : 'team';
      const matchingExperts = experts.filter(expert => expert.expert_type === teamType);

      if (matchingExperts.length < 2) {
        console.warn(`团队 ${team.team_name} 的匹配专家数量不足 (${matchingExperts.length} < 2)`);
        continue;
      }

      // 随机选择专家
      const shuffledExperts = matchingExperts.sort(() => 0.5 - Math.random());
      const selectedExperts = shuffledExperts.slice(0, Math.min(2, matchingExperts.length));

      // 创建分配记录 - 为每个文件分配专家
      for (const expert of selectedExperts) {
        for (const file of teamFiles) {
          // 检查是否已经存在分配
          const existingAssignments = await dbOperations.assignments.findByExpertAndFile(expert.id, file.id);
          console.log(`🔍 检查分配: 专家${expert.id} 文件${file.id} 现有分配:`, existingAssignments.length);
          if (existingAssignments.length === 0) {
            await dbOperations.assignments.create(file.id, expert.id);
            console.log(`✅ 创建新分配: 专家${expert.id} 文件${file.id}`);
          } else {
            console.log(`⚠️ 跳过重复分配: 专家${expert.id} 文件${file.id}`);
          }
        }

        assignments.push({
          team_id: team.id,
          team_name: team.team_name,
          expert_id: expert.id,
          expert_name: expert.username,
          expert_type: expert.expert_type,
          team_type: teamType,
          status: 'assigned',
          files_count: teamFiles.length
        });
      }
    }

    return {
      success: true,
      message: `成功分配 ${assignments.length} 个评审任务`,
      assignments: assignments
    };

  } catch (error) {
    console.error('Review assignment failed:', error);
    return { success: false, message: '分配失败', assignments: [] };
  }
}

export async function getExpertAssignments(expertId: number): Promise<ReviewAssignment[]> {
  try {
    return await dbOperations.assignments.findByExpert(expertId);
  } catch (error) {
    console.error('Failed to get expert assignments:', error);
    return [];
  }
}

export async function submitReview(
  assignmentId: number,
  score: number,
  comments: string
): Promise<boolean> {
  try {
    const result = await dbOperations.assignments.updateScore(assignmentId, score, comments);
    return result.changes > 0;
  } catch (error) {
    console.error('Failed to submit review:', error);
    return false;
  }
}

export async function getAllAssignments(): Promise<any[]> {
  try {
    return await dbOperations.assignments.findAll();
  } catch (error) {
    console.error('Failed to get all assignments:', error);
    return [];
  }
}

export async function getReviewStatistics(): Promise<any> {
  try {
    const stats = await dbOperations.assignments.getStatistics();
    const teams = await dbOperations.teams.findAll();
    const files = await dbOperations.files.findAll();
    
    const teamStats = {
      total_teams: teams.length,
      enterprise_teams: teams.filter(t => t.is_enterprise).length,
      team_groups: teams.filter(t => !t.is_enterprise).length,
      active_teams: teams.filter(t => t.status === 'active').length
    };

    const fileStats = {
      total_files: files.length,
      completed_files: files.filter(f => f.upload_status === 'completed').length
    };

    return {
      assignments: stats || {},
      teams: teamStats,
      files: fileStats
    };
  } catch (error) {
    console.error('Failed to get review statistics:', error);
    return {
      assignments: {},
      teams: {},
      files: {}
    };
  }
}
