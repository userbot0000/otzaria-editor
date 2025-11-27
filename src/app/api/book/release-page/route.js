import { NextResponse } from 'next/server'
import { saveJSON, readJSON } from '@/lib/storage'

export const runtime = 'nodejs'

export async function POST(request) {
    try {
        const body = await request.json()
        const { bookPath, pageNumber, userId } = body

        console.log('🔓 Release page request:', { bookPath, pageNumber, userId })

        if (!bookPath || !pageNumber || !userId) {
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

        // בדוק שהעמוד שייך למשתמש הזה
        if (page.claimedById !== userId) {
            return NextResponse.json(
                { success: false, error: 'אין לך הרשאה לשחרר עמוד זה' },
                { status: 403 }
            )
        }

        // בדוק שהעמוד לא הושלם
        if (page.status === 'completed') {
            return NextResponse.json(
                { success: false, error: 'לא ניתן לשחרר עמוד שכבר הושלם' },
                { status: 400 }
            )
        }

        // שחרר את העמוד
        pagesData[pageIndex] = {
            ...page,
            status: 'available',
            claimedBy: null,
            claimedById: null,
            claimedAt: null,
        }

        // שמור בחזרה ל-Storage
        await saveJSON(pagesDataFile, pagesData)

        // החזר את 5 הנקודות שקיבל על תפיסת העמוד
        try {
            const usersData = await readJSON('data/users.json')
            if (usersData) {
                const userIndex = usersData.findIndex(u => u.id === userId)
                if (userIndex !== -1) {
                    usersData[userIndex].points = Math.max(0, (usersData[userIndex].points || 0) - 5)
                    await saveJSON('data/users.json', usersData)
                    console.log(`💰 Removed 5 points from user (total: ${usersData[userIndex].points})`)
                }
            }
        } catch (error) {
            console.error('⚠️  Error updating user points:', error)
            // לא נכשיל את הבקשה אם עדכון הנקודות נכשל
        }

        console.log(`✅ Page ${pageNumber} released`)

        return NextResponse.json({
            success: true,
            message: 'העמוד שוחרר בהצלחה (-5 נקודות)',
            page: pagesData[pageIndex],
        })
    } catch (error) {
        console.error('❌ Error releasing page:', error)
        return NextResponse.json(
            { success: false, error: 'שגיאה בשחרור העמוד: ' + error.message },
            { status: 500 }
        )
    }
}
