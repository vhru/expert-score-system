import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, access, constants } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        UPLOAD_DIR: process.env.UPLOAD_DIR,
        currentWorkingDir: process.cwd()
      },
      tests: {}
    };

    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    
    // 测试1: 检查上传目录
    try {
      await access(uploadDir, constants.F_OK);
      results.tests.uploadDirExists = { status: 'success', message: '上传目录存在' };
    } catch (error) {
      results.tests.uploadDirExists = { status: 'error', message: '上传目录不存在', error: error.message };
    }

    // 测试2: 检查目录权限
    try {
      await access(uploadDir, constants.W_OK);
      results.tests.uploadDirWritable = { status: 'success', message: '上传目录可写' };
    } catch (error) {
      results.tests.uploadDirWritable = { status: 'error', message: '上传目录不可写', error: error.message };
    }

    // 测试3: 创建子目录
    const subDirs = ['member-cvs', 'team-documents', 'team-images', 'photos'];
    for (const subDir of subDirs) {
      try {
        const fullPath = path.join(uploadDir, subDir);
        await mkdir(fullPath, { recursive: true });
        results.tests[`createSubDir_${subDir}`] = { status: 'success', message: `成功创建 ${subDir} 目录` };
      } catch (error) {
        results.tests[`createSubDir_${subDir}`] = { status: 'error', message: `创建 ${subDir} 目录失败`, error: error.message };
      }
    }

    // 测试4: 文件写入测试
    try {
      const testFile = path.join(uploadDir, `test_${Date.now()}.txt`);
      await writeFile(testFile, 'test content');
      results.tests.fileWrite = { status: 'success', message: '文件写入测试成功' };
      
      // 清理测试文件
      try {
        const fs = require('fs');
        fs.unlinkSync(testFile);
        results.tests.fileCleanup = { status: 'success', message: '文件清理成功' };
      } catch (error) {
        results.tests.fileCleanup = { status: 'warning', message: '文件清理失败', error: error.message };
      }
    } catch (error) {
      results.tests.fileWrite = { status: 'error', message: '文件写入测试失败', error: error.message };
    }

    // 测试5: 检查磁盘空间
    try {
      const fs = require('fs');
      const stats = fs.statSync(uploadDir);
      results.tests.diskSpace = { 
        status: 'success', 
        message: '磁盘空间检查通过',
        details: {
          mode: stats.mode.toString(8),
          uid: stats.uid,
          gid: stats.gid
        }
      };
    } catch (error) {
      results.tests.diskSpace = { status: 'error', message: '磁盘空间检查失败', error: error.message };
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        error: '健康检查失败', 
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
