import { MongoClient } from 'mongodb'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const uri = process.env.DATABASE_URL
const client = new MongoClient(uri)

async function uploadLocalData() {
  try {
    console.log('🚀 Uploading local data to MongoDB...')
    
    // התחבר ל-MongoDB
    await client.connect()
    const db = client.db('otzaria')
    const collection = db.collection('files')
    
    console.log('✅ Connected to MongoDB')
    
    let successCount = 0
    let errorCount = 0
    
    // 1. העלה קבצי pages
    console.log('\n📚 Uploading pages...')
    const pagesDir = 'data/pages'
    const pageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.json'))
    
    for (const file of pageFiles) {
      try {
        const filePath = path.join(pagesDir, file)
        const content = fs.readFileSync(filePath, 'utf-8')
        const data = JSON.parse(content)
        
        const dbPath = `data/pages/${file}`
        
        await collection.updateOne(
          { path: dbPath },
          { 
            $set: { 
              path: dbPath,
              data: data,
              contentType: 'application/json',
              size: content.length,
              uploadedAt: new Date(),
              updatedAt: new Date()
            }
          },
          { upsert: true }
        )
        
        console.log(`  ✅ ${file}`)
        successCount++
      } catch (error) {
        console.error(`  ❌ ${file}:`, error.message)
        errorCount++
      }
    }
    
    // 2. העלה קבצי content
    console.log('\n📄 Uploading content files...')
    const contentDir = 'data/content'
    const contentFiles = fs.readdirSync(contentDir).filter(f => f.endsWith('.txt'))
    
    for (const file of contentFiles) {
      try {
        const filePath = path.join(contentDir, file)
        const content = fs.readFileSync(filePath, 'utf-8')
        
        const dbPath = `data/content/${file}`
        
        await collection.updateOne(
          { path: dbPath },
          { 
            $set: { 
              path: dbPath,
              data: { content }, // שמור כאובייקט עם content
              contentType: 'text/plain',
              size: content.length,
              uploadedAt: new Date(),
              updatedAt: new Date()
            }
          },
          { upsert: true }
        )
        
        console.log(`  ✅ ${file}`)
        successCount++
      } catch (error) {
        console.error(`  ❌ ${file}:`, error.message)
        errorCount++
      }
    }
    
    // 3. צור books.json אם לא קיים
    console.log('\n📖 Creating books.json...')
    const booksData = []
    
    for (const file of pageFiles) {
      const bookName = file.replace('.json', '')
      const filePath = path.join(pagesDir, file)
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      
      booksData.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: bookName,
        totalPages: content.totalPages || 0,
        completedPages: content.completedPages || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
    
    await collection.updateOne(
      { path: 'data/books.json' },
      { 
        $set: { 
          path: 'data/books.json',
          data: booksData,
          contentType: 'application/json',
          size: JSON.stringify(booksData).length,
          uploadedAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )
    
    console.log(`  ✅ books.json created with ${booksData.length} books`)
    successCount++
    
    console.log('\n' + '='.repeat(50))
    console.log(`🎉 Upload completed!`)
    console.log(`✅ Success: ${successCount} files`)
    console.log(`❌ Errors: ${errorCount} files`)
    console.log('='.repeat(50))
    
  } catch (error) {
    console.error('❌ Upload failed:', error)
  } finally {
    await client.close()
    console.log('👋 Disconnected from MongoDB')
  }
}

uploadLocalData()
