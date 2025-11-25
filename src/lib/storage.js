import { put, del, list, head } from '@vercel/blob'
import { logger } from './logger'

// כרגע כל הנתונים ב-dev/ כולל production
const BLOB_PREFIX = 'dev/'

// שמירת קובץ JSON עם גיבוי אוטומטי
export async function saveJSON(path, data) {
  try {
    const jsonString = JSON.stringify(data, null, 2)
    
    // שמור את הקובץ הראשי
    const blob = await put(BLOB_PREFIX + path, jsonString, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true
    })
    
    // שמור גיבוי עם חותמת זמן (רק לקבצי pages)
    if (path.includes('data/pages/')) {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupPath = path.replace('.json', `_backup_${timestamp}.json`)
        await put(BLOB_PREFIX + backupPath, jsonString, {
          access: 'public',
          contentType: 'application/json',
          addRandomSuffix: false,
          allowOverwrite: true
        })
        logger.log(`✅ Backup saved: ${backupPath}`)
      } catch (backupError) {
        logger.warn('⚠️  Failed to save backup:', backupError)
        // לא נזרוק שגיאה כי הקובץ הראשי נשמר
      }
    }
    
    return blob
  } catch (error) {
    logger.error('❌ Error saving JSON:', error)
    throw error
  }
}

// קריאת קובץ JSON עם התאוששות אוטומטית מגיבוי
export async function readJSON(path) {
  try {
    // נסה לקרוא את הקובץ הראשי
    const blobs = await list({ prefix: BLOB_PREFIX + path, limit: 1 })
    
    if (blobs.blobs.length > 0) {
      const response = await fetch(blobs.blobs[0].url)
      if (response.ok) {
        const data = await response.json()
        logger.log(`✅ Loaded JSON from: ${path}`)
        return data
      }
    }
    
    // אם הקובץ הראשי לא נמצא, נסה למצוא גיבוי
    if (path.includes('data/pages/')) {
      logger.warn(`⚠️  Main file not found: ${path}, searching for backup...`)
      const backupPath = path.replace('.json', '_backup_')
      const backupBlobs = await list({ prefix: BLOB_PREFIX + backupPath })
      
      if (backupBlobs.blobs.length > 0) {
        // מיין לפי תאריך (הכי חדש קודם)
        const sortedBackups = backupBlobs.blobs.sort((a, b) => 
          new Date(b.uploadedAt) - new Date(a.uploadedAt)
        )
        
        logger.log(`📦 Found ${sortedBackups.length} backups, using latest`)
        const response = await fetch(sortedBackups[0].url)
        if (response.ok) {
          const data = await response.json()
          logger.log(`✅ Restored from backup: ${sortedBackups[0].pathname}`)
          
          // שחזר את הקובץ הראשי
          await saveJSON(path, data)
          return data
        }
      }
    }
    
    logger.warn(`❌ No file or backup found for: ${path}`)
    return null
  } catch (error) {
    logger.error('❌ Error reading JSON:', error)
    return null
  }
}

// שמירת קובץ טקסט
export async function saveText(path, content) {
  try {
    const blob = await put(BLOB_PREFIX + path, content, {
      access: 'public',
      contentType: 'text/plain; charset=utf-8',
      addRandomSuffix: false,
      allowOverwrite: true
    })
    return blob
  } catch (error) {
    logger.error('Error saving text:', error)
    throw error
  }
}

// קריאת קובץ טקסט
export async function readText(path) {
  try {
    const blobs = await list({ prefix: BLOB_PREFIX + path, limit: 1 })
    if (blobs.blobs.length === 0) return null
    
    const response = await fetch(blobs.blobs[0].url)
    if (!response.ok) return null
    return await response.text()
  } catch (error) {
    logger.error('Error reading text:', error)
    return null
  }
}

// מחיקת קובץ
export async function deleteFile(url) {
  try {
    await del(url)
  } catch (error) {
    logger.error('Error deleting file:', error)
  }
}

// רשימת קבצים
export async function listFiles(prefix) {
  try {
    const fullPrefix = BLOB_PREFIX + prefix
    logger.log('🔍 Listing files with prefix:', fullPrefix)
    const { blobs } = await list({ prefix: fullPrefix })
    logger.log('📦 Found blobs:', blobs.length)
    if (blobs.length > 0) {
      logger.log('📄 First blob:', blobs[0].pathname)
    }
    return blobs
  } catch (error) {
    logger.error('Error listing files:', error)
    return []
  }
}

// בדיקה אם קובץ קיים
export async function fileExists(path) {
  try {
    const blobs = await list({ prefix: BLOB_PREFIX + path, limit: 1 })
    return blobs.blobs.length > 0
  } catch {
    return false
  }
}

// שמירת תמונה
export async function saveImage(path, imageBuffer, contentType = 'image/jpeg') {
  try {
    const blob = await put(BLOB_PREFIX + path, imageBuffer, {
      access: 'public',
      contentType: contentType,
      addRandomSuffix: false,
      allowOverwrite: true
    })
    return blob
  } catch (error) {
    logger.error('Error saving image:', error)
    throw error
  }
}

// קריאת URL של תמונה
export async function getImageUrl(path) {
  try {
    const blobs = await list({ prefix: BLOB_PREFIX + path, limit: 1 })
    if (blobs.blobs.length === 0) return null
    return blobs.blobs[0].url
  } catch (error) {
    logger.error('Error getting image URL:', error)
    return null
  }
}
