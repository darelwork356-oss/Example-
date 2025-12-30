const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const { userId } = event.queryStringParameters || {};
      
      const result = await pool.query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 50`,
        [userId]
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ notifications: result.rows })
      };
    }

    if (event.httpMethod === 'POST') {
      const { userId, type, message, fromUserId } = JSON.parse(event.body);
      
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await pool.query(
        `INSERT INTO notifications (id, user_id, type, message, from_user_id, created_at, read) 
         VALUES ($1, $2, $3, $4, $5, NOW(), false)`,
        [notifId, userId, type, message, fromUserId]
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
