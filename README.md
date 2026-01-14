# NOTE – NestJS + Casdoor Demo

## File chính
- src/main.ts: Khởi động NestJS, config session, chạy port 3000
- src/app.controller.ts: Route chính (home, login, callback, logout)
- src/auth/auth.guard.ts: Guard kiểm tra đăng nhập bằng session
- src/types/express-session.d.ts: Khai báo session.user cho TypeScript
- src/app.module.ts: Module gốc của app
- docker-compose.yml: Chạy Casdoor + PostgreSQL (port 8000)

## Quy trình chạy
1) Chạy Casdoor
docker compose up -d
→ http://localhost:8000 (admin / 123)

2) Chạy NestJS
npm run start:dev
→ http://localhost:3000

3) Test
- Vào http://localhost:3000 → redirect Casdoor
- Login Casdoor → quay về app
- Logout → xóa session + logout Casdoor
