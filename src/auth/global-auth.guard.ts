import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class GlobalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Các route công khai (không cần login): login, callback, na...
    const publicPaths = ['/auth/login', '/auth/callback', '/na', '/favicon.ico'];
    if (publicPaths.includes(request.path) || request.path.startsWith('/assets/')) {
      return true;
    }

    // Kiểm tra session user
    if (!request.session?.user) {
      // Tự động redirect sang Casdoor login
      const clientId = 'ef7c1571a8c61aeee204'; // thay bằng clientId thật
      const redirectUri = 'http://localhost:3000/auth/callback';

      const authUrl = `http://localhost:8000/login/oauth/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=openid profile email&` +
        `state=auto-redirect-state-${Date.now()}`; // state random để chống CSRF

      request.res.redirect(authUrl);
      return false;
    }

    return true;
  }
}