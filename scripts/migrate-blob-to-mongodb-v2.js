import { list, head } from '@vercel/blob'
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
    const { blobs } = await list({ 
      prefix: 'dev/',
      token: process.env.BLOB_READ_WRITE_TOKEN 
    })
    
    console.log(`📄 Found ${blobs.length} files in Blob`)
    
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0
    
    // העבר כל קובץ
    for (const blob of blobs) {
      try {
        console.log(`\n📥 Processing: ${blob.pathname}`)
        
        // בדוק אם הקובץ כבר קיים ב-MongoDB
        const path = blob.pathname.replace('dev/', '')
        const existing = await collection.findOne({ path })
        
        if (existing) {
          console.log(`  ⏭️  Already exists, skipping`)
          skippedCount++
          continue
        }
        
        // נסה להוריד עם downloadUrl אם קיים
        let data
        const contentType = blob.contentType || 'application/octet-stream'
        
        try {
          // נסה להוריד עם fetch רגיל
          const response = await fetch(blob.downloadUrl || blob.url)
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          
          // בדוק אם זה JSON או תמונה
          if (contentType.includes('application/json') || blob.pathname.endsWith('.json')) {
            data = await response.json()
            console.log(`  📝 JSON file`)
          } else if (contentType.includes('image')) {
            const buffer = await response.arrayBuffer()
            data = Buffer.from(buffer).toString('base64')
            console.log(`  🖼️  Image file`)
          } else {
            data = await response.text()
            console.log(`  📄 Text file`)
          }
          
          // שמור ב-MongoDB
          await collection.insertOne({
            path,
            data,
            contentType,
            size: blob.size,
            uploadedAt: blob.uploadedAt,
            updatedAt: new Date()
          })
          
          console.log(`  ✅ Saved to MongoDB: ${path}`)
          successCount++
          
        } catch (downloadError) {
          console.error(`  ❌ Cannot download (403), saving metadata only`)
          
          // שמור לפחות את המטא-דאטה
          await collection.insertOne({
            path,
            data: null,
            contentType,
            size: blob.size,
            uploadedAt: blob.uploadedAt,
            updatedAt: new Date(),
            error: 'Could not download - 403 Forbidden'
          })
          
          errorCount++
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing ${blob.pathname}:`, error.message)
        errorCount++
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log(`🎉 Migration completed!`)
    console.log(`✅ Success: ${successCount} files`)
    console.log(`⏭️  Skipped: ${skippedCount} files`)
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
