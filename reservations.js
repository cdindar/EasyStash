const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

// Middleware: Token prüfen
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Kein Token vorhanden' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token ungültig' });
    }
    req.user = user;
    next();
  });
}

// Schließfach reservieren
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { locker_id, duration_minutes } = req.body;
    const user_id = req.user.userId;
    
    // Prüfen ob Fach verfügbar ist
    const [lockers] = await db.query(
      'SELECT * FROM lockers WHERE id = ? AND is_available = TRUE',
      [locker_id]
    );
    
    if (lockers.length === 0) {
      return res.status(400).json({ error: 'Schließfach nicht verfügbar' });
    }
    
    // QR-Code Token generieren
    const qr_token = crypto.randomBytes(32).toString('hex');
    
    // End-Zeit berechnen
    const end_time = new Date(Date.now() + (duration_minutes || 60) * 60000);
    
    // Reservierung erstellen
    const [result] = await db.query(
      'INSERT INTO reservations (user_id, locker_id, qr_token, end_time) VALUES (?, ?, ?, ?)',
      [user_id, locker_id, qr_token, end_time]
    );
    
    // Schließfach als belegt markieren
    await db.query(
      'UPDATE lockers SET is_available = FALSE WHERE id = ?',
      [locker_id]
    );
    
    res.status(201).json({
      message: 'Schließfach erfolgreich reserviert',
      reservation_id: result.insertId,
      qr_token,
      locker_number: lockers[0].locker_number,
      valid_until: end_time
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Nutzung beenden
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const reservation_id = req.params.id;
    const user_id = req.user.userId;
    
    // Reservierung holen
    const [reservations] = await db.query(
      'SELECT * FROM reservations WHERE id = ? AND user_id = ?',
      [reservation_id, user_id]
    );
    
    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Reservierung nicht gefunden' });
    }
    
    const reservation = reservations[0];
    
    // Token ungültig machen
    await db.query(
      'UPDATE reservations SET token_valid = FALSE WHERE id = ?',
      [reservation_id]
    );
    
    // Schließfach wieder freigeben
    await db.query(
      'UPDATE lockers SET is_available = TRUE WHERE id = ?',
      [reservation.locker_id]
    );
    
    res.json({ message: 'Nutzung beendet, Schließfach freigegeben' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// QR-Code verifizieren (für ESP32)
router.post('/verify', async (req, res) => {
  try {
    const { qr_token } = req.body;
    
    // Token prüfen
    const [reservations] = await db.query(
      'SELECT * FROM reservations WHERE qr_token = ? AND token_valid = TRUE',
      [qr_token]
    );
    
    if (reservations.length === 0) {
      return res.status(401).json({ 
        valid: false, 
        message: 'Token ungültig oder abgelaufen' 
      });
    }
    
    const reservation = reservations[0];
    
    // Zeitprüfung
    if (new Date() > new Date(reservation.end_time)) {
      return res.status(401).json({ 
        valid: false, 
        message: 'Reservierung abgelaufen' 
      });
    }
    
    // Zugriff protokollieren
    await db.query(
      'INSERT INTO access_logs (reservation_id) VALUES (?)',
      [reservation.id]
    );
    
    res.json({ 
      valid: true, 
      message: 'Zugriff gewährt',
      locker_id: reservation.locker_id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;