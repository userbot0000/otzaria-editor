import { NextResponse } from 'next/server'
import { saveJSON, readJSON } from '@/lib/storage'
import { listImages } from '@/lib/github-storage'
import path from 'path'
import fs from 'fs'

const USE_BLOB = process.env.USE_BLOB_STORAGE === 'true' || process.env.VERCEL_ENV === 'production'
const USE_GITHUB = process.env.USE_GITHUB_STORAGE === 'true' || process.env.VERCEL_ENV === 'production'
const THUMBNAILS_PATH = path.join(process.cwd(), 'public', 'thumbnails')

export const runtime = 'nodejs'

export async function GET(request) {
    try {
        // קבל את bookName מ-query parameter
        const { searchParams } = new URL(request.url)
        const bookName = searchParams.get('name')
        
        console.log('📥 API called with bookName:', bookName)
        
        if (!bookName) {
            return NextResponse.json(
                { success: false, error: 'חסר שם ספר' },
                { status: 400 }
            )
        }
        
        console.log('   Book name:', bookName)
        console.log('   Book name length:', bookName.length)

        // קרא את מספר העמודים מספירת התמונות
        let numPages
        try {
            numPages = await getPageCountFromThumbnails(bookName)
        } catch (countError) {
            console.error('❌ Failed to count pages:', countError)
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'שגיאה בספירת עמודי הספר',
                    details: countError.message,
                    bookName: bookName
                },
                { status: 500 }
            )
        }
        
        if (!numPages || numPages === 0) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'לא נמצאו תמונות עבור ספר זה',
                    bookName: bookName,
                    useBlob: USE_BLOB
                },
                { status: 404 }
            )
        }
        
        console.log(`Book "${bookName}" has ${numPages} pages`)

        // טען נתוני עמודים מ-Blob Storage
        const pagesDataFile = `data/pages/${bookName}.json`
        let pagesData = await readJSON(pagesDataFile)

        if (!pagesData) {
            pagesData = await createPagesData(numPages, [], bookName)
            await saveJSON(pagesDataFile, pagesData)
        } else if (pagesData.length !== numPages) {
            console.log(`Updating pages count from ${pagesData.length} to ${numPages}`)
            pagesData = await createPagesData(numPages, pagesData, bookName)
            await saveJSON(pagesDataFile, pagesData)
        }

        return NextResponse.json({
            success: true,
            book: {
                name: bookName,
                path: bookName,
                totalPages: numPages,
            },
            pages: pagesData,
        })
    } catch (error) {
        console.error('Error loading book:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'שגיאה בטעינת הספר',
                details: error.message,
            },
            { status: 500 }
        )
    }
}

// העתק את כל הפונקציות העזר מהקובץ המקורי
async function createPagesData(numPages, existingData = [], bookName) {
    const pagesData = []
    
    let thumbnails = []
    let bookId = null
    
    if (USE_GITHUB) {
        // טען מיפוי ספרים
        const mapping = await readJSON('data/book-mapping.json')
        bookId = Object.entries(mapping || {}).find(([id, name]) => name === bookName)?.[0]
        
        if (bookId) {
            const images = await listImages(bookId)
            thumbnails = images.map(img => ({
                name: img.pathname.replace(`${bookId}_`, ''),
                url: img.url
            }))
        }
    } else if (USE_BLOB) {
        const { listFiles } = await import('@/lib/storage')
        const blobs = await listFiles(`thumbnails/${bookName}/`)
        thumbnails = blobs.map(blob => ({
            name: blob.pathname.split('/').pop(),
            url: blob.url
        }))
    }

    for (let i = 1; i <= numPages; i++) {
        const existingPage = existingData.find(p => p.number === i)
        let thumbnail = null
        
        if (USE_GITHUB && bookId) {
            thumbnail = findPageThumbnailFromBlobs(thumbnails, i, bookName)
        } else if (USE_BLOB) {
            thumbnail = findPageThumbnailFromBlobs(thumbnails, i, bookName)
        } else {
            const thumbnailsPath = path.join(THUMBNAILS_PATH, bookName)
            thumbnail = findPageThumbnail(thumbnailsPath, i, bookName)
        }

        if (existingPage) {
            pagesData.push({
                ...existingPage,
                thumbnail: thumbnail || existingPage.thumbnail
            })
        } else {
            pagesData.push({
                number: i,
                status: 'available',
                claimedBy: null,
                claimedById: null,
                claimedAt: null,
                completedAt: null,
                thumbnail: thumbnail,
            })
        }
    }

    return pagesData
}

