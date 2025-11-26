import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { readJSON, saveJSON } from '@/lib/storage'

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { bookName, pageNumber, updates } = await request.json()
    
    if (!bookName || !pageNumber) {
      return NextResponse.json(
        { success: false, error: 'חסרים פרמטרים נדרשים' },
        { status: 400 }
      )
    }

    console.log(`🔧 Admin updating page: ${bookName} - page ${pageNumber}`)
    console.log('   Updates:', updates)

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

    // עדכן את העמוד
    const oldPage = pagesData[pageIndex]
    pagesData[pageIndex] = {
      ...oldPage,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.name,
      updatedById: session.user.id
    }

    // אם משנים סטטוס ל-available, נקה את הנתונים
    if (updates.status === 'available') {
      pagesData[pageIndex] = {
        number: pageNumber,
        status: 'available',
        claimedBy: null,
        claimedById: null,
        claimedAt: null,
        completedAt: null,
        thumbnail: oldPage.thumbnail,
        updatedAt: new Date().toISOString(),
        updatedBy: session.user.name,
        updatedById: session.user.id
      }
    }

    // שמור בחזרה
    await saveJSON(pagesDataFile, pagesData)

    console.log(`✅ Page updated: ${bookName} - page ${pageNumber}`)

    return NextResponse.json({
      success: true,
      page: pagesData[pageIndex],
      message: 'העמוד עודכן בהצלחה'
    })
  } catch (error) {
    console.error('Error updating page:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
