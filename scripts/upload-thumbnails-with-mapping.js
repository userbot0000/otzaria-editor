import { Octokit } from '@octokit/rest'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

const GITHUB_OWNER = process.env.GITHUB_OWNER
const GITHUB_REPO = process.env.GITHUB_REPO
const RELEASE_TAG = 'thumbnails-v2'

// מיפוי שמות ספרים לאנגלית
const bookMapping = {}

function generateBookId(bookName) {
  // צור ID ייחודי מהשם העברי
  const hash = crypto.createHash('md5').update(bookName).digest('hex').substring(0, 8)
  const id = `book_${hash}`
  bookMapping[id] = bookName
  return id
}

async function uploadThumbnails() {
  try {
    console.log('🚀 Uploading thumbnails to GitHub with English names...')
    
    // מחק release ישן אם קיים
    try {
      const { data: releases } = await octokit.repos.listReleases({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
      })
      
      const oldRelease = releases.find(r => r.tag_name === RELEASE_TAG)
      if (oldRelease) {
        await octokit.repos.deleteRelease({
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          release_id: oldRelease.id,
        })
        console.log('🗑️  Deleted old release')
      }
    } catch (error) {
      // אין release ישן, זה בסדר
    }
    
    // צור release חדש
    const { data: release } = await octokit.repos.createRelease({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      tag_name: RELEASE_TAG,
      name: 'Thumbnails Storage v2',
      body: 'Storage for book thumbnails with English names',
      draft: false,
      prerelease: false,
    })
    
    console.log('✅ Created new release')
    
    // סרוק את תיקיית התמונות
    const thumbnailsDir = 'public/thumbnails'
    const books = fs.readdirSync(thumbnailsDir)
    
    let successCount = 0
    let errorCount = 0
    
    for (const bookName of books) {
      const bookPath = path.join(thumbnailsDir, bookName)
      
      if (!fs.statSync(bookPath).isDirectory()) continue
      
      console.log(`\n📚 Processing book: ${bookName}`)
      
      // צור ID באנגלית
      const bookId = generateBookId(bookName)
      console.log(`   ID: ${bookId}`)
      
      const files = fs.readdirSync(bookPath)
      const imageFiles = files.filter(f => {
        const ext = path.extname(f).toLowerCase()
        return ['.jpg', '.jpeg', '.png'].includes(ext)
      })
      
      console.log(`   Found ${imageFiles.length} images`)
      
      for (const fileName of imageFiles) {
        try {
          const filePath = path.join(bookPath, fileName)
          
          // שם קובץ באנגלית: book_abc123_page-1.jpg
          const assetName = `${bookId}_${fileName}`
          
          // קרא את הקובץ
          const fileBuffer = fs.readFileSync(filePath)
          
          // העלה ל-GitHub
          await octokit.repos.uploadReleaseAsset({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            release_id: release.id,
            name: assetName,
            data: fileBuffer,
            headers: {
              'content-type': 'image/jpeg',
              'content-length': fileBuffer.length,
            },
          })
          
          console.log(`   ✅ ${fileName}`)
          successCount++
          
          // המתן קצת
          await new Promise(resolve => setTimeout(resolve, 500))
          
        } catch (error) {
          console.error(`   ❌ ${fileName}:`, error.message)
          errorCount++
        }
      }
    }
    
    // שמור את המיפוי ל-MongoDB
    console.log('\n💾 Saving book mapping to MongoDB...')
    await saveMapping(bookMapping)
    
    console.log('\n' + '='.repeat(50))
    console.log(`🎉 Upload completed!`)
    console.log(`✅ Success: ${successCount} images`)
    console.log(`❌ Errors: ${errorCount} images`)
    console.log(`📖 Books mapped: ${Object.keys(bookMapping).length}`)
    console.log('='.repeat(50))
    
    console.log('\n📋 Book Mapping:')
    Object.entries(bookMapping).forEach(([id, name]) => {
      console.log(`   ${id} → ${name}`)
    })
    
  } catch (error) {
    console.error('❌ Upload failed:', error)
  }
}

async function saveMapping(mapping) {
  const { MongoClient } = await import('mongodb')
  const client = new MongoClient(process.env.DATABASE_URL)
  
  try {
    await client.connect()
    const db = client.db('otzaria')
    const collection = db.collection('files')
    
    await collection.updateOne(
      { path: 'data/book-mapping.json' },
      { 
        $set: { 
          path: 'data/book-mapping.json',
          data: mapping,
          contentType: 'application/json',
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )
    
    console.log('✅ Mapping saved to MongoDB')
  } finally {
    await client.close()
  }
}

uploadThumbnails()
