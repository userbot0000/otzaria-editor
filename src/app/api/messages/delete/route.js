import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function DELETE(request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return Response.json({ success: false, error: 'לא מחובר' }, { status: 401 })
        }

        if (session.user.role !== 'admin') {
            return Response.json({ success: false, error: 'אין הרשאה' }, { status: 403 })
        }

        const { messageId } = await request.json()

        if (!messageId) {
            return Response.json({ success: false, error: 'חסר מזהה הודעה' }, { status: 400 })
        }

        const client = await clientPromise
        const db = client.db('otzaria')

        const result = await db.collection('messages').deleteOne({
            _id: new ObjectId(messageId)
        })

        if (result.deletedCount === 0) {
            return Response.json({ success: false, error: 'הודעה לא נמצאה' }, { status: 404 })
        }

        return Response.json({
            success: true,
            message: 'ההודעה נמחקה בהצלחה'
        })
    } catch (error) {
        console.error('Error deleting message:', error)
        return Response.json({ success: false, error: 'שגיאה במחיקת הודעה' }, { status: 500 })
    }
}
