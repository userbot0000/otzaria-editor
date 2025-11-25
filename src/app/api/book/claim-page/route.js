import { NextResponse } from 'next/server'
import { saveJSON, readJSON } from '@/lib/storage'

export const runtime = 'nodejs'

export async function POST(request) {
    try {
        const body = await request.json()
        const { bookPath, pageNumber, userId, userName } = body

        console.log('📤 Claim page request:', { bookPath, pageNumber, userId, userName })
        console.log('   Book path length:', bookPath?.length)
        console.log('   Book path char codes:', bookPath ? Array.from(bookPath).map(c => c.charCodeAt(0)) : 'N/A')

        if (!bookPath || !pageNumber || !userId || !userName) {
            return NextResponse.json(
                { success: false, error: 'חסרים פרמטרים נדרשים' },
                { status: 400 }
            )
        }

        const bookName = bookPath
        const pagesDataFile = `data/pages/${bookName}.json`

        let pagesData = await readJSON(pagesDataFile)

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

        // בדוק אם העמוד כבר תפוס על ידי מישהו אחר
        if (page.status === 'in-progress' && page.claimedById !== userId) {
            return NextResponse.json(
                { success: false, error: `העמוד כבר בטיפול של ${page.claimedBy}` },
                { status: 409 }
            )
        }

        // עדכן את העמוד
        pagesData[pageIndex] = {
            ...page,
            status: 'in-progress',
            claimedBy: userName,
            claimedById: userId,
            claimedAt: new Date().toISOString(),
        }

        // שמור בחזרה ל-Blob Storage
        await saveJSON(pagesDataFile, pagesData)

        console.log(`✅ Page ${pageNumber} claimed by ${userName}`)

        return NextResponse.json({
            success: true,
            message: 'העמוד נתפס בהצלחה',
            page: pagesData[pageIndex],
        })
    } catch (error) {
        console.error('❌ Error claiming page:', error)
        return NextResponse.json(
            { success: false, error: 'שגיאה בתפיסת העמוד: ' + error.message },
            { status: 500 }
        )
    }
}
