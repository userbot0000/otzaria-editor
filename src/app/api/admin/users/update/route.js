import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { readJSON, saveJSON } from '@/lib/storage'

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'אין הרשאה' },
        { status: 403 }
      )
    }

    const { userId, updates } = await request.json()

    if (!userId || !updates) {
      return NextResponse.json(
        { success: false, error: 'חסרים פרמטרים' },
        { status: 400 }
      )
    }

    const users = await readJSON('data/users.json')
    
    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'קובץ משתמשים לא נמצא' },
        { status: 404 }
      )
    }
    const userIndex = users.findIndex(u => u.id === userId)

    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'משתמש לא נמצא' },
        { status: 404 }
      )
    }

    // עדכן רק שדות מותרים
    const allowedFields = ['name', 'role', 'points']
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        users[userIndex][field] = updates[field]
      }
    })

    await saveJSON('data/users.json', users)

    return NextResponse.json({ success: true, user: users[userIndex] })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בעדכון משתמש' },
      { status: 500 }
    )
  }
}
