const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- MySQL connection ---
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password3', // your MySQL password
  database: 'travelease'
});

db.connect(err => {
  if (err) {
    console.error('MySQL connection failed:', err);
  } else {
    console.log(' Connected to MySQL database.');
  }
});
db.query('SELECT 1', (err) => {
  if (err) console.error('TEST QUERY FAILED:', err);
  else console.log('TEST QUERY OK');
});


// --- JWT Middleware ---
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, 'secretkey', (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = decoded; // contains user id and email
    next();
  });
}

// --- Register Route ---
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, hashedPassword],
    (err) => {
      if (err) {
        console.error('REGISTER ERROR:', err);

        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Email already registered' });
        }

        return res.status(500).json({
          message: err.sqlMessage || 'Database error'
        });
      }

      res.status(201).json({ message: 'User registered successfully' });
    }
  );
});



// --- Login Route ---
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, result) => {
    if (err) {console.error('DB ERROR:', err);
return res.status(500).json({ error: err.code, message: err.sqlMessage });}

    if (result.length === 0)
      return res.status(401).json({ message: 'Invalid email or password' });

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, email: user.email }, 'secretkey', { expiresIn: '1h' });

    res.json({
      message: 'Login successful',
      token,
      userId: user.id,
      username: user.username
    });
  });
});

// --- Create Booking Route ---
app.post('/api/bookings', verifyToken, (req, res) => {
  const { packageName, travelers, totalPrice } = req.body;
  const userId = req.user.id; // comes from JWT

  if (!packageName || !travelers || !totalPrice) {
    return res.status(400).json({ message: 'All booking fields required' });
  }

  db.query(
    'INSERT INTO bookings (userId, packageName, travelers, totalPrice) VALUES (?, ?, ?, ?)',
    [userId, packageName, travelers, totalPrice],
    (err, result) => {
      if (err) {
  console.error('Booking insert error:', err);
  return res.status(500).json({
    message: 'Booking failed',
    error: err.sqlMessage
  });
}


      res.status(201).json({
        message: 'Booking successful',
        bookingId: result.insertId
      });
    }
  );
});

// --- Get Bookings for Logged-in User ---
app.get('/api/mybookings', verifyToken, (req, res) => {
  const userId = req.user.id;
  db.query('SELECT * FROM bookings WHERE userId = ?', [userId], (err, results) => {
    if (err) {
      console.error('Fetch bookings error:', err);
      return res.status(500).json({ message: 'Failed to fetch bookings' });
    }
    res.json(results);
  });
});

app.listen(5000, () => console.log(' Server running on http://localhost:5000'));
