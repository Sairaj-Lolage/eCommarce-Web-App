require('dotenv').config();

const express = require('express');
const pool = require('./db/db');

const app = express();

const PORT = process.env.PORT

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

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