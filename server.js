// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const productRoutes = require('./routes/product');
const usersRoutes = require('./routes/users');
const salesRoutes = require('./routes/sales');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/products', productRoutes);
app.use('/users', usersRoutes);
app.use('/sales', salesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
