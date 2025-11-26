import { list } from '@vercel/blob'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import https from 'https'

dotenv.config({ path: '.env.local' })

const uri = process.env.DATABASE_URL
const client = new MongoClient(uri)

// פונקציה להורדת קובץ מ-Vercel Blob
async function downloadBlob(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`))
        return
      }
      
      const chunks = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => resolve(Buffer.concat(chunks)))
      response.on('error', reject)
    }).on('error', reject)
  })
}

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
        const buffer = await downloadBlob(blob.url)
        console.log(`  📦 Downloaded: ${buffer.length} bytes`)
        
        let data
        const contentType = blob.contentType || 'application/octet-stream'
        
        // בדוק אם זה JSON או תמונה
        if (contentType.includes('application/json') || blob.pathname.endsWith('.json')) {
          const text = buffer.toString('utf-8')
          data = JSON.parse(text)
          console.log(`  📝 JSON file`)
        } else if (contentType.includes('image')) {
          data = buffer.toString('base64')
          console.log(`  🖼️  Image file`)
        } else {
          data = buffer.toString('utf-8')
          console.log(`  📄 Text file`)
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
