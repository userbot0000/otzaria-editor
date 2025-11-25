import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { deleteFile, listFiles } from '@/lib/storage'

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'אין הרשאה' },
        { status: 403 }
      )
    }

    const { bookPath } = await request.json()

    if (!bookPath) {
      return NextResponse.json(
        { success: false, error: 'חסר נתיב ספר' },
        { status: 400 }
      )
    }

    // מחק קבצים מ-Blob Storage
    const blobs = await listFiles(`data/`)
    
    for (const blob of blobs) {
      // מחק קבצים הקשורים לספר הזה
      if (blob.pathname.includes(bookPath)) {
        await deleteFile(blob.url)
        console.log(`Deleted: ${blob.pathname}`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting book:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה במחיקת ספר' },
      { status: 500 }
    )
  }
}
