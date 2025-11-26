import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadUsers() {
  try {
    // קרא את הקובץ המקומי
    const usersPath = path.join(__dirname, '..', 'data', 'users.json');
    const usersData = fs.readFileSync(usersPath, 'utf-8');
    
    // העלה ל-Blob Storage
    const blob = await put('data/users.json', usersData, {
      access: 'public',
      contentType: 'application/json',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log('✅ הקובץ הועלה בהצלחה ל-Blob Storage!');
    console.log('URL:', blob.url);
  } catch (error) {
    console.error('❌ שגיאה בהעלאה:', error);
  }
}

uploadUsers();
