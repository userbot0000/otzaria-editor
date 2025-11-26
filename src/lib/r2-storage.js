import B2 from 'backblaze-b2'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { logger } from './logger.js'

// יצירת Backblaze B2 Client
const b2 = new B2({
  accountId: process.env.B2_ACCOUNT_ID,
  applicationKeyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
})

// יצירת S3 Client לקריאה
const s3Client = new S3Client({
  region: 'us-east-005',
  endpoint: 'https://s3.us-east-005.backblazeb2.com',
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
  forcePathStyle: true,
})

const BUCKET_NAME = process.env.B2_BUCKET_NAME || 'otzaria'
const R2_PREFIX = 'dev/'

let authData = null
let bucketId = null

// אתחול חיבור ל-B2
async function initB2() {
  if (!authData) {
    authData = await b2.authorize()
    
    // קבל את ה-bucket ID
    const bucketsResponse = await b2.listBuckets({
      bucketName: BUCKET_NAME,
    })
    
    if (bucketsResponse.data.buckets.length > 0) {
      bucketId = bucketsResponse.data.buckets[0].bucketId
    } else {
      throw new Error(`Bucket ${BUCKET_NAME} not found`)
    }
  }
  return { authData, bucketId }
}

// שמירת קובץ JSON
export async function saveJSON(path, data) {
  try {
    await initB2()
    
    const jsonString = JSON.stringify(data, null, 2)
    const fileName = R2_PREFIX + path
    
    // קבל URL להעלאה
    const uploadUrlResponse = await b2.getUploadUrl({
      bucketId: bucketId,
    })
    
    // העלה את הקובץ
    await b2.uploadFile({
      uploadUrl: uploadUrlResponse.data.uploadUrl,
      uploadAuthToken: uploadUrlResponse.data.authorizationToken,
      fileName: fileName,
      data: Buffer.from(jsonString),
      mime: 'application/json',
    })
    
    logger.log(`✅ Saved JSON to B2: ${fileName}`)
    
    // גיבוי לקבצי pages
    if (path.includes('data/pages/')) {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupFileName = fileName.replace('.json', `_backup_${timestamp}.json`)
        
        const backupUploadUrl = await b2.getUploadUrl({ bucketId })
        await b2.uploadFile({
          uploadUrl: backupUploadUrl.data.uploadUrl,
          uploadAuthToken: backupUploadUrl.data.authorizationToken,
          fileName: backupFileName,
          data: Buffer.from(jsonString),
          mime: 'application/json',
        })
        
        logger.log(`✅ Backup saved: ${backupFileName}`)
      } catch (backupError) {
        logger.warn('⚠️  Failed to save backup:', backupError)
      }
    }
    
    return { url: `https://f005.backblazeb2.com/file/${BUCKET_NAME}/${fileName}` }
  } catch (error) {
    logger.error('❌ Error saving JSON to B2:', error)
    throw error
  }
}

// קריאת קובץ JSON
export async function readJSON(path) {
  try {
    await initB2()
    
    const fileName = R2_PREFIX + path
    logger.log(`🔍 Looking for file: ${fileName}`)
    
    // חפש את הקובץ
    const fileList = await b2.listFileNames({
      bucketId: bucketId,
      startFileName: fileName,
      maxFileCount: 1,
      prefix: fileName,
    })
    
    logger.log(`📦 Found ${fileList.data.files.length} files`)
    
    if (fileList.data.files.length === 0) {
      throw new Error('File not found')
    }
    
    const file = fileList.data.files[0]
    logger.log(`📄 File: ${file.fileName}`)
    
    // הורד את הקובץ באמצעות S3 SDK
    try {
      logger.log(`📥 Downloading via S3 SDK`)
      
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
      })
      
      const response = await s3Client.send(command)
      const text = await response.Body.transformToString()
      const data = JSON.parse(text)
      
      logger.log(`✅ Loaded JSON from B2: ${fileName}`)
      return data
    } catch (downloadError) {
      logger.error(`❌ Download error:`, downloadError.message)
      throw downloadError
    }
  } catch (error) {
    logger.error(`❌ ReadJSON error for ${path}:`, error.message)
    // אם הקובץ לא נמצא, נסה גיבוי
    if (path.includes('data/pages/')) {
      logger.warn(`⚠️  Main file not found: ${path}, searching for backup...`)
      
      try {
        const backupPrefix = R2_PREFIX + path.replace('.json', '_backup_')
        
        const backupList = await b2.listFileNames({
          bucketId: bucketId,
          prefix: backupPrefix,
          maxFileCount: 100,
        })
        
        if (backupList.data.files.length > 0) {
          // מיין לפי תאריך (הכי חדש קודם)
          const sortedBackups = backupList.data.files.sort((a, b) => 
            b.uploadTimestamp - a.uploadTimestamp
          )
          
          const latestBackup = sortedBackups[0]
          logger.log(`📦 Found ${sortedBackups.length} backups, using latest: ${latestBackup.fileName}`)
          
          const downloadAuth = await b2.getDownloadAuthorization({
            bucketId: bucketId,
            fileNamePrefix: latestBackup.fileName,
            validDurationInSeconds: 3600,
          })
          
          const downloadUrl = `${authData.data.downloadUrl}/file/${BUCKET_NAME}/${latestBackup.fileName}`
          const response = await fetch(downloadUrl, {
            headers: {
              Authorization: downloadAuth.data.authorizationToken,
            },
          })
          
          const text = await response.text()
          const data = JSON.parse(text)
          
          // שחזר את הקובץ הראשי
          await saveJSON(path, data)
          return data
        }
      } catch (backupError) {
        logger.error('❌ Error loading backup:', backupError)
      }
    }
    
    logger.warn(`❌ No file or backup found for: ${path}`)
    return null
  }
}

