import fs from 'fs'
import path from 'path'
import { listFiles } from './storage.js'
import { logger } from './logger.js'

// נתיב לתיקיית התמונות המקומית
const THUMBNAILS_PATH = path.join(process.cwd(), 'public', 'thumbnails')

// האם להשתמש ב-Blob Storage או בקבצים מקומיים
const USE_BLOB = process.env.USE_BLOB_STORAGE === 'true' || process.env.VERCEL_ENV === 'production'

// Cache למבנה הספרייה - 10 דקות
let cachedStructure = null
let cacheTime = null
const CACHE_DURATION = 10 * 60 * 1000 // 10 דקות

/**
 * קריאת מבנה הספרייה מתיקיית התמונות
 * כל תיקייה = ספר, כל תמונה = עמוד
 */
export async function loadLibraryStructure() {
  // בדוק cache
  const now = Date.now()
  if (cachedStructure && cacheTime && (now - cacheTime) < CACHE_DURATION) {
    logger.log('✅ Returning cached library structure')
    return cachedStructure
  }
  try {
    logger.log('🚀 Loading library structure from MongoDB...')
    
    // קרא את books.json מ-MongoDB
    const { readJSON } = await import('./storage.js')
    const booksData = await readJSON('data/books.json')
    
    if (!booksData || booksData.length === 0) {
      logger.warn('⚠️  No books found in MongoDB')
      
      // נסה לסרוק מהתיקייה המקומית
      if (!USE_BLOB && fs.existsSync(THUMBNAILS_PATH)) {
        logger.log('📁 Falling back to local filesystem')
        const structure = scanThumbnailsDirectory()
        cachedStructure = structure
        cacheTime = now
        return structure
      }
      
      return []
    }
    
    logger.log(`📚 Found ${booksData.length} books in MongoDB`)
    
    // המר לפורמט הנכון
    const structure = booksData.map(book => ({
      id: book.id || book.name,
      name: book.name,
      type: 'file',
      status: 'available',
      lastEdit: book.updatedAt || book.createdAt,
      editor: null,
      path: book.name,
      pageCount: book.totalPages || 0,
    }))

    // שמור ב-cache
    cachedStructure = structure
    cacheTime = now
    logger.log('💾 Cached library structure')

    return structure
  } catch (error) {
    logger.error('Error loading library structure:', error)
    // אם יש cache ישן, החזר אותו במקרה של שגיאה
    if (cachedStructure) {
      logger.log('⚠️  Returning stale cache due to error')
      return cachedStructure
    }
    return []
  }
}

/**
 * סריקת תמונות מ-Blob Storage
 */
async function scanBlobThumbnails() {
  try {
    logger.log('🔍 Scanning GitHub for thumbnails...')
    const blobs = await listFiles('thumbnails')
    logger.log('📦 Total blobs found:', blobs.length)
    
    if (blobs.length > 0) {
      logger.log('📄 First blob example:', blobs[0])
    }
    
    const books = new Map()

    for (const blob of blobs) {
      logger.log('  Processing blob:', blob.pathname)
      
      // נתיב לדוגמה: thumbnails_חוות_דעת_page-1.jpg
      const fileName = blob.pathname.split('/').pop() // קבל רק את שם הקובץ
      
      if (!fileName.startsWith('thumbnails_')) {
        logger.log('    ⏭️  Skipping - not a thumbnail')
        continue
      }
      
      // פרק את שם הקובץ: thumbnails_חוות_דעת_page-1.jpg
      const parts = fileName.replace('thumbnails_', '').split('_')
      
      // הסר את החלק האחרון (page-X.jpg)
      const pagePart = parts.pop()
      
      // מה שנשאר הוא שם הספר
      const bookName = parts.join('_').replace(/_/g, ' ')
      logger.log('    📖 Book name:', bookName)
      
      if (!books.has(bookName)) {
        // המר Date object ל-string
        const uploadDate = blob.uploadedAt instanceof Date 
          ? blob.uploadedAt.toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
          
        books.set(bookName, {
          id: bookName,
          name: bookName,
          type: 'file',
          status: 'available',
          lastEdit: uploadDate,
          editor: null,
          path: bookName,
          pageCount: 0,
          thumbnailsPath: `/thumbnails/${bookName}`,
        })
        logger.log('    ✅ Created book entry')
      }

      books.get(bookName).pageCount++
    }

    logger.log('📚 Total books found in Blob:', books.size)
    return Array.from(books.values())
  } catch (error) {
    logger.error('❌ Error scanning blob thumbnails:', error)
    return []
  }
}

