'use strict';

const { DATABASE_URL, DB_CONFIG } = require('./config');

if (!DATABASE_URL) {
  const mysql = require('mysql2/promise');
  const pool = mysql.createPool({
    ...DB_CONFIG,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  module.exports = pool;
} else {
  const { Pool } = require('pg');
  const postgresPool = new Pool({
    connectionString: DATABASE_URL,
    max: Number(process.env.DB_POOL_SIZE || 5),
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  function placeholders(sql) {
    let index = 0;
    let quote = null;
    let result = '';
    for (let i = 0; i < sql.length; i += 1) {
      const character = sql[i];
      if (quote) {
        result += character;
        if (character === quote && sql[i - 1] !== '\\') quote = null;
      } else if (character === "'" || character === '"') {
        quote = character;
        result += character;
      } else if (character === '?') {
        index += 1;
        result += `$${index}`;
      } else {
        result += character;
      }
    }
    return result;
  }

  function postgresSql(rawSql) {
    let sql = String(rawSql).trim();
    if (/^CREATE TABLE IF NOT EXISTS\b/i.test(sql)) return { skip: true };
    if (/^SHOW COLUMNS FROM analytics_events LIKE\b/i.test(sql)) {
      return { rows: [{ Field: sql.includes('journey_id') ? 'journey_id' : 'campaign_code' }] };
    }
    sql = sql
      .replace(/\bINSERT\s+IGNORE\s+INTO\b/gi, 'INSERT INTO')
      .replace(/\bCURRENT_DATE\(\)/gi, 'CURRENT_DATE')
      .replace(/\bCURDATE\(\)/gi, 'CURRENT_DATE')
      .replace(/DATE_SUB\(NOW\(\),\s*INTERVAL\s+(\d+)\s+(DAY|MONTH|SECOND)\)/gi,
        (_, amount, unit) => `NOW() - INTERVAL '${amount} ${unit.toLowerCase()}'`)
      .replace(/NOW\(\)\s*-\s*INTERVAL\s+(\d+)\s+(DAY|MONTH|SECOND)/gi,
        (_, amount, unit) => `NOW() - INTERVAL '${amount} ${unit.toLowerCase()}'`)
      .replace(/CURRENT_DATE\s*-\s*INTERVAL\s+(\d+)\s+DAY/gi,
        (_, amount) => `CURRENT_DATE - INTERVAL '${amount} days'`)
      .replace(/DATE_FORMAT\(([^,]+),\s*'%Y-%m-%d'\)/gi, "TO_CHAR($1, 'YYYY-MM-DD')")
      .replace(/TIMESTAMPDIFF\(YEAR,\s*([^,]+),\s*CURRENT_DATE\)/gi,
        'EXTRACT(YEAR FROM AGE(CURRENT_DATE, $1))');
    sql = sql.replace(/;\s*$/, '');
    if (/^INSERT\b/i.test(sql) && !/\bON CONFLICT\b/i.test(sql)) {
      sql += /\bRETURNING\b/i.test(sql) ? '' : ' RETURNING *';
    } else if (/^INSERT\b/i.test(sql) && !/\bRETURNING\b/i.test(sql)) {
      sql += ' RETURNING *';
    }
    return { sql: placeholders(sql) };
  }

  function mysqlResult(result, sql) {
    if (/^SELECT\b|^WITH\b/i.test(String(sql).trim())) return [result.rows, result.fields || []];
    const first = result.rows?.[0] || {};
    const insertId = first.id ?? first.user_id ?? first.attempt_id ?? first.student_id ?? 0;
    return [{ affectedRows: result.rowCount, insertId, rows: result.rows }, result.fields || []];
  }

  async function run(client, sql, params = []) {
    const converted = postgresSql(sql);
    if (converted.skip) return [{ affectedRows: 0, insertId: 0 }, []];
    if (converted.rows) return [converted.rows, []];
    const result = await client.query(converted.sql, params);
    return mysqlResult(result, converted.sql);
  }

  const adapter = {
    dialect: 'postgres',
    query(sql, params) {
      return run(postgresPool, sql, params);
    },
    async getConnection() {
      const client = await postgresPool.connect();
      return {
        query(sql, params) { return run(client, sql, params); },
        beginTransaction() { return client.query('BEGIN'); },
        commit() { return client.query('COMMIT'); },
        rollback() { return client.query('ROLLBACK'); },
        release() { client.release(); },
      };
    },
    end() { return postgresPool.end(); },
  };

  module.exports = adapter;
}
