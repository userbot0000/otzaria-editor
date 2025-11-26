import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

export const runtime = 'nodejs'

// Vercel Cron Job - רק אם יש authorization header נכון
export async function GET(request) {
  try {
    // בדוק authorization (Vercel Cron שולח header מיוחד)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔄 Starting automatic backup...')
    
    const client = new MongoClient(process.env.DATABASE_URL)
    await client.connect()
    const db = client.db('otzaria')
    
    const filesCollection = db.collection('files')
    const backupsCollection = db.collection('backups')
    
    // קבל את כל הקבצים החשובים
    const criticalPaths = [
      'data/users.json',
      'data/books.json',
      'data/book-mapping.json',
      'data/uploads-meta.json'
    ]
    
    let backedUpCount = 0
    
    for (const path of criticalPaths) {
      const file = await filesCollection.findOne({ path })
      
      if (file) {
        // שמור גיבוי
        await backupsCollection.insertOne({
          path: file.path,
          data: file.data,
          originalUpdatedAt: file.updatedAt,
          createdAt: new Date(),
          backupType: 'automatic-hourly'
        })
        
        backedUpCount++
        console.log(`✅ Backed up: ${path}`)
      }
    }
    
    // גיבוי של כל קבצי העמודים (רק אם השתנו בשעה האחרונה)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentPages = await filesCollection.find({
      path: { $regex: '^data/pages/' },
      updatedAt: { $gte: oneHourAgo }
    }).toArray()
    
    for (const page of recentPages) {
      await backupsCollection.insertOne({
        path: page.path,
        data: page.data,
        originalUpdatedAt: page.updatedAt,
        createdAt: new Date(),
        backupType: 'automatic-hourly'
      })
      
      backedUpCount++
      console.log(`✅ Backed up: ${page.path}`)
    }
    
    // נקה גיבויים ישנים (שמור רק 7 ימים אחרונים)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const deleteResult = await backupsCollection.deleteMany({
      createdAt: { $lt: sevenDaysAgo },
      backupType: 'automatic-hourly'
    })
    
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} old backups`)
    
    await client.close()
    
    console.log(`✅ Backup completed: ${backedUpCount} files backed up`)
    
    return NextResponse.json({
      success: true,
      backedUpCount,
      deletedOldBackups: deleteResult.deletedCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Backup failed:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
