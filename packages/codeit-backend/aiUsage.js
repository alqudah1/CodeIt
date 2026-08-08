'use strict';

const pool = require('./db');
const { estimateCostUSD } = require('./aiUsagePricing');

const OPERATIONS = new Set([
  'build_initial',
  'build_retry',
  'polish',
  'edit',
  'edit_retry',
  'explain',
  'element_patch',
  'missions',
]);

const tableReady = pool.dialect === 'postgres' ? Promise.resolve(true) : pool.query(`
  CREATE TABLE IF NOT EXISTS ai_usage_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    operation VARCHAR(32) NOT NULL,
    model VARCHAR(80) NOT NULL,
    input_tokens INT UNSIGNED NOT NULL DEFAULT 0,
    output_tokens INT UNSIGNED NOT NULL DEFAULT 0,
    cache_creation_input_tokens INT UNSIGNED NOT NULL DEFAULT 0,
    cache_read_input_tokens INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ai_usage_created (created_at),
    INDEX idx_ai_usage_operation (operation, created_at)
  ) ENGINE=InnoDB
`).then(async () => {
  try {
    await pool.query(
      'DELETE FROM ai_usage_events WHERE created_at < DATE_SUB(NOW(), INTERVAL 13 MONTH)'
    );
  } catch (err) {
    console.error('AI usage retention cleanup failed:', err.message);
  }
  return true;
}).catch((err) => {
  console.error('AI usage table initialization failed:', err.message);
  return false;
});

function tokenCount(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

async function recordAIUsage(operation, message) {
  if (!OPERATIONS.has(operation) || !message?.usage || typeof message.model !== 'string') return false;

  const usage = {
    input_tokens: tokenCount(message.usage.input_tokens),
    output_tokens: tokenCount(message.usage.output_tokens),
    cache_creation_input_tokens: tokenCount(message.usage.cache_creation_input_tokens),
    cache_read_input_tokens: tokenCount(message.usage.cache_read_input_tokens),
  };

  try {
    if (!await tableReady) return false;
    await pool.query(
      `INSERT INTO ai_usage_events
       (operation, model, input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        operation,
        message.model.slice(0, 80),
        usage.input_tokens,
        usage.output_tokens,
        usage.cache_creation_input_tokens,
        usage.cache_read_input_tokens,
      ]
    );
    return true;
  } catch (err) {
    console.error('AI usage write failed:', err.message);
    return false;
  }
}

async function getAIUsageReport(requestedDays = 30) {
  const days = [7, 30, 90].includes(Number(requestedDays)) ? Number(requestedDays) : 30;

  try {
    if (!await tableReady) return null;
    const [rows] = await pool.query(
      `SELECT operation, model, COUNT(*) AS calls,
              SUM(input_tokens) AS input_tokens,
              SUM(output_tokens) AS output_tokens,
              SUM(cache_creation_input_tokens) AS cache_creation_input_tokens,
              SUM(cache_read_input_tokens) AS cache_read_input_tokens
       FROM ai_usage_events
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
       GROUP BY operation, model
       ORDER BY operation, model`
    );

    const operations = rows.map((row) => {
      const usage = {
        input_tokens: Number(row.input_tokens) || 0,
        output_tokens: Number(row.output_tokens) || 0,
        cache_creation_input_tokens: Number(row.cache_creation_input_tokens) || 0,
        cache_read_input_tokens: Number(row.cache_read_input_tokens) || 0,
      };
      return {
        operation: row.operation,
        model: row.model,
        calls: Number(row.calls) || 0,
        ...usage,
        estimated_usd: estimateCostUSD(row.model, usage),
      };
    });

    const totals = operations.reduce((sum, row) => ({
      calls: sum.calls + row.calls,
      input_tokens: sum.input_tokens + row.input_tokens,
      output_tokens: sum.output_tokens + row.output_tokens,
      estimated_usd: row.estimated_usd == null || sum.estimated_usd == null
        ? null
        : sum.estimated_usd + row.estimated_usd,
    }), { calls: 0, input_tokens: 0, output_tokens: 0, estimated_usd: 0 });

    return { days, totals, operations };
  } catch (err) {
    console.error('AI usage report failed:', err.message);
    return null;
  }
}

module.exports = { getAIUsageReport, recordAIUsage };
