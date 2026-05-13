const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Test-Route
app.get('/', (req, res) => {
  res.json({ message: 'EasyStash Backend läuft! ✅' });
});

app.listen(process.env.PORT, () => {
  console.log(`Server läuft auf http://localhost:${process.env.PORT}`);
});