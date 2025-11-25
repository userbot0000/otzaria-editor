'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    myPages: 0,
    completedPages: 0,
    inProgressPages: 0,
    points: 0,
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      loadUserStats()
    }
  }, [status, router])

  const loadUserStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/stats')
      const result = await response.json()
      
      if (result.success) {
        setStats({
          myPages: result.stats?.myPages || 0,
          completedPages: result.stats?.completedPages || 0,
          inProgressPages: result.stats?.inProgressPages || 0,
          points: result.stats?.points || 0,
          recentActivity: result.recentActivity || []
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-6xl text-primary">
          progress_activity
        </span>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isAdmin = session.user.role === 'admin'

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-on-surface">
            שלום, {session.user.name}!
          </h1>
          <p className="text-on-surface/70 mb-8">
            ברוך הבא לאיזור האישי שלך
          </p>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="glass p-6 rounded-xl">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-5xl text-blue-600">
                  edit_note
                </span>
                <div>
                  <p className="text-3xl font-bold text-on-surface">
                    {loading ? '...' : stats.inProgressPages}
                  </p>
                  <p className="text-on-surface/70">עמודים בטיפול</p>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-xl">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-5xl text-green-600">
                  check_circle
                </span>
                <div>
                  <p className="text-3xl font-bold text-on-surface">
                    {loading ? '...' : stats.completedPages}
                  </p>
                  <p className="text-on-surface/70">עמודים שהושלמו</p>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-xl">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-5xl text-primary">
                  description
                </span>
                <div>
                  <p className="text-3xl font-bold text-on-surface">
                    {loading ? '...' : stats.myPages}
                  </p>
                  <p className="text-on-surface/70">סה"כ עמודים שלי</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-strong p-8 rounded-2xl mb-8">
            <h2 className="text-2xl font-bold mb-6 text-on-surface">פעולות מהירות</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/library" className="flex flex-col items-center gap-3 p-6 bg-primary-container rounded-xl hover:bg-primary/20 transition-all">
                <span className="material-symbols-outlined text-4xl text-primary">library_books</span>
                <span className="font-medium text-on-surface">הספרייה</span>
              </Link>

              <Link href="/upload" className="flex flex-col items-center gap-3 p-6 bg-primary-container rounded-xl hover:bg-primary/20 transition-all">
                <span className="material-symbols-outlined text-4xl text-primary">upload_file</span>
                <span className="font-medium text-on-surface">שליחת ספרים</span>
              </Link>

              <Link href="/library" className="flex flex-col items-center gap-3 p-6 bg-primary-container rounded-xl hover:bg-primary/20 transition-all">
                <span className="material-symbols-outlined text-4xl text-primary">search</span>
                <span className="font-medium text-on-surface">חיפוש ספרים</span>
              </Link>

              {isAdmin && (
                <Link href="/admin" className="flex flex-col items-center gap-3 p-6 bg-accent/20 rounded-xl hover:bg-accent/30 transition-all">
                  <span className="material-symbols-outlined text-4xl text-accent">admin_panel_settings</span>
                  <span className="font-medium text-on-surface">פאנל ניהול</span>
                </Link>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-strong p-8 rounded-2xl">
            <h2 className="text-2xl font-bold mb-6 text-on-surface">העמודים שלי</h2>
            {loading ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">
                  progress_activity
                </span>
              </div>
            ) : stats.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => (
                  <div key={`${activity.bookName}-${activity.pageNumber}`} className="flex items-center gap-4 p-4 bg-surface rounded-lg">
                    <span className={`material-symbols-outlined ${
                      activity.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {activity.status === 'completed' ? 'check_circle' : 'edit_note'}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-on-surface">
                        {activity.bookName} - עמוד {activity.pageNumber}
                      </p>
                      <p className="text-sm text-on-surface/60">
                        {activity.status === 'completed' ? 'הושלם' : 'בטיפול'} • {activity.date}
                      </p>
                    </div>
                    <Link 
                      href={`/book/${activity.bookPath}`}
                      className="text-primary hover:text-accent"
                    >
                      <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-on-surface/20 mb-4 block">
                  description
                </span>
                <p className="text-on-surface/60">עדיין לא תפסת עמודים לעריכה</p>
                <Link 
                  href="/library"
                  className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-primary text-on-primary rounded-lg hover:bg-accent transition-colors"
                >
                  <span className="material-symbols-outlined">library_books</span>
                  <span>עבור לספרייה</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
