import { logger } from './logger.js'

const IMGBB_API_KEY = process.env.IMGBB_API_KEY

// העלאת תמונה ל-ImgBB
export async function uploadImage(imageBuffer, name) {
  try {
    if (!IMGBB_API_KEY) {
      throw new Error('IMGBB_API_KEY not configured')
    }
    
    // המר ל-base64 רק להעלאה
    const base64Image = imageBuffer.toString('base64')
    
    const formData = new FormData()
    formData.append('key', IMGBB_API_KEY)
    formData.append('image', base64Image)
    formData.append('name', name)
    
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error(`ImgBB upload failed: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error('ImgBB upload failed')
    }
    
    logger.log(`✅ Uploaded image to ImgBB: ${name}`)
    
    return {
      url: data.data.url,
      displayUrl: data.data.display_url,
      deleteUrl: data.data.delete_url,
      thumb: data.data.thumb.url,
      medium: data.data.medium.url,
    }
  } catch (error) {
    logger.error('❌ Error uploading to ImgBB:', error)
    throw error
  }
}

// שמירת תמונה (מחזיר רק URL)
export async function saveImage(path, imageBuffer, contentType = 'image/jpeg') {
  const result = await uploadImage(imageBuffer, path)
  return { url: result.url }
}

// קריאת URL של תמונה (פשוט מחזיר את ה-URL)
export async function getImageUrl(path) {
  // התמונות כבר ב-ImgBB, אין צורך לקרוא מ-MongoDB
  return path // path הוא בעצם ה-URL
}
