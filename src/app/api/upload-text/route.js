import { NextResponse } from 'next/server'
import { saveJSON, saveText, listFiles } from '@/lib/storage'


export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const bookName = formData.get('bookName')
    const author = formData.get('author')
    const description = formData.get('description')

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'לא נבחר קובץ' },
        { status: 400 }
      )
    }

    // בדוק שזה קובץ טקסט
    if (!file.name.endsWith('.txt')) {
      return NextResponse.json(
        { success: false, error: 'ניתן להעלות רק קבצי .txt' },
        { status: 400 }
      )
    }

    // קרא את תוכן הקובץ
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const content = buffer.toString('utf-8')

    // צור שם קובץ בטוח
    const safeName = (bookName || file.name.replace('.txt', '')).replace(/[^a-zA-Z0-9א-ת\s]/g, '_')
    const fileName = `${safeName}.txt`
    const filePath = `data/uploads/${fileName}`

    // שמור את הקובץ
    await saveText(filePath, content)

    // שמור מטא-דאטה
    const metaData = {
      bookName: bookName || file.name.replace('.txt', ''),
      author: author || 'לא ידוע',
      description: description || '',
      fileName: fileName,
      uploadedAt: new Date().toISOString(),
      fileSize: buffer.length,
      lines: content.split('\n').length
    }

    const metaPath = `data/uploads/${safeName}.meta.json`
    await saveJSON(metaPath, metaData)

    console.log(`✅ Text file uploaded: ${fileName}`)

    return NextResponse.json({
      success: true,
      message: 'הקובץ הועלה בהצלחה',
      data: metaData
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בהעלאת הקובץ' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const blobs = await listFiles('data/uploads/')
    const files = []
    
    for (const blob of blobs) {
      if (blob.pathname.endsWith('.meta.json')) {
        const response = await fetch(blob.url)
        if (response.ok) {
          const meta = await response.json()
          files.push(meta)
        }
      }
    }

    return NextResponse.json({
      success: true,
      files: files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    })
  } catch (error) {
    console.error('Error loading files:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת קבצים' },
      { status: 500 }
    )
  }
}
