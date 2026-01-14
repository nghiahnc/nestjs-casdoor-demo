// index.js (CommonJS version)

const express = require('express');
const session = require('express-session');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// Config Casdoor
const config = {
  serverUrl: 'http://localhost:8000',
  clientId: 'ef7c1571a8c61aeee204',
  clientSecret: '97a5e944d0c71cd7e23403b6cee8401adbcb5f79',
  redirectUri: 'http://localhost:3000/callback',
};

// Sử dụng session
app.use(session({
  secret: 'mat-khau-bi-mat-cua-ban-2026', // thay bằng cái mạnh hơn
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // true nếu dùng HTTPS (production)
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
  }
}));

// Middleware kiểm tra login
const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// Trang chủ
app.get('/', (req, res) => {
  if (req.session.user) {
    res.send(`
      <h1>Xin chào ${req.session.user.name || 'User'}!</h1>
      <p>Email: ${req.session.user.email || 'Chưa có'}</p>
      <img src="${req.session.user.avatar}" width="80" alt="avatar">
      <br><a href="/profile">Profile</a> | <a href="/logout">Đăng xuất</a>
    `);
  } else {
    res.send('<h1>Chưa đăng nhập</h1><a href="/login">Đăng nhập với Casdoor</a>');
  }
});

// Bắt đầu login
app.get('/login', (req, res) => {
  const state = crypto.randomBytes(32).toString('hex');
  req.session.oauthState = state;

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri,
    scope: 'openid profile email',
    state: state,
  });

  const authUrl = `${config.serverUrl}/login/oauth/authorize?${params.toString()}`;
  res.redirect(authUrl);
});

// Callback từ Casdoor
app.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  if (state !== req.session.oauthState) {
    return res.status(400).send('Invalid state - có thể bị tấn công CSRF');
  }
  delete req.session.oauthState;

  if (!code) {
    return res.status(400).send('Không nhận được code');
  }

  try {
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code.toString(),
      redirect_uri: config.redirectUri,
    });

    const tokenRes = await axios.post(
      `${config.serverUrl}/api/login/oauth/access_token`,
      tokenBody.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const tokens = tokenRes.data;

    // Decode id_token để lấy thông tin user
    const parts = tokens.id_token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    req.session.user = {
      id: payload.sub,
      name: payload.name || payload.displayName || 'User',
      email: payload.email,
      avatar: payload.avatar || 'https://cdn.casbin.org/img/casbin.svg',
      accessToken: tokens.access_token,
    };

    res.redirect('/na');
  } catch (err) {
    console.error('Lỗi lấy token:', err.message);
    res.status(500).send('Lỗi đăng nhập');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    const logoutUrl = `${config.serverUrl}/login/oauth/logout?post_logout_redirect_uri=${encodeURIComponent('http://localhost:3000/')}`;
    res.redirect(logoutUrl);
  });
});

app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
  console.log('Truy cập: http://localhost:3000/login để test');
});