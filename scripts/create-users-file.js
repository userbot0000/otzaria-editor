import B2 from 'backblaze-b2'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const b2 = new B2({
  accountId: process.env.B2_ACCOUNT_ID,
  applicationKeyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
})

async function createUsersFile() {
  try {
    console.log('🚀 Creating users.json file in Backblaze...')
    
    // אתחול
    const authData = await b2.authorize()
    console.log('✅ Authorized')
    
    // קבל bucket ID
    const bucketsResponse = await b2.listBuckets({
      bucketName: process.env.B2_BUCKET_NAME,
    })
    
    const bucketId = bucketsResponse.data.buckets[0].bucketId
    console.log('✅ Found bucket:', bucketId)
    
    // קבל URL להעלאה
    const uploadUrlResponse = await b2.getUploadUrl({ bucketId })
    console.log('✅ Got upload URL')
    
    // העלה קובץ users ריק
    const emptyUsers = JSON.stringify([], null, 2)
    await b2.uploadFile({
      uploadUrl: uploadUrlResponse.data.uploadUrl,
      uploadAuthToken: uploadUrlResponse.data.authorizationToken,
      fileName: 'dev/data/users.json',
      data: Buffer.from(emptyUsers),
      mime: 'application/json',
    })
    
    console.log('✅ Created dev/data/users.json')
    
    // העלה גם books.json
    const uploadUrlResponse2 = await b2.getUploadUrl({ bucketId })
    const emptyBooks = JSON.stringify([], null, 2)
    await b2.uploadFile({
      uploadUrl: uploadUrlResponse2.data.uploadUrl,
      uploadAuthToken: uploadUrlResponse2.data.authorizationToken,
      fileName: 'dev/data/books.json',
      data: Buffer.from(emptyBooks),
      mime: 'application/json',
    })
    
    console.log('✅ Created dev/data/books.json')
    console.log('🎉 Done!')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createUsersFile()
