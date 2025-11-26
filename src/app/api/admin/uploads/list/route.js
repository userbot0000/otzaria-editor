import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { readJSON, listFiles } from '@/lib/storage'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)

    // בדיקת הרשאות מנהל
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'אין הרשאה' },
        { status: 403 }
      )
    }

    // טען את המטא-דאטה
    let allUploads = await readJSON('data/uploads-meta.json') || []

    // קבל את רשימת הקבצים מ-Blob כדי לקבל את ה-URLs
    const blobFiles = await listFiles('data/uploads/')

    // הוסף את ה-URL לכל העלאה
    allUploads = allUploads.map(upload => {
      const blobFile = blobFiles.find(f => f.pathname.endsWith(upload.fileName))
      return {
        ...upload,
        fileUrl: blobFile ? blobFile.url : null,
        downloadUrl: blobFile ? blobFile.downloadUrl : null
      }
    })

    return NextResponse.json({
      success: true,
      uploads: allUploads
    })
  } catch (error) {
    console.error('Error loading uploads:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת ההעלאות' },
      { status: 500 }
    )
  }
}
