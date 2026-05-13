const express = require('express');
const db = require('../db');

const router = express.Router();

// Alle verfügbaren Schließfächer anzeigen
router.get('/', async (req, res) => {
  try {
    const [lockers] = await db.query(
      'SELECT * FROM lockers WHERE is_available = TRUE'
    );
    
    res.json({ 
      message: 'Verfügbare Schließfächer',
      count: lockers.length,
      lockers 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alle Schließfächer anzeigen (auch belegte)
router.get('/all', async (req, res) => {
  try {
    const [lockers] = await db.query('SELECT * FROM lockers');
    
    res.json({ 
      message: 'Alle Schließfächer',
      count: lockers.length,
      lockers 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;