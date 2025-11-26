import { MongoClient } from 'mongodb'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const uri = process.env.DATABASE_URL
const client = new MongoClient(uri)

async function loadBackup() {
  try {
    console.log('🚀 Loading users backup to MongoDB...')
    
    // קרא את קובץ הגיבוי
    const backupPath = 'C:/Users/חיים/Downloads/dev_data_users.json'
    
    if (!fs.existsSync(backupPath)) {
      console.error('❌ Backup file not found at:', backupPath)
      console.log('Please provide the correct path to the backup file')
      return
    }
    
    const usersData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'))
    console.log(`📄 Found ${usersData.length} users in backup`)
    
    // התחבר ל-MongoDB
    await client.connect()
    const db = client.db('otzaria')
    const collection = db.collection('files')
    
    console.log('✅ Connected to MongoDB')
    
    // שמור את קובץ המשתמשים
    await collection.updateOne(
      { path: 'data/users.json' },
      { 
        $set: { 
          path: 'data/users.json',
          data: usersData,
          contentType: 'application/json',
          size: JSON.stringify(usersData).length,
          uploadedAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )
    
    console.log('✅ Users loaded to MongoDB!')
    console.log(`📊 Total users: ${usersData.length}`)
    
    // הצג את המשתמשים
    usersData.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
    console.log('👋 Disconnected from MongoDB')
  }
}

loadBackup()
