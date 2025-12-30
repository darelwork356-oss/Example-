const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userId } = JSON.parse(event.body);
    
    // Verificar notas en las últimas 24 horas
    const notesCount = await pool.query(
      `SELECT COUNT(*) FROM notes 
       WHERE user_id = $1 
       AND created_at > NOW() - INTERVAL '24 hours'`,
      [userId]
    );

    const dailyLimit = 10;
    const remaining = dailyLimit - parseInt(notesCount.rows[0].count);

    return {
      statusCode: 200,
      body: JSON.stringify({
        canPost: remaining > 0,
        remaining: Math.max(0, remaining),
        limit: dailyLimit
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
