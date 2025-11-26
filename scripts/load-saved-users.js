import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const uri = process.env.DATABASE_URL
const client = new MongoClient(uri)

const usersData = [
  {
    "id": "1764024411215",
    "email": "yy581834yy@gmail.com",
    "password": "$2b$12$LQOldkNHkpqKa2uG2xHh8OIiCbnp.4bxxDnwhXuSE8GJccCR18otO",
    "name": "userbot",
    "role": "admin",
    "createdAt": "2025-11-24T22:46:51.215Z"
  },
  {
    "id": "1764066451049",
    "email": "admin@gmail.com",
    "password": "$2b$12$lwn/pvr8I00gG.EXOZM2IeP22BPyXypvU0blIC5xXqlXzYdlaxqKS",
    "name": "admin",
    "role": "admin",
    "createdAt": "2025-11-25T10:27:31.049Z"
  }
]

async function loadUsers() {
  try {
    console.log('🚀 Loading users to MongoDB...')
    
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
    
    console.log('\n🎉 Done! You can now login with these users.')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
    console.log('👋 Disconnected from MongoDB')
  }
}

loadUsers()
