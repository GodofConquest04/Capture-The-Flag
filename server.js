const express = require('express');
const mysql = require('mysql2');
const { exec } = require('child_process');
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const supportFile = path.join(__dirname, 'messages.json');
const flagFile = path.join(__dirname, 'flag.txt');
const JWT_SECRET = 'S3lfm@de_N1nj@_s3cr3t_k3y';
const FLAG = 'SelfmadeNinja{X$$_f1@g_thr0ugh_cH@t}';
const PLACEHOLDER = 'execute_xss';
const COMMAND_FLAG = 'SelfmadeNinja{C0mm@nd_1nj3ct10n_f1@g}';
const PROFILE_FLAG = 'SelfmadeNinja{1D0R_fl@g_thr0ugh_@dm1n}';
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'ctfuser',
  password: process.env.DB_PASSWORD || 'ctfpass',
  database: process.env.DB_NAME || 'ctfdb'
});

db.connect(err => {
  if (err) {
    console.error('DB connection error:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL');
});

function authenticateToken(req, res, next) {
  if (req.path === '/' || req.path === '/login') return next();
  const token = req.cookies.token;
  if (!token) return res.status(401).send('Access denied, token missing');
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Invalid or expired token');
    req.user = user;
    next();
  });
}

app.use(authenticateToken);

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.post('/login', (req, res) => {
  const username = req.body.username || '';
  const password = req.body.password || '';
  const q = `SELECT * FROM users WHERE username='${username}' AND password='${password}' LIMIT 1;`;
  db.query(q, (err, results) => {
    if (err) return res.status(500).send('Server error');
    if (!results || results.length === 0) return res.send('<h3>Invalid credentials</h3>');
    const user = results[0];
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 3600000 });
    return res.redirect('/dashboard');
  });
});

app.get('/dashboard', (req, res) => {
  const username = req.user.username;
  let dashboardHtml = fs.readFileSync(path.join(__dirname, 'public', 'dashboard.html'), 'utf8');
  if (username === 'admin') {
    db.query('SELECT flag FROM flags LIMIT 1', (fErr, fRes) => {
      if (fErr) return res.status(500).send('Server error');
      dashboardHtml = dashboardHtml.replace('%%FLAG_SECTION%%', `<div class="flag">Flag: ${fRes[0].flag}</div>`);
      dashboardHtml = dashboardHtml.replace('%%USERNAME%%', username);
      res.send(dashboardHtml);
    });
  } else {
    dashboardHtml = dashboardHtml.replace('%%FLAG_SECTION%%', '');
    dashboardHtml = dashboardHtml.replace('%%USERNAME%%', username);
    res.send(dashboardHtml);
  }
});

app.get('/chat', (req, res) => {
  let messages = [];
  if (fs.existsSync(supportFile)) messages = JSON.parse(fs.readFileSync(supportFile, 'utf8'));
  const chatHtmlTemplate = fs.readFileSync(path.join(__dirname, 'public', 'chat.html'), 'utf8');
  const messagesHtml = messages.map(m =>
    `<div class="message"><span class="username">${m.username}</span>: ${m.message}</div>`
  ).join('');
  const chatHtml = chatHtmlTemplate.replace('%%MESSAGES%%', messagesHtml);
  res.send(chatHtml);
});

app.get('/chat/messages', (req, res) => {
  let messages = [];
  if (fs.existsSync(supportFile)) messages = JSON.parse(fs.readFileSync(supportFile, 'utf8'));
  res.json(messages);
});

app.post('/chat', (req, res) => {
  const username = req.user.username;
  const { message } = req.body;
  if (!message) return res.status(400).send('Message required');

  let messages = [];
  if (fs.existsSync(supportFile)) messages = JSON.parse(fs.readFileSync(supportFile, 'utf8'));
  messages.push({ username, message, timestamp: new Date().toISOString() });
  fs.writeFileSync(supportFile, JSON.stringify(messages, null, 2));

  if (message.includes('<script>') || message.includes('onerror') || message.includes('onmouseover')) {
    fs.writeFileSync(flagFile, FLAG);
  }

  res.sendStatus(200);
});

app.get('/flag.txt', (req, res) => {
  if (fs.existsSync(flagFile)) {
    res.sendFile(flagFile);
  } else {
    res.send(PLACEHOLDER);
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

app.get('/dashboard/user', (req, res) => res.json({ username: req.user.username }));
app.get('/dashboard/flag', (req, res) => {
  if (req.user.username !== 'admin') {
    return res.status(403).send('Access denied');
  }

  db.query('SELECT flag FROM flags LIMIT 1', (err, results) => {
    if (err || !results || results.length === 0) {
      return res.status(500).send('Flag not found');
    }
    res.json({ flag: results[0].flag });
  });
});


app.get('/lookup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'lookup.html'));
});

app.post('/lookup', (req, res) => {
  const { host } = req.body;
  if (!host) return res.send('Please provide a host');

  if (host.includes(';') || host.includes('&') || host.includes('|')) {
    fs.writeFileSync(flagFile, FLAG);
    return res.send(`<pre>${COMMAND_FLAG}</pre><a href="/lookup">Back</a>`);
  }

  exec(`ping -c 4 ${host}`, (err, stdout, stderr) => {
    let output;
    if (err) output = stderr || err.message;
    else output = stdout;

    res.send(`<pre>${output}</pre><a href="/lookup">Back</a>`);
  });
});

app.get('/profile.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/profile', (req, res) => {
  if (!req.query.username) {
    if (req.user && req.user.username) {
      return res.redirect(`/profile?username=${req.user.username}`);
    } else {
      return res.send('User not found');
    }
  }

  const requestedUser = req.query.username;

  db.query(
    'SELECT username FROM users WHERE username = ?',
    [requestedUser],
    (err, results) => {
      if (err) return res.status(500).send('Server error');
      if (!results || results.length === 0) return res.send('User not found');

      const user = results[0];
      let html = fs.readFileSync(path.join(__dirname, 'public', 'profile.html'), 'utf8');
      html = html.replace('%%USERNAME%%', user.username);

      if (user.username === 'admin') {
        html = html.replace('%%FLAG%%', `<div class="flag">Flag: ${PROFILE_FLAG}</div>`);
      } else {
        html = html.replace('%%FLAG%%', '');
      }

      res.send(html);
    }
  );
});
const PORT = 3000;
app.listen(PORT, () => console.log(`App listening on port ${PORT}`));
