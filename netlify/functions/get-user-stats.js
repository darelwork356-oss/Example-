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
    const { userId } = event.queryStringParameters || {};
    
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId required' })
      };
    }

    const [stories, followers, following] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM stories WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) FROM following WHERE following_id = $1', [userId]),
      pool.query('SELECT COUNT(*) FROM following WHERE user_id = $1', [userId])
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        stories: parseInt(stories.rows[0].count),
        followers: parseInt(followers.rows[0].count),
        following: parseInt(following.rows[0].count)
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