// שמירת קובץ טקסט
export async function saveText(path, content) {
  try {
    await initB2()
    
    const fileName = R2_PREFIX + path
    const uploadUrlResponse = await b2.getUploadUrl({ bucketId })
    
    await b2.uploadFile({
      uploadUrl: uploadUrlResponse.data.uploadUrl,
      uploadAuthToken: uploadUrlResponse.data.authorizationToken,
      fileName: fileName,
      data: Buffer.from(content),
      mime: 'text/plain; charset=utf-8',
    })
    
    logger.log(`✅ Saved text to B2: ${fileName}`)
    return { url: `https://f005.backblazeb2.com/file/${BUCKET_NAME}/${fileName}` }
  } catch (error) {
    logger.error('Error saving text to B2:', error)
    throw error
  }
}

// קריאת קובץ טקסט
export async function readText(path) {
  try {
    await initB2()
    
    const fileName = R2_PREFIX + path
    const fileList = await b2.listFileNames({
      bucketId: bucketId,
      startFileName: fileName,
      maxFileCount: 1,
      prefix: fileName,
    })
    
    if (fileList.data.files.length === 0) {
      return null
    }
    
    const downloadAuth = await b2.getDownloadAuthorization({
      bucketId: bucketId,
      fileNamePrefix: fileName,
      validDurationInSeconds: 3600,
    })
    
    const downloadUrl = `${authData.data.downloadUrl}/file/${BUCKET_NAME}/${fileName}`
    const response = await fetch(downloadUrl, {
      headers: {
        Authorization: downloadAuth.data.authorizationToken,
      },
    })
    
    if (!response.ok) {
      return null
    }
    
    return await response.text()
  } catch (error) {
    logger.error('Error reading text from B2:', error)
    return null
  }
}

// מחיקת קובץ
export async function deleteFile(pathname) {
  try {
    await initB2()
    
    const fileList = await b2.listFileNames({
      bucketId: bucketId,
      startFileName: pathname,
      maxFileCount: 1,
      prefix: pathname,
    })
    
    if (fileList.data.files.length > 0) {
      const file = fileList.data.files[0]
      await b2.deleteFileVersion({
        fileId: file.fileId,
        fileName: file.fileName,
      })
      logger.log(`✅ Deleted from B2: ${pathname}`)
    }
  } catch (error) {
    logger.error('Error deleting file from B2:', error)
  }
}

// רשימת קבצים
export async function listFiles(prefix) {
  try {
    await initB2()
    
    const fullPrefix = R2_PREFIX + prefix
    logger.log('🔍 Listing files with prefix:', fullPrefix)
    
    const fileList = await b2.listFileNames({
      bucketId: bucketId,
      prefix: fullPrefix,
      maxFileCount: 1000,
    })
    
    const blobs = fileList.data.files.map(file => ({
      pathname: file.fileName,
      url: `https://f005.backblazeb2.com/file/${BUCKET_NAME}/${file.fileName}`,
      size: file.contentLength,
      uploadedAt: new Date(file.uploadTimestamp),
    }))
    
    logger.log('📦 Found files:', blobs.length)
    return blobs
  } catch (error) {
    logger.error('Error listing files from B2:', error)
    return []
  }
}

// בדיקה אם קובץ קיים
export async function fileExists(path) {
  try {
    await initB2()
    
    const fileName = R2_PREFIX + path
    const fileList = await b2.listFileNames({
      bucketId: bucketId,
      startFileName: fileName,
      maxFileCount: 1,
      prefix: fileName,
    })
    
    return fileList.data.files.length > 0
  } catch (error) {
    return false
  }
}

// שמירת תמונה
export async function saveImage(path, imageBuffer, contentType = 'image/jpeg') {
  try {
    await initB2()
    
    const fileName = R2_PREFIX + path
    const uploadUrlResponse = await b2.getUploadUrl({ bucketId })
    
    await b2.uploadFile({
      uploadUrl: uploadUrlResponse.data.uploadUrl,
      uploadAuthToken: uploadUrlResponse.data.authorizationToken,
      fileName: fileName,
      data: imageBuffer,
      mime: contentType,
    })
    
    logger.log(`✅ Saved image to B2: ${fileName}`)
    return { url: `https://f005.backblazeb2.com/file/${BUCKET_NAME}/${fileName}` }
  } catch (error) {
    logger.error('Error saving image to B2:', error)
    throw error
  }
}

// קריאת URL של תמונה
export async function getImageUrl(path) {
  try {
    await initB2()
    
    const fileName = R2_PREFIX + path
    const downloadAuth = await b2.getDownloadAuthorization({
      bucketId: bucketId,
      fileNamePrefix: fileName,
      validDurationInSeconds: 604800, // 7 ימים
    })
    
    const url = `${authData.data.downloadUrl}/file/${BUCKET_NAME}/${fileName}?Authorization=${downloadAuth.data.authorizationToken}`
    return url
  } catch (error) {
    logger.error('Error getting image URL from B2:', error)
    return null
  }
}
