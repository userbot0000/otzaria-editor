import { list } from '@vercel/blob'
import dotenv from 'dotenv'

// טען את משתני הסביבה
dotenv.config({ path: '.env.local' })

async function analyzeBlob() {
  console.log('🔍 מנתח שימוש ב-Vercel Blob...\n')

  try {
    const { blobs } = await list()
    
    const stats = {
      total: blobs.length,
      byFolder: {},
      totalSize: 0,
      duplicates: []
    }

    // נתח לפי תיקיות
    for (const blob of blobs) {
      const folder = blob.pathname.split('/')[0] + '/' + (blob.pathname.split('/')[1] || '')
      
      if (!stats.byFolder[folder]) {
        stats.byFolder[folder] = { count: 0, size: 0 }
      }
      
      stats.byFolder[folder].count++
      stats.byFolder[folder].size += blob.size
      stats.totalSize += blob.size
    }

    console.log('📊 סטטיסטיקות:\n')
    console.log(`סה"כ קבצים: ${stats.total}`)
    console.log(`סה"כ גודל: ${(stats.totalSize / 1024 / 1024 / 1024).toFixed(2)} GB\n`)
    
    console.log('📁 פילוח לפי תיקיות:\n')
    for (const [folder, data] of Object.entries(stats.byFolder)) {
      console.log(`${folder}:`)
      console.log(`  קבצים: ${data.count}`)
      console.log(`  גודל: ${(data.size / 1024 / 1024).toFixed(2)} MB`)
      console.log()
    }

    // חפש קבצים כפולים או לא נחוצים
    console.log('🔍 מחפש קבצים פוטנציאליים למחיקה:\n')
    
    const toCheck = blobs.filter(b => {
      // קבצים ישנים מאוד
      const age = Date.now() - new Date(b.uploadedAt).getTime()
      const daysOld = age / (1000 * 60 * 60 * 24)
      
      // קבצים גדולים מאוד
      const sizeMB = b.size / 1024 / 1024
      
      return daysOld > 90 || sizeMB > 50
    })

    if (toCheck.length > 0) {
      console.log(`⚠️  נמצאו ${toCheck.length} קבצים שאולי כדאי לבדוק:`)
      toCheck.slice(0, 10).forEach(b => {
        const age = Math.floor((Date.now() - new Date(b.uploadedAt).getTime()) / (1000 * 60 * 60 * 24))
        console.log(`  - ${b.pathname} (${(b.size / 1024 / 1024).toFixed(2)} MB, ${age} ימים)`)
      })
      if (toCheck.length > 10) {
        console.log(`  ... ועוד ${toCheck.length - 10}`)
      }
    }

    console.log('\n💡 המלצות לחיסכון במכסה:')
    console.log('1. הוסף Cache headers לקבצים סטטיים')
    console.log('2. טען תמונות רק כשצריך (lazy loading)')
    console.log('3. שמור נתוני API בזיכרון זמני')
    console.log('4. מחק קבצים ישנים/לא בשימוש')

  } catch (error) {
    console.error('❌ שגיאה:', error)
  }
}

analyzeBlob()
