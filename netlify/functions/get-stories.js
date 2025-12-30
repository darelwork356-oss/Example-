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
    const { userId, limit = 50 } = event.queryStringParameters || {};
    
    let query = `
      SELECT s.*, u.username, u.profile_image_url,
      (SELECT COUNT(*) FROM story_views WHERE story_id = s.id) as views
      FROM stories s
      LEFT JOIN users u ON s.user_id = u.id
    `;
    
    const params = [];
    if (userId) {
      query += ' WHERE s.user_id = $1';
      params.push(userId);
    }
    
    query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);

    return {
      statusCode: 200,
      body: JSON.stringify({ stories: result.rows })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
