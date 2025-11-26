import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function PUT(request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return Response.json({ success: false, error: 'לא מחובר' }, { status: 401 })
        }

        const { messageId } = await request.json()

        if (!messageId) {
            return Response.json({ success: false, error: 'חסר מזהה הודעה' }, { status: 400 })
        }

        const client = await clientPromise
        const db = client.db('otzaria')

        const result = await db.collection('messages').updateOne(
            { _id: new ObjectId(messageId) },
            { $set: { status: 'read', readAt: new Date().toISOString() } }
        )

        if (result.matchedCount === 0) {
            return Response.json({ success: false, error: 'הודעה לא נמצאה' }, { status: 404 })
        }

        return Response.json({
            success: true,
            message: 'ההודעה סומנה כנקראה'
        })
    } catch (error) {
        console.error('Error marking message as read:', error)
        return Response.json({ success: false, error: 'שגיאה בעדכון הודעה' }, { status: 500 })
    }
}
