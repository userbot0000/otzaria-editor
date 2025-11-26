import { saveJSON } from '../src/lib/r2-storage.js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function initStorage() {
  console.log('🚀 Initializing Backblaze B2 storage...')
  
  try {
    // יצירת קובץ users ריק
    await saveJSON('data/users.json', [])
    console.log('✅ Created data/users.json')
    
    // יצירת קובץ books ריק
    await saveJSON('data/books.json', [])
    console.log('✅ Created data/books.json')
    
    console.log('🎉 Storage initialized successfully!')
  } catch (error) {
    console.error('❌ Error initializing storage:', error)
    process.exit(1)
  }
}

initStorage()
