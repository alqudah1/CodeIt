const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');

const JWT_SECRET = 'Team42*';
const JWT_EXPIRY = '7d';

// ── POST /api/signup ───────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { accountType, username, name, email, password, dob, parent_email } = req.body;

  const isStudent = accountType === 'student' || (!!username && !email);

  if (isStudent) {
    if (!username || !username.trim()) return res.status(400).json({ error: 'Username is required' });
    if (!password)                     return res.status(400).json({ error: 'Password is required' });
    if (!dob)                          return res.status(400).json({ error: 'Birthday is required' });
  } else {
    if (!name || !name.trim())   return res.status(400).json({ error: 'Name is required' });
    if (!email || !email.trim()) return res.status(400).json({ error: 'Email is required' });
    if (!password)               return res.status(400).json({ error: 'Password is required' });
  }

  const role = isStudent ? 'Student' : 'Educator';
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    if (isStudent) {
      const [dup] = await connection.query(
        'SELECT user_id FROM Users WHERE username = ?',
        [username.trim()]
      );
      if (dup.length) {
        await connection.rollback();
        return res.status(400).json({ field: 'username', error: 'That username is already taken — try another one' });
      }
    } else {
      const [dup] = await connection.query(
        'SELECT user_id FROM Users WHERE email = ?',
        [email.trim().toLowerCase()]
      );
      if (dup.length) {
        await connection.rollback();
        return res.status(400).json({ error: 'An account with that email already exists' });
      }
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    let result;

    if (isStudent) {
      [result] = await connection.query(
        'INSERT INTO Users (username, name, password, role, dob, parent_email) VALUES (?, ?, ?, ?, ?, ?)',
        [username.trim(), username.trim(), hashedPassword, role, dob, parent_email || null]
      );
      await connection.query(
        'INSERT INTO Students (user_id, level_id, total_xp, weekly_xp) VALUES (?, 1, 0, 0)',
        [result.insertId]
      );
    } else {
      [result] = await connection.query(
        'INSERT INTO Users (name, email, password, role, dob) VALUES (?, ?, ?, ?, ?)',
        [name.trim(), email.trim().toLowerCase(), hashedPassword, role, dob || null]
      );
    }

    await connection.commit();

    const user_id    = result.insertId;
    const displayName = isStudent ? username.trim() : name.trim();
    const token = jwt.sign({ user_id, role, name: displayName }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    res.json({
      message: isStudent ? 'Student created' : 'Educator created',
      token,
      user: {
        id:       user_id,
        name:     displayName,
        username: isStudent ? username.trim() : null,
        email:    isStudent ? null : email.trim().toLowerCase(),
        role,
      },
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Registration error:', err.code, err.message);
    res.status(500).json({ error: `Registration failed: ${err.message}` });
  } finally {
    if (connection) connection.release();
  }
});

// ── POST /api/login ────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  // Accept 'identifier' (username or email) OR legacy 'email' field
  const identifier = (req.body.identifier || req.body.email || '').trim();
  const { password } = req.body;

  if (!identifier) return res.status(400).json({ error: 'Username or email is required' });
  if (!password)   return res.status(400).json({ error: 'Password is required' });

  let connection;
  try {
    connection = await db.getConnection();
    // Search by email OR username so both student and educator accounts work
    const [results] = await connection.query(
      'SELECT * FROM Users WHERE email = ? OR username = ?',
      [identifier.toLowerCase(), identifier]
    );

    if (!results.length) {
      return res.status(400).json({ error: 'No account found with that username or email' });
    }

    const user = results[0];
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ error: 'Incorrect password' });
    }

    const displayName = user.name || user.username;
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, name: displayName },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id:       user.user_id,
        name:     displayName,
        username: user.username,
        email:    user.email,
        role:     user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err.code, err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// ── POST /api/add-parent-email ─────────────────────────────────────────────────
router.post('/add-parent-email', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload      = jwt.verify(token, JWT_SECRET);
    const { parent_email } = req.body;
    if (!parent_email) return res.status(400).json({ error: 'parent_email is required' });
    await db.query('UPDATE Users SET parent_email = ? WHERE user_id = ?', [parent_email, payload.user_id]);
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'Could not save parent email' });
  }
});

module.exports = router;
