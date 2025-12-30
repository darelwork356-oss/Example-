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
    const { content, userId, imageUrl } = JSON.parse(event.body);
    
    if (!content || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await pool.query(
      `INSERT INTO notes (id, user_id, content, image_url, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [noteId, userId, content, imageUrl || null]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, note: result.rows[0] })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
