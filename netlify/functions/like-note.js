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
    const { noteId, userId } = JSON.parse(event.body);
    
    // Verificar si ya dio like
    const checkLike = await pool.query(
      'SELECT * FROM note_likes WHERE note_id = $1 AND user_id = $2',
      [noteId, userId]
    );

    if (checkLike.rows.length > 0) {
      return {
        statusCode: 429,
        body: JSON.stringify({ message: 'Ya diste like a esta nota' })
      };
    }

    // Insertar like
    await pool.query(
      'INSERT INTO note_likes (note_id, user_id, created_at) VALUES ($1, $2, NOW())',
      [noteId, userId]
    );

    // Contar likes
    const countResult = await pool.query(
      'SELECT COUNT(*) as likes FROM note_likes WHERE note_id = $1',
      [noteId]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ likes: parseInt(countResult.rows[0].likes) })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
