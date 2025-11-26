// סקריפט להצגת משתמשים מ-MongoDB Cloud
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function getUsers() {
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
        
        // קבל את קובץ המשתמשים
        const usersFile = await db.collection('files').findOne({ path: 'data/users.json' })

        if (!usersFile) {
            console.log('⚠️  קובץ משתמשים לא נמצא')
            return
        }

        const users = usersFile.data

        console.log(`📊 נמצאו ${users.length} משתמשים:\n`)
        console.log('=' .repeat(100))

        users.forEach((user, index) => {
            console.log(`\n${index + 1}. ${user.name}`)
            console.log(`   ID: ${user.id}`)
            console.log(`   Email: ${user.email}`)
            console.log(`   Role: ${user.role}`)
            console.log(`   Points: ${user.points || 0}`)
            console.log(`   Completed Pages: ${user.completedPages || 0}`)
            console.log(`   Created: ${user.createdAt}`)
            if (user.lastLogin) {
                console.log(`   Last Login: ${user.lastLogin}`)
            }
            if (user.password) {
                console.log(`   Password Hash: ${user.password.substring(0, 20)}...`)
            }
        })

        console.log('\n' + '='.repeat(100))
        console.log(`\n✅ סה"כ: ${users.length} משתמשים`)

        // סטטיסטיקות
        const admins = users.filter(u => u.role === 'admin').length
        const regularUsers = users.filter(u => u.role === 'user').length
        const totalPoints = users.reduce((sum, u) => sum + (u.points || 0), 0)
        const totalPages = users.reduce((sum, u) => sum + (u.completedPages || 0), 0)

        console.log(`\n📈 סטטיסטיקות:`)
        console.log(`   - מנהלים: ${admins}`)
        console.log(`   - משתמשים רגילים: ${regularUsers}`)
        console.log(`   - סה"כ נקודות: ${totalPoints.toLocaleString()}`)
        console.log(`   - סה"כ עמודים שהושלמו: ${totalPages.toLocaleString()}`)

        // שמור לקובץ מקומי
        const fs = await import('fs')
        fs.writeFileSync('cloud-users-backup.json', JSON.stringify(users, null, 2))
        console.log(`\n💾 הנתונים נשמרו גם ב: cloud-users-backup.json`)

    } catch (error) {
        console.error('❌ שגיאה:', error)
        process.exit(1)
    } finally {
        await client.close()
    }
}

getUsers()
