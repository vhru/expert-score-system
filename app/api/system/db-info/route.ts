import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/database-adapter';

export async function GET(request: NextRequest) {
  try {
    // 检查数据库类型
    const dbType = process.env.NODE_ENV === 'production' 
      ? (process.env.DB_TYPE !== 'sqlite' ? 'MySQL' : 'SQLite')
      : (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD 
          ? 'SQLite' : 'MySQL');

    // 获取数据库连接信息（不包含敏感信息）
    const dbInfo = {
      type: dbType,
      environment: process.env.NODE_ENV,
      dbType: process.env.DB_TYPE,
      hasDbHost: !!process.env.DB_HOST,
      hasDbUser: !!process.env.DB_USER,
      hasDbPassword: !!process.env.DB_PASSWORD,
      timestamp: new Date().toISOString()
    };

    // 尝试执行一个简单的数据库查询来验证连接
    let connectionStatus = 'unknown';
    let tableCount = 0;
    
    try {
      // 尝试获取表数量
      const tables = await dbOperations.getTableCount();
      tableCount = tables as number;
      connectionStatus = 'connected';
    } catch (error) {
      connectionStatus = 'error';
      console.error('Database connection test failed:', error);
    }

    return NextResponse.json({
      success: true,
      database: {
        ...dbInfo,
        connectionStatus,
        tableCount
      }
    });

  } catch (error) {
    console.error('Database info check failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check database info'
    }, { status: 500 });
  }
}
