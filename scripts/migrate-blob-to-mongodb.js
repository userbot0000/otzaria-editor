import { list } from '@vercel/blob'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const uri = process.env.DATABASE_URL
const client = new MongoClient(uri)

async function migrateToMongoDB() {
  try {
    console.log('🚀 Starting migration from Vercel Blob to MongoDB...')
    
    // התחבר ל-MongoDB
    await client.connect()
    const db = client.db('otzaria')
    const collection = db.collection('files')
    
    console.log('✅ Connected to MongoDB')
    
    // קבל את כל הקבצים מ-Blob
    console.log('📦 Fetching files from Vercel Blob...')
    const { blobs } = await list({ prefix: 'dev/' })
    
    console.log(`📄 Found ${blobs.length} files in Blob`)
    
    let successCount = 0
    let errorCount = 0
    
    // העבר כל קובץ
    for (const blob of blobs) {
      try {
        console.log(`\n📥 Processing: ${blob.pathname}`)
        
        // הורד את הקובץ
        const response = await fetch(blob.url)
        if (!response.ok) {
          throw new Error(`Failed to download: ${response.statusText}`)
        }
        
        const contentType = response.headers.get('content-type')
        let data
        
        // בדוק אם זה JSON או תמונה
        if (contentType?.includes('application/json')) {
          data = await response.json()
          console.log(`  📝 JSON file, size: ${JSON.stringify(data).length} bytes`)
        } else if (contentType?.includes('image')) {
          const buffer = await response.arrayBuffer()
          data = Buffer.from(buffer).toString('base64')
          console.log(`  🖼️  Image file, size: ${data.length} bytes`)
        } else {
          data = await response.text()
          console.log(`  📄 Text file, size: ${data.length} bytes`)
        }
        
        // שמור ב-MongoDB
        const path = blob.pathname.replace('dev/', '')
        
        await collection.updateOne(
          { path },
          { 
            $set: { 
              path,
              data,
              contentType,
              size: blob.size,
              uploadedAt: blob.uploadedAt,
              updatedAt: new Date()
            }
          },
          { upsert: true }
        )
        
        console.log(`  ✅ Saved to MongoDB: ${path}`)
        successCount++
        
      } catch (error) {
        console.error(`  ❌ Error processing ${blob.pathname}:`, error.message)
        errorCount++
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log(`🎉 Migration completed!`)
    console.log(`✅ Success: ${successCount} files`)
    console.log(`❌ Errors: ${errorCount} files`)
    console.log('='.repeat(50))
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await client.close()
    console.log('👋 Disconnected from MongoDB')
  }
}

migrateToMongoDB()
