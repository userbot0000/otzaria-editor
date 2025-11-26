import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return Response.json({ success: false, error: 'לא מחובר' }, { status: 401 })
        }

        const { messageId, reply } = await request.json()

        if (!messageId || !reply) {
            return Response.json({ success: false, error: 'נא למלא את כל השדות' }, { status: 400 })
        }

        const client = await clientPromise
        const db = client.db('otzaria')

        const replyObj = {
            message: reply,
            senderId: session.user.id,
            senderName: session.user.name,
            senderEmail: session.user.email,
            createdAt: new Date().toISOString()
        }

        const result = await db.collection('messages').updateOne(
            { _id: new ObjectId(messageId) },
            { 
                $push: { replies: replyObj },
                $set: { status: 'replied', updatedAt: new Date().toISOString() }
            }
        )

        if (result.matchedCount === 0) {
            return Response.json({ success: false, error: 'הודעה לא נמצאה' }, { status: 404 })
        }

        return Response.json({
            success: true,
            message: 'התגובה נשלחה בהצלחה'
        })
    } catch (error) {
        console.error('Error replying to message:', error)
        return Response.json({ success: false, error: 'שגיאה בשליחת תגובה' }, { status: 500 })
    }
}
