import { NextResponse } from 'next/server'
import { list } from '@vercel/blob'
import { MongoClient } from 'mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request) {
  try {
    // בדוק שהמשתמש הוא admin
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const client = new MongoClient(process.env.DATABASE_URL)
    await client.connect()
    const db = client.db('otzaria')
    const collection = db.collection('files')
    
    // קבל את כל הקבצים מ-Blob
    const { blobs } = await list({ prefix: 'dev/' })
    
    let successCount = 0
    let errorCount = 0
    
    for (const blob of blobs) {
      try {
        const path = blob.pathname.replace('dev/', '')
        
        // בדוק אם כבר קיים
        const existing = await collection.findOne({ path })
        if (existing) continue
        
        // הורד את הקובץ
        const response = await fetch(blob.url)
        if (!response.ok) throw new Error('Download failed')
        
        let data
        const contentType = blob.contentType || 'application/octet-stream'
        
        if (contentType.includes('application/json') || path.endsWith('.json')) {
          data = await response.json()
        } else if (contentType.includes('image')) {
          const buffer = await response.arrayBuffer()
          data = Buffer.from(buffer).toString('base64')
        } else {
          data = await response.text()
        }
        
        await collection.insertOne({
          path,
          data,
          contentType,
          size: blob.size,
          uploadedAt: blob.uploadedAt,
          updatedAt: new Date()
        })
        
        successCount++
      } catch (error) {
        errorCount++
      }
    }
    
    await client.close()
    
    return NextResponse.json({
      success: true,
      migrated: successCount,
      errors: errorCount,
      total: blobs.length
    })
    
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
