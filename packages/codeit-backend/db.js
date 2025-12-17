const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'ls-44f538763910ead9dcd8cb51164a1961379d7f1b.cf06qk4sweo5.ca-central-1.rds.amazonaws.com',
  user: 'elearning',
  password: 'YOUR_DB_PASSWORD',
  database: 'elearning',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL RDS successfully!');
    
    connection.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err);
  }
})();

module.exports = pool;

