import { NextResponse } from 'next/server'
import { saveText, readText } from '@/lib/storage'
import path from 'path'

export async function POST(request) {
  try {
    const body = await request.json()
    const { bookPath, pageNumber, content, leftColumn, rightColumn, twoColumns, rightColumnName, leftColumnName } = body

    if (!bookPath || !pageNumber) {
      return NextResponse.json(
        { success: false, error: 'חסרים פרמטרים' },
        { status: 400 }
      )
    }

    // צור שם קובץ בטוח - bookPath הוא כבר שם התיקייה
    const bookName = bookPath.replace(/[^a-zA-Z0-9א-ת]/g, '_')
    const fileName = `data/content/${bookName}_page_${pageNumber}.txt`

    // בנה את התוכן לשמירה
    let textContent = ''
    
    if (twoColumns) {
      // אם יש שני טורים, שמור אותם עם מפריד וכותרות
      const rightName = rightColumnName || 'חלק 1'
      const leftName = leftColumnName || 'חלק 2'
      textContent = `=== ${rightName} ===\n${rightColumn || ''}\n\n=== ${leftName} ===\n${leftColumn || ''}`
    } else {
      // אם יש טור אחד, שמור אותו כמו שהוא
      textContent = content || ''
    }

    await saveText(fileName, textContent)

    console.log(`✅ Content saved: ${fileName}`)

    return NextResponse.json({
      success: true,
      message: 'התוכן נשמר בהצלחה'
    })
  } catch (error) {
    console.error('Error saving content:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בשמירת התוכן' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const bookPath = searchParams.get('bookPath')
    const pageNumber = searchParams.get('pageNumber')

    if (!bookPath || !pageNumber) {
      return NextResponse.json(
        { success: false, error: 'חסרים פרמטרים' },
        { status: 400 }
      )
    }

    const bookName = bookPath.replace(/[^a-zA-Z0-9א-ת]/g, '_')
    const fileName = `data/content/${bookName}_page_${pageNumber}.txt`

    const textContent = await readText(fileName)
    
    if (!textContent) {
      return NextResponse.json({
        success: true,
        data: {
          content: '',
          leftColumn: '',
          rightColumn: '',
          twoColumns: false
        }
      })
    }
    
    // נסה לזהות אם יש שני טורים
    const columnsMatch = textContent.match(/=== (.+?) ===\n([\s\S]*?)\n\n=== (.+?) ===\n([\s\S]*)/)
    
    let data
    if (columnsMatch) {
      // יש שני טורים
      data = {
        content: '',
        leftColumn: columnsMatch[4] || '',
        rightColumn: columnsMatch[2] || '',
        rightColumnName: columnsMatch[1] || 'חלק 1',
        leftColumnName: columnsMatch[3] || 'חלק 2',
        twoColumns: true
      }
    } else {
      // טור אחד
      data = {
        content: textContent,
        leftColumn: '',
        rightColumn: '',
        rightColumnName: 'חלק 1',
        leftColumnName: 'חלק 2',
        twoColumns: false
      }
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error loading content:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת התוכן' },
      { status: 500 }
    )
  }
}
