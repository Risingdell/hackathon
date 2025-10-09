const { Pool } = require('pg');

// TODO: For production, use environment variables from .env file
// require('dotenv').config();
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'employee',
  password: '2032',
  port: 5432,
});

module.exports = pool;
