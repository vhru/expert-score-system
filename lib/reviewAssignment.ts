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
    const allTeams = await dbOperations.teams.findAll() as any[];
    const teams = allTeams.filter(t => t.status === 'active' && t.audit_status === 'approved');

    // 获取所有专家
    const allUsers = await dbOperations.users.findAll() as any[];
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
      const teamFiles = await dbOperations.files.findByTeam(team.team_name) as any[];
      if (teamFiles.length === 0) {
        console.warn(`团队 ${team.team_name} 没有上传任何文档，跳过分配`);
        continue;
      }

      // 检查是否已经完整分配过 - 检查该团队是否已经有完整的专家分配
      const allAssignments = await dbOperations.assignments.findAll() as any[];
      const teamFileIds = teamFiles.map(f => f.id);
      const existingAssignments = allAssignments.filter(a => 
        teamFileIds.includes(a.file_id)
      );

      // 如果该团队的文件已经被分配，检查是否分配完整
      if (existingAssignments.length > 0) {
        // 统计每个专家分配的文件数量
        const expertFileCounts = {};
        existingAssignments.forEach(assignment => {
          const expertId = assignment.expert_id;
          expertFileCounts[expertId] = (expertFileCounts[expertId] || 0) + 1;
        });

        // 检查是否所有分配该团队的专家都分配了所有文件
        const assignedExpertIds = Object.keys(expertFileCounts);
        const isCompleteAssignment = assignedExpertIds.every(expertId => 
          expertFileCounts[expertId] === teamFiles.length
        );

        if (isCompleteAssignment) {
          console.log(`团队 ${team.team_name} 已经完整分配过专家，跳过`);
          continue;
        } else {
          console.log(`团队 ${team.team_name} 分配不完整，继续分配`);
        }
      }

      // 根据团队类型筛选专家
      const teamType = team.is_enterprise ? 'enterprise' : 'team';
      const matchingExperts = experts.filter(expert => expert.expert_type === teamType);

      if (matchingExperts.length < 2) {
        console.warn(`团队 ${team.team_name} 的匹配专家数量不足 (${matchingExperts.length} < 2)`);
        continue;
      }

      // 选择工作负载最少的专家（负载均衡）
      const expertWorkloads = await Promise.all(
        matchingExperts.map(async (expert) => {
          const assignments = await dbOperations.assignments.findByExpert(expert.id) as any[];
          return {
            expert,
            workload: assignments.length
          };
        })
      );
      
      // 按工作负载排序，选择负载最少的2个专家
      const sortedExperts = expertWorkloads.sort((a, b) => a.workload - b.workload);
      const selectedExperts = sortedExperts.slice(0, Math.min(2, matchingExperts.length)).map(item => item.expert);
      
      console.log(`📊 专家负载情况:`, expertWorkloads.map(item => 
        `专家${item.expert.id}(${item.expert.username}): ${item.workload}个任务`
      ).join(', '));

      // 创建分配记录 - 为每个专家分配该团队的所有文件
      for (const expert of selectedExperts) {
        // 检查该专家是否已经分配过这个团队的任何文件
        const existingAssignments = await dbOperations.assignments.findByExpertAndTeam(expert.id, team.team_name) as any[];
        console.log(`🔍 检查专家${expert.id}对团队${team.team_name}的现有分配:`, existingAssignments.length);
        
        if (existingAssignments.length === 0) {
          // 为该专家分配该团队（按团队分配，不是按文件）
          // 使用第一个文件作为代表，但实际评审的是整个团队
          if (teamFiles.length > 0) {
            await dbOperations.assignments.create(teamFiles[0].id, expert.id);
            console.log(`✅ 创建新分配: 专家${expert.id} 团队${team.team_name} (使用文件${teamFiles[0].id}作为代表)`);
            
            assignments.push({
              team_id: team.id,
              team_name: team.team_name,
              expert_id: expert.id,
              expert_name: expert.username,
              expert_type: expert.expert_type,
              team_type: teamType,
              status: 'assigned',
              file_id: teamFiles[0].id,
              file_name: `${team.team_name}_团队评审`
            });
          }
        } else {
          console.log(`⚠️ 跳过重复分配: 专家${expert.id}已经分配过团队${team.team_name}`);
        }
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
    return await dbOperations.assignments.findByExpert(expertId) as any[];
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
    return await dbOperations.assignments.findAll() as any[];
  } catch (error) {
    console.error('Failed to get all assignments:', error);
    return [];
  }
}

export async function getReviewStatistics(): Promise<any> {
  try {
    console.log('📊 开始获取统计数据...');
    
    // 获取分配统计
    let stats = {};
    try {
      stats = await dbOperations.assignments.getStatistics() as any;
      console.log('📊 分配统计数据:', stats);
    } catch (error) {
      console.error('❌ 获取分配统计失败:', error);
    }
    
    // 获取团队统计
    let teams = [];
    try {
      teams = await dbOperations.teams.findAll() as any[];
      console.log('📊 团队数据:', teams.length, '个团队');
    } catch (error) {
      console.error('❌ 获取团队数据失败:', error);
    }
    
    // 获取文件统计
    let files = [];
    try {
      files = await dbOperations.files.findAll() as any[];
      console.log('📊 文件数据:', files.length, '个文件');
    } catch (error) {
      console.error('❌ 获取文件数据失败:', error);
    }
    
    const teamStats = {
      total_teams: teams.length || 0,
      enterprise_teams: teams.filter(t => t.is_enterprise).length || 0,
      team_groups: teams.filter(t => !t.is_enterprise).length || 0,
      active_teams: teams.filter(t => t.status === 'active').length || 0
    };

    const fileStats = {
      total_files: files.length || 0,
      completed_files: files.filter(f => f.upload_status === 'completed').length || 0
    };

    const result = {
      assignments: stats || {},
      teams: teamStats,
      files: fileStats
    };
    
    console.log('📊 最终统计数据:', result);
    return result;
  } catch (error) {
    console.error('❌ 获取统计数据失败:', error);
    return {
      assignments: {},
      teams: {},
      files: {}
    };
  }
}
