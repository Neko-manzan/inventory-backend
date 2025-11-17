const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', (req, res) => {
  pool.query("SELECT * FROM product", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  pool.query("SELECT * FROM product WHERE product_id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: "Product not found" });
    res.json(results[0]);
  });
});

router.post('/', (req, res) => {
  const { product_name, category, price, quantity_in_stock } = req.body;
  pool.query(
    "INSERT INTO product (product_name, category, price, quantity_in_stock, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
    [product_name, category, price, quantity_in_stock],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Product added", product_id: result.insertId });
    }
  );
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { product_name, category, price, quantity_in_stock } = req.body;
  pool.query(
    "UPDATE product SET product_name=?, category=?, price=?, quantity_in_stock=?, updated_at=NOW() WHERE product_id=?",
    [product_name, category, price, quantity_in_stock, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Product updated" });
    }
  );
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  pool.query("DELETE FROM product WHERE product_id=?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Product deleted" });
  });
});

module.exports = router;
