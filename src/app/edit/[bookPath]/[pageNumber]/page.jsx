'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getAvatarColor, getInitial } from '@/lib/avatar-colors'

export default function EditPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const bookPath = decodeURIComponent(params.bookPath)
  const pageNumber = parseInt(params.pageNumber)
  
  const [bookData, setBookData] = useState(null)
  const [pageData, setPageData] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [twoColumns, setTwoColumns] = useState(false)
  const [leftColumn, setLeftColumn] = useState('')
  const [rightColumn, setRightColumn] = useState('')
  const [activeTextarea, setActiveTextarea] = useState(null)
  const [selectedFont, setSelectedFont] = useState('monospace')
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      loadPageData()
    }
  }, [status, bookPath, pageNumber])

  const loadPageData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // טען נתוני ספר
      const bookResponse = await fetch(`/api/book-by-name?name=${encodeURIComponent(bookPath)}`)
      const bookResult = await bookResponse.json()
      
      if (bookResult.success) {
        setBookData(bookResult.book)
        const page = bookResult.pages.find(p => p.number === pageNumber)
        console.log('📄 Page data for edit:', page)
        console.log('🖼️ Thumbnail URL:', page?.thumbnail)
        setPageData(page)
      } else {
        setError(bookResult.error || 'שגיאה בטעינת הספר')
        return
      }
      
      // טען תוכן שמור
      const contentResponse = await fetch(`/api/page-content?bookPath=${encodeURIComponent(bookPath)}&pageNumber=${pageNumber}`)
      const contentResult = await contentResponse.json()
      
      if (contentResult.success && contentResult.data) {
        const data = contentResult.data
        setContent(data.content || '')
        setLeftColumn(data.leftColumn || '')
        setRightColumn(data.rightColumn || '')
        setTwoColumns(data.twoColumns || false)
      }
    } catch (err) {
      console.error('Error loading page:', err)
      setError(err.message || 'שגיאה בטעינת העמוד')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      const response = await fetch('/api/page-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookPath,
          pageNumber,
          content,
          leftColumn,
          rightColumn,
          twoColumns
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert('✅ הטקסט נשמר בהצלחה!')
      } else {
        alert('❌ שגיאה בשמירה')
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert('❌ שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  const handleAutoSave = (text) => {
    setContent(text)
    // שמירה אוטומטית לשרת
    debouncedSave(text, leftColumn, rightColumn, twoColumns)
  }

  const handleColumnChange = (column, newText) => {
    if (column === 'left') {
      setLeftColumn(newText)
      debouncedSave(content, newText, rightColumn, twoColumns)
    } else {
      setRightColumn(newText)
      debouncedSave(content, leftColumn, newText, twoColumns)
    }
  }

  // שמירה אוטומטית עם debounce
  const debouncedSave = (() => {
    let timeout
    return (contentText, leftText, rightText, twoCol) => {
      clearTimeout(timeout)
      timeout = setTimeout(async () => {
        try {
          await fetch('/api/page-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookPath,
              pageNumber,
              content: contentText,
              leftColumn: leftText,
              rightColumn: rightText,
              twoColumns: twoCol
            })
          })
          console.log('✅ Auto-saved')
        } catch (error) {
          console.error('Auto-save error:', error)
        }
      }, 2000) // שמירה אחרי 2 שניות של חוסר פעילות
    }
  })()

  const toggleColumns = () => {
    if (!twoColumns) {
      // מעבר מטור אחד לשניים - פצל את הטקסט
      const lines = content.split('\n')
      const midPoint = Math.ceil(lines.length / 2)
      const rightText = lines.slice(0, midPoint).join('\n')
      const leftText = lines.slice(midPoint).join('\n')
      
      setRightColumn(rightText)
      setLeftColumn(leftText)
      setTwoColumns(true)
      
      // שמור מיד
      debouncedSave(content, leftText, rightText, true)
    } else {
      // מעבר משניים לאחד - איחוד הטקסט
      const combinedText = rightColumn + '\n\n' + leftColumn
      setContent(combinedText)
      setTwoColumns(false)
      
      // שמור מיד
      debouncedSave(combinedText, leftColumn, rightColumn, false)
    }
  }

  const handleFindReplace = (replaceAll = false) => {
    if (!findText) {
      alert('אנא הזן טקסט לחיפוש')
      return
    }

    // המר תווים מיוחדים
    const processedFindText = findText
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
    
    const processedReplaceText = replaceText
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')

    let updatedContent = content
    let updatedLeft = leftColumn
    let updatedRight = rightColumn
    let count = 0

    if (twoColumns) {
      if (replaceAll) {
        const rightCount = (rightColumn.match(new RegExp(processedFindText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
        const leftCount = (leftColumn.match(new RegExp(processedFindText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
        count = rightCount + leftCount
        
        updatedRight = rightColumn.split(processedFindText).join(processedReplaceText)
        updatedLeft = leftColumn.split(processedFindText).join(processedReplaceText)
      } else {
        // החלפה ראשונה בלבד
        if (rightColumn.includes(processedFindText)) {
          updatedRight = rightColumn.replace(processedFindText, processedReplaceText)
          count = 1
        } else if (leftColumn.includes(processedFindText)) {
          updatedLeft = leftColumn.replace(processedFindText, processedReplaceText)
          count = 1
        }
      }
      
      setRightColumn(updatedRight)
      setLeftColumn(updatedLeft)
      debouncedSave(content, updatedLeft, updatedRight, twoColumns)
    } else {
      if (replaceAll) {
        count = (content.match(new RegExp(processedFindText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
        updatedContent = content.split(processedFindText).join(processedReplaceText)
      } else {
        if (content.includes(processedFindText)) {
          updatedContent = content.replace(processedFindText, processedReplaceText)
          count = 1
        }
      }
      
      setContent(updatedContent)
      debouncedSave(updatedContent, leftColumn, rightColumn, twoColumns)
    }

    if (count > 0) {
      alert(`✅ הוחלפו ${count} מופעים`)
    } else {
      alert('❌ לא נמצאו תוצאות')
    }
  }

  const insertTag = (tag) => {
    // זהה איזה textarea פעיל
    let currentText, column
    
    if (twoColumns) {
      // אם יש textarea פעיל, השתמש בו
      if (activeTextarea === 'left') {
        currentText = leftColumn
        column = 'left'
      } else if (activeTextarea === 'right') {
        currentText = rightColumn
        column = 'right'
      } else {
        // ברירת מחדל - טור ימין
        currentText = rightColumn
        column = 'right'
      }
    } else {
      currentText = content
      column = null
    }
    
    const textarea = column ? document.querySelector(`textarea[data-column="${column}"]`) : document.querySelector('textarea')
    
    if (!textarea) {
      console.log('No textarea found')
      return
    }
    
    const start = textarea.selectionStart || 0
    const end = textarea.selectionEnd || 0
    const selectedText = currentText.substring(start, end)
    const beforeText = currentText.substring(0, start)
    const afterText = currentText.substring(end)
    
    let newText = ''
    let insertedText = ''
    
    switch(tag) {
      case 'b':
        insertedText = `<b>${selectedText || 'טקסט מודגש'}</b>`
        break
      case 'i':
        insertedText = `<i>${selectedText || 'טקסט נטוי'}</i>`
        break
      case 'u':
        insertedText = `<u>${selectedText || 'טקסט עם קו תחתון'}</u>`
        break
      case 'big':
        insertedText = `<big>${selectedText || 'טקסט גדול'}</big>`
        break
      case 'small':
        insertedText = `<small>${selectedText || 'טקסט קטן'}</small>`
        break
      case 'h1':
        insertedText = `<h1>${selectedText || 'כותרת 1'}</h1>`
        break
      case 'h2':
        insertedText = `<h2>${selectedText || 'כותרת 2'}</h2>`
        break
      case 'h3':
        insertedText = `<h3>${selectedText || 'כותרת 3'}</h3>`
        break
      default:
        return
    }
    
    newText = beforeText + insertedText + afterText
    
    // עדכן את הטקסט המתאים
    if (column === 'left') {
      setLeftColumn(newText)
      debouncedSave(content, newText, rightColumn, twoColumns)
    } else if (column === 'right') {
      setRightColumn(newText)
      debouncedSave(content, leftColumn, newText, twoColumns)
    } else {
      setContent(newText)
      debouncedSave(newText, leftColumn, rightColumn, twoColumns)
    }
    
    // החזר פוקוס ל-textarea
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + insertedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <span className="material-symbols-outlined animate-spin text-6xl text-primary mb-4 block">
            progress_activity
          </span>
          <p className="text-on-surface/70">טוען עמוד...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center glass-strong p-8 rounded-2xl max-w-md">
          <span className="material-symbols-outlined text-6xl text-red-500 mb-4 block">
            error
          </span>
          <h2 className="text-2xl font-bold text-on-surface mb-2">שגיאה</h2>
          <p className="text-on-surface/70 mb-4">{error}</p>
          <Link 
            href={`/book/${encodeURIComponent(bookPath)}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-lg hover:bg-accent transition-colors"
          >
            <span className="material-symbols-outlined">arrow_forward</span>
            <span>חזרה לספר</span>
          </Link>
        </div>
      </div>
    )
  }

  const thumbnailUrl = pageData?.thumbnail

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="glass-strong border-b border-surface-variant sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/book/${encodeURIComponent(bookPath)}`}
                className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">arrow_forward</span>
                <span>חזרה לספר</span>
              </Link>
              <div className="w-px h-8 bg-surface-variant"></div>
              <div>
                <h1 className="text-lg font-bold text-on-surface">
                  {bookData?.name} - עמוד {pageNumber}
                </h1>
                <p className="text-xs text-on-surface/60">עריכת טקסט</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>נשמר אוטומטית</span>
              </div>
              
              <Link 
                href="/dashboard" 
                className="flex items-center justify-center hover:opacity-80 transition-opacity"
                title={session?.user?.name}
              >
                <div 
                  className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-base shadow-md hover:shadow-lg transition-shadow"
                  style={{ backgroundColor: getAvatarColor(session?.user?.name || '') }}
                >
                  {getInitial(session?.user?.name || '')}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Single Container */}
      <div className="flex-1 flex flex-col overflow-hidden p-6">
        <div className="glass-strong rounded-xl border border-surface-variant flex-1 flex flex-col overflow-hidden">
          
          {/* Unified Toolbar */}
          <div className="bg-primary/10 px-4 py-3 border-b border-surface-variant">
            <div className="flex items-center justify-between gap-4">
              {/* Left Side - Image Tools */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">image</span>
                  <span className="font-bold text-on-surface">תמונת העמוד</span>
                </div>
                <div className="w-px h-6 bg-surface-variant"></div>
                <span className="text-sm text-on-surface/60">עמוד {pageNumber} מתוך {bookData?.totalPages}</span>
              </div>

              {/* Right Side - Text Tools */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleColumns}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-surface-variant rounded-lg hover:border-primary transition-colors text-sm"
                >
                  <span className="material-symbols-outlined text-lg">
                    {twoColumns ? 'view_column' : 'view_agenda'}
                  </span>
                  <span>{twoColumns ? 'שני טורים' : 'טור אחד'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Text Formatting Toolbar */}
          <div className="px-4 py-2 border-b border-surface-variant bg-surface/30 flex items-center justify-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => insertTag('b')}
                    className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-primary"
                    title="מודגש"
                  >
                    <span className="font-bold">B</span>
                  </button>
                  <button
                    onClick={() => insertTag('i')}
                    className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-primary"
                    title="נטוי"
                  >
                    <span className="italic">I</span>
                  </button>
                  <button
                    onClick={() => insertTag('u')}
                    className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-primary"
                    title="קו תחתון"
                  >
                    <span className="underline">U</span>
                  </button>
                </div>

                <div className="w-px h-6 bg-surface-variant"></div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => insertTag('big')}
                    className="p-2 hover:bg-white rounded transition-colors text-lg border border-transparent hover:border-primary"
                    title="גדול"
                  >
                    A+
                  </button>
                  <button
                    onClick={() => insertTag('small')}
                    className="p-2 hover:bg-white rounded transition-colors text-xs border border-transparent hover:border-primary"
                    title="קטן"
                  >
                    A-
                  </button>
                </div>

                <div className="w-px h-6 bg-surface-variant"></div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => insertTag('h1')}
                    className="px-2 py-1 hover:bg-white rounded transition-colors text-sm font-bold border border-transparent hover:border-primary"
                    title="כותרת 1"
                  >
                    H1
                  </button>
                  <button
                    onClick={() => insertTag('h2')}
                    className="px-2 py-1 hover:bg-white rounded transition-colors text-sm font-bold border border-transparent hover:border-primary"
                    title="כותרת 2"
                  >
                    H2
                  </button>
                  <button
                    onClick={() => insertTag('h3')}
                    className="px-2 py-1 hover:bg-white rounded transition-colors text-sm font-bold border border-transparent hover:border-primary"
                    title="כותרת 3"
                  >
                    H3
                  </button>
                </div>

                <div className="w-px h-6 bg-surface-variant"></div>

                <button
                  onClick={() => setShowFindReplace(true)}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-white rounded transition-colors border border-transparent hover:border-primary"
                  title="חיפוש והחלפה"
                >
                  <span className="material-symbols-outlined text-lg">find_replace</span>
                  <span className="text-sm">חיפוש והחלפה</span>
                </button>

                <div className="w-px h-6 bg-surface-variant"></div>

                <select
                  value={selectedFont}
                  className="px-3 py-1.5 bg-white border-2 border-surface-variant rounded-lg text-sm focus:outline-none focus:border-primary"
                  onChange={(e) => {
                    setSelectedFont(e.target.value)
                  }}
                >
                  <option value="monospace">Monospace</option>
                  <option value="Arial">Arial</option>
                  <option value="'Times New Roman'">Times New Roman</option>
                  <option value="'Courier New'">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                </select>
          </div>

          {/* Split Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Image Side */}
            <div className="w-1/2 overflow-auto p-4 bg-white border-l border-surface-variant">
              {thumbnailUrl ? (
                <img 
                  src={thumbnailUrl} 
                  alt={`עמוד ${pageNumber}`}
                  className="w-full h-auto rounded-lg shadow-lg"
                  onError={(e) => {
                    console.error('Failed to load image:', thumbnailUrl)
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div 
                className="flex items-center justify-center min-h-full bg-surface rounded-lg"
                style={{ display: thumbnailUrl ? 'none' : 'flex' }}
              >
                <div className="text-center">
                  <span className="material-symbols-outlined text-9xl text-on-surface/20 block mb-4">
                    description
                  </span>
                  <p className="text-on-surface/60">אין תמונה זמינה</p>
                  <p className="text-xs text-on-surface/40 mt-2">(עמוד {pageNumber})</p>
                </div>
              </div>
            </div>

            {/* Text Editor Side */}
            <div className="w-1/2 flex flex-col overflow-hidden p-4 editor-container">
                {twoColumns ? (
                  <div className="grid grid-cols-2 gap-4 h-full">
                    <div className="flex flex-col h-full">
                      <label className="text-sm font-bold text-on-surface mb-2">טור ימין</label>
                      <textarea
                        data-column="right"
                        value={rightColumn}
                        onChange={(e) => handleColumnChange('right', e.target.value)}
                        onFocus={() => setActiveTextarea('right')}
                        placeholder="טקסט הטור הימני..."
                        style={{ fontFamily: selectedFont }}
                        className="flex-1 p-4 bg-white border-2 border-surface-variant rounded-lg resize-none focus:outline-none focus:border-primary transition-colors text-lg leading-relaxed"
                        dir="rtl"
                      />
                    </div>
                    <div className="flex flex-col h-full">
                      <label className="text-sm font-bold text-on-surface mb-2">טור שמאל</label>
                      <textarea
                        data-column="left"
                        value={leftColumn}
                        onChange={(e) => handleColumnChange('left', e.target.value)}
                        onFocus={() => setActiveTextarea('left')}
                        placeholder="טקסט הטור השמאלי..."
                        style={{ fontFamily: selectedFont }}
                        className="flex-1 p-4 bg-white border-2 border-surface-variant rounded-lg resize-none focus:outline-none focus:border-primary transition-colors text-lg leading-relaxed"
                        dir="rtl"
                      />
                    </div>
                  </div>
                ) : (
                  <textarea
                    value={content}
                    onChange={(e) => handleAutoSave(e.target.value)}
                    onFocus={() => setActiveTextarea(null)}
                    placeholder="התחל להקליד את הטקסט מהעמוד כאן...&#10;&#10;הטקסט נשמר אוטומטית בזמן הקלדה."
                    style={{ fontFamily: selectedFont }}
                    className="w-full h-full p-4 bg-white border-2 border-surface-variant rounded-lg resize-none focus:outline-none focus:border-primary transition-colors text-lg leading-relaxed"
                    dir="rtl"
                  />
                )}
              </div>
            </div>

          {/* Stats Bar */}
          <div className="px-4 py-3 border-t border-surface-variant bg-surface/50">
            <div className="flex items-center justify-between text-sm text-on-surface/60">
              <div className="flex items-center gap-4">
                {twoColumns ? (
                  <>
                    <span>ימין: {rightColumn.length} תווים</span>
                    <span>שמאל: {leftColumn.length} תווים</span>
                  </>
                ) : (
                  <>
                    <span>תווים: {content.length}</span>
                    <span>מילים: {content.trim() ? content.trim().split(/\s+/).length : 0}</span>
                    <span>שורות: {content.split('\n').length}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>נשמר אוטומטית</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Find & Replace Dialog */}
      {showFindReplace && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowFindReplace(false)}>
          <div className="glass-strong rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">find_replace</span>
                <span>חיפוש והחלפה</span>
              </h2>
              <button 
                onClick={() => setShowFindReplace(false)}
                className="text-on-surface/50 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Find Input */}
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">
                  חפש:
                </label>
                <input
                  type="text"
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  placeholder="הזן טקסט לחיפוש..."
                  className="w-full px-4 py-3 bg-white border-2 border-surface-variant rounded-lg focus:outline-none focus:border-primary transition-colors"
                  dir="rtl"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setFindText(findText + '\\n')}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                    title="שורה חדשה"
                  >
                    \n (אנטר)
                  </button>
                  <button
                    onClick={() => setFindText(findText + '\\t')}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                    title="טאב"
                  >
                    \t (טאב)
                  </button>
                  <button
                    onClick={() => setFindText(findText + ' ')}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                    title="רווח"
                  >
                    רווח
                  </button>
                </div>
              </div>

              {/* Replace Input */}
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">
                  החלף ב:
                </label>
                <input
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder="הזן טקסט חדש..."
                  className="w-full px-4 py-3 bg-white border-2 border-surface-variant rounded-lg focus:outline-none focus:border-primary transition-colors"
                  dir="rtl"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setReplaceText(replaceText + '\\n')}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                    title="שורה חדשה"
                  >
                    \n (אנטר)
                  </button>
                  <button
                    onClick={() => setReplaceText(replaceText + '\\t')}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                    title="טאב"
                  >
                    \t (טאב)
                  </button>
                  <button
                    onClick={() => setReplaceText(replaceText + ' ')}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                    title="רווח"
                  >
                    רווח
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2 text-sm text-blue-800">
                  <span className="material-symbols-outlined text-blue-600 text-lg">info</span>
                  <div>
                    <p className="font-bold mb-1">טיפים:</p>
                    <ul className="space-y-1">
                      <li>• החיפוש רגיש לאותיות גדולות/קטנות</li>
                      <li>• השתמש בכפתורים להוספת תווים מיוחדים</li>
                      <li>• או הקלד ידנית: <code className="bg-white px-1 rounded">\n</code> לאנטר, <code className="bg-white px-1 rounded">\t</code> לטאב</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleFindReplace(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-on-primary rounded-lg hover:bg-accent transition-colors font-bold"
                >
                  <span className="material-symbols-outlined">search</span>
                  <span>החלף ראשון</span>
                </button>
                <button
                  onClick={() => handleFindReplace(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold"
                >
                  <span className="material-symbols-outlined">find_replace</span>
                  <span>החלף הכל</span>
                </button>
              </div>

              <button
                onClick={() => setShowFindReplace(false)}
                className="w-full px-4 py-3 border-2 border-surface-variant text-on-surface rounded-lg hover:bg-surface transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

