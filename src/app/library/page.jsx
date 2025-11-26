'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { statusConfig } from '@/lib/library-data'
import Header from '@/components/Header'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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
          {/* Top Container - Header + Search | Chart */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Left Side - Header + Search */}
            <div>
              <h1 className="text-4xl font-bold mb-6 text-on-surface" style={{ fontFamily: 'FrankRuehl, serif' }}>ספריית אוצריא</h1>
              
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="חיפוש ספר..."
                  className="w-full pr-12 pl-4 py-3 border border-surface-variant rounded-lg focus:outline-none focus:border-primary bg-white text-on-surface placeholder:text-on-surface/40 transition-colors shadow-sm"
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface/40">
                  search
                </span>
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

            {/* Right Side - Chart */}
            <div>
              <WeeklyProgressChart />
            </div>
          </div>

          {/* Bottom Container - Library Grid | Stats Cards */}
          <div className="grid lg:grid-cols-6 gap-6">
            {/* Library Section - Takes 5 columns */}
            <div className="lg:col-span-5">
              {/* Filter Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`
                    px-4 py-2 rounded-lg transition-all font-medium whitespace-nowrap
                    ${filterStatus === 'all' 
                      ? 'bg-primary text-on-primary' 
                      : 'bg-surface text-on-surface hover:bg-surface-variant'}
                  `}
                >
                  הכל
                </button>

                {Object.entries(statusConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setFilterStatus(key)}
                    className={`
                      px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2 whitespace-nowrap
                      ${filterStatus === key 
                        ? 'bg-primary text-on-primary' 
                        : 'bg-surface text-on-surface hover:bg-surface-variant'}
                    `}
                  >
                    <span className="material-symbols-outlined text-lg">{config.icon}</span>
                    <span>{config.label}</span>
                  </button>
                ))}
              </div>

              {/* Books Grid */}
              <CardGridView items={filteredData} onFileClick={handleFileClick} />

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

            {/* Stats Cards (Vertical) - Takes 1 column */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
                <div className="text-center">
                  <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="material-symbols-outlined text-xl text-green-700">check_circle</span>
                  </div>
                  <p className="text-xs font-medium text-green-700 mb-1">הושלמו</p>
                  <p className="text-2xl font-bold text-green-800">{stats.completed}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
                <div className="text-center">
                  <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="material-symbols-outlined text-xl text-blue-700">edit</span>
                  </div>
                  <p className="text-xs font-medium text-blue-700 mb-1">בטיפול</p>
                  <p className="text-2xl font-bold text-blue-800">{stats['in-progress']}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200">
                <div className="text-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="material-symbols-outlined text-xl text-gray-700">description</span>
                  </div>
                  <p className="text-xs font-medium text-gray-700 mb-1">זמינים</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.available}</p>
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

// Weekly Progress Chart Component
function WeeklyProgressChart() {
  const [chartData, setChartData] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadWeeklyProgress() {
      try {
        const response = await fetch('/api/stats/weekly-progress')
        const result = await response.json()
        
        if (result.success) {
          setChartData(result.data)
          setTotalPages(result.total)
        }
      } catch (error) {
        console.error('Error loading weekly progress:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadWeeklyProgress()
  }, [])

  if (loading) {
    return (
      <div className="bg-surface rounded-xl p-6 border border-surface-variant mb-8 flex items-center justify-center h-[350px]">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">
          progress_activity
        </span>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-xl p-6 border border-surface-variant mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-on-surface mb-1">התקדמות שבועית</h2>
          <p className="text-sm text-on-surface/60">עמודים שהושלמו בשבוע האחרון</p>
        </div>
        <div className="text-left">
          <p className="text-sm text-on-surface/60">סה"כ השבוע</p>
          <p className="text-3xl font-bold text-primary">{totalPages}</p>
        </div>
      </div>
      
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e0d8" />
            <XAxis 
              dataKey="day" 
              stroke="#6b5d4f"
              style={{ fontSize: '14px', fontWeight: 'bold' }}
            />
            <YAxis 
              stroke="#6b5d4f"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fefbf6', 
                border: '2px solid #6b5d4f',
                borderRadius: '8px',
                direction: 'rtl'
              }}
              labelStyle={{ fontWeight: 'bold', color: '#1c1b1a' }}
              formatter={(value) => [`${value} עמודים`, 'הושלמו']}
            />
            <Line 
              type="monotone" 
              dataKey="pages" 
              stroke="#6b5d4f" 
              strokeWidth={3}
              dot={{ fill: '#6b5d4f', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-12 text-on-surface/60">
          <span className="material-symbols-outlined text-5xl mb-2 block">
            show_chart
          </span>
          <p>אין נתונים להצגה</p>
        </div>
      )}
    </div>
  )
}

// Card Grid View Component
function CardGridView({ items, onFileClick }) {
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {files.map((file) => {
        const status = statusConfig[file.status]
        return (
          <div
            key={file.id}
            onClick={() => onFileClick(file)}
            className="group relative bg-surface hover:bg-surface-variant rounded-xl p-6 cursor-pointer transition-all duration-200 border border-surface-variant hover:border-primary hover:shadow-lg"
          >
            {/* Status indicator - top right */}
            <div className="absolute top-3 left-3">
              <div className={`w-2 h-2 rounded-full ${status.color === 'text-green-600' ? 'bg-green-500' : status.color === 'text-blue-600' ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
            </div>

            {/* Info icon - top left */}
            <button 
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                // Show info
              }}
            >
              <span className="material-symbols-outlined text-lg text-on-surface/40 hover:text-on-surface">
                info
              </span>
            </button>

            {/* Book content */}
            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <div className="mb-4">
                <span className="material-symbols-outlined text-5xl text-on-surface/60">
                  menu_book
                </span>
              </div>

              {/* Book name */}
              <h3 className="font-bold text-on-surface mb-2 line-clamp-2 min-h-[3rem]">
                {file.name}
              </h3>

              {/* Path - if exists */}
              {file.path && file.path.length > 1 && (
                <p className="text-xs text-on-surface/50 line-clamp-1">
                  {file.path.slice(0, -1).join(' / ')}
                </p>
              )}
            </div>
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
