import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express'; // import type nếu cần, nhưng ở đây dùng trực tiếp

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Các route công khai (không cần login)
    const publicPaths = ['/auth/login', '/auth/callback', '/na', '/favicon.ico'];
    if (publicPaths.includes(request.path) || request.path.startsWith('/assets/')) {
      return true;
    }

    // Kiểm tra đã login chưa (dùng session.user)
    if (!request.session?.user) {
      // Tự động redirect sang Casdoor login
      const clientId = 'ef7c1571a8c61aeee204'; // thay bằng Client ID thật của bạn
      const redirectUri = 'http://localhost:3000/auth/callback';

      const authUrl = `http://localhost:8000/login/oauth/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=openid profile email&` +
        `state=auto-redirect-${Date.now()}`; // state random để chống CSRF

      response.redirect(authUrl);
      return false; // Dừng xử lý tiếp theo
    }

    // Đã login → cho phép tiếp tục
    return true;
  }
}