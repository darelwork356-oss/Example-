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
    const { userId, targetUserId, action } = JSON.parse(event.body);

    if (action === 'follow') {
      await pool.query(
        'INSERT INTO following (user_id, following_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
        [userId, targetUserId]
      );
    } else if (action === 'unfollow') {
      await pool.query(
        'DELETE FROM following WHERE user_id = $1 AND following_id = $2',
        [userId, targetUserId]
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
