const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = 'your-jwt-secret-key'; 

router.post('/signup', async (req, res) => {
  console.log('Signup endpoint reached. Body:', req.body);
  const { name, email, password, role, dob, parent_email } = req.body;

  if (!name || !email || !password || !role || !dob) {
    console.log('Validation failed: Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (role !== 'Student' && role !== 'Admin') {
    console.log('Validation failed: Invalid role');
    return res.status(400).json({ error: 'Invalid role. Must be Student or Admin' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    console.time('User exists check');
    const [results] = await connection.query('SELECT * FROM Users WHERE email = ?', [email]);
    console.timeEnd('User exists check');

    if (results.length) {
      console.log('User already exists:', email);
      return res.status(400).json({ error: 'User exists' });
    }

    console.time('Password hashing');
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    console.timeEnd('Password hashing');

    console.time('Users insert');
    const [result] = await connection.query(
      'INSERT INTO Users (name, email, password, role, dob, parent_email) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, dob, parent_email || null]
    );
    console.timeEnd('Users insert');
    const user_id = result.insertId;
    console.log('User inserted, user_id:', user_id);

    await connection.beginTransaction();

    if (role === 'Student') {
      console.time('Students insert');
      await connection.query(
        'INSERT INTO Students (user_id, level_id, parent_id, total_xp) VALUES (?, 1, NULL, 0)',
        [user_id]
      );
      console.timeEnd('Students insert');

      console.time('Leaderboards insert');
      await connection.query(
        'INSERT INTO Leaderboards (student_id, rank_position, xp_points) VALUES (?, 0, 0)',
        [user_id]
      );
      console.timeEnd('Leaderboards insert');

      console.log('Student creation successful for user_id:', user_id);
    } else if (role === 'Admin') {
      console.time('Admins insert');
      await connection.query(
        'INSERT INTO Admins (user_id, permissions) VALUES (?, ?)',
        [user_id, 'default']
      );
      console.timeEnd('Admins insert');

      console.log('Admin creation successful for user_id:', user_id);
    }

    await connection.commit();
    res.json({ message: `${role} created`, user_id });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Unexpected error:', err.code, err.message, err.stack);
    res.status(500).json({ error: `Server error: ${err.message}` });
  } finally {
    if (connection) connection.release();
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login endpoint reached. Body:', { email });

  let connection;
  try {
    connection = await db.getConnection();
    const [results] = await connection.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (!results.length) return res.status(400).json({ error: 'User not found' });

    const user = results[0];
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ user_id: user.user_id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token, user: { name: user.name, role: user.role } });
  } catch (err) {
    console.error('Unexpected error:', err.code, err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;