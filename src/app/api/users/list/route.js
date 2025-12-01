import { NextResponse } from 'next/server'
import { readJSON, listFiles } from '@/lib/storage'

export async function GET(request) {
  try {
    // קרא משתמשים
    const users = await readJSON('data/users.json')
    
    console.log(`👥 Loaded ${users?.length || 0} users from MongoDB`)
    
    if (!users || users.length === 0) {
      console.warn('⚠️  No users found in database')
      return NextResponse.json({
        success: true,
        users: []
      })
    }

    // חשב נקודות וסטטיסטיקות לכל משתמש
    const usersWithStats = await Promise.all(users.map(async user => {
      const stats = await calculateUserStats(user.id)
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        completedPages: stats.completedPages,
        inProgressPages: stats.inProgressPages,
        points: stats.points
      }
    }))

    console.log(`✅ Returning ${usersWithStats.length} users with stats`)
    
    return NextResponse.json({
      success: true,
      users: usersWithStats
    })
  } catch (error) {
    console.error('❌ Error loading users list:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת המשתמשים' },
      { status: 500 }
    )
  }
}

// Cache לסטטיסטיקות משתמשים
let statsCache = null
let statsCacheTime = 0
const CACHE_DURATION = 30000 // 30 שניות

async function calculateAllUsersStats() {
  // בדוק אם יש cache תקף
  const now = Date.now()
  if (statsCache && (now - statsCacheTime) < CACHE_DURATION) {
    return statsCache
  }

  const userStats = {}

  try {
    // קרא את כל המשתמשים פעם אחת
    const usersData = await readJSON('data/users.json')
    if (usersData) {
      usersData.forEach(user => {
        userStats[user.id] = {
          completedPages: 0,
          inProgressPages: 0,
          points: user.points || 0
        }
      })
    }

    // קרא את כל קבצי העמודים פעם אחת
    const files = await listFiles('data/pages/')
    const jsonFiles = files.filter(f => f.pathname.endsWith('.json'))

    for (const file of jsonFiles) {
      try {
        const pages = await readJSON(file.pathname)
        
        if (!pages || !Array.isArray(pages)) {
          continue
        }

        pages.forEach(page => {
          const userId = page.claimedById
          if (userId && userStats[userId]) {
            if (page.status === 'completed') {
              userStats[userId].completedPages++
            } else if (page.status === 'in-progress') {
              userStats[userId].inProgressPages++
            }
          }
        })
      } catch (error) {
        // דלג על קבצים בעייתיים
        console.warn(`Skipping file ${file.pathname}:`, error.message)
      }
    }

  } catch (error) {
    console.error('Error calculating user stats:', error)
  }

  // שמור ב-cache
  statsCache = userStats
  statsCacheTime = now

  return userStats
}

async function calculateUserStats(userId) {
  const allStats = await calculateAllUsersStats()
  return allStats[userId] || {
    completedPages: 0,
    inProgressPages: 0,
    points: 0
  }
}
