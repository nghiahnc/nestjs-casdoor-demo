import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import session from 'express-session'; // import default (đúng cách cho TypeScript)

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Config session middleware (phải đặt trước khi listen)
  app.use(
    session({
      secret: 'your-secret-key-change-me-2026', // thay bằng chuỗi bí mật mạnh, random
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        httpOnly: true,                  // bảo mật cookie
        secure: false,                   // đổi thành true nếu dùng HTTPS (production)
        sameSite: 'lax',                 // chống CSRF tốt hơn
      },
    }),
  );

  // Optional: thêm prefix cho tất cả route nếu muốn (ví dụ /api)
  // app.setGlobalPrefix('api');

  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});