// סקריפט להקמת collection של הודעות עם אינדקסים
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function setupMessagesCollection() {
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL
    
    if (!mongoUri) {
        console.error('❌ שגיאה: לא נמצא MONGODB_URI או DATABASE_URL ב-.env.local')
        process.exit(1)
    }

    const client = new MongoClient(mongoUri)

    try {
        await client.connect()
        console.log('✅ מחובר ל-MongoDB')

        const db = client.db('otzaria')
        
        // בדוק אם ה-collection קיים
        const collections = await db.listCollections({ name: 'messages' }).toArray()
        
        if (collections.length === 0) {
            // צור collection חדש
            await db.createCollection('messages')
            console.log('✅ נוצר collection: messages')
        } else {
            console.log('ℹ️  Collection messages כבר קיים')
        }

        // צור אינדקסים לביצועים טובים
        await db.collection('messages').createIndexes([
            { key: { senderId: 1 }, name: 'senderId_index' },
            { key: { recipientId: 1 }, name: 'recipientId_index' },
            { key: { status: 1 }, name: 'status_index' },
            { key: { createdAt: -1 }, name: 'createdAt_index' }
        ])
        console.log('✅ נוצרו אינדקסים')

        // הצג סטטיסטיקות
        const count = await db.collection('messages').countDocuments()
        console.log(`\n📊 סטטיסטיקות:`)
        console.log(`   - סה"כ הודעות: ${count}`)

        const unreadCount = await db.collection('messages').countDocuments({ status: 'unread' })
        console.log(`   - הודעות חדשות: ${unreadCount}`)

        console.log('\n✅ ההקמה הושלמה בהצלחה!')

    } catch (error) {
        console.error('❌ שגיאה:', error)
        process.exit(1)
    } finally {
        await client.close()
    }
}

setupMessagesCollection()
