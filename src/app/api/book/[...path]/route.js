import { NextResponse } from 'next/server'
import { saveJSON, readJSON } from '@/lib/storage'
import path from 'path'
import fs from 'fs'

const LIBRARY_PATH = path.join(process.cwd(), 'public', 'assets', 'library')

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

        const bookName = path.basename(bookPath, '.pdf')
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

        const bookName = path.basename(bookPath, '.pdf')
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
        const fullPath = path.join(LIBRARY_PATH, decodedPath)
        console.log('Full path:', fullPath)

        if (!fs.existsSync(fullPath)) {
            console.log('File not found:', fullPath)
            return NextResponse.json(
                { success: false, error: 'הספר לא נמצא' },
                { status: 404 }
            )
        }

        const stats = fs.statSync(fullPath)
        const bookName = path.basename(decodedPath, '.pdf')

        // קרא את מספר העמודים ממטא-דאטה או השתמש בהערכה
        let numPages = await getPageCountFromMeta(fullPath) || estimatePages(stats.size)
        console.log(`Book "${bookName}" has ${numPages} pages (from meta or estimate)`)

        // טען או צור נתוני עמודים
        const pagesDataFile = `data/pages/${bookName}.json`
        let pagesData = await readJSON(pagesDataFile)

        if (pagesData) {
            // אם מספר העמודים השתנה, עדכן
            if (pagesData.length !== numPages) {
                console.log(`Updating pages count from ${pagesData.length} to ${numPages}`)
                pagesData = createPagesData(numPages, pagesData, decodedPath)
                await saveJSON(pagesDataFile, pagesData)
            }
        } else {
            // צור נתוני עמודים חדשים
            pagesData = createPagesData(numPages, [], decodedPath)
            await saveJSON(pagesDataFile, pagesData)
        }

        return NextResponse.json({
            success: true,
            book: {
                name: bookName,
                path: decodedPath,
                size: stats.size,
                lastModified: stats.mtime,
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

// יצירת נתוני עמודים
function createPagesData(numPages, existingData = [], bookPath) {
    const pagesData = []

    // נסה לטעון תמונות thumbnail אם קיימות
    const bookNameWithoutExt = bookPath.replace('.pdf', '')
    const thumbnailsPath = path.join(process.cwd(), 'public', 'thumbnails', bookNameWithoutExt)
    const hasThumbnails = fs.existsSync(thumbnailsPath)

    let thumbnailCount = 0

    for (let i = 1; i <= numPages; i++) {
        // אם יש נתונים קיימים לעמוד זה, שמור אותם
        const existingPage = existingData.find(p => p.number === i)

        // בדוק אם יש תמונת thumbnail
        let thumbnail = null
        if (hasThumbnails) {
            const thumbPath = path.join(thumbnailsPath, `page-${i}.jpg`)
            if (fs.existsSync(thumbPath)) {
                thumbnail = `/thumbnails/${bookNameWithoutExt}/page-${i}.jpg`
                thumbnailCount++
            }
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

// קריאת מספר עמודים ממטא-דאטה
async function getPageCountFromMeta(pdfPath) {
    const metaPath = pdfPath + '.meta.json'

    if (fs.existsSync(metaPath)) {
        try {
            const meta = fs.readFileSync(metaPath, 'utf-8')
            const parsed = JSON.parse(meta)
            console.log(`Found meta file for ${path.basename(pdfPath)}: ${parsed.pages} pages`)
            return parsed.pages || null
        } catch (error) {
            console.error('Error reading meta file:', error)
        }
    }

    return null
}

// הערכת מספר עמודים לפי גודל קובץ (fallback)
function estimatePages(fileSize) {
    // הערכה גסה: כל 50KB = עמוד אחד
    const estimated = Math.ceil(fileSize / 50000)
    // הגבל בין 10 ל-500 עמודים
    return Math.min(Math.max(estimated, 10), 500)
}
