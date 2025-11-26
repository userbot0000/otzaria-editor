import { NextResponse } from 'next/server'
import { readJSON, saveJSON } from '@/lib/storage'

const USERS_FILE = 'data/users.json'

export async function POST(request) {
  try {
    const { email, secretKey } = await request.json()
    
    // מפתח סודי לאבטחה - שנה אותו למשהו אחר!
    if (secretKey !== 'CHANGE_ME_SECRET_123') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // קרא משתמשים
    const users = await readJSON(USERS_FILE) || []
    
    // מצא משתמש לפי אימייל
    const user = users.find(u => u.email === email)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // שנה ל-admin
    user.role = 'admin'
    
    // שמור
    await saveJSON(USERS_FILE, users)

    return NextResponse.json({ 
      success: true, 
      message: `User ${email} is now admin!` 
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
