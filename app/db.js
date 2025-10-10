const { Pool } = require('pg');

// Global pool variable
let pool = null;

// Default configuration
const defaultConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'employee',
  password: '2032',
  port: 5432,
};

// Initialize with default configuration
pool = new Pool(defaultConfig);

// Function to create a new pool with custom configuration
const updatePoolConfig = (config) => {
  // Close existing pool if it exists
  if (pool) {
    pool.end().catch(err => console.error('Error closing pool:', err));
  }

  // Create new pool with provided configuration
  pool = new Pool({
    user: config.user,
    host: config.host,
    database: config.database,
    password: config.password,
    port: config.port,
  });

  return pool;
};

// Function to get the current pool
const getPool = () => {
  if (!pool) {
    pool = new Pool(defaultConfig);
  }
  return pool;
};

// Function to test connection
const testConnection = async (config) => {
  let testPool = null;
  try {
    testPool = new Pool(config);
    const client = await testPool.connect();
    await client.query('SELECT 1');
    client.release();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    if (testPool) {
      await testPool.end();
    }
  }
};

module.exports = {
  getPool,
  updatePoolConfig,
  testConnection,
  // For backward compatibility, export pool directly
  get pool() {
    return getPool();
  }
};
