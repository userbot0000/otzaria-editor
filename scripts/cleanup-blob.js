import { list, del } from '@vercel/blob'
import dotenv from 'dotenv'
import readline from 'readline'

// טען את משתני הסביבה
dotenv.config({ path: '.env.local' })

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function cleanupBlob() {
  console.log('🧹 ניקוי Vercel Blob\n')

  try {
    const { blobs } = await list()
    
    // מצא קבצים ב-dev/
    const devFiles = blobs.filter(b => b.pathname.startsWith('dev/'))
    
    console.log(`📦 נמצאו ${devFiles.length} קבצים בתיקיית dev/`)
    console.log(`💾 גודל כולל: ${(devFiles.reduce((sum, b) => sum + b.size, 0) / 1024 / 1024).toFixed(2)} MB\n`)

    if (devFiles.length === 0) {
      console.log('✅ אין קבצים למחיקה!')
      rl.close()
      return
    }

    console.log('קבצים שימחקו:')
    devFiles.slice(0, 10).forEach(f => {
      console.log(`  - ${f.pathname}`)
    })
    if (devFiles.length > 10) {
      console.log(`  ... ועוד ${devFiles.length - 10} קבצים`)
    }

    console.log('\n⚠️  אזהרה: פעולה זו תמחק את כל הקבצים בתיקיית dev/ מ-Blob!')
    const answer = await question('האם להמשיך? (yes/no): ')

    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ בוטל על ידי המשתמש')
      rl.close()
      return
    }

    console.log('\n🗑️  מוחק קבצים...\n')
    
    let deleted = 0
    for (const file of devFiles) {
      try {
        await del(file.url)
        console.log(`✅ נמחק: ${file.pathname}`)
        deleted++
      } catch (error) {
        console.error(`❌ שגיאה במחיקת ${file.pathname}:`, error.message)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`✅ נמחקו ${deleted} מתוך ${devFiles.length} קבצים`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ שגיאה:', error)
  } finally {
    rl.close()
  }
}

cleanupBlob()
