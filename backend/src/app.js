require('dotenv').config();

const express = require('express');
const pool = require('./db/db');

const productRoutes = require('./routes/product.routes');
const authRoutes = require('./routes/auth.routes');
const addressRoutes = require('./routes/address.routes');

const app = express();
app.use(express.json());

const PORT = process.env.PORT

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/address', addressRoutes);

app.listen(PORT, async() => {
  console.log(`Server is running....`);

  try{
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0]);
  }
  catch(err){
    console.error('Database connection error:', err.message);
  }

});