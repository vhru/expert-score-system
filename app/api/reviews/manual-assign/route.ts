import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { teamId, expertIds } = await request.json();

    if (!teamId || !expertIds || !Array.isArray(expertIds) || expertIds.length === 0) {
      return NextResponse.json({ error: '请提供有效的团队ID和专家ID列表' }, { status: 400 });
    }

    const { dbOperations } = await import('@/lib/database-adapter');
    
    // 检查团队是否存在
    const team = await dbOperations.teams.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: '团队不存在' }, { status: 404 });
    }

    // 检查专家是否存在并验证类型匹配
    const experts = await Promise.all(
      expertIds.map(id => dbOperations.users.findById(id))
    );
    
    const invalidExperts = expertIds.filter((id, index) => !experts[index]);
    if (invalidExperts.length > 0) {
      return NextResponse.json({ error: `专家ID ${invalidExperts.join(', ')} 不存在` }, { status: 400 });
    }

    // 验证专家类型匹配
    const teamType = team.is_enterprise ? 'enterprise' : 'team';
    const mismatchedExperts = expertIds.filter((id, index) => {
      const expert = experts[index];
      return expert && expert.expert_type !== teamType;
    });
    
    if (mismatchedExperts.length > 0) {
      return NextResponse.json({ 
        error: `专家类型不匹配：团队类型为${teamType === 'enterprise' ? '企业组' : '团队组'}，但专家ID ${mismatchedExperts.join(', ')} 的类型不匹配` 
      }, { status: 400 });
    }

    // 检查是否已经分配过
    const existingAssignments = await Promise.all(
      expertIds.map(id => dbOperations.assignments.findByExpertAndFile(id, teamId))
    );
    
    const alreadyAssigned = expertIds.filter((id, index) => existingAssignments[index]);
    if (alreadyAssigned.length > 0) {
      return NextResponse.json({ error: `专家ID ${alreadyAssigned.join(', ')} 已经分配过此团队` }, { status: 400 });
    }

    // 创建分配记录
    const results = [];
    for (const expertId of expertIds) {
      try {
        const result = await dbOperations.assignments.create(teamId, expertId);
        results.push(result);
      } catch (error) {
        console.error(`Failed to assign team ${teamId} to expert ${expertId}:`, error);
      }
    }

    if (results.length === 0) {
      return NextResponse.json({ error: '分配失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `成功分配 ${results.length} 个评审任务`,
      assignments: results.length
    });

  } catch (error) {
    console.error('Manual assignment error:', error);
    return NextResponse.json(
      { error: '手动分配失败' },
      { status: 500 }
    );
  }
}
