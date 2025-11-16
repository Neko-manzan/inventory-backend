const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all products
router.get('/', (req, res) => {
  db.query("SELECT * FROM product", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// ADD a product
router.post('/', (req, res) => {
  const { product_name, category, price, quantity_in_stock } = req.body;

  db.query(
    "INSERT INTO product (product_name, category, price, quantity_in_stock, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
    [product_name, category, price, quantity_in_stock],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Product added", product_id: result.insertId });
    }
  );
});

// UPDATE a product
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { product_name, category, price, quantity_in_stock } = req.body;

  db.query(
    "UPDATE product SET product_name=?, category=?, price=?, quantity_in_stock=?, updated_at=NOW() WHERE product_id=?",
    [product_name, category, price, quantity_in_stock, id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Product updated" });
    }
  );
});

// DELETE a product
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM product WHERE product_id=?", [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Product deleted" });
  });
});

module.exports = router;
