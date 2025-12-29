const db = require('../db');

module.exports = async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    return res.json({ 
      success: true, 
      message: 'Database connected',
      time: result.rows[0].now 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Check DATABASE_URL variable'
    });
  }
};
