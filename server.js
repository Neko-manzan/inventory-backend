const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const productRoutes = require('./routes/product');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// register routes
app.use('/products', productRoutes);

app.listen(3000, () => {
  console.log('Backend server running on port 3000');
});
