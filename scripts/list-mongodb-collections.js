// סקריפט להצגת כל ה-collections ב-MongoDB
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function listCollections() {
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL
    
    if (!mongoUri) {
        console.error('❌ שגיאה: לא נמצא MONGODB_URI או DATABASE_URL ב-.env.local')
        process.exit(1)
    }

    const client = new MongoClient(mongoUri)

    try {
        await client.connect()
        console.log('✅ מחובר ל-MongoDB\n')

        const db = client.db('otzaria')
        
        // קבל את כל ה-collections
        const collections = await db.listCollections().toArray()

        console.log(`📊 נמצאו ${collections.length} collections:\n`)
        console.log('=' .repeat(80))

        for (const collection of collections) {
            const count = await db.collection(collection.name).countDocuments()
            console.log(`\n📁 ${collection.name}`)
            console.log(`   - מסמכים: ${count.toLocaleString()}`)
            
            // הצג דוגמה של מסמך אחד
            const sample = await db.collection(collection.name).findOne({})
            if (sample) {
                console.log(`   - דוגמה: ${JSON.stringify(sample, null, 2).substring(0, 200)}...`)
            }
        }

        console.log('\n' + '='.repeat(80))

    } catch (error) {
        console.error('❌ שגיאה:', error)
        process.exit(1)
    } finally {
        await client.close()
    }
}

listCollections()
