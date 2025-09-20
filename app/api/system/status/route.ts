import { NextRequest, NextResponse } from 'next/server';
import { getMaintenanceInfo } from '@/lib/maintenance';

export async function GET(request: NextRequest) {
  try {
    const maintenanceInfo = getMaintenanceInfo();
    
    return NextResponse.json({
      success: true,
      maintenance: maintenanceInfo
    });

  } catch (error) {
    console.error('Get system status error:', error);
    return NextResponse.json(
      { error: '获取系统状态失败' },
      { status: 500 }
    );
  }
}
