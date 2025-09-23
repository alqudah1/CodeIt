const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'elearning.cqr0so48udnk.us-east-1.rds.amazonaws.com', 
  user: 'admin',                                
  password: 'yaan*23AUG',                            
  database: 'elearning',                      
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection once at startup
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
