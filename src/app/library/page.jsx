'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { statusConfig } from '@/lib/library-data'
import Header from '@/components/Header'

export default function LibraryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  // viewMode הוסר - רק מצב רשימה
  const [selectedFile, setSelectedFile] = useState(null)
  const [libraryData, setLibraryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // טעינת נתוני הספרייה מה-API
  useEffect(() => {
    async function loadLibrary() {
      try {
        setLoading(true)
        
        // הוסף timeout של 10 שניות
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        const response = await fetch('/api/library', {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        const result = await response.json()
        
        if (result.success) {
          setLibraryData(result.data || [])
        } else {
          setError(result.error || 'שגיאה בטעינת הספרייה')
        }
      } catch (err) {
        console.error('Error loading library:', err)
        if (err.name === 'AbortError') {
          setError('הטעינה לקחה יותר מדי זמן. אנא נסה שוב.')
        } else {
          setError('שגיאה בטעינת הספרייה: ' + err.message)
        }
      } finally {
        setLoading(false)
      }
    }
    
    loadLibrary()
  }, [])

  // חישוב סטטיסטיקות
  const stats = useMemo(() => {
    const counts = { completed: 0, 'in-progress': 0, available: 0 }
    
    function count(items) {
      items.forEach(item => {
        if (item.type === 'file' && item.status) {
          counts[item.status]++
        }
        if (item.children) {
          count(item.children)
        }
      })
    }
    
    count(libraryData)
    return counts
  }, [libraryData])

  // סינון וחיפוש
  const filteredData = useMemo(() => {
    let data = libraryData

    // חיפוש
    if (searchTerm) {
      const results = []
      const lowerSearch = searchTerm.toLowerCase()
      
      function search(items, path = []) {
        items.forEach(item => {
          const currentPath = [...path, item.name]
          
          if (item.name.toLowerCase().includes(lowerSearch)) {
            results.push({ ...item, path: currentPath })
          }
          
          if (item.children) {
            search(item.children, currentPath)
          }
        })
      }
      
      search(libraryData)
      return results
    }

    // סינון לפי סטטוס
    if (filterStatus !== 'all') {
      function filterByStatus(items) {
        return items.reduce((acc, item) => {
          if (item.type === 'folder') {
            const filteredChildren = filterByStatus(item.children || [])
            if (filteredChildren.length > 0) {
              acc.push({ ...item, children: filteredChildren })
            }
          } else if (item.status === filterStatus) {
            acc.push(item)
          }
          return acc
        }, [])
      }
      data = filterByStatus(data)
    }

    return data
  }, [searchTerm, filterStatus, libraryData])

  const handleFileClick = (file) => {
    // נווט לדף הספר
    if (file.path) {
      router.push(`/book/${encodeURIComponent(file.path)}`)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined animate-spin text-6xl text-primary mb-4 block">
            progress_activity
          </span>
          <p className="text-on-surface/70">טוען את הספרייה...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-strong p-8 rounded-2xl max-w-md">
          <span className="material-symbols-outlined text-6xl text-red-500 mb-4 block">
            error
          </span>
          <h2 className="text-2xl font-bold text-on-surface mb-2">שגיאה</h2>
          <p className="text-on-surface/70 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-on-primary rounded-lg hover:bg-accent transition-colors"
          >
            נסה שוב
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2 text-on-surface">ספריית אוצריא</h1>
            <p className="text-on-surface/70">עיין, חפש וערוך ספרי קודש</p>
          </div>

          {/* Filters Bar - Top */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface/40">
                  search
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="חיפוש ספר..."
                  className="w-full pr-12 pl-12 py-3.5 border-2 border-surface-variant rounded-xl focus:outline-none focus:border-primary bg-background text-on-surface placeholder:text-on-surface/40 transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/40 hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter by Status */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`
                  px-4 py-3.5 rounded-xl transition-all font-medium border-2
                  ${filterStatus === 'all' 
                    ? 'bg-primary-container text-primary border-primary' 
                    : 'bg-background text-on-surface border-surface-variant hover:border-primary/50'}
                `}
              >
                הכל
              </button>

              {Object.entries(statusConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={`
                    px-4 py-3.5 rounded-xl transition-all font-medium border-2 flex items-center gap-2
                    ${filterStatus === key 
                      ? 'bg-primary-container text-primary border-primary' 
                      : 'bg-background text-on-surface border-surface-variant hover:border-primary/50'}
                  `}
                  title={config.label}
                >
                  <span className="material-symbols-outlined text-xl">{config.icon}</span>
                  <span className="hidden lg:inline">{config.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content - Library + Stats Sidebar */}
          <div className="grid lg:grid-cols-6 gap-6">
            {/* Library Tree/List - Takes 5 columns */}
            <div className="lg:col-span-5">
              <div className="glass-strong rounded-2xl overflow-hidden border border-surface-variant/30">
                {/* Header Bar */}
                <div className="bg-gradient-to-l from-primary/10 to-primary/5 px-6 py-4 border-b border-surface-variant/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-bold text-on-surface">
                        {searchTerm ? 'תוצאות חיפוש' : 'הספרייה'}
                      </h3>
                      
                      {searchTerm && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 rounded-lg">
                          <span className="material-symbols-outlined text-sm text-primary">search</span>
                          <span className="text-sm font-medium text-on-surface">
                            "{searchTerm}"
                          </span>
                          <span className="text-xs text-on-surface/60">
                            ({Array.isArray(filteredData) ? filteredData.length : 0})
                          </span>
                        </div>
                      )}
                    </div>


                  </div>
                </div>

                {/* Content Area - No scroll, infinite */}
                <div className="p-6">
                  <ListView items={filteredData} onFileClick={handleFileClick} />

                  {Array.isArray(filteredData) && filteredData.length === 0 && (
                    <div className="text-center py-20">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-surface mb-4">
                        <span className="material-symbols-outlined text-5xl text-on-surface/30">
                          search_off
                        </span>
                      </div>
                      <p className="text-lg font-medium text-on-surface/70 mb-2">לא נמצאו תוצאות</p>
                      <p className="text-sm text-on-surface/50">נסה לשנות את מונחי החיפוש או הסינון</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Sidebar - Takes 1 column */}
            <div className="lg:col-span-1">
              <div className="glass-strong rounded-2xl p-4 border border-surface-variant/30 sticky top-24">
                <div className="text-center mb-4 pb-4 border-b-2 border-surface-variant">
                  <span className="material-symbols-outlined text-3xl text-primary mb-2 block">bar_chart</span>
                  <h3 className="text-sm font-bold text-on-surface">סטטיסטיקות</h3>
                </div>
                
                <div className="space-y-3">
                  {/* Completed */}
                  <div className="p-3 rounded-lg bg-green-50 border-2 border-green-200 text-center">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-2">
                      <span className="material-symbols-outlined text-lg text-green-600">
                        check_circle
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-700 mb-1">{stats.completed}</p>
                    <p className="text-xs font-medium text-green-700">הושלמו</p>
                  </div>

                  {/* In Progress */}
                  <div className="p-3 rounded-lg bg-blue-50 border-2 border-blue-200 text-center">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                      <span className="material-symbols-outlined text-lg text-blue-600">
                        edit
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700 mb-1">{stats['in-progress']}</p>
                    <p className="text-xs font-medium text-blue-700">בטיפול</p>
                  </div>

                  {/* Available */}
                  <div className="p-3 rounded-lg bg-gray-50 border-2 border-gray-200 text-center">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-2">
                      <span className="material-symbols-outlined text-lg text-gray-600">
                        description
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-700 mb-1">{stats.available}</p>
                    <p className="text-xs font-medium text-gray-700">זמינים</p>
                  </div>
                </div>

                {/* Total */}
                <div className="mt-4 pt-4 border-t-2 border-surface-variant text-center">
                  <p className="text-xs font-medium text-on-surface/70 mb-1">סה"כ</p>
                  <p className="text-3xl font-bold text-primary">
                    {stats.completed + stats['in-progress'] + stats.available}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File Details Modal */}
      {selectedFile && (
        <FileDetailsModal file={selectedFile} onClose={() => setSelectedFile(null)} />
      )}
    </div>
  )
}

// List View Component
function ListView({ items, onFileClick }) {
  const flattenItems = (items, path = []) => {
    let result = []
    items.forEach(item => {
      if (item.type === 'file') {
        result.push({ ...item, path: [...path, item.name] })
      }
      if (item.children) {
        result = [...result, ...flattenItems(item.children, [...path, item.name])]
      }
    })
    return result
  }

  const files = flattenItems(items)

  return (
    <div className="space-y-1.5">
      {files.map((file) => {
        const status = statusConfig[file.status]
        return (
          <div
            key={file.id}
            onClick={() => onFileClick(file)}
            className="group flex items-center gap-3 px-4 py-2.5 bg-surface rounded-lg hover:bg-primary/5 cursor-pointer transition-all duration-200 border border-surface-variant/30 hover:border-primary/30"
          >
            {/* Icon with background */}
            <div className={`
              flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg
              ${status.bgColor} transition-all group-hover:scale-110
            `}>
              <span className={`material-symbols-outlined text-xl ${status.color}`}>
                {status.icon}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors truncate">
                  {file.name}
                </p>
                {file.path && (
                  <>
                    <span className="text-on-surface/30">•</span>
                    <p className="text-xs text-on-surface/50 truncate">
                      {file.path.slice(0, -1).join(' / ')}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <span className={`
              flex-shrink-0 px-3 py-1 rounded-md text-xs font-bold border-2
              ${status.bgColor} ${status.color} ${status.borderColor}
              transition-all
            `}>
              {status.label}
            </span>

            {/* Arrow indicator */}
            <span className="material-symbols-outlined text-lg text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              arrow_back
            </span>
          </div>
        )
      })}
    </div>
  )
}

// File Details Modal
function FileDetailsModal({ file, onClose }) {
  const status = statusConfig[file.status]

  const handleDownload = () => {
    if (file.fileUrl) {
      window.open(file.fileUrl, '_blank')
    }
  }

  const handleView = () => {
    if (file.fileUrl) {
      window.open(file.fileUrl, '_blank')
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'לא ידוע'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-strong rounded-2xl p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl bg-red-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-red-600">
                picture_as_pdf
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-on-surface">{file.name}</h2>
              <span className={`
                inline-block mt-2 px-3 py-1 rounded-md text-sm font-medium border
                ${status.bgColor} ${status.color} ${status.borderColor}
              `}>
                {status.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-on-surface/50 hover:text-on-surface">
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {file.size && (
            <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
              <span className="material-symbols-outlined text-primary">description</span>
              <div>
                <p className="text-sm text-on-surface/70">גודל קובץ</p>
                <p className="font-medium text-on-surface">{formatFileSize(file.size)}</p>
              </div>
            </div>
          )}

          {file.lastEdit && (
            <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
              <span className="material-symbols-outlined text-primary">calendar_today</span>
              <div>
                <p className="text-sm text-on-surface/70">תאריך עדכון</p>
                <p className="font-medium text-on-surface">{new Date(file.lastEdit).toLocaleDateString('he-IL')}</p>
              </div>
            </div>
          )}

          {file.path && (
            <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
              <span className="material-symbols-outlined text-primary">folder</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-on-surface/70">מיקום</p>
                <p className="font-medium text-on-surface truncate">{file.path}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleView}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-lg hover:bg-accent transition-colors"
          >
            <span className="material-symbols-outlined">visibility</span>
            <span>פתח PDF</span>
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined">download</span>
            <span>הורד</span>
          </button>
        </div>
      </div>
    </div>
  )
}
