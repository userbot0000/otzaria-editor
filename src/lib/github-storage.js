import { Octokit } from '@octokit/rest'
import { logger } from './logger.js'

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

const GITHUB_OWNER = process.env.GITHUB_OWNER // שם המשתמש שלך
const GITHUB_REPO = process.env.GITHUB_REPO // שם הריפו
const RELEASE_TAG = 'thumbnails-v2' // תג לכל התמונות

let releaseId = null

// קבל או צור release
async function getOrCreateRelease() {
  if (releaseId) return releaseId
  
  try {
    // נסה למצוא release קיים
    const { data: releases } = await octokit.repos.listReleases({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
    })
    
    const existing = releases.find(r => r.tag_name === RELEASE_TAG)
    
    if (existing) {
      releaseId = existing.id
      logger.log(`✅ Found existing release: ${RELEASE_TAG}`)
      return releaseId
    }
    
    // צור release חדש
    const { data: newRelease } = await octokit.repos.createRelease({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      tag_name: RELEASE_TAG,
      name: 'Thumbnails Storage',
      body: 'Storage for book thumbnails',
      draft: false,
      prerelease: false,
    })
    
    releaseId = newRelease.id
    logger.log(`✅ Created new release: ${RELEASE_TAG}`)
    return releaseId
    
  } catch (error) {
    logger.error('❌ Error getting/creating release:', error)
    throw error
  }
}

// העלאת תמונה ל-GitHub Release
export async function uploadImage(imageBuffer, fileName) {
  try {
    const releaseId = await getOrCreateRelease()
    
    // העלה את הקובץ
    const { data } = await octokit.repos.uploadReleaseAsset({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      release_id: releaseId,
      name: fileName,
      data: imageBuffer,
      headers: {
        'content-type': 'image/jpeg',
        'content-length': imageBuffer.length,
      },
    })
    
    logger.log(`✅ Uploaded to GitHub: ${fileName}`)
    
    return {
      url: data.browser_download_url,
      id: data.id,
    }
  } catch (error) {
    logger.error(`❌ Error uploading ${fileName}:`, error.message)
    throw error
  }
}

// שמירת תמונה
export async function saveImage(path, imageBuffer, contentType = 'image/jpeg') {
  const fileName = path.replace(/\//g, '_') // המר / ל-_
  const result = await uploadImage(imageBuffer, fileName)
  return { url: result.url }
}

// קריאת URL של תמונה
export async function getImageUrl(path) {
  const fileName = path.replace(/\//g, '_')
  
  try {
    const releaseId = await getOrCreateRelease()
    
    // קבל את כל ה-assets
    const { data: assets } = await octokit.repos.listReleaseAssets({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      release_id: releaseId,
    })
    
    const asset = assets.find(a => a.name === fileName)
    
    if (asset) {
      return asset.browser_download_url
    }
    
    return null
  } catch (error) {
    logger.error('❌ Error getting image URL:', error)
    return null
  }
}

// טען מיפוי ספרים
export async function loadBookMapping() {
  try {
    const { readJSON } = await import('./storage.js')
    const mapping = await readJSON('data/book-mapping.json')
    return mapping || {}
  } catch (error) {
    logger.error('❌ Error loading book mapping:', error)
    return {}
  }
}

// המר ID באנגלית לשם עברי
export async function getBookNameFromId(bookId) {
  const mapping = await loadBookMapping()
  return mapping[bookId] || bookId
}

// המר שם עברי ל-ID באנגלית
export async function getBookIdFromName(bookName) {
  const mapping = await loadBookMapping()
  const entry = Object.entries(mapping).find(([id, name]) => name === bookName)
  return entry ? entry[0] : null
}

// רשימת כל התמונות
export async function listImages(prefix = '') {
  try {
    const releaseId = await getOrCreateRelease()
    
    // אם יש prefix (שם ספר), המר אותו ל-ID
    let filterPrefix = prefix
    if (prefix && prefix.includes('thumbnails/')) {
      const bookName = prefix.replace('thumbnails/', '').replace('/', '')
      const bookId = await getBookIdFromName(bookName)
      if (bookId) {
        filterPrefix = bookId
      }
    }
    
    // טען את כל ה-assets (עם pagination)
    let allAssets = []
    let page = 1
    let hasMore = true
    
    while (hasMore) {
      const { data: assets } = await octokit.repos.listReleaseAssets({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        release_id: releaseId,
        per_page: 100,
        page: page,
      })
      
      if (assets.length === 0) {
        hasMore = false
      } else {
        allAssets = allAssets.concat(assets)
        page++
        
        // אם קיבלנו פחות מ-100, זה העמוד האחרון
        if (assets.length < 100) {
          hasMore = false
        }
      }
    }
    
    logger.log(`📸 Loaded ${allAssets.length} total assets from GitHub`)
    
    return allAssets
      .filter(a => !filterPrefix || a.name.startsWith(filterPrefix))
      .map(a => ({
        pathname: a.name,
        url: a.browser_download_url,
        size: a.size,
        uploadedAt: a.created_at,
      }))
  } catch (error) {
    logger.error('❌ Error listing images:', error)
    return []
  }
}