/**
 * סריקת תיקיית התמונות
 * כל תיקייה = ספר
 */
function scanThumbnailsDirectory() {
  const books = []
  
  try {
    logger.log('📂 Scanning thumbnails directory:', THUMBNAILS_PATH)
    const entries = fs.readdirSync(THUMBNAILS_PATH, { withFileTypes: true })
    logger.log('📁 Found entries:', entries.length)
    
    entries.forEach((entry) => {
      logger.log('  - Entry:', entry.name, 'isDirectory:', entry.isDirectory())
      
      // דלג על קבצים מוסתרים
      if (entry.name.startsWith('.')) {
        logger.log('    ⏭️  Skipping hidden file')
        return
      }
      
      if (entry.isDirectory()) {
        const bookPath = path.join(THUMBNAILS_PATH, entry.name)
        logger.log('    📖 Scanning book:', entry.name)
        const bookData = scanBookDirectory(entry.name, bookPath)
        
        if (bookData) {
          logger.log('    ✅ Book added:', bookData.name, 'pages:', bookData.pageCount)
          books.push(bookData)
        } else {
          logger.log('    ❌ Book data is null')
        }
      }
    })
    
    logger.log('📚 Total books found:', books.length)
  } catch (error) {
    logger.error('Error scanning thumbnails directory:', error)
  }
  
  return books
}

/**
 * סריקת תיקיית ספר ספציפי
 */
function scanBookDirectory(bookName, bookPath) {
  try {
    logger.log('      📂 Reading directory:', bookPath)
    const files = fs.readdirSync(bookPath)
    logger.log('      📄 Total files:', files.length)
    
    // סנן רק קבצי תמונות
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)
    })
    
    logger.log('      🖼️  Image files:', imageFiles.length)
    
    if (imageFiles.length === 0) {
      logger.warn(`      ⚠️  No images found in book: ${bookName}`)
      return null
    }
    
    // ספור עמודים
    const pageCount = imageFiles.length
    
    // קרא מטא-דאטה אם קיימת
    const stats = fs.statSync(bookPath)
    
    const bookData = {
      id: bookName,
      name: bookName,
      type: 'file',
      status: 'available', // ברירת מחדל
      lastEdit: stats.mtime.toISOString().split('T')[0],
      editor: null,
      path: bookName,
      pageCount: pageCount,
      thumbnailsPath: `/thumbnails/${bookName}`,
    }
    
    logger.log('      ✅ Book data created:', JSON.stringify(bookData, null, 2))
    return bookData
  } catch (error) {
    logger.error('      ❌ Error scanning book directory:', bookName, error)
    return null
  }
}

/**
 * חיפוש ספרים
 */
export function searchInTree(books, searchTerm) {
  if (!searchTerm) return books
  
  const lowerSearch = searchTerm.toLowerCase()
  return books.filter(book => 
    book.name.toLowerCase().includes(lowerSearch)
  )
}

/**
 * ספירת ספרים לפי סטטוס
 */
export function countByStatus(books) {
  const counts = { completed: 0, 'in-progress': 0, available: 0 }
  
  books.forEach(book => {
    if (book.status) {
      counts[book.status]++
    }
  })
  
  return counts
}

/**
 * קבלת מספר עמודים של ספר
 */
export function getBookPageCount(bookName) {
  try {
    const bookPath = path.join(THUMBNAILS_PATH, bookName)
    
    if (!fs.existsSync(bookPath)) {
      return 0
    }
    
    const files = fs.readdirSync(bookPath)
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)
    })
    
    return imageFiles.length
  } catch (error) {
    logger.error('Error getting page count:', error)
    return 0
  }
}

/**
 * בדיקה אם תמונת עמוד קיימת
 */
export function pageImageExists(bookName, pageNumber) {
  try {
    const bookPath = path.join(THUMBNAILS_PATH, bookName)
    
    if (!fs.existsSync(bookPath)) {
      return false
    }
    
    // נסה מספר פורמטים אפשריים
    const possibleNames = [
      `page-${pageNumber}.jpg`,
      `page-${pageNumber}.jpeg`,
      `page-${pageNumber}.png`,
      `page_${pageNumber}.jpg`,
      `${pageNumber}.jpg`,
    ]
    
    for (const name of possibleNames) {
      if (fs.existsSync(path.join(bookPath, name))) {
        return true
      }
    }
    
    return false
  } catch (error) {
    return false
  }
}
