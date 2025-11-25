import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// טען את .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const THUMBNAILS_PATH = path.join(__dirname, '..', 'public', 'thumbnails')
const BLOB_PREFIX = process.env.VERCEL_ENV === 'production' ? 'prod/' : 'dev/'

async function uploadThumbnails() {
  console.log('🚀 מתחיל העלאת תמונות ל-Blob Storage...\n')

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ שגיאה: BLOB_READ_WRITE_TOKEN לא מוגדר ב-.env.local')
    process.exit(1)
  }

  if (!fs.existsSync(THUMBNAILS_PATH)) {
    console.error('❌ שגיאה: תיקיית thumbnails לא נמצאה')
    process.exit(1)
  }

  let totalUploaded = 0
  let totalFailed = 0

  try {
    const books = fs.readdirSync(THUMBNAILS_PATH, { withFileTypes: true })
      .filter(entry => entry.isDirectory())

    console.log(`📚 נמצאו ${books.length} ספרים\n`)

    for (const book of books) {
      const bookName = book.name
      const bookPath = path.join(THUMBNAILS_PATH, bookName)
      
      console.log(`📖 מעלה ספר: ${bookName}`)

      const files = fs.readdirSync(bookPath)
        .filter(file => {
          const ext = path.extname(file).toLowerCase()
          return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)
        })

      console.log(`   📄 ${files.length} תמונות`)

      for (const file of files) {
        try {
          const filePath = path.join(bookPath, file)
          const fileContent = fs.readFileSync(filePath)
          const blobPath = `${BLOB_PREFIX}thumbnails/${bookName}/${file}`

          await put(blobPath, fileContent, {
            access: 'public',
            contentType: getContentType(file),
            addRandomSuffix: false,
          })

          totalUploaded++
          process.stdout.write('.')
        } catch (error) {
          console.error(`\n   ❌ שגיאה בהעלאת ${file}:`, error.message)
          totalFailed++
        }
      }

      console.log(` ✅ הושלם\n`)
    }

    console.log('\n' + '='.repeat(50))
    console.log(`✅ סיום! הועלו ${totalUploaded} תמונות`)
    if (totalFailed > 0) {
      console.log(`⚠️  ${totalFailed} תמונות נכשלו`)
    }
    console.log('='.repeat(50))

  } catch (error) {
    console.error('❌ שגיאה כללית:', error)
    process.exit(1)
  }
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase()
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  }
  return types[ext] || 'application/octet-stream'
}

uploadThumbnails()
