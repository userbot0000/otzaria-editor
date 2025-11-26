import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return Response.json({ success: false, error: 'לא מחובר' }, { status: 401 })
        }

        const client = await clientPromise
        const db = client.db('otzaria')

        // וודא שה-collection קיים
        const collections = await db.listCollections({ name: 'messages' }).toArray()
        if (collections.length === 0) {
            // אם אין collection, החזר מערך רק
            return Response.json({
                success: true,
                messages: []
            })
        }

        let messages

        if (session.user.role === 'admin') {
            // מנהלים רואים את כל ההודעות
            messages = await db.collection('messages')
                .find({})
                .sort({ createdAt: -1 })
                .toArray()
        } else {
            // משתמשים רואים רק את ההודעות שלהם
            messages = await db.collection('messages')
                .find({
                    $or: [
                        { senderId: session.user.id },
                        { recipientId: session.user.id }
                    ]
                })
                .sort({ createdAt: -1 })
                .toArray()
        }

        return Response.json({
            success: true,
            messages: messages.map(msg => ({
                ...msg,
                id: msg._id.toString(),
                _id: undefined
            }))
        })
    } catch (error) {
        console.error('Error loading messages:', error)
        return Response.json({ success: false, error: 'שגיאה בטעינת הודעות', messages: [] }, { status: 500 })
    }
}
