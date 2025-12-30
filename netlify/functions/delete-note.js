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
    
    // Verificar que el usuario es el dueño
    const note = await pool.query(
      'SELECT user_id FROM notes WHERE id = $1',
      [noteId]
    );

    if (note.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Note not found' })
      };
    }

    if (note.rows[0].user_id !== userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    await pool.query('DELETE FROM notes WHERE id = $1', [noteId]);

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
