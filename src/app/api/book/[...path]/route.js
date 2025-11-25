import { NextResponse } from 'next/server'
import { saveJSON, readJSON, listFiles } from '@/lib/storage'
import path from 'path'
import fs from 'fs'

const THUMBNAILS_PATH = path.join(process.cwd(), 'public', 'thumbnails')
const USE_BLOB = process.env.USE_BLOB_STORAGE === 'true' || process.env.VERCEL_ENV === 'production'

export async function POST(request, { params }) {
    try {
        const body = await request.json()
        const { action, bookPath, pageNumber, userId, userName } = body

        console.log('POST request:', { action, bookPath, pageNumber, userId, userName })

        if (action === 'claim') {
            return handleClaimPage(bookPath, pageNumber, userId, userName)
        } else if (action === 'complete') {
            return handleCompletePage(bookPath, pageNumber, userId)
        }

        return NextResponse.json(
            { success: false, error: 'פעולה לא מוכרת' },
            { status: 400 }
        )
    } catch (error) {
        console.error('Error in POST:', error)
        return NextResponse.json(
            { success: false, error: 'שגיאה בעיבוד הבקשה' },
            { status: 500 }
        )
    }
}

async function handleClaimPage(bookPath, pageNumber, userId, userName) {
    try {
        if (!bookPath || !pageNumber || !userId || !userName) {
            return NextResponse.json(
                { success: false, error: 'חסרים פרמטרים נדרשים' },
                { status: 400 }
            )
        }

        const bookName = bookPath // שם הספר הוא שם התיקייה
        const pagesDataFile = `data/pages/${bookName}.json`

        const pagesData = await readJSON(pagesDataFile)

        if (!pagesData) {
            return NextResponse.json(
                { success: false, error: 'קובץ נתוני העמודים לא נמצא' },
                { status: 404 }
            )
        }

        const pageIndex = pagesData.findIndex(p => p.number === pageNumber)

        if (pageIndex === -1) {
            return NextResponse.json(
                { success: false, error: 'העמוד לא נמצא' },
                { status: 404 }
            )
        }

        const page = pagesData[pageIndex]

        if (page.status === 'in-progress' && page.claimedById !== userId) {
            return NextResponse.json(
                { success: false, error: `העמוד כבר בטיפול של ${page.claimedBy}` },
                { status: 409 }
            )
        }

        pagesData[pageIndex] = {
            ...page,
            status: 'in-progress',
            claimedBy: userName,
            claimedById: userId,
            claimedAt: new Date().toISOString(),
        }

        await saveJSON(pagesDataFile, pagesData)

        console.log(`✅ Page ${pageNumber} claimed by ${userName}`)

        return NextResponse.json({
            success: true,
            message: 'העמוד נתפס בהצלחה',
            page: pagesData[pageIndex],
        })
    } catch (error) {
        console.error('Error claiming page:', error)
        return NextResponse.json(
            { success: false, error: 'שגיאה בתפיסת העמוד' },
            { status: 500 }
        )
    }
}

async function handleCompletePage(bookPath, pageNumber, userId) {
    try {
        if (!bookPath || !pageNumber || !userId) {
            return NextResponse.json(
                { success: false, error: 'חסרים פרמטרים נדרשים' },
                { status: 400 }
            )
        }

        const bookName = bookPath // שם הספר הוא שם התיקייה
        const pagesDataFile = `data/pages/${bookName}.json`

        const pagesData = await readJSON(pagesDataFile)

        if (!pagesData) {
            return NextResponse.json(
                { success: false, error: 'קובץ נתוני העמודים לא נמצא' },
                { status: 404 }
            )
        }

        const pageIndex = pagesData.findIndex(p => p.number === pageNumber)

        if (pageIndex === -1) {
            return NextResponse.json(
                { success: false, error: 'העמוד לא נמצא' },
                { status: 404 }
            )
        }

        const page = pagesData[pageIndex]

        if (page.claimedById !== userId) {
            return NextResponse.json(
                { success: false, error: 'אין לך הרשאה לסמן עמוד זה כהושלם' },
                { status: 403 }
            )
        }

        pagesData[pageIndex] = {
            ...page,
            status: 'completed',
            completedAt: new Date().toISOString(),
        }

        await saveJSON(pagesDataFile, pagesData)

        console.log(`✅ Page ${pageNumber} completed by user ${userId}`)

        return NextResponse.json({
            success: true,
            message: 'העמוד סומן כהושלם',
            page: pagesData[pageIndex],
        })
    } catch (error) {
        console.error('Error completing page:', error)
        return NextResponse.json(
            { success: false, error: 'שגיאה בסימון העמוד כהושלם' },
            { status: 500 }
        )
    }
}

