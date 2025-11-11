const jwt = require('jsonwebtoken');
require('dotenv').config();

console.log('=== JWT SECRET TEST ===');
console.log('JWT_SECRET from env:', process.env.JWT_SECRET);
console.log('');

// Create a test token
const testPayload = {
  userId: 999,
  email: 'test@test.com',
  role: 'user',
  type: 'access'
};

const token = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '24h' });
console.log('Generated token:', token.substring(0, 50) + '...');
console.log('');

// Try to verify it
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('✅ SUCCESS: Token verified!');
  console.log('Decoded:', decoded);
} catch (error) {
  console.log('❌ FAILED:', error.message);
}
