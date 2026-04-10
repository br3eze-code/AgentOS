import path from 'path';
import dotenv from 'dotenv';

console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

const envPath = path.join(__dirname, '../../../.env');
console.log('Target .env path:', envPath);

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.log('Dotenv error:', result.error.message);
} else {
  console.log('Dotenv loaded successfully');
  console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
}
