'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function AdminClient({ session }) {
    const [users, setUsers] = useState([])
    const [books, setBooks] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('users')
    const [editingUser, setEditingUser] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [usersRes, booksRes] = await Promise.all([
                fetch('/api/users/list'),
                fetch('/api/library/list')
            ])

            const usersData = await usersRes.json()
            const booksData = await booksRes.json()

            if (usersData.success) setUsers(usersData.users)
            if (booksData.success) setBooks(booksData.books)
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteUser = async (userId) => {
        try {
            const response = await fetch('/api/admin/users/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            })

            const result = await response.json()
            if (result.success) {
                setUsers(users.filter(u => u.id !== userId))
                setDeleteConfirm(null)
            } else {
                alert(result.error || 'שגיאה במחיקת משתמש')
            }
        } catch (error) {
            console.error('Error deleting user:', error)
            alert('שגיאה במחיקת משתמש')
        }
    }

    const handleUpdateUser = async (userId, updates) => {
        try {
            const response = await fetch('/api/admin/users/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, updates })
            })

            const result = await response.json()
            if (result.success) {
                setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u))
                setEditingUser(null)
            } else {
                alert(result.error || 'שגיאה בעדכון משתמש')
            }
        } catch (error) {
            console.error('Error updating user:', error)
            alert('שגיאה בעדכון משתמש')
        }
    }

    const handleDeleteBook = async (bookPath) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק את הספר? פעולה זו אינה הפיכה!')) {
            return
        }

        try {
            const response = await fetch('/api/admin/books/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookPath })
            })

            const result = await response.json()
            if (result.success) {
                setBooks(books.filter(b => b.path !== bookPath))
            } else {
                alert(result.error || 'שגיאה במחיקת ספר')
            }
        } catch (error) {
            console.error('Error deleting book:', error)
            alert('שגיאה במחיקת ספר')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-6xl text-primary">
                    progress_activity
                </span>
            </div>
        )
    }

    const totalPages = books.reduce((sum, book) => sum + (book.totalPages || 0), 0)
    const completedPages = books.reduce((sum, book) => sum + (book.completedPages || 0), 0)
    const totalPoints = users.reduce((sum, user) => sum + (user.points || 0), 0)

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />

            <main className="flex-1">
                <div className="container mx-auto px-4 py-12">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-4xl font-bold text-on-surface flex items-center gap-3">
                                    <span className="material-symbols-outlined text-5xl text-accent">
                                        admin_panel_settings
                                    </span>
                                    פאנל ניהול
                                </h1>
                                <p className="text-on-surface/60 mt-2">ניהול מלא של המערכת</p>
                            </div>
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-2 px-4 py-2 glass rounded-lg hover:bg-surface-variant transition-colors"
                            >
                                <span className="material-symbols-outlined">arrow_forward</span>
                                <span>חזרה לדשבורד</span>
                            </Link>
                        </div>

                        {/* Stats Overview */}
                        <div className="grid md:grid-cols-4 gap-4 mb-8">
                            <div className="glass p-6 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-4xl text-blue-600">
                                        group
                                    </span>
                                    <div>
                                        <p className="text-3xl font-bold text-on-surface">{users.length}</p>
                                        <p className="text-on-surface/70 text-sm">משתמשים</p>
                                    </div>
                                </div>
                            </div>

                            <div className="glass p-6 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-4xl text-green-600">
                                        menu_book
                                    </span>
                                    <div>
                                        <p className="text-3xl font-bold text-on-surface">{books.length}</p>
                                        <p className="text-on-surface/70 text-sm">ספרים</p>
                                    </div>
                                </div>
                            </div>

                            <div className="glass p-6 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-4xl text-purple-600">
                                        description
                                    </span>
                                    <div>
                                        <p className="text-3xl font-bold text-on-surface">{totalPages}</p>
                                        <p className="text-on-surface/70 text-sm">עמודים</p>
                                    </div>
                                </div>
                            </div>

                            <div className="glass p-6 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-4xl text-yellow-600">
                                        star
                                    </span>
                                    <div>
                                        <p className="text-3xl font-bold text-on-surface">{totalPoints.toLocaleString()}</p>
                                        <p className="text-on-surface/70 text-sm">נקודות</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'users'
                                    ? 'bg-primary text-on-primary'
                                    : 'glass text-on-surface hover:bg-surface-variant'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined">group</span>
                                    משתמשים
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('books')}
                                className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'books'
                                    ? 'bg-primary text-on-primary'
                                    : 'glass text-on-surface hover:bg-surface-variant'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined">menu_book</span>
                                    ספרים
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('stats')}
                                className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'stats'
                                    ? 'bg-primary text-on-primary'
                                    : 'glass text-on-surface hover:bg-surface-variant'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined">analytics</span>
                                    סטטיסטיקות
                                </span>
                            </button>
                        </div>

                        {/* Content */}
                        {activeTab === 'users' && (
                            <div className="glass-strong p-6 rounded-xl">
                                <h2 className="text-2xl font-bold mb-6 text-on-surface">ניהול משתמשים</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-surface-variant">
                                                <th className="text-right p-4 text-on-surface">שם</th>
                                                <th className="text-right p-4 text-on-surface">אימייל</th>
                                                <th className="text-right p-4 text-on-surface">תפקיד</th>
                                                <th className="text-right p-4 text-on-surface">נקודות</th>
                                                <th className="text-right p-4 text-on-surface">עמודים</th>
                                                <th className="text-right p-4 text-on-surface">תאריך הצטרפות</th>
                                                <th className="text-right p-4 text-on-surface">פעולות</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(user => (
                                                <tr key={user.id} className="border-b border-surface-variant/50 hover:bg-surface-variant/30">
                                                    <td className="p-4">
                                                        {editingUser?.id === user.id ? (
                                                            <input
                                                                type="text"
                                                                value={editingUser.name}
                                                                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                                                className="px-2 py-1 border rounded bg-background text-on-surface"
                                                            />
                                                        ) : (
                                                            <span className="font-medium text-on-surface">{user.name}</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-on-surface/70">{user.email}</td>
                                                    <td className="p-4">
                                                        {editingUser?.id === user.id ? (
                                                            <select
                                                                value={editingUser.role}
                                                                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                                                className="px-2 py-1 border rounded bg-background text-on-surface"
                                                            >
                                                                <option value="user">משתמש</option>
                                                                <option value="admin">מנהל</option>
                                                            </select>
                                                        ) : (
                                                            <span className={`px-3 py-1 rounded-full text-sm ${user.role === 'admin'
                                                                ? 'bg-accent/20 text-accent'
                                                                : 'bg-primary/20 text-primary'
                                                                }`}>
                                                                {user.role === 'admin' ? 'מנהל' : 'משתמש'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        {editingUser?.id === user.id ? (
                                                            <input
                                                                type="number"
                                                                value={editingUser.points || 0}
                                                                onChange={(e) => setEditingUser({ ...editingUser, points: parseInt(e.target.value) || 0 })}
                                                                className="px-2 py-1 border rounded bg-background text-on-surface w-24"
                                                                min="0"
                                                            />
                                                        ) : (
                                                            <span className="text-on-surface font-bold">{user.points?.toLocaleString() || 0}</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-on-surface">{user.completedPages || 0}</td>
                                                    <td className="p-4 text-on-surface/70 text-sm">
                                                        {new Date(user.createdAt).toLocaleDateString('he-IL')}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex gap-2">
                                                            {editingUser?.id === user.id ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleUpdateUser(user.id, {
                                                                            name: editingUser.name,
                                                                            role: editingUser.role,
                                                                            points: editingUser.points
                                                                        })}
                                                                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                                                                        title="שמור"
                                                                    >
                                                                        <span className="material-symbols-outlined">check</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setEditingUser(null)}
                                                                        className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                                                                        title="ביטול"
                                                                    >
                                                                        <span className="material-symbols-outlined">close</span>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        onClick={() => setEditingUser(user)}
                                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                                        title="ערוך"
                                                                    >
                                                                        <span className="material-symbols-outlined">edit</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDeleteConfirm(user.id)}
                                                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                                        title="מחק"
                                                                        disabled={user.id === session.user.id}
                                                                    >
                                                                        <span className="material-symbols-outlined">delete</span>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'books' && (
                            <div className="glass-strong p-6 rounded-xl">
                                <h2 className="text-2xl font-bold mb-6 text-on-surface">ניהול ספרים</h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {books.map(book => (
                                        <div key={book.path} className="glass p-4 rounded-lg">
                                            <div className="flex items-start gap-3">
                                                {book.thumbnail && (
                                                    <Image
                                                        src={book.thumbnail}
                                                        alt={book.name}
                                                        width={60}
                                                        height={80}
                                                        className="rounded object-cover"
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-on-surface mb-1 truncate">{book.name}</h3>
                                                    <p className="text-sm text-on-surface/60 mb-2">
                                                        {book.completedPages || 0} / {book.totalPages || 0} עמודים
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <Link
                                                            href={`/book/${book.path}`}
                                                            className="text-sm text-primary hover:text-accent"
                                                        >
                                                            צפה
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteBook(book.path)}
                                                            className="text-sm text-red-600 hover:text-red-800"
                                                        >
                                                            מחק
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'stats' && (
                            <div className="space-y-6">
                                <div className="glass-strong p-6 rounded-xl">
                                    <h2 className="text-2xl font-bold mb-6 text-on-surface">סטטיסטיקות כלליות</h2>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-4 bg-surface rounded-lg">
                                            <span className="text-on-surface">אחוז השלמת עמודים</span>
                                            <span className="text-2xl font-bold text-primary">
                                                {totalPages > 0 ? Math.round((completedPages / totalPages) * 100) : 0}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-surface rounded-lg">
                                            <span className="text-on-surface">ממוצע נקודות למשתמש</span>
                                            <span className="text-2xl font-bold text-primary">
                                                {users.length > 0 ? Math.round(totalPoints / users.length) : 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-surface rounded-lg">
                                            <span className="text-on-surface">ממוצע עמודים לספר</span>
                                            <span className="text-2xl font-bold text-primary">
                                                {books.length > 0 ? Math.round(totalPages / books.length) : 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-strong p-6 rounded-xl">
                                    <h2 className="text-2xl font-bold mb-6 text-on-surface">משתמשים מובילים</h2>
                                    <div className="space-y-3">
                                        {users
                                            .sort((a, b) => (b.points || 0) - (a.points || 0))
                                            .slice(0, 10)
                                            .map((user, index) => (
                                                <div key={user.id} className="flex items-center gap-4 p-3 bg-surface rounded-lg">
                                                    <span className="text-2xl font-bold text-primary w-8">{index + 1}</span>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-on-surface">{user.name}</p>
                                                        <p className="text-sm text-on-surface/60">{user.completedPages || 0} עמודים</p>
                                                    </div>
                                                    <span className="text-xl font-bold text-primary">
                                                        {user.points?.toLocaleString() || 0}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="glass-strong p-8 rounded-2xl max-w-md mx-4">
                        <h3 className="text-2xl font-bold mb-4 text-on-surface">אישור מחיקה</h3>
                        <p className="text-on-surface/70 mb-6">
                            האם אתה בטוח שברצונך למחוק את המשתמש? פעולה זו אינה הפיכה!
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleDeleteUser(deleteConfirm)}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                מחק
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-3 glass rounded-lg hover:bg-surface-variant"
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
