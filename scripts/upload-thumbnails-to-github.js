import { Octokit } from '@octokit/rest'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

const GITHUB_OWNER = process.env.GITHUB_OWNER
const GITHUB_REPO = process.env.GITHUB_REPO
const RELEASE_TAG = 'thumbnails-v1'

async function uploadThumbnails() {
  try {
    console.log('🚀 Uploading thumbnails to GitHub Releases...')
    console.log(`   Owner: ${GITHUB_OWNER}`)
    console.log(`   Repo: ${GITHUB_REPO}`)
    
    // צור או קבל release
    let release
    try {
      const { data: releases } = await octokit.repos.listReleases({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
      })
      
      release = releases.find(r => r.tag_name === RELEASE_TAG)
      
      if (release) {
        console.log(`✅ Found existing release: ${RELEASE_TAG}`)
      } else {
        const { data: newRelease } = await octokit.repos.createRelease({
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          tag_name: RELEASE_TAG,
          name: 'Thumbnails Storage',
          body: 'Storage for book thumbnails',
          draft: false,
          prerelease: false,
        })
        release = newRelease
        console.log(`✅ Created new release: ${RELEASE_TAG}`)
      }
    } catch (error) {
      console.error('❌ Error with release:', error.message)
      throw error
    }
    
    // סרוק את תיקיית התמונות
    const thumbnailsDir = 'public/thumbnails'
    const books = fs.readdirSync(thumbnailsDir)
    
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0
    
    for (const bookName of books) {
      const bookPath = path.join(thumbnailsDir, bookName)
      
      if (!fs.statSync(bookPath).isDirectory()) continue
      
      console.log(`\n📚 Processing book: ${bookName}`)
      
      const files = fs.readdirSync(bookPath)
      const imageFiles = files.filter(f => {
        const ext = path.extname(f).toLowerCase()
        return ['.jpg', '.jpeg', '.png'].includes(ext)
      })
      
      console.log(`   Found ${imageFiles.length} images`)
      
      for (const fileName of imageFiles) {
        try {
          const filePath = path.join(bookPath, fileName)
          const assetName = `thumbnails_${bookName}_${fileName}`.replace(/ /g, '_')
          
          // בדוק אם כבר קיים
          const { data: assets } = await octokit.repos.listReleaseAssets({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            release_id: release.id,
          })
          
          if (assets.find(a => a.name === assetName)) {
            console.log(`   ⏭️  ${fileName} (already exists)`)
            skippedCount++
            continue
          }
          
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
          
          // המתן קצת כדי לא להציף את ה-API
          await new Promise(resolve => setTimeout(resolve, 500))
          
        } catch (error) {
          console.error(`   ❌ ${fileName}:`, error.message)
          errorCount++
        }
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log(`🎉 Upload completed!`)
    console.log(`✅ Success: ${successCount} images`)
    console.log(`⏭️  Skipped: ${skippedCount} images`)
    console.log(`❌ Errors: ${errorCount} images`)
    console.log('='.repeat(50))
    
  } catch (error) {
    console.error('❌ Upload failed:', error)
  }
}

uploadThumbnails()
