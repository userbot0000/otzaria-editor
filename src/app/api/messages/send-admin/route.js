import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'
import { readJSON } from '@/lib/storage'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return Response.json(
        { success: false, error: 'אין הרשאה' },
        { status: 403 }
      )
    }

    const { recipientId, subject, message, sendToAll } = await request.json()

    if (!subject || !message) {
      return Response.json(
        { success: false, error: 'חסרים שדות נדרשים' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('otzaria')

    if (sendToAll) {
      // שלח לכל המשתמשים
      const users = await readJSON('data/users.json') || []
      const regularUsers = users.filter(u => u.role !== 'admin')

      const messagesToInsert = regularUsers.map(user => ({
        senderId: session.user.id,
        senderName: session.user.name,
        recipientId: user.id,
        recipientName: user.name,
        subject,
        message,
        status: 'unread',
        type: 'admin-to-user',
        createdAt: new Date(),
        replies: []
      }))

      await db.collection('messages').insertMany(messagesToInsert)
      console.log(`📧 Admin sent message to ${regularUsers.length} users`)

      return Response.json({
        success: true,
        message: `ההודעה נשלחה ל-${regularUsers.length} משתמשים`
      })
    } else {
      // שלח למשתמש ספציפי
      if (!recipientId) {
        return Response.json(
          { success: false, error: 'חסר מזהה נמען' },
          { status: 400 }
        )
      }

      const users = await readJSON('data/users.json') || []
      const recipient = users.find(u => u.id === recipientId)

      if (!recipient) {
        return Response.json(
          { success: false, error: 'משתמש לא נמצא' },
          { status: 404 }
        )
      }

      const newMessage = {
        senderId: session.user.id,
        senderName: session.user.name,
        recipientId: recipient.id,
        recipientName: recipient.name,
        subject,
        message,
        status: 'unread',
        type: 'admin-to-user',
        createdAt: new Date(),
        replies: []
      }

      await db.collection('messages').insertOne(newMessage)
      console.log(`📧 Admin sent message to ${recipient.name}`)

      return Response.json({
        success: true,
        message: 'ההודעה נשלחה בהצלחה'
      })
    }
  } catch (error) {
    console.error('Error sending admin message:', error)
    return Response.json(
      { success: false, error: 'שגיאה בשליחת הודעה' },
      { status: 500 }
    )
  }
}
