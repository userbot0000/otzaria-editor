import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import nodemailer from 'nodemailer'

export const runtime = 'nodejs'

export async function GET(request) {
  try {
    // בדוק authorization
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('📧 Creating backup and sending via email...')
    
    const client = new MongoClient(process.env.DATABASE_URL)
    await client.connect()
    const db = client.db('otzaria')
    const filesCollection = db.collection('files')
    
    // צור גיבוי
    const backup = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: {}
    }
    
    // ייצוא נתונים
    const usersDoc = await filesCollection.findOne({ path: 'data/users.json' })
    backup.data.users = usersDoc?.data || []
    
    const booksDoc = await filesCollection.findOne({ path: 'data/books.json' })
    backup.data.books = booksDoc?.data || []
    
    const mappingDoc = await filesCollection.findOne({ path: 'data/book-mapping.json' })
    backup.data.bookMapping = mappingDoc?.data || {}
    
    const pagesFiles = await filesCollection.find({
      path: { $regex: '^data/pages/' }
    }).toArray()
    
    backup.data.pages = {}
    for (const pageFile of pagesFiles) {
      const bookName = pageFile.path.replace('data/pages/', '').replace('.json', '')
      backup.data.pages[bookName] = pageFile.data
    }
    
    await client.close()
    
    // שלח מייל
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })
    
    const fileName = `otzaria-backup-${new Date().toISOString().split('T')[0]}.json`
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.SUPER_ADMIN_EMAIL,
      subject: `גיבוי אוטומטי - ${new Date().toLocaleDateString('he-IL')}`,
      text: `גיבוי אוטומטי של מערכת אוצריא\n\nתאריך: ${new Date().toLocaleString('he-IL')}\nמשתמשים: ${backup.data.users.length}\nספרים: ${backup.data.books.length}\nעמודים: ${Object.keys(backup.data.pages).length}`,
      attachments: [
        {
          filename: fileName,
          content: JSON.stringify(backup, null, 2),
          contentType: 'application/json'
        }
      ]
    })
    
    console.log('✅ Backup sent via email')
    
    return NextResponse.json({
      success: true,
      message: 'Backup sent successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Email backup failed:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
