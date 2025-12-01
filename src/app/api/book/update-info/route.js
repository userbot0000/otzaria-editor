import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { saveJSON, readJSON } from '@/lib/storage'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    // בדוק שהמשתמש מחובר ומנהל
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'אין הרשאה' },
        { status: 403 }
      )
    }

    const { bookPath, editingInfo } = await request.json()

    if (!bookPath) {
      return NextResponse.json(
        { success: false, error: 'חסר נתיב ספר' },
        { status: 400 }
      )
    }

    // קרא את נתוני הספר
    const bookFile = `data/books/${bookPath}.json`
    const bookData = await readJSON(bookFile)

    if (!bookData) {
      return NextResponse.json(
        { success: false, error: 'ספר לא נמצא' },
        { status: 404 }
      )
    }

    // עדכן את מידע העריכה
    bookData.editingInfo = editingInfo

    // שמור בחזרה
    await saveJSON(bookFile, bookData)

    return NextResponse.json({
      success: true,
      message: 'מידע העריכה עודכן בהצלחה'
    })

  } catch (error) {
    console.error('Error updating book info:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בעדכון המידע' },
      { status: 500 }
    )
  }
}
