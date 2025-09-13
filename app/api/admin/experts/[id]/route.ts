import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { encryptData } from '@/lib/encryption';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const expertId = parseInt(params.id);
    if (isNaN(expertId)) {
      return NextResponse.json({ error: '无效的专家ID' }, { status: 400 });
    }

    const { username, password, personalInfo, expertType } = await request.json();

    if (!username || !username.trim()) {
      return NextResponse.json({ error: '用户名不能为空' }, { status: 400 });
    }

    const { dbOperations } = await import('@/lib/simple-sqlite');
    
    // 检查用户名是否已被其他用户使用
    const existingUser = await dbOperations.users.findByUsername(username);
    if (existingUser && existingUser.id !== expertId) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 400 });
    }

    // 准备更新数据
    const updateData: any = {
      username: username.trim()
    };

    // 如果提供了新密码，则加密
    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    // 如果提供了个人信息，则加密
    if (personalInfo && personalInfo.trim()) {
      updateData.encrypted_info = encryptData(personalInfo.trim());
    }

    // 如果提供了专家类型，则更新
    if (expertType) {
      updateData.expert_type = expertType;
    }

    // 更新专家信息
    const result = await dbOperations.users.update(expertId, updateData);

    if (result.changes > 0) {
      return NextResponse.json({
        success: true,
        message: '专家信息更新成功'
      });
    } else {
      return NextResponse.json({ error: '更新失败' }, { status: 500 });
    }

  } catch (error) {
    console.error('Failed to update expert:', error);
    return NextResponse.json(
      { error: '更新专家信息失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const expertId = parseInt(params.id);
    if (isNaN(expertId)) {
      return NextResponse.json({ error: '无效的专家ID' }, { status: 400 });
    }

    const { dbOperations } = await import('@/lib/simple-sqlite');
    
    // 检查是否有相关的评审任务
    const assignments = await dbOperations.assignments.findByExpert(expertId);
    if (assignments.length > 0) {
      return NextResponse.json({ 
        error: '该专家还有未完成的评审任务，无法删除' 
      }, { status: 400 });
    }

    // 删除专家
    const result = await dbOperations.users.delete(expertId);

    if (result.changes > 0) {
      return NextResponse.json({
        success: true,
        message: '专家账号删除成功'
      });
    } else {
      return NextResponse.json({ error: '删除失败' }, { status: 500 });
    }

  } catch (error) {
    console.error('Failed to delete expert:', error);
    return NextResponse.json(
      { error: '删除专家失败' },
      { status: 500 }
    );
  }
}
