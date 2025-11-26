import dotenv from 'dotenv'

// טען את ה-env קודם!
dotenv.config({ path: '.env.local' })

// עכשיו import את המודולים
const { listImages, loadBookMapping } = await import('./src/lib/github-storage.js')

async function test() {
  try {
    console.log('🧪 Testing GitHub thumbnails...\n')
    
    // 1. טען מיפוי
    console.log('📋 Loading book mapping...')
    const mapping = await loadBookMapping()
    console.log('Mapping:', mapping)
    console.log('')
    
    // 2. מצא את ה-ID של "חוות דעת"
    const bookName = 'חוות דעת'
    const bookId = Object.entries(mapping).find(([id, name]) => name === bookName)?.[0]
    console.log(`📚 Book: "${bookName}"`)
    console.log(`   ID: ${bookId}`)
    console.log('')
    
    if (!bookId) {
      console.error('❌ Book ID not found!')
      return
    }
    
    // 3. קבל תמונות מ-GitHub
    console.log('📸 Fetching images from GitHub...')
    const images = await listImages(bookId)
    console.log(`   Found ${images.length} images`)
    console.log('')
    
    // 4. הצג כמה דוגמאות
    console.log('🖼️  Sample images:')
    images.slice(0, 5).forEach(img => {
      console.log(`   - ${img.pathname}`)
      console.log(`     ${img.url}`)
    })
    
    console.log('\n✅ Test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

test()
