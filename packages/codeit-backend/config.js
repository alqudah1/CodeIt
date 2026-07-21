'use strict';

function requireEnv(name, { minLength = 1 } = {}) {
  const value = process.env[name];
  if (!value || value.length < minLength) {
    throw new Error(`Missing or invalid required environment variable: ${name}`);
  }
  return value;
}

const dbPort = Number(process.env.DB_PORT || 3306);
if (!Number.isInteger(dbPort) || dbPort < 1 || dbPort > 65535) {
  throw new Error('DB_PORT must be a valid TCP port.');
}

const JWT_SECRET = requireEnv('JWT_SECRET', { minLength: 32 });

const DB_CONFIG = Object.freeze({
  host: requireEnv('DB_HOST'),
  user: requireEnv('DB_USER'),
  password: requireEnv('DB_PASSWORD'),
  database: requireEnv('DB_NAME'),
  port: dbPort,
});

module.exports = {
  DB_CONFIG,
  JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',
};
