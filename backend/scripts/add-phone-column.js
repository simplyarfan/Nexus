const database = require('../models/database');

async function addPhoneColumn() {
  try {
    await database.connect();

    // Add phone column to users table if it doesn't exist
    await database.run(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50)
    `);

    console.log('✅ Successfully added phone column to users table');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding phone column:', error.message);
    process.exit(1);
  }
}

addPhoneColumn();
