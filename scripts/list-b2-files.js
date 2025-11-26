import B2 from 'backblaze-b2'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const b2 = new B2({
  accountId: process.env.B2_ACCOUNT_ID,
  applicationKeyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
})

async function listFiles() {
  try {
    console.log('🔍 Listing files in Backblaze...')
    
    const authData = await b2.authorize()
    console.log('✅ Authorized')
    
    const bucketsResponse = await b2.listBuckets({
      bucketName: process.env.B2_BUCKET_NAME,
    })
    
    const bucketId = bucketsResponse.data.buckets[0].bucketId
    console.log('✅ Bucket ID:', bucketId)
    
    const fileList = await b2.listFileNames({
      bucketId: bucketId,
      maxFileCount: 100,
    })
    
    console.log('\n📦 Files in bucket:')
    fileList.data.files.forEach(file => {
      console.log(`  - ${file.fileName} (${file.contentLength} bytes)`)
    })
    
    console.log(`\nTotal: ${fileList.data.files.length} files`)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

listFiles()
