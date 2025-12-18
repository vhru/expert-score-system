import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbOperations } from '@/lib/database-adapter';
import path from 'path';
import { readFile } from 'fs/promises';

export const dynamic = 'force-dynamic';

// 查询任务状态
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
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

    const taskId = parseInt(params.taskId);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: '无效的任务ID' }, { status: 400 });
    }

    const task = await dbOperations.exportTasks.findById(taskId);
    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    // 类型断言：task是数据库查询结果，包含所需字段
    const taskData = task as any;

    return NextResponse.json({
      success: true,
      task: {
        id: taskData.id,
        task_type: taskData.task_type,
        status: taskData.status,
        progress_message: taskData.progress_message,
        error_message: taskData.error_message,
        file_name: taskData.file_name,
        created_at: taskData.created_at,
        updated_at: taskData.updated_at,
        completed_at: taskData.completed_at
      }
    });

  } catch (error) {
    console.error('查询任务状态失败:', error);
    return NextResponse.json(
      { error: `查询失败: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

// 下载已完成的Excel文件
export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
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

    const taskId = parseInt(params.taskId);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: '无效的任务ID' }, { status: 400 });
    }

    const task = await dbOperations.exportTasks.findById(taskId);
    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    // 类型断言：task是数据库查询结果，包含所需字段
    const taskData = task as any;

    if (taskData.status !== 'completed') {
      return NextResponse.json({ error: '任务尚未完成' }, { status: 400 });
    }

    if (!taskData.file_path) {
      return NextResponse.json({ error: '文件路径不存在' }, { status: 404 });
    }

    // 读取文件
    const fileBuffer = await readFile(taskData.file_path);

    // 将Buffer转换为Uint8Array以兼容NextResponse
    const uint8Array = new Uint8Array(fileBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(taskData.file_name || `export_${taskId}.xlsx`)}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('下载文件失败:', error);
    return NextResponse.json(
      { error: `下载失败: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

