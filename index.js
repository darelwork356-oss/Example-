const db = require('../db');

module.exports = async (req, res) => {
  const { action } = req.query;

  try {
    // NOTES
    if (action === 'get-notes') {
      const { limit = 50, userId } = req.query;
      let query = `SELECT n.*, u.username, u.display_name, u.profile_image_url,
                   (SELECT COUNT(*) FROM note_likes WHERE note_id = n.id) as likes
                   FROM notes n LEFT JOIN users u ON n.user_id = u.id`;
      const params = [];
      if (userId) {
        query += ' WHERE n.user_id = $1';
        params.push(userId);
      }
      query += ' ORDER BY n.created_at DESC LIMIT $' + (params.length + 1);
      params.push(parseInt(limit));
      const result = await db.query(query, params);
      return res.json({ notes: result.rows });
    }

    if (action === 'upload-note') {
      const { content, userId } = req.body;
      if (!content || !userId) return res.status(400).json({ error: 'Missing fields' });
      const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const result = await db.query(
        `INSERT INTO notes (id, user_id, content, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *`,
        [noteId, userId, content]
      );
      return res.json({ success: true, note: result.rows[0] });
    }

    if (action === 'get-user-data') {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: 'Missing userId' });
      const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (result.rows.length === 0) {
        const newUser = await db.query(
          `INSERT INTO users (id, email, username, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *`,
          [userId, `${userId}@beaboo.app`, `user_${userId.substr(0, 8)}`]
        );
        return res.json({ user: newUser.rows[0] });
      }
      return res.json({ user: result.rows[0] });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};
