import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 检查是否在维护模式
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  
  if (maintenanceMode) {
    // 维护模式下的路径白名单
    const allowedPaths = [
      '/maintenance',
      '/api/system/status',
      '/api/admin/login',
      '/admin-dashboard',
      '/admin-audit'
    ];
    
    // 检查当前路径是否在白名单中
    const isAllowed = allowedPaths.some(path => request.nextUrl.pathname.startsWith(path));
    
    if (!isAllowed) {
      // 重定向到维护页面
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
