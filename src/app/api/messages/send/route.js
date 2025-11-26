import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return Response.json({ success: false, error: 'לא מחובר' }, { status: 401 })
        }

        const { message, subject, recipientId } = await request.json()

        if (!message || !subject) {
            return Response.json({ success: false, error: 'נא למלא את כל השדות' }, { status: 400 })
        }

        const client = await clientPromise
        const db = client.db('otzaria')

        const newMessage = {
            subject,
            message,
            senderId: session.user.id,
            senderName: session.user.name,
            senderEmail: session.user.email,
            recipientId: recipientId || null, // null = למנהלים
            status: 'unread',
            createdAt: new Date().toISOString(),
            replies: []
        }

        const result = await db.collection('messages').insertOne(newMessage)

        return Response.json({
            success: true,
            message: 'ההודעה נשלחה בהצלחה',
            messageId: result.insertedId
        })
    } catch (error) {
        console.error('Error sending message:', error)
        return Response.json({ success: false, error: 'שגיאה בשליחת הודעה' }, { status: 500 })
    }
}
