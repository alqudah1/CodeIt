const sql = require('mssql');

const config = {
  user: 'admin_nehal',
  password: 'Te@m42C@pstone',
  server: 'elearning-sql-server.database.windows.net',
  database: 'E_LearningPlatform',
  options: { encrypt: true, trustServerCertificate: true }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(async pool => {
    console.log('Connected to SQL Server');


    /*try {
        const result = await pool.request().query('SELECT * FROM Quiz_questions');
        console.log('Test Query Successful! Quizzes Data:', result.recordset);
      } catch (err) {
        console.error('Test Query Failed:', err);
      }*/

    return pool;
  })
  .catch(err => console.log('Database Connection Failed:', err));

module.exports = { sql, poolPromise };