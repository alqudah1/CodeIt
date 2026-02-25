const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = 'Team42*'; 

router.post('/signup', async (req, res) => {
  console.log('Signup endpoint reached. Body:', req.body);
  const { name, email, password, dob, parent_email } = req.body;
  // Default to Student — the register form is student-facing; admins are created separately
  const role = 'Student';

  if (!name || !email || !password || !dob) {
    console.log('Validation failed: Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    
    // Start transaction BEFORE any database operations
    await connection.beginTransaction();
    
    console.time('User exists check');
    const [results] = await connection.query('SELECT * FROM Users WHERE email = ?', [email]);
    console.timeEnd('User exists check');

    if (results.length) {
      console.log('User already exists:', email);
      await connection.rollback();
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

    // Create Student record (role is always Student from the public form)
    console.time('Students insert');
    await connection.query(
      'INSERT INTO Students (user_id, level_id, total_xp, weekly_xp) VALUES (?, 1, 0, 0)',
      [user_id]
    );
    console.timeEnd('Students insert');
    console.log('Student creation successful for user_id:', user_id);

    // Commit the entire transaction
    await connection.commit();
    console.log('✅ Transaction committed successfully');

    // Issue a JWT so the client can auto-login immediately after signup
    const token = jwt.sign(
      { user_id, role, name },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Student created',
      token,
      user: { id: user_id, name, role },
    });
  } catch (err) {
    if (connection) {
      console.log('🔄 Rolling back transaction due to error');
      await connection.rollback();
    }
    console.error('❌ Registration error:', err.code, err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: `Registration failed: ${err.message}` });
  } finally {
    if (connection) {
      connection.release();
      console.log('🔌 Database connection released');
    }
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
    console.log('Generated token payload:', { user_id: user.user_id, role: user.role, name: user.name });
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.user_id, name: user.name, role: user.role } 
    });
  } catch (err) {
    console.error('Unexpected error:', err.code, err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
});
module.exports = router;