import { NextResponse } from 'next/server'
import { listFiles, readJSON } from '@/lib/storage'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // קבל את כל קבצי העמודים
    const pageFiles = await listFiles('data/pages/')
    
    // מערך לספירת עמודים לפי יום
    const last7Days = []
    const today = new Date()
    
    // צור מערך של 7 ימים אחרונים
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
      const dayName = dayNames[date.getDay()]
      
      last7Days.push({
        date: date.toISOString().split('T')[0],
        day: dayName,
        pages: 0
      })
    }
    
    // עבור על כל קבצי העמודים
    for (const file of pageFiles) {
      if (!file.pathname.endsWith('.json')) continue
      
      const pagesData = await readJSON(file.pathname)
      if (!pagesData || !Array.isArray(pagesData)) continue
      
      // עבור על כל העמודים
      for (const page of pagesData) {
        if (page.status === 'completed' && page.completedAt) {
          const completedDate = new Date(page.completedAt)
          completedDate.setHours(0, 0, 0, 0)
          const dateStr = completedDate.toISOString().split('T')[0]
          
          // מצא את היום המתאים במערך
          const dayIndex = last7Days.findIndex(d => d.date === dateStr)
          if (dayIndex !== -1) {
            last7Days[dayIndex].pages++
          }
        }
      }
    }
    
    // חשב סה"כ
    const totalPages = last7Days.reduce((sum, day) => sum + day.pages, 0)
    
    return NextResponse.json({
      success: true,
      data: last7Days,
      total: totalPages
    })
  } catch (error) {
    console.error('Error getting weekly progress:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת נתוני התקדמות' },
      { status: 500 }
    )
  }
}
