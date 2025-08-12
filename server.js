const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/login', (req, res) => {
  const username = req.body.username || '';
  const password = req.body.password || '';

  const q = `SELECT * FROM users WHERE username='${username}' AND password='${password}' LIMIT 1;`;
  console.log('Query:', q);

  db.query(q, (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).send('Server error');
    }

    if (!results || results.length === 0) {
      return res.send('<h3>Invalid credentials</h3>');
    }

    const user = results[0];
    if (user.username === 'admin') {
      db.query('SELECT flag FROM flags LIMIT 1', (fErr, fRes) => {
        if (fErr) {
          console.error('Flag read error:', fErr);
          return res.status(500).send('Server error');
        }
        return res.send(`<h3>Welcome admin</h3><p>Flag: ${fRes[0].flag}</p>`);
      });
    } else {
      return res.send(`<h3>Welcome ${user.username}</h3>`);
    }
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
