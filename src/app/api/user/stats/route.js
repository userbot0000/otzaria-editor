import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { listFiles, readJSON } from '@/lib/storage'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'לא מחובר' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // קרא את נקודות המשתמש מ-users.json
    let userPoints = 0
    try {
      const usersData = await readJSON('data/users.json')
      if (usersData) {
        const user = usersData.find(u => u.id === userId)
        if (user) {
          userPoints = user.points || 0
        }
      }
    } catch (error) {
      console.error('Error loading user points:', error)
    }

    // קרא את כל קבצי הסטטוס
    const files = await listFiles('data/pages/')
    const jsonFiles = files.filter(f => f.pathname.endsWith('.json'))
    
    let myPages = 0
    let completedPages = 0
    let inProgressPages = 0
    const recentActivity = []

    for (const file of jsonFiles) {
      const bookName = file.pathname.split('/').pop().replace('.json', '')
      
      try {
        // קרא ישירות מ-MongoDB במקום fetch
        const pages = await readJSON(file.pathname)
        
        if (!pages || !Array.isArray(pages)) {
          console.warn(`No valid pages data for ${bookName}`)
          continue
        }

        pages.forEach(page => {
          if (page.claimedById === userId) {
            myPages++
            
            if (page.status === 'completed') {
              completedPages++
            } else if (page.status === 'in-progress') {
              inProgressPages++
            }

            // הוסף לפעילות אחרונה
            recentActivity.push({
              bookName,
              bookPath: bookName,
              pageNumber: page.number,
              status: page.status,
              claimedAt: page.claimedAt,
              completedAt: page.completedAt,
              date: new Date(page.completedAt || page.claimedAt).toLocaleDateString('he-IL', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            })
          }
        })
      } catch (error) {
        console.error(`Error loading book ${bookName}:`, error)
      }
    }

    // מיין לפי תאריך אחרון
    recentActivity.sort((a, b) => {
      const dateA = new Date(a.completedAt || a.claimedAt)
      const dateB = new Date(b.completedAt || b.claimedAt)
      return dateB - dateA
    })

    return NextResponse.json({
      success: true,
      stats: {
        myPages,
        completedPages,
        inProgressPages,
        points: userPoints // השתמש בנקודות האמיתיות מ-users.json
      },
      recentActivity: recentActivity.slice(0, 10) // 10 אחרונים
    })
  } catch (error) {
    console.error('Error loading user stats:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת סטטיסטיקות' },
      { status: 500 }
    )
  }
}
