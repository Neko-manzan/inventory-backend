const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');


router.get('/', (req, res) => {
  pool.query("SELECT user_id, username, fullname, role, created_at, updated_at FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, fullname, role } = req.body;
    if (!username || !password || !fullname || !role) {
      return res.status(400).json({ message: "username, password, fullname and role are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    pool.query(
      "INSERT INTO users (username, password, fullname, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [username, hashedPassword, fullname, role],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "User registered", user_id: result.insertId });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "username and password required" });

  pool.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(400).json({ message: "User not found" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Incorrect password" });

    res.json({
      message: "Login successful",
      user: {
        user_id: user.user_id,
        username: user.username,
        fullname: user.fullname,
        role: user.role
      }
    });
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  pool.query("DELETE FROM users WHERE user_id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "User deleted" });
  });
});

module.exports = router;
