const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', (req, res) => {
  const { user_id, items } = req.body;
  if (!user_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "user_id and items[] are required" });
  }

  const productIds = items.map(i => i.product_id);

  pool.getConnection((err, conn) => {
    if (err) return res.status(500).json({ error: err.message });

    conn.beginTransaction(async (err) => {
      if (err) {
        conn.release();
        return res.status(500).json({ error: err.message });
      }

      try {
        const placeholders = productIds.map(() => '?').join(',');
        const [products] = await new Promise((resolve, reject) => {
          conn.query(`SELECT * FROM product WHERE product_id IN (${placeholders}) FOR UPDATE`, productIds, (qErr, qRes) => {
            if (qErr) return reject(qErr);
            resolve([qRes]);
          });
        });

        const prodMap = {};
        for (const p of products) prodMap[p.product_id] = p;

        let totalAmount = 0;
        for (const item of items) {
          const p = prodMap[item.product_id];
          if (!p) throw new Error(`Product id ${item.product_id} not found`);
          if (item.quantity <= 0) throw new Error(`Invalid quantity for product ${item.product_id}`);
          if (p.quantity_in_stock < item.quantity) throw new Error(`Insufficient stock for product ${p.product_id} (${p.product_name})`);
          totalAmount += parseFloat(p.price) * parseInt(item.quantity, 10);
        }

        const saleResult = await new Promise((resolve, reject) => {
          conn.query(
            "INSERT INTO sale (user_id, total_amount, sale_date) VALUES (?, ?, NOW())",
            [user_id, totalAmount],
            (iErr, iRes) => {
              if (iErr) return reject(iErr);
              resolve(iRes);
            }
          );
        });

        const saleId = saleResult.insertId;

        for (const item of items) {
          const p = prodMap[item.product_id];
          const subtotal = parseFloat(p.price) * parseInt(item.quantity, 10);

          await new Promise((resolve, reject) => {
            conn.query(
              "INSERT INTO sales_detail (sale_id, product_id, quantity, subtotal) VALUES (?, ?, ?, ?)",
              [saleId, item.product_id, item.quantity, subtotal],
              (dErr, dRes) => {
                if (dErr) return reject(dErr);
                resolve(dRes);
              }
            );
          });

          await new Promise((resolve, reject) => {
            conn.query(
              "UPDATE product SET quantity_in_stock = quantity_in_stock - ? WHERE product_id = ?",
              [item.quantity, item.product_id],
              (uErr, uRes) => {
                if (uErr) return reject(uErr);
                resolve(uRes);
              }
            );
          });
        }

        conn.commit((cErr) => {
          if (cErr) {
            return conn.rollback(() => {
              conn.release();
              res.status(500).json({ error: cErr.message });
            });
          }

          conn.release();
          res.json({ message: "Sale recorded", sale_id: saleId, total_amount: totalAmount });
        });

      } catch (e) {
        conn.rollback(() => {
          conn.release();
          res.status(400).json({ error: e.message });
        });
      }
    });
  });
});

router.get('/', (req, res) => {
  pool.query(
    `SELECT s.sale_id, s.user_id, s.total_amount, s.sale_date, u.username 
     FROM sale s LEFT JOIN users u ON s.user_id = u.user_id ORDER BY s.sale_date DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  pool.query("SELECT * FROM sale WHERE sale_id = ?", [id], (err, saleRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (saleRows.length === 0) return res.status(404).json({ message: "Sale not found" });

    pool.query(
      `SELECT sd.*, p.product_name, p.category 
       FROM sales_detail sd 
       JOIN product p ON sd.product_id = p.product_id
       WHERE sd.sale_id = ?`,
      [id],
      (dErr, details) => {
        if (dErr) return res.status(500).json({ error: dErr.message });
        res.json({ sale: saleRows[0], details });
      }
    );
  });
});

module.exports = router;
