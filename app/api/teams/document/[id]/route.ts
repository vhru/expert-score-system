import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证团队token
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

    if (!decoded || decoded.role !== 'team') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { dbOperations } = await import('@/lib/database-adapter');
    
    // 获取文档信息
    const document = await dbOperations.teamDocuments.findById(parseInt(params.id));
    
    if (!document) {
      return NextResponse.json({ error: '文档不存在' }, { status: 404 });
    }

    // 验证文档属于当前团队
    if (document.team_id !== decoded.id) {
      return NextResponse.json({ error: '无权访问此文档' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      document: document
    });

  } catch (error) {
    console.error('Get document error:', error);
    return NextResponse.json(
      { error: '获取文档信息失败' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';