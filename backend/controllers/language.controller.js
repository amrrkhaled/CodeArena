const db = require('../config/db');

const getLanguages = async (req, res) => {
  try {
    const languages = await db.query('SELECT * FROM languages');
    res.status(200).json(languages.rows);
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getLanguages };
