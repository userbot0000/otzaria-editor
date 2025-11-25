import { put, del, list, head } from '@vercel/blob'

// כרגע כל הנתונים ב-dev/ כולל production
const BLOB_PREFIX = 'dev/'

// שמירת קובץ JSON
export async function saveJSON(path, data) {
  try {
    const blob = await put(BLOB_PREFIX + path, JSON.stringify(data, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true
    })
    return blob
  } catch (error) {
    console.error('Error saving JSON:', error)
    throw error
  }
}

// קריאת קובץ JSON
export async function readJSON(path) {
  try {
    const blobs = await list({ prefix: BLOB_PREFIX + path, limit: 1 })
    if (blobs.blobs.length === 0) return null
    
    const response = await fetch(blobs.blobs[0].url)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Error reading JSON:', error)
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
    console.error('Error saving text:', error)
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
    console.error('Error reading text:', error)
    return null
  }
}

// מחיקת קובץ
export async function deleteFile(url) {
  try {
    await del(url)
  } catch (error) {
    console.error('Error deleting file:', error)
  }
}

// רשימת קבצים
export async function listFiles(prefix) {
  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX + prefix })
    return blobs
  } catch (error) {
    console.error('Error listing files:', error)
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
    console.error('Error saving image:', error)
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
    console.error('Error getting image URL:', error)
    return null
  }
}
