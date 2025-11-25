import { NextResponse } from 'next/server'
import { saveJSON, readJSON, listFiles } from '@/lib/storage'
import path from 'path'
import fs from 'fs'

// ב-production (Vercel) תמיד נשתמש ב-Blob Storage
const USE_BLOB = process.env.USE_BLOB_STORAGE === 'true' || process.env.VERCEL_ENV === 'production'
const THUMBNAILS_PATH = path.join(process.cwd(), 'public', 'thumbnails')

// הגדר את runtime ל-nodejs (לא edge) כדי לתמוך ב-fs
export const runtime = 'nodejs'

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
        console.log('📥 API called')
        console.log('   Full params:', JSON.stringify(params))
        console.log('   params.path:', params?.path)
        console.log('   Request URL:', request.url)
        
        // בדוק שיש params.path
        if (!params || !params.path) {
            console.error('❌ Missing params.path!')
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'חסר נתיב לספר',
                    debug: {
                        params: params,
                        url: request.url
                    }
                },
                { status: 400 }
            )
        }
        
        // Next.js API routes מפענחים את params אוטומטית
        let bookPath = Array.isArray(params.path) ? params.path.join('/') : params.path
        
        // אם זה עדיין מקודד (לפעמים Next.js לא מפענח), פענח אותו
        if (bookPath && bookPath.includes('%')) {
            bookPath = decodeURIComponent(bookPath)
            console.log('   Decoded path:', bookPath)
        }
        
        console.log('   Book path:', bookPath)
        console.log('   Book path length:', bookPath?.length)
        console.log('   Book path char codes:', bookPath ? Array.from(bookPath).map(c => c.charCodeAt(0)) : 'N/A')
        
        const bookName = bookPath

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
                path: bookPath,
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
        console.log(`📸 Loading thumbnails for book: "${bookName}"`)
        const blobs = await listFiles(`thumbnails/${bookName}/`)
        console.log(`   Found ${blobs.length} blobs`)
        thumbnails = blobs.map(blob => {
            const fileName = blob.pathname.split('/').pop()
            console.log(`   - ${fileName} -> ${blob.url}`)
            return {
                name: fileName,
                url: blob.url
            }
        })
    }

    for (let i = 1; i <= numPages; i++) {
        // אם יש נתונים קיימים לעמוד זה, שמור אותם
        const existingPage = existingData.find(p => p.number === i)

        // מצא את תמונת העמוד
        let thumbnail = null
        if (USE_BLOB) {
            thumbnail = findPageThumbnailFromBlobs(thumbnails, i, bookName)
            if (!thumbnail) {
                console.warn(`⚠️  No thumbnail found for page ${i}`)
            }
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

    console.log(`✅ Created ${pagesData.length} pages, ${pagesData.filter(p => p.thumbnail).length} with thumbnails`)
    return pagesData
}

// מציאת תמונת עמוד מרשימת blobs
function findPageThumbnailFromBlobs(thumbnails, pageNumber, bookName) {
    // נסה פורמטים שונים של שמות קבצים
    const possibleNames = [
        `page-${pageNumber}.jpg`,
        `page-${pageNumber}.jpeg`,
        `page-${pageNumber}.png`,
        `page_${pageNumber}.jpg`,
        `${pageNumber}.jpg`,
        `${String(pageNumber).padStart(3, '0')}.jpg`, // 001.jpg
        `page-${String(pageNumber).padStart(3, '0')}.jpg`, // page-001.jpg
    ]

    for (const name of possibleNames) {
        const found = thumbnails.find(t => t.name === name)
        if (found) {
            console.log(`   ✅ Found thumbnail for page ${pageNumber}: ${name}`)
            return found.url
        }
    }

    // אם לא נמצא, נסה חיפוש גמיש יותר
    const flexibleMatch = thumbnails.find(t => {
        const fileName = t.name.toLowerCase()
        return fileName.includes(`${pageNumber}.`) || 
               fileName.includes(`-${pageNumber}.`) ||
               fileName.includes(`_${pageNumber}.`)
    })
    
    if (flexibleMatch) {
        console.log(`   ✅ Found thumbnail (flexible) for page ${pageNumber}: ${flexibleMatch.name}`)
        return flexibleMatch.url
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
    console.log(`📊 getPageCountFromThumbnails called`)
    console.log(`   USE_BLOB: ${USE_BLOB}`)
    console.log(`   VERCEL_ENV: ${process.env.VERCEL_ENV}`)
    console.log(`   USE_BLOB_STORAGE: ${process.env.USE_BLOB_STORAGE}`)
    console.log(`   Has BLOB_TOKEN: ${!!process.env.BLOB_READ_WRITE_TOKEN}`)
    
    if (USE_BLOB) {
        // ספור תמונות מ-Blob Storage
        try {
            console.log(`📊 Counting thumbnails from Blob for: "${bookName}"`)
            console.log(`   Book name length: ${bookName.length}`)
            console.log(`   Book name charCodes:`, Array.from(bookName).map(c => c.charCodeAt(0)))
            
            const prefix = `thumbnails/${bookName}/`
            console.log(`   Full prefix: "${prefix}"`)
            
            const blobs = await listFiles(prefix)
            console.log(`   Found ${blobs.length} blobs`)
            
            if (blobs.length === 0) {
                // נסה ללא / בסוף
                console.log(`   Trying without trailing slash...`)
                const blobs2 = await listFiles(`thumbnails/${bookName}`)
                console.log(`   Found ${blobs2.length} blobs without slash`)
                return blobs2.length || null
            }
            
            if (blobs.length > 0) {
                console.log(`   First blob: ${blobs[0].pathname}`)
            }
            return blobs.length || null
        } catch (error) {
            console.error('❌ Error counting thumbnails from Blob:', error)
            console.error('   Error details:', error.message)
            console.error('   Error stack:', error.stack)
            throw error // זרוק את השגיאה כדי שנראה אותה
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
