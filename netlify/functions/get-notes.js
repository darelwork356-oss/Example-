const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { limit = 50, userId } = event.queryStringParameters || {};
    
    let query = `
      SELECT n.*, u.username, u.display_name, u.profile_image_url,
      (SELECT COUNT(*) FROM note_likes WHERE note_id = n.id) as likes
      FROM notes n 
      LEFT JOIN users u ON n.user_id = u.id
    `;
    
    const params = [];
    if (userId) {
      query += ' WHERE n.user_id = $1';
      params.push(userId);
    }
    
    query += ` ORDER BY n.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);

    return {
      statusCode: 200,
      body: JSON.stringify({ notes: result.rows })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
