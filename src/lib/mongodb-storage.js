import { MongoClient } from 'mongodb'
import { logger } from './logger.js'

const uri = process.env.DATABASE_URL
let client = null
let db = null

// התחבר ל-MongoDB
async function connectDB() {
  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
    db = client.db('otzaria')
    logger.log('✅ Connected to MongoDB')
  }
  return db
}

// שמירת JSON
export async function saveJSON(path, data) {
  try {
    const database = await connectDB()
    const collection = database.collection('files')
    
    // שמור או עדכן את הקובץ
    await collection.updateOne(
      { path },
      { 
        $set: { 
          path,
          data,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )
    
    logger.log(`✅ Saved to MongoDB: ${path}`)
    
    // גיבוי לקבצי pages
    if (path.includes('data/pages/')) {
      try {
        const backupCollection = database.collection('backups')
        await backupCollection.insertOne({
          path,
          data,
          createdAt: new Date()
        })
        logger.log(`✅ Backup saved: ${path}`)
      } catch (backupError) {
        logger.warn('⚠️  Failed to save backup:', backupError)
      }
    }
    
    return { success: true }
  } catch (error) {
    logger.error('❌ Error saving to MongoDB:', error)
    throw error
  }
}

// קריאת JSON
export async function readJSON(path) {
  try {
    const database = await connectDB()
    const collection = database.collection('files')
    
    const doc = await collection.findOne({ path })
    
    if (!doc) {
      // נסה למצוא גיבוי
      if (path.includes('data/pages/')) {
        logger.warn(`⚠️  Main file not found: ${path}, searching for backup...`)
        
        const backupCollection = database.collection('backups')
        const backup = await backupCollection
          .find({ path })
          .sort({ createdAt: -1 })
          .limit(1)
          .toArray()
        
        if (backup.length > 0) {
          logger.log(`📦 Found backup for: ${path}`)
          // שחזר את הקובץ הראשי
          await saveJSON(path, backup[0].data)
          return backup[0].data
        }
      }
      
      logger.warn(`❌ No file found for: ${path}`)
      return null
    }
    
    logger.log(`✅ Loaded from MongoDB: ${path}`)
    return doc.data
  } catch (error) {
    logger.error('❌ Error reading from MongoDB:', error)
    return null
  }
}

// שמירת טקסט
export async function saveText(path, content) {
  return saveJSON(path, { content })
}

// קריאת טקסט
export async function readText(path) {
  const data = await readJSON(path)
  return data?.content || null
}

// מחיקת קובץ
export async function deleteFile(path) {
  try {
    const database = await connectDB()
    const collection = database.collection('files')
    
    await collection.deleteOne({ path })
    logger.log(`✅ Deleted from MongoDB: ${path}`)
  } catch (error) {
    logger.error('Error deleting from MongoDB:', error)
  }
}

// רשימת קבצים
export async function listFiles(prefix) {
  try {
    const database = await connectDB()
    const collection = database.collection('files')
    
    logger.log('🔍 Listing files with prefix:', prefix)
    
    const files = await collection
      .find({ path: { $regex: `^${prefix}` } })
      .toArray()
    
    const blobs = files.map(file => ({
      pathname: file.path,
      url: file.path,
      size: JSON.stringify(file.data).length,
      uploadedAt: file.updatedAt,
    }))
    
    logger.log('📦 Found files:', blobs.length)
    return blobs
  } catch (error) {
    logger.error('Error listing files from MongoDB:', error)
    return []
  }
}

// בדיקה אם קובץ קיים
export async function fileExists(path) {
  try {
    const database = await connectDB()
    const collection = database.collection('files')
    
    const doc = await collection.findOne({ path })
    return !!doc
  } catch (error) {
    return false
  }
}

// שמירת תמונה (כ-base64)
export async function saveImage(path, imageBuffer, contentType = 'image/jpeg') {
  try {
    const database = await connectDB()
    const collection = database.collection('files')
    
    const base64 = imageBuffer.toString('base64')
    
    await collection.updateOne(
      { path },
      { 
        $set: { 
          path,
          data: base64,
          contentType,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )
    
    logger.log(`✅ Saved image to MongoDB: ${path}`)
    return { success: true }
  } catch (error) {
    logger.error('Error saving image to MongoDB:', error)
    throw error
  }
}

// קריאת URL של תמונה
export async function getImageUrl(path) {
  try {
    const database = await connectDB()
    const collection = database.collection('files')
    
    const doc = await collection.findOne({ path })
    if (!doc) return null
    
    // החזר data URL
    return `data:${doc.contentType || 'image/jpeg'};base64,${doc.data}`
  } catch (error) {
    logger.error('Error getting image from MongoDB:', error)
    return null
  }
}
