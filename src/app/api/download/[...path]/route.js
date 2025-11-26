import { NextResponse } from 'next/server'
import { readText } from '@/lib/storage'

export const runtime = 'nodejs'

export async function GET(request, { params }) {
  try {
    // קבל את הנתיב המלא
    const pathSegments = params.path
    const filePath = pathSegments.join('/')
    
    console.log('📥 Download request:', filePath)
    console.log('   Path segments:', pathSegments)

    // קרא את הקובץ מ-MongoDB
    const content = await readText(filePath)
    
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'קובץ לא נמצא' },
        { status: 404 }
      )
    }

    // חלץ את שם הקובץ
    const fileName = pathSegments[pathSegments.length - 1]

    // החזר את הקובץ
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    })
  } catch (error) {
    console.error('Error downloading file:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בהורדת הקובץ' },
      { status: 500 }
    )
  }
}
