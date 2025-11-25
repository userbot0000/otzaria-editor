import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { getAllUsers, updateUserRole, deleteUser } from '@/lib/auth'
import { apiLimiter, getClientIp } from '@/lib/rate-limit'

// קבלת כל המשתמשים (למנהלים בלבד)
export async function GET(request) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const rateLimitResult = apiLimiter.check(10, ip)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה' },
        { status: 429 }
      )
    }

    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'אין הרשאה' },
        { status: 403 }
      )
    }

    const users = await getAllUsers()
    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json(
      { error: 'שגיאה בטעינת משתמשים' },
      { status: 500 }
    )
  }
}

// עדכון תפקיד משתמש
export async function PATCH(request) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const rateLimitResult = apiLimiter.check(10, ip)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה' },
        { status: 429 }
      )
    }

    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'אין הרשאה' },
        { status: 403 }
      )
    }

    const { userId, role } = await request.json()
    const success = await updateUserRole(userId, role)
    
    if (success) {
      return NextResponse.json({ message: 'התפקיד עודכן בהצלחה' })
    } else {
      return NextResponse.json(
        { error: 'משתמש לא נמצא' },
        { status: 404 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'שגיאה בעדכון משתמש' },
      { status: 500 }
    )
  }
}

// מחיקת משתמש
export async function DELETE(request) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const rateLimitResult = apiLimiter.check(10, ip)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה' },
        { status: 429 }
      )
    }

    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'אין הרשאה' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')
    
    const success = await deleteUser(userId)
    
    if (success) {
      return NextResponse.json({ message: 'המשתמש נמחק בהצלחה' })
    } else {
      return NextResponse.json(
        { error: 'משתמש לא נמצא' },
        { status: 404 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'שגיאה במחיקת משתמש' },
      { status: 500 }
    )
  }
}
