import { Octokit } from '@octokit/rest'
import { logger } from './logger.js'

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

const GITHUB_OWNER = process.env.GITHUB_OWNER // שם המשתמש שלך
const GITHUB_REPO = process.env.GITHUB_REPO // שם הריפו
const RELEASE_TAG = 'thumbnails-v1' // תג לכל התמונות

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

// רשימת כל התמונות
export async function listImages(prefix = '') {
  try {
    const releaseId = await getOrCreateRelease()
    
    const { data: assets } = await octokit.repos.listReleaseAssets({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      release_id: releaseId,
      per_page: 100,
    })
    
    return assets
      .filter(a => a.name.startsWith(prefix.replace(/\//g, '_')))
      .map(a => ({
        pathname: a.name.replace(/_/g, '/'),
        url: a.browser_download_url,
        size: a.size,
        uploadedAt: a.created_at,
      }))
  } catch (error) {
    logger.error('❌ Error listing images:', error)
    return []
  }
}
