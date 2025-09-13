import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // 验证团队token
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

    if (!decoded || decoded.role !== 'team') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { dbOperations } = await import('@/lib/database-adapter');
    
    // 获取团队的文档作为提交记录
    const teamDocuments = await dbOperations.teamDocuments.findByTeam(decoded.id);
    
    // 确保teamDocuments是数组
    if (!Array.isArray(teamDocuments)) {
      return NextResponse.json({ error: '获取文档数据失败' }, { status: 500 });
    }
    
    // 将团队文档转换为提交记录格式
    const submissions = teamDocuments.map(doc => ({
      id: doc.id,
      original_name: doc.document_name,
      document_type: doc.document_type,
      team_name: decoded.teamName,
      file_size: doc.file_size,
      mime_type: doc.mime_type,
      upload_status: 'completed',
      created_at: doc.uploaded_at,
      updated_at: doc.uploaded_at,
      review_status: 'not_assigned',
      expert_assignments: []
    }));

    return NextResponse.json({
      success: true,
      submissions: submissions
    });

  } catch (error) {
    console.error('Failed to fetch team submissions:', error);
    return NextResponse.json(
      { error: '获取提交记录失败' },
      { status: 500 }
    );
  }
}
