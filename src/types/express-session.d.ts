import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      name: string;
      email: string;
      avatar: string;
      accessToken?: string;
      // thêm các trường khác nếu cần
    };
  }
}