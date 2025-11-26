import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { listFiles, readJSON } from '@/lib/storage'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const bookName = searchParams.get('book')
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    // קבל את כל קבצי העמודים
    const pageFiles = await listFiles('data/pages/')
    const allPages = []

    for (const file of pageFiles) {
      if (!file.pathname.endsWith('.json')) continue
      
      const bookNameFromPath = file.pathname.split('/').pop().replace('.json', '')
      
      // אם יש סינון לפי ספר, דלג על ספרים אחרים
      if (bookName && bookNameFromPath !== bookName) continue
      
      const pagesData = await readJSON(file.pathname)
      if (!pagesData || !Array.isArray(pagesData)) continue
      
      // הוסף את העמודים עם שם הספר
      pagesData.forEach(page => {
        // סינון לפי סטטוס
        if (status && page.status !== status) return
        
        // סינון לפי משתמש
        if (userId && page.claimedById !== userId) return
        
        allPages.push({
          ...page,
          bookName: bookNameFromPath
        })
      })
    }

    // מיין לפי תאריך עדכון אחרון
    allPages.sort((a, b) => {
      const dateA = new Date(a.completedAt || a.claimedAt || 0)
      const dateB = new Date(b.completedAt || b.claimedAt || 0)
      return dateB - dateA
    })

    return NextResponse.json({
      success: true,
      pages: allPages,
      total: allPages.length
    })
  } catch (error) {
    console.error('Error listing pages:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
