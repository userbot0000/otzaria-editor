// ממשק אחיד לאחסון - משתמש ב-MongoDB
import * as mongoStorage from './mongodb-storage.js'

// ייצוא מחדש של כל הפונקציות מ-mongodb-storage
export const saveJSON = mongoStorage.saveJSON
export const readJSON = mongoStorage.readJSON
export const saveText = mongoStorage.saveText
export const readText = mongoStorage.readText
export const deleteFile = mongoStorage.deleteFile
export const listFiles = mongoStorage.listFiles
export const fileExists = mongoStorage.fileExists
export const saveImage = mongoStorage.saveImage
export const getImageUrl = mongoStorage.getImageUrl
