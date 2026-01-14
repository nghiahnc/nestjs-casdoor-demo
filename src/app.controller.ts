import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import type { Response } from 'express'; // Sửa lỗi TS1272 bằng import type
import axios from 'axios';
import { AuthGuard } from './auth/auth.guard'; // Giả sử bạn đã tạo file này

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Trang chủ: BẮT BUỘC phải đăng nhập mới vào được
  @Get()
  @UseGuards(AuthGuard)
  getHome(@Req() req, @Res() res: Response): void {
    const user = req.session.user;

    res.send(`
      <h1>Chào mừng ${user.name || 'bạn'}!</h1>
      <p>Bạn đã đăng nhập thành công với Casdoor.</p>
      <p>Email: ${user.email || 'Chưa có'}</p>
      <img src="${user.avatar || 'https://cdn.casbin.org/img/casbin.svg'}" width="100" alt="Avatar">
      <br><br>
      <a href="/profile">Xem profile chi tiết</a> |
      <a href="/auth/logout">Đăng xuất</a> |
      <a href="/na">Test route /na</a>
    `);
  }

  // Route test công khai (không cần login)
  @Get('na')
   @UseGuards(AuthGuard)
  getHello(): string {
    return this.appService.getHello();
  }

  // Route bắt đầu đăng nhập (redirect sang Casdoor)
  @Get('auth/login')
  login(@Res() res: Response): void {
    const clientId = 'ef7c1571a8c61aeee204'; // Thay bằng Client ID thật của bạn
    const redirectUri = 'http://localhost:3000/auth/callback';

    const authUrl = `http://localhost:8000/login/oauth/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=openid profile email&` +
      `state=xyz-random-state-2026`; // Nên dùng random state thật để chống CSRF

    res.redirect(authUrl);
  }

  // Route callback: đổi code lấy token, lưu user vào session, redirect về trang chủ
  @Get('auth/callback')
  async callback(@Req() req, @Res() res: Response): Promise<void> {
    const code = req.query.code as string;

    if (!code) {
      res.status(400).send('Không nhận được code từ Casdoor');
      return;
    }

    try {
      // Đổi code lấy token từ Casdoor
      const tokenResponse = await axios.post(
        'http://localhost:8000/api/login/oauth/access_token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: 'ef7c1571a8c61aeee204', // Thay bằng Client ID thật
          client_secret: '97a5e944d0c71cd7e23403b6cee8401adbcb5f79', // Thay bằng Client Secret thật
          code,
          redirect_uri: 'http://localhost:3000/auth/callback',
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const tokens = tokenResponse.data;

      // Decode id_token để lấy thông tin user
      const [, payloadBase64] = tokens.id_token.split('.');
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));

      // Lưu user vào session
      req.session.user = {
        id: payload.sub,
        name: payload.name || payload.displayName || 'User',
        email: payload.email,
        avatar: payload.avatar || 'https://cdn.casbin.org/img/casbin.svg',
        accessToken: tokens.access_token,
      };

      // Redirect về trang chủ (bây giờ đã có user)
      res.redirect('/');
    } catch (err) {
      console.error('Lỗi khi đổi code lấy token:', err.response?.data || err.message);
      res.status(500).send('Lỗi đăng nhập, vui lòng thử lại');
    }
  }

  // Route logout (xóa session và logout Casdoor nếu cần)
  @Get('auth/logout')
  logout(@Req() req, @Res() res: Response): void {
    req.session.destroy(() => {
      // Optional: redirect về Casdoor logout để xóa session bên Casdoor
      const logoutUrl = `http://localhost:8000/login/oauth/logout?post_logout_redirect_uri=${encodeURIComponent('http://localhost:3000/')}`;
      res.redirect(logoutUrl);
    });
  }
}