import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { readJSON, saveJSON } from '@/lib/storage'

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)

    // בדיקת הרשאות מנהל
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'אין הרשאה' },
        { status: 403 }
      )
    }

    const { uploadId, status } = await request.json()

    if (!uploadId || !status) {
      return NextResponse.json(
        { success: false, error: 'חסרים פרמטרים' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'סטטוס לא תקין' },
        { status: 400 }
      )
    }

    // טען את קובץ המטא-דאטה
    let allUploads = await readJSON('data/uploads-meta.json') || []

    // מצא את ההעלאה ועדכן את הסטטוס
    const uploadIndex = allUploads.findIndex(u => u.id === uploadId)
    
    if (uploadIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'העלאה לא נמצאה' },
        { status: 404 }
      )
    }

    allUploads[uploadIndex].status = status
    allUploads[uploadIndex].reviewedBy = session.user.name
    allUploads[uploadIndex].reviewedAt = new Date().toISOString()

    // שמור את השינויים
    await saveJSON('data/uploads-meta.json', allUploads)

    console.log(`✅ Upload ${uploadId} status updated to ${status} by ${session.user.name}`)

    return NextResponse.json({
      success: true,
      upload: allUploads[uploadIndex]
    })
  } catch (error) {
    console.error('Error updating upload status:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בעדכון סטטוס' },
      { status: 500 }
    )
  }
}
