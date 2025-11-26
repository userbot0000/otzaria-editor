import { list, head } from '@vercel/blob'
import fs from 'fs'
import path from 'path'
import https from 'https'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// טען את משתני הסביבה
dotenv.config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(filepath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const file = fs.createWriteStream(filepath)
    https.get(url, (response) => {
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', (err) => {
      fs.unlink(filepath, () => {})
      reject(err)
    })
  })
}

async function downloadAllFromBlob() {
  console.log('🔽 מוריד את כל הנתונים מ-Vercel Blob...\n')

  try {
    // קבל את כל הקבצים
    const { blobs } = await list()
    
    console.log(`📦 נמצאו ${blobs.length} קבצים\n`)

    let downloaded = 0
    let skipped = 0
    let errors = 0

    for (const blob of blobs) {
      try {
        // המר את pathname ל-path מקומי
        const localPath = path.join(__dirname, '..', blob.pathname)
        
        // בדוק אם הקובץ כבר קיים
        if (fs.existsSync(localPath)) {
          const stats = fs.statSync(localPath)
          if (stats.size === blob.size) {
            console.log(`⏭️  קיים: ${blob.pathname}`)
            skipped++
            continue
          }
        }

        // הורד את הקובץ
        console.log(`⬇️  מוריד: ${blob.pathname} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`)
        await downloadFile(blob.url, localPath)
        downloaded++
        
      } catch (error) {
        console.error(`❌ שגיאה בהורדת ${blob.pathname}:`, error.message)
        errors++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ סיום הורדה!')
    console.log(`📥 הורדו: ${downloaded} קבצים`)
    console.log(`⏭️  דולגו (קיימים): ${skipped} קבצים`)
    if (errors > 0) {
      console.log(`❌ שגיאות: ${errors} קבצים`)
    }
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ שגיאה כללית:', error)
    process.exit(1)
  }
}

downloadAllFromBlob()
