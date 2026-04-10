console.log('Node.js test starting...');
console.log('CWD:', process.cwd());
console.log('Env:', process.env.NODE_ENV);
console.log('Node version:', process.version);
try {
  const path = require('path');
  console.log('Path module loaded.');
} catch (e) {
  console.error('Core module load failed:', e);
}
console.log('Success.');
