const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

// Registrierung
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Passwort verschlüsseln
    const password_hash = await bcrypt.hash(password, 10);
    
    // User in Datenbank speichern
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, password_hash]
    );
    
    res.status(201).json({ 
      message: 'User erfolgreich registriert',
      userId: result.insertId 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // User aus Datenbank holen
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Email oder Passwort falsch' });
    }
    
    const user = users[0];
    
    // Passwort prüfen
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Email oder Passwort falsch' });
    }
    
    // JWT Token erstellen
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ 
      message: 'Login erfolgreich',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;