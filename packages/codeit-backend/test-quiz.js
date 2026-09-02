// Load .env
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  });
}

const express = require('express');
const cors = require('cors');
const quizRoutes = require('./routes/quiz');
const authRoutes = require('./routes/auth');
const rewardsRoutes = require('./routes/rewards');
const lessonsRoutes = require('./routes/lessons');
const puzzlesRoutes = require('./routes/puzzles');
const journeyRoutes = require('./routes/journey');
const builderRoutes = require('./routes/builder');
const exploreRoutes = require('./routes/explore');
const analyticsRoutes = require('./routes/analytics');
const progressNotificationRoutes = require('./routes/progressNotifications');
const foundingWaitlistRoutes = require('./routes/foundingWaitlist');
const adminRoutes = require('./routes/admin');
const familyRoutes = require('./routes/family');
const understandingRoutes = require('./routes/understanding');
const unlistedRoutes = require('./routes/unlisted');
const activityRoutes = require('./routes/activity');
const billingRoutes = require('./routes/billing');
const { legacyAccessGuard } = require('./legacyParentReview');
const { studioReadiness, studioReadinessMessage } = require('./studioReadiness');

const app = express();
app.set('trust proxy', 1);
// ── Health ────────────────────────────────────────────────────────────────
//
// { ok: true } answered yes while every build in production returned a canned
// starter instead of the child's idea, for an unknown length of time, because
// a missing model key is not an outage: the process starts, the route answers
// 200, and nothing anywhere notices. Health now reports whether the studio can
// do the thing the product is named for. It never reports the key itself.
const healthBody = () => {
  const studio = studioReadiness(process.env);
  return { ok: true, studio: { ready: studio.ready, missing: studio.missing } };
};
app.get('/health', (req, res) => { res.json(healthBody()); });
app.get('/api/health', (req, res) => { res.json(healthBody()); });

// Said once, at boot, in plain words. A line in the log is not a guard, but it
// is the difference between a person seeing this on the day it breaks and
// nobody seeing it for months.
{
  const studio = studioReadiness(process.env);
  if (!studio.ready) console.error(studioReadinessMessage(studio));
}
const configuredOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  'https://codeitlearn.com',
  'https://www.codeitlearn.com',
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
  ...(process.env.VERCEL_BRANCH_URL ? [`https://${process.env.VERCEL_BRANCH_URL}`] : []),
  ...configuredOrigins,
]);

app.use(cors({
  origin(origin, callback) {
    if (
      !origin ||
      allowedOrigins.has(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CodeIt-Journey'],
  credentials: true,
}));

// Stripe signs the raw request body, so this route is mounted before
// express.json and before the account guard — the caller is Stripe, not a user.
app.post(
  '/api/billing/webhook',
  express.raw({ type: 'application/json', limit: '1mb' }),
  billingRoutes.handleWebhook
);

app.use(express.json({ limit: '512kb' }));
app.use('/api', legacyAccessGuard());

app.use('/api/quiz', quizRoutes);
app.use('/api', authRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/puzzles', puzzlesRoutes);
app.use('/api/journey', journeyRoutes);
// The more specific mount goes first: '/api/builder' also matches
// '/api/builder/unlisted', and relying on that falling through is fragile.
app.use('/api/builder/unlisted', unlistedRoutes);
app.use('/api/builder', builderRoutes);
app.use('/api/explore', exploreRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/progress-notifications', progressNotificationRoutes);
app.use('/api/founding-waitlist', foundingWaitlistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/understanding', understandingRoutes);
app.use('/api/billing', billingRoutes);

const PORT = Number(process.env.PORT || 8080);
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
