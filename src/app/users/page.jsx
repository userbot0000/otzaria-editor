'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { getAvatarColor, getInitial } from '@/lib/avatar-colors'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('points') // points, name, date
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 40

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users/list')
      const result = await response.json()
      
      if (result.success) {
        setUsers(result.users)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const sortedUsers = [...users].sort((a, b) => {
    switch (sortBy) {
      case 'points':
        return b.points - a.points
      case 'name':
        return a.name.localeCompare(b.name, 'he')
      case 'date':
        return new Date(b.createdAt) - new Date(a.createdAt)
      default:
        return 0
    }
  })

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + usersPerPage)

  // Reset to page 1 when sort changes
  useEffect(() => {
    setCurrentPage(1)
  }, [sortBy])

  const formatJoinDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffDays === 0) return 'הצטרף היום'
    if (diffDays === 1) return 'הצטרף אתמול'
    if (diffDays < 7) return `הצטרף לפני ${diffDays} ימים`
    if (diffDays < 30) return `הצטרף לפני ${Math.floor(diffDays / 7)} שבועות`
    if (diffDays < 365) return `הצטרף לפני ${Math.floor(diffDays / 30)} חודשים`
    return `הצטרף לפני ${Math.floor(diffDays / 365)} שנים`
  }

  const getRankBadge = (points) => {
    if (points >= 1000) return { name: 'מומחה', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: 'workspace_premium' }
    if (points >= 500) return { name: 'מתקדם', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: 'star' }
    if (points >= 100) return { name: 'פעיל', color: 'bg-green-100 text-green-800 border-green-300', icon: 'trending_up' }
    return { name: 'מתחיל', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: 'person' }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header - Compact */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-on-surface">משתמשים</h1>
                <p className="text-on-surface/60">{users.length} משתמשים רשומים</p>
              </div>
              
              {/* Sort Options - Compact */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('points')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    sortBy === 'points'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface text-on-surface hover:bg-surface-variant'
                  }`}
                >
                  נקודות
                </button>
                <button
                  onClick={() => setSortBy('name')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    sortBy === 'name'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface text-on-surface hover:bg-surface-variant'
                  }`}
                >
                  שם
                </button>
                <button
                  onClick={() => setSortBy('date')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    sortBy === 'date'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface text-on-surface hover:bg-surface-variant'
                  }`}
                >
                  תאריך
                </button>
              </div>
            </div>

            {/* Users Grid - Horizontal Cards */}
            {loading ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined animate-spin text-6xl text-primary">
                  progress_activity
                </span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {paginatedUsers.map((user) => {
                    return (
                      <div
                        key={user.id}
                        className="glass p-3 rounded-lg hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-md"
                            style={{ backgroundColor: getAvatarColor(user.name) }}
                          >
                            {getInitial(user.name)}
                          </div>

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm text-on-surface truncate">
                              {user.name}
                            </h3>
                            <p className="text-xs text-on-surface/60">
                              {formatJoinDate(user.createdAt)}
                            </p>
                          </div>

                          {/* Points */}
                          <div className="text-left flex-shrink-0">
                            <div className="text-primary font-bold text-base">
                              {user.points.toLocaleString()}
                            </div>
                            <p className="text-xs text-on-surface/60">נקודות</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-surface hover:bg-surface-variant disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // Show first, last, current, and neighbors
                          if (page === 1 || page === totalPages) return true
                          if (Math.abs(page - currentPage) <= 1) return true
                          return false
                        })
                        .map((page, idx, arr) => {
                          // Add ellipsis
                          const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsisBefore && (
                                <span className="px-2 text-on-surface/50">...</span>
                              )}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                                  currentPage === page
                                    ? 'bg-primary text-on-primary'
                                    : 'bg-surface hover:bg-surface-variant text-on-surface'
                                }`}
                              >
                                {page}
                              </button>
                            </div>
                          )
                        })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-surface hover:bg-surface-variant disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
