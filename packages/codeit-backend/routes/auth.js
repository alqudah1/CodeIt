const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const { JWT_SECRET, JWT_EXPIRY } = require('../config');
const { recordEvent } = require('../analytics');
const { ageOnDate, studentAgeEligibility } = require('../studentAge');
const { normalizeJourneyId } = require('../analyticsEvents');
const { updateSettings } = require('../progressNotifications');
const { requestPasswordReset, resetPassword, validPassword } = require('../passwordReset');
const { childAccessStatus, createReviewSession } = require('../legacyParentReview');
const { recordUserActivity } = require('../userActivity');

// ── POST /api/signup ───────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { accountType, username, name, email, password, dob, parent_email } = req.body;

  const isStudent = accountType === 'student' || (!!username && !email);

  if (isStudent) {
    if (!username || !username.trim()) return res.status(400).json({ error: 'Username is required' });
    if (!password)                     return res.status(400).json({ error: 'Password is required' });
    if (!dob)                          return res.status(400).json({ error: 'Birthday is required' });

    const eligibility = studentAgeEligibility(dob);
    if (eligibility.reason === 'invalid') {
      return res.status(400).json({ field: 'dob', error: 'Enter a valid birthday.' });
    }
    if (eligibility.reason === 'parent_required') {
      return res.status(403).json({
        code: 'PARENT_ACCOUNT_REQUIRED',
        field: 'dob',
        error: 'Learners under 13 need a parent or guardian to create and manage their access. You can still try CodeIt without an account.',
      });
    }
    if (eligibility.reason === 'adult_account') {
      return res.status(400).json({
        code: 'ADULT_ACCOUNT_REQUIRED',
        field: 'dob',
        error: 'Use the Parent or Educator option for adult accounts.',
      });
    }
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
    void recordEvent('signup_complete', {
      userId: result.insertId,
      journeyId: normalizeJourneyId(req.get('X-CodeIt-Journey')),
      meta: isStudent ? 'student' : 'educator',
    });

    const user_id    = result.insertId;
    const displayName = isStudent ? username.trim() : name.trim();
    const token = jwt.sign({ user_id, role, name: displayName }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    void recordUserActivity(user_id, 'login');

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
    const accountAge = user.dob ? ageOnDate(new Date(user.dob).toISOString().slice(0, 10)) : null;
    const familyAccess = await childAccessStatus(user.user_id, user.dob, user.role);
    if (familyAccess.requiresParentReview) {
      return res.json({
        message: 'Parent review required',
        code: 'PARENT_REVIEW_REQUIRED',
        requiresParentReview: true,
        reviewToken: createReviewSession(user.user_id),
        review: {
          ageGroup: accountAge !== null && accountAge < 13 ? 'under_13' : null,
        },
      });
    }
    const managedProfile = familyAccess.managedProfile;
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, name: displayName, managedProfile },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    void recordUserActivity(user.user_id, 'login');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id:       user.user_id,
        name:     displayName,
        username: user.username,
        email:    user.email,
        role:     user.role,
        managedProfile,
      },
    });
  } catch (err) {
    console.error('Login error:', err.code, err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// ── POST /api/forgot-password ─────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const genericMessage = 'If that email is registered, a reset link is on its way.';
  try {
    await requestPasswordReset(req.body.email);
  } catch (error) {
    console.error('Password reset request error:', error.message);
  }
  res.json({ message: genericMessage });
});

// ── POST /api/reset-password ──────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!validPassword(password)) {
    return res.status(400).json({ error: 'Use at least 10 characters for your new password.' });
  }

  try {
    const result = await resetPassword(token, password);
    if (!result.ok) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    }
    res.json({ message: 'Password updated. You can now sign in.' });
  } catch (error) {
    console.error('Password reset error:', error.message);
    res.status(500).json({ error: 'We could not update your password. Please try again.' });
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
    const result = await updateSettings(payload.user_id, { parentEmail: parent_email });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 400).json({ error: error.message || 'Could not save parent email' });
  }
});

module.exports = router;
