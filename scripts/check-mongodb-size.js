import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function checkSize() {
  const client = new MongoClient(process.env.DATABASE_URL)
  
  try {
    await client.connect()
    const db = client.db('otzaria')
    
    console.log('📊 בדיקת גודל מסד הנתונים...\n')
    
    // סטטיסטיקות כלליות
    const stats = await db.stats()
    
    console.log('='.repeat(60))
    console.log('📈 סטטיסטיקות כלליות:')
    console.log('='.repeat(60))
    console.log(`גודל נתונים: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`גודל אחסון: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`גודל אינדקסים: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`סה"כ: ${((stats.dataSize + stats.indexSize) / 1024 / 1024).toFixed(2)} MB`)
    console.log(`מגבלה: 512 MB`)
    console.log(`נותר: ${(512 - (stats.dataSize + stats.indexSize) / 1024 / 1024).toFixed(2)} MB`)
    console.log(`אחוז שימוש: ${(((stats.dataSize + stats.indexSize) / 1024 / 1024 / 512) * 100).toFixed(1)}%`)
    console.log('')
    
    // פירוט לפי קולקשן
    console.log('='.repeat(60))
    console.log('📁 פירוט לפי קולקשן:')
    console.log('='.repeat(60))
    
    const collections = await db.listCollections().toArray()
    
    for (const collInfo of collections) {
      try {
        const collection = db.collection(collInfo.name)
        const count = await collection.countDocuments()
        const collStats = await collection.stats()
        const sizeMB = (collStats.size / 1024 / 1024).toFixed(2)
        
        console.log(`${collInfo.name}:`)
        console.log(`  📄 מסמכים: ${count.toLocaleString()}`)
        console.log(`  💾 גודל: ${sizeMB} MB`)
        if (collStats.avgObjSize) {
          console.log(`  📊 ממוצע למסמך: ${(collStats.avgObjSize / 1024).toFixed(2)} KB`)
        }
        console.log('')
      } catch (err) {
        console.log(`${collInfo.name}: (לא ניתן לקבל סטטיסטיקות)`)
        console.log('')
      }
    }
    
    // אזהרות
    const usagePercent = ((stats.dataSize + stats.indexSize) / 1024 / 1024 / 512) * 100
    
    console.log('='.repeat(60))
    if (usagePercent > 80) {
      console.log('⚠️  אזהרה: השימוש מעל 80%!')
      console.log('   מומלץ לשדרג ל-M2 ($9/month) או למחוק נתונים ישנים')
    } else if (usagePercent > 60) {
      console.log('⚡ שים לב: השימוש מעל 60%')
      console.log('   עקוב אחרי הגודל')
    } else {
      console.log('✅ הכל תקין! יש הרבה מקום')
    }
    console.log('='.repeat(60))
    
  } finally {
    await client.close()
  }
}

checkSize()
