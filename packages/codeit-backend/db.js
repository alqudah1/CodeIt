const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'ls-97dee3c51e40df2b3d6f86689a76a4a8d11c5b1d.cfo6qk4sweo5.ca-central-1.rds.amazonaws.com',
  user: 'elearning',                                
  password: 'Mustafa2003',                            
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