export async function GET(request, { params }) {
    try {
        console.log('API called with params:', params)
        const bookPath = Array.isArray(params.path) ? params.path.join('/') : params.path
        console.log('Book path:', bookPath)
        const decodedPath = decodeURIComponent(bookPath)
        console.log('Decoded path:', decodedPath)

        const bookName = decodedPath // שם הספר הוא שם התיקייה

        // קרא את מספר העמודים מספירת התמונות
        let numPages = await getPageCountFromThumbnails(bookName)
        
        if (!numPages || numPages === 0) {
            return NextResponse.json(
                { success: false, error: 'לא נמצאו תמונות עבור ספר זה' },
                { status: 404 }
            )
        }
        
        console.log(`Book "${bookName}" has ${numPages} pages`)

        // טען נתוני עמודים מ-Blob Storage
        const pagesDataFile = `data/pages/${bookName}.json`
        let pagesData = await readJSON(pagesDataFile)

        if (!pagesData) {
            // אם אין קובץ, צור נתונים חדשים
            pagesData = await createPagesData(numPages, [], bookName)
            await saveJSON(pagesDataFile, pagesData)
        } else if (pagesData.length !== numPages) {
            // אם מספר העמודים השתנה, עדכן
            console.log(`Updating pages count from ${pagesData.length} to ${numPages}`)
            pagesData = await createPagesData(numPages, pagesData, bookName)
            await saveJSON(pagesDataFile, pagesData)
        }

        return NextResponse.json({
            success: true,
            book: {
                name: bookName,
                path: decodedPath,
                totalPages: numPages,
            },
            pages: pagesData,
        })
    } catch (error) {
        console.error('Error loading book:', error)
        console.error('Error stack:', error.stack)
        return NextResponse.json(
            {
                success: false,
                error: 'שגיאה בטעינת הספר',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        )
    }
}

// יצירת נתוני עמודים מתיקיית התמונות
async function createPagesData(numPages, existingData = [], bookName) {
    const pagesData = []
    
    // טען את כל התמונות של הספר
    let thumbnails = []
    if (USE_BLOB) {
        const blobs = await listFiles(`thumbnails/${bookName}/`)
        thumbnails = blobs.map(blob => ({
            name: blob.pathname.split('/').pop(),
            url: blob.url
        }))
    }

    for (let i = 1; i <= numPages; i++) {
        // אם יש נתונים קיימים לעמוד זה, שמור אותם
        const existingPage = existingData.find(p => p.number === i)

        // מצא את תמונת העמוד
        let thumbnail = null
        if (USE_BLOB) {
            thumbnail = findPageThumbnailFromBlobs(thumbnails, i, bookName)
        } else {
            const thumbnailsPath = path.join(THUMBNAILS_PATH, bookName)
            thumbnail = findPageThumbnail(thumbnailsPath, i, bookName)
        }

        // הוסף את העמוד לרשימה
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

// מציאת תמונת עמוד מרשימת blobs
function findPageThumbnailFromBlobs(thumbnails, pageNumber, bookName) {
    const possibleNames = [
        `page-${pageNumber}.jpg`,
        `page-${pageNumber}.jpeg`,
        `page-${pageNumber}.png`,
        `page_${pageNumber}.jpg`,
        `${pageNumber}.jpg`,
    ]

    for (const name of possibleNames) {
        const found = thumbnails.find(t => t.name === name)
        if (found) {
            return found.url
        }
    }

    return null
}

// מציאת תמונת עמוד - תומך בפורמטים שונים (מקומי)
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

// קריאת מספר עמודים מספירת תמונות
async function getPageCountFromThumbnails(bookName) {
    if (USE_BLOB) {
        // ספור תמונות מ-Blob Storage
        try {
            console.log(`Counting thumbnails from Blob for: ${bookName}`)
            const blobs = await listFiles(`thumbnails/${bookName}/`)
            console.log(`Found ${blobs.length} blobs for ${bookName}`)
            return blobs.length || null
        } catch (error) {
            console.error('Error counting thumbnails from Blob:', error)
            return null
        }
    } else {
        // ספור תמונות מקומיות
        const thumbnailsPath = path.join(THUMBNAILS_PATH, bookName)

        if (fs.existsSync(thumbnailsPath)) {
            try {
                const files = fs.readdirSync(thumbnailsPath)
                const imageFiles = files.filter(f => {
                    const ext = path.extname(f).toLowerCase()
                    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)
                })
                console.log(`Found ${imageFiles.length} thumbnail images for ${bookName}`)
                return imageFiles.length || null
            } catch (error) {
                console.error('Error counting thumbnails:', error)
            }
        }

        console.warn(`Thumbnails directory not found: ${thumbnailsPath}`)
        return null
    }
}
