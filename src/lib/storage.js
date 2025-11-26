// ממשק אחיד לאחסון
import * as mongoStorage from './mongodb-storage.js'
import * as githubStorage from './github-storage.js'

// נתונים (JSON/Text) - MongoDB
export const saveJSON = mongoStorage.saveJSON
export const readJSON = mongoStorage.readJSON
export const saveText = mongoStorage.saveText
export const readText = mongoStorage.readText
export const deleteFile = mongoStorage.deleteFile
export const fileExists = mongoStorage.fileExists

// תמונות - GitHub Releases
export const saveImage = githubStorage.saveImage
export const getImageUrl = githubStorage.getImageUrl

// רשימת קבצים - תלוי בסוג
export async function listFiles(prefix) {
  // אם זה תמונות, השתמש ב-GitHub
  if (prefix.includes('thumbnails')) {
    return await githubStorage.listImages(prefix)
  }
  // אחרת, MongoDB
  return await mongoStorage.listFiles(prefix)
}
