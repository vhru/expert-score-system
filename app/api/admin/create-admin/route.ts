import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/database-adapter';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 创建管理员账号...');
    
    // 检查是否已存在admin账号
    const existingAdmin = await dbOperations.users.findByUsername('admin@example.com');
    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: '管理员账号已存在',
        admin: {
          username: existingAdmin.username,
          role: existingAdmin.role
        }
      });
    }
    
    // 创建admin账号
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    const result = await dbOperations.users.create(
      'admin@example.com',
      adminPassword,
      'admin',
      null,
      'admin'
    );
    
    if (result.changes > 0) {
      return NextResponse.json({
        success: true,
        message: '管理员账号创建成功！',
        admin: {
          username: 'admin@example.com',
          password: 'admin123',
          role: 'admin'
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: '管理员账号创建失败'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ 创建管理员账号时出错:', error);
    return NextResponse.json({
      success: false,
      message: '创建管理员账号时出错',
      error: error.message
    }, { status: 500 });
  }
}
