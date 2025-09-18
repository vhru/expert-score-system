import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/database-adapter';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      environment: {
        ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@example.com',
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
        NODE_ENV: process.env.NODE_ENV
      },
      checks: {}
    };

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // 1. 检查用户是否存在
    try {
      const user = await dbOperations.users.findByUsername(adminEmail);
      if (user) {
        results.checks.userExists = { 
          status: 'success', 
          message: '管理员用户存在',
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            expert_type: user.expert_type,
            created_at: user.created_at
          }
        };

        // 2. 检查密码验证
        try {
          const isValidPassword = await bcrypt.compare(adminPassword, user.password);
          results.checks.passwordValidation = {
            status: isValidPassword ? 'success' : 'error',
            message: isValidPassword ? '密码验证成功' : '密码验证失败',
            passwordHash: user.password.substring(0, 20) + '...' // 只显示前20个字符
          };
        } catch (error) {
          results.checks.passwordValidation = {
            status: 'error',
            message: '密码验证过程出错',
            error: error.message
          };
        }

      } else {
        results.checks.userExists = { 
          status: 'error', 
          message: '管理员用户不存在' 
        };
      }
    } catch (error) {
      results.checks.userExists = { 
        status: 'error', 
        message: '查询用户时出错',
        error: error.message
      };
    }

    // 3. 检查所有管理员用户
    try {
      const allUsers = await dbOperations.users.findAll();
      const adminUsers = allUsers.filter((user: any) => user.role === 'admin');
      results.checks.allAdminUsers = {
        status: 'success',
        message: `找到 ${adminUsers.length} 个管理员用户`,
        users: adminUsers.map((user: any) => ({
          id: user.id,
          username: user.username,
          role: user.role,
          expert_type: user.expert_type,
          created_at: user.created_at
        }))
      };
    } catch (error) {
      results.checks.allAdminUsers = {
        status: 'error',
        message: '查询所有管理员用户时出错',
        error: error.message
      };
    }

    // 4. 测试认证流程
    try {
      const { authenticateUser } = await import('@/lib/auth');
      const authResult = await authenticateUser(adminEmail, adminPassword);
      results.checks.authenticationFlow = {
        status: authResult ? 'success' : 'error',
        message: authResult ? '认证流程成功' : '认证流程失败',
        result: authResult ? {
          id: authResult.id,
          username: authResult.username,
          role: authResult.role
        } : null
      };
    } catch (error) {
      results.checks.authenticationFlow = {
        status: 'error',
        message: '认证流程测试出错',
        error: error.message
      };
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json(
      { 
        error: '管理员检查失败', 
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
