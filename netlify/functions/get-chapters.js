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
    const { storyId } = event.queryStringParameters || {};
    
    if (!storyId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'storyId required' })
      };
    }

    const result = await pool.query(
      `SELECT * FROM chapters 
       WHERE story_id = $1 
       ORDER BY chapter_number ASC`,
      [storyId]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ chapters: result.rows })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
