import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getUserById, verifyPassword, hashPassword } from '@/lib/auth'
import { readJSON, saveJSON } from '@/lib/storage'
import { logger } from '@/lib/logger'

const USERS_FILE = 'data/users.json'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json(
        { success: false, error: 'לא מחובר' },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword } = await request.json()

    // בדיקות קלט
    if (!currentPassword || !newPassword) {
      return Response.json(
        { success: false, error: 'נא למלא את כל השדות' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return Response.json(
        { success: false, error: 'הסיסמה החדשה חייבת להכיל לפחות 6 תווים' },
        { status: 400 }
      )
    }

    // טען את המשתמש הנוכחי
    const user = await getUserById(session.user.id)
    
    if (!user) {
      return Response.json(
        { success: false, error: 'משתמש לא נמצא' },
        { status: 404 }
      )
    }

    // אמת את הסיסמה הנוכחית
    const isValid = await verifyPassword(currentPassword, user.password)
    
    if (!isValid) {
      return Response.json(
        { success: false, error: 'הסיסמה הנוכחית שגויה' },
        { status: 400 }
      )
    }

    // צור hash לסיסמה החדשה
    const hashedPassword = await hashPassword(newPassword)

    // עדכן את הסיסמה
    const users = await readJSON(USERS_FILE)
    const userIndex = users.findIndex(u => u.id === session.user.id)
    
    if (userIndex === -1) {
      return Response.json(
        { success: false, error: 'משתמש לא נמצא' },
        { status: 404 }
      )
    }

    users[userIndex].password = hashedPassword
    users[userIndex].passwordChangedAt = new Date().toISOString()
    
    await saveJSON(USERS_FILE, users)

    logger.info(`Password changed for user: ${session.user.email}`)

    return Response.json({
      success: true,
      message: 'הסיסמה שונתה בהצלחה'
    })

  } catch (error) {
    logger.error('Error changing password:', error)
    return Response.json(
      { success: false, error: 'שגיאה בשינוי הסיסמה' },
      { status: 500 }
    )
  }
}
