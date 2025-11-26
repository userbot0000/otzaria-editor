import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { MongoClient } from 'mongodb'

export const runtime = 'nodejs'

// רק משתמש בשם "admin" יכול לגשת
const SUPER_ADMIN_USERNAME = 'admin'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    // בדוק שזה המשתמש "admin"
    if (!session || session.user.name !== SUPER_ADMIN_USERNAME) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Only user "admin" can access backups' },
        { status: 401 }
      )
    }

    console.log('📦 Creating full backup export...')
    
    const client = new MongoClient(process.env.DATABASE_URL)
    await client.connect()
    const db = client.db('otzaria')
    
    const filesCollection = db.collection('files')
    
    // ייצוא כל הנתונים החשובים
    const backup = {
      exportDate: new Date().toISOString(),
      exportedBy: session.user.name,
      version: '1.0',
      data: {}
    }
    
    // 1. משתמשים
    const usersDoc = await filesCollection.findOne({ path: 'data/users.json' })
    backup.data.users = usersDoc?.data || []
    console.log(`✅ Exported ${backup.data.users.length} users`)
    
    // 2. ספרים
    const booksDoc = await filesCollection.findOne({ path: 'data/books.json' })
    backup.data.books = booksDoc?.data || []
    console.log(`✅ Exported ${backup.data.books.length} books`)
    
    // 3. מיפוי ספרים
    const mappingDoc = await filesCollection.findOne({ path: 'data/book-mapping.json' })
    backup.data.bookMapping = mappingDoc?.data || {}
    console.log(`✅ Exported book mapping`)
    
    // 4. כל העמודים של כל הספרים
    const pagesFiles = await filesCollection.find({
      path: { $regex: '^data/pages/' }
    }).toArray()
    
    backup.data.pages = {}
    for (const pageFile of pagesFiles) {
      const bookName = pageFile.path.replace('data/pages/', '').replace('.json', '')
      backup.data.pages[bookName] = pageFile.data
    }
    console.log(`✅ Exported pages for ${Object.keys(backup.data.pages).length} books`)
    
    // 5. העלאות
    const uploadsDoc = await filesCollection.findOne({ path: 'data/uploads-meta.json' })
    backup.data.uploads = uploadsDoc?.data || []
    console.log(`✅ Exported ${backup.data.uploads.length} uploads`)
    
    await client.close()
    
    // סטטיסטיקות
    const stats = {
      totalUsers: backup.data.users.length,
      totalBooks: backup.data.books.length,
      totalPages: Object.values(backup.data.pages).reduce((sum, pages) => sum + pages.length, 0),
      totalUploads: backup.data.uploads.length,
      exportSize: JSON.stringify(backup).length
    }
    
    backup.stats = stats
    
    console.log('📊 Backup stats:', stats)
    console.log('✅ Backup export completed')
    
    // החזר כקובץ להורדה
    const fileName = `otzaria-backup-${new Date().toISOString().split('T')[0]}.json`
    
    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('❌ Backup export failed:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