function findPageThumbnailFromBlobs(thumbnails, pageNumber, bookName) {
    const possibleNames = [
        `page-${pageNumber}.jpg`,
        `page-${pageNumber}.jpeg`,
        `page-${pageNumber}.png`,
        `page_${pageNumber}.jpg`,
        `${pageNumber}.jpg`,
        `${String(pageNumber).padStart(3, '0')}.jpg`,
        `page-${String(pageNumber).padStart(3, '0')}.jpg`,
    ]

    for (const name of possibleNames) {
        const found = thumbnails.find(t => t.name === name)
        if (found) return found.url
    }

    const flexibleMatch = thumbnails.find(t => {
        const fileName = t.name.toLowerCase()
        return fileName.includes(`${pageNumber}.`) || 
               fileName.includes(`-${pageNumber}.`) ||
               fileName.includes(`_${pageNumber}.`)
    })
    
    if (flexibleMatch) return flexibleMatch.url
    return null
}

function findPageThumbnail(thumbnailsPath, pageNumber, bookName) {
    const possibleNames = [
        `page-${pageNumber}.jpg`,
        `page-${pageNumber}.jpeg`,
        `page-${pageNumber}.png`,
        `page_${pageNumber}.jpg`,
        `${pageNumber}.jpg`,
    ]

    for (const name of possibleNames) {
        const fullPath = path.join(thumbnailsPath, name)
        if (fs.existsSync(fullPath)) {
            return `/thumbnails/${bookName}/${name}`
        }
    }

    return null
}

async function getPageCountFromThumbnails(bookName) {
    if (USE_GITHUB) {
        try {
            // טען מיפוי ספרים
            const mapping = await readJSON('data/book-mapping.json')
            if (!mapping) {
                console.error('❌ No book mapping found')
                return null
            }
            
            // מצא את ה-ID של הספר
            const bookId = Object.entries(mapping).find(([id, name]) => name === bookName)?.[0]
            if (!bookId) {
                console.error(`❌ No book ID found for: ${bookName}`)
                return null
            }
            
            console.log(`📚 Book ID: ${bookId}`)
            
            // קבל תמונות מ-GitHub
            const images = await listImages(bookId)
            console.log(`📸 Found ${images.length} images on GitHub`)
            return images.length || null
        } catch (error) {
            console.error('❌ Error counting thumbnails from GitHub:', error)
            throw error
        }
    } else if (USE_BLOB) {
        try {
            const { listFiles } = await import('@/lib/storage')
            const blobs = await listFiles(`thumbnails/${bookName}/`)
            if (blobs.length === 0) {
                const blobs2 = await listFiles(`thumbnails/${bookName}`)
                return blobs2.length || null
            }
            return blobs.length || null
        } catch (error) {
            console.error('❌ Error counting thumbnails from Blob:', error)
            throw error
        }
    } else {
        const thumbnailsPath = path.join(THUMBNAILS_PATH, bookName)
        if (fs.existsSync(thumbnailsPath)) {
            const files = fs.readdirSync(thumbnailsPath)
            const imageFiles = files.filter(f => {
                const ext = path.extname(f).toLowerCase()
                return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)
            })
            return imageFiles.length || null
        }
        return null
    }
}
