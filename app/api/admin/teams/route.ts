import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    // 获取所有团队及其评审状态
    const { dbOperations } = await import('@/lib/simple-sqlite');
    const teams = await dbOperations.teams.findAll();
    
    // 为每个团队添加评审状态信息
    const teamsWithReviewStatus = await Promise.all(teams.map(async (team) => {
      // 获取团队的核心成员
      const coreMembers = await dbOperations.coreMembers.findByTeam(team.id);
      
      // 获取团队的文档
      const documents = await dbOperations.teamDocuments.findByTeam(team.id);
      
      // 获取团队的图片
      const teamImages = await dbOperations.teamImages.findByTeam(team.id);
      
      // 计算评审完成状态（暂时设为未分配，因为新系统还没有评审分配）
      let reviewCompletionStatus = 'not_assigned';
      let reviewStatus = {
        totalAssignments: 0,
        completedAssignments: 0,
        averageScore: null,
        assignments: []
      };

      return {
        ...team,
        coreMembers,
        documents,
        images: teamImages,
        reviewCompletionStatus,
        reviewStatus
      };
    }));

    return NextResponse.json({
      success: true,
      teams: teamsWithReviewStatus
    });

  } catch (error) {
    console.error('Failed to fetch teams:', error);
    return NextResponse.json(
      { error: '获取团队列表失败' },
      { status: 500 }
    );
  }
}
