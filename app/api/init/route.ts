import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/simple-sqlite';

export async function POST(request: NextRequest) {
  try {
    await initDatabase();
    
    return NextResponse.json({
      success: true,
      message: '数据库初始化成功'
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { error: '数据库初始化失败' },
      { status: 500 }
    );
  }
}
