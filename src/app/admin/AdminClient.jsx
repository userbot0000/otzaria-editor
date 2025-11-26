'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function AdminClient({ session }) {
    const [users, setUsers] = useState([])
    const [books, setBooks] = useState([])
    const [uploads, setUploads] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('users')
    const [editingUser, setEditingUser] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [showAddBook, setShowAddBook] = useState(false)
    const [newBookName, setNewBookName] = useState('')
    const [addingBook, setAddingBook] = useState(false)
    const [pages, setPages] = useState([])
    const [pagesFilter, setPagesFilter] = useState({ status: '', book: '', userId: '' })
    const [editingPage, setEditingPage] = useState(null)

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        if (activeTab === 'pages') {
            loadPages()
        }
    }, [activeTab, pagesFilter])

    const loadData = async () => {
        try {
            setLoading(true)
            const [usersRes, booksRes, uploadsRes] = await Promise.all([
                fetch('/api/users/list'),
                fetch('/api/library/list'),
                fetch('/api/admin/uploads/list')
            ])

            const usersData = await usersRes.json()
            const booksData = await booksRes.json()
            const uploadsData = await uploadsRes.json()

            if (usersData.success) setUsers(usersData.users)
            if (booksData.success) setBooks(booksData.books)
            if (uploadsData.success) setUploads(uploadsData.uploads)
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadPages = async () => {
        try {
            const params = new URLSearchParams()
            if (pagesFilter.status) params.append('status', pagesFilter.status)
            if (pagesFilter.book) params.append('book', pagesFilter.book)
            if (pagesFilter.userId) params.append('userId', pagesFilter.userId)

            const response = await fetch(`/api/admin/pages/list?${params}`)
            const data = await response.json()

            if (data.success) {
                setPages(data.pages)
            }
        } catch (error) {
            console.error('Error loading pages:', error)
        }
    }

    const handleUpdatePage = async (bookName, pageNumber, updates) => {
        try {
            const response = await fetch('/api/admin/pages/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookName, pageNumber, updates })
            })

            const result = await response.json()
            if (result.success) {
                loadPages()
                setEditingPage(null)
                alert('העמוד עודכן בהצלחה!')
            } else {
                alert(result.error || 'שגיאה בעדכון עמוד')
            }
        } catch (error) {
            console.error('Error updating page:', error)
            alert('שגיאה בעדכון עמוד')
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
            // וודא שנקודות הן מספר
            const cleanUpdates = { ...updates }
            if (cleanUpdates.points !== undefined) {
                cleanUpdates.points = parseInt(cleanUpdates.points) || 0
            }

            const response = await fetch('/api/admin/users/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, updates: cleanUpdates })
            })

            const result = await response.json()
            if (result.success) {
                // עדכן את המשתמש עם הנתונים שחזרו מהשרת
                setUsers(users.map(u => u.id === userId ? result.user : u))
                setEditingUser(null)
                alert('המשתמש עודכן בהצלחה!')
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
                // עדכן את הרשימה מיד
                setBooks(books.filter(b => b.path !== bookPath && b.name !== bookPath && b.id !== bookPath))
                
                // רענן גם את הנתונים מהשרת
                const booksRes = await fetch('/api/library/list?refresh=true')
                const booksData = await booksRes.json()
                if (booksData.success) {
                    setBooks(booksData.books)
                }
                
                alert('הספר נמחק בהצלחה!')
            } else {
                alert(result.error || 'שגיאה במחיקת ספר')
            }
        } catch (error) {
            console.error('Error deleting book:', error)
            alert('שגיאה במחיקת ספר')
        }
    }

    const handleAddBook = async () => {
        if (!newBookName.trim()) {
            alert('נא להזין שם ספר')
            return
        }

        try {
            setAddingBook(true)
            const response = await fetch('/api/admin/books/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookName: newBookName.trim() })
            })

            const result = await response.json()
            if (result.success) {
                // רענן את הרשימה מהשרת
                const booksRes = await fetch('/api/library/list?refresh=true')
                const booksData = await booksRes.json()
                if (booksData.success) {
                    setBooks(booksData.books)
                } else {
                    // אם נכשל, לפחות הוסף את הספר החדש
                    setBooks([...books, result.book])
                }
                
                setNewBookName('')
                setShowAddBook(false)
                alert(result.message)
            } else {
                alert(result.error || 'שגיאה בהוספת ספר')
            }
        } catch (error) {
            console.error('Error adding book:', error)
            alert('שגיאה בהוספת ספר')
        } finally {
            setAddingBook(false)
        }
    }

    const handleUpdateUploadStatus = async (uploadId, status) => {
        try {
            const response = await fetch('/api/admin/uploads/update-status', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uploadId, status })
            })

            const result = await response.json()
            if (result.success) {
                setUploads(uploads.map(u => u.id === uploadId ? { ...u, status } : u))
                alert(`ההעלאה ${status === 'approved' ? 'אושרה' : 'נדחתה'} בהצלחה!`)
            } else {
                alert(result.error || 'שגיאה בעדכון סטטוס')
            }
        } catch (error) {
            console.error('Error updating upload status:', error)
            alert('שגיאה בעדכון סטטוס')
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
                        <div className="grid md:grid-cols-5 gap-4 mb-8">
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

                            <div className="glass p-6 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-4xl text-orange-600">
                                        upload_file
                                    </span>
                                    <div>
                                        <p className="text-3xl font-bold text-on-surface">{uploads?.length || 0}</p>
                                        <p className="text-on-surface/70 text-sm">העלאות</p>
                                        {uploads?.filter(u => u.status === 'pending').length > 0 && (
                                            <p className="text-xs text-orange-600 font-bold">
                                                {uploads.filter(u => u.status === 'pending').length} ממתינות
                                            </p>
                                        )}
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
                                onClick={() => setActiveTab('uploads')}
                                className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'uploads'
                                    ? 'bg-primary text-on-primary'
                                    : 'glass text-on-surface hover:bg-surface-variant'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined">upload_file</span>
                                    העלאות ({uploads?.filter(u => u.status === 'pending').length || 0})
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('pages')}
                                className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'pages'
                                    ? 'bg-primary text-on-primary'
                                    : 'glass text-on-surface hover:bg-surface-variant'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined">description</span>
                                    עמודים
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
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-on-surface">ניהול ספרים</h2>
                                    <button
                                        onClick={() => setShowAddBook(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-accent transition-colors"
                                    >
                                        <span className="material-symbols-outlined">add</span>
                                        <span>הוסף ספר</span>
                                    </button>
                                </div>
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

                        {activeTab === 'uploads' && (
                            <div className="glass-strong p-6 rounded-xl">
                                <h2 className="text-2xl font-bold mb-6 text-on-surface">העלאות משתמשים</h2>
                                {!uploads || uploads.length === 0 ? (
                                    <div className="text-center py-12">
                                        <span className="material-symbols-outlined text-6xl text-on-surface/30 mb-4">
                                            upload_file
                                        </span>
                                        <p className="text-on-surface/60">אין העלאות עדיין</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {uploads.map(upload => (
                                            <div key={upload.id} className="glass p-6 rounded-lg">
                                                <div className="flex items-start gap-4">
                                                    <span className="material-symbols-outlined text-5xl text-primary">
                                                        description
                                                    </span>
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div>
                                                                <h3 className="text-xl font-bold text-on-surface mb-1">
                                                                    {upload.bookName}
                                                                </h3>
                                                                <p className="text-sm text-on-surface/60">
                                                                    הועלה על ידי: <span className="font-medium">{upload.uploadedBy}</span>
                                                                </p>
                                                            </div>
                                                            <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                                                                upload.status === 'approved'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : upload.status === 'rejected'
                                                                        ? 'bg-red-100 text-red-800'
                                                                        : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                                {upload.status === 'approved' ? '✓ אושר' : upload.status === 'rejected' ? '✗ נדחה' : '⏳ ממתין'}
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                                                            <div>
                                                                <span className="text-on-surface/60">שם קובץ:</span>
                                                                <p className="font-medium text-on-surface">{upload.originalFileName}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-on-surface/60">גודל:</span>
                                                                <p className="font-medium text-on-surface">
                                                                    {(upload.fileSize / 1024).toFixed(2)} KB
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className="text-on-surface/60">שורות:</span>
                                                                <p className="font-medium text-on-surface">{upload.lineCount?.toLocaleString()}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-on-surface/60">תאריך:</span>
                                                                <p className="font-medium text-on-surface">
                                                                    {new Date(upload.uploadedAt).toLocaleDateString('he-IL', {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-3 flex-wrap">
                                                            {upload.fileName ? (
                                                                <a
                                                                    href={`/api/download/data/uploads/${upload.fileName}`}
                                                                    download={upload.originalFileName}
                                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined">download</span>
                                                                    <span>הורד קובץ</span>
                                                                </a>
                                                            ) : (
                                                                <span className="text-sm text-red-600 px-4 py-2">
                                                                    ⚠️ קובץ לא נמצא
                                                                </span>
                                                            )}
                                                            {upload.status === 'pending' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleUpdateUploadStatus(upload.id, 'approved')}
                                                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                                                    >
                                                                        <span className="material-symbols-outlined">check_circle</span>
                                                                        <span>אשר</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateUploadStatus(upload.id, 'rejected')}
                                                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                                                    >
                                                                        <span className="material-symbols-outlined">cancel</span>
                                                                        <span>דחה</span>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'pages' && (
                            <div className="glass-strong p-6 rounded-xl">
                                <h2 className="text-2xl font-bold mb-6 text-on-surface">ניהול עמודים</h2>
                                
                                {/* Filters */}
                                <div className="grid md:grid-cols-3 gap-4 mb-6">
                                    <select
                                        value={pagesFilter.status}
                                        onChange={(e) => setPagesFilter({ ...pagesFilter, status: e.target.value })}
                                        className="px-4 py-2 border border-surface-variant rounded-lg bg-white text-on-surface"
                                    >
                                        <option value="">כל הסטטוסים</option>
                                        <option value="available">זמין</option>
                                        <option value="in-progress">בטיפול</option>
                                        <option value="completed">הושלם</option>
                                    </select>

                                    <select
                                        value={pagesFilter.book}
                                        onChange={(e) => setPagesFilter({ ...pagesFilter, book: e.target.value })}
                                        className="px-4 py-2 border border-surface-variant rounded-lg bg-white text-on-surface"
                                    >
                                        <option value="">כל הספרים</option>
                                        {books.map(book => (
                                            <option key={book.id} value={book.name}>{book.name}</option>
                                        ))}
                                    </select>

                                    <select
                                        value={pagesFilter.userId}
                                        onChange={(e) => setPagesFilter({ ...pagesFilter, userId: e.target.value })}
                                        className="px-4 py-2 border border-surface-variant rounded-lg bg-white text-on-surface"
                                    >
                                        <option value="">כל המשתמשים</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>{user.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Pages Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-surface-variant">
                                                <th className="text-right p-4 text-on-surface">ספר</th>
                                                <th className="text-right p-4 text-on-surface">עמוד</th>
                                                <th className="text-right p-4 text-on-surface">סטטוס</th>
                                                <th className="text-right p-4 text-on-surface">משתמש</th>
                                                <th className="text-right p-4 text-on-surface">תאריך</th>
                                                <th className="text-right p-4 text-on-surface">פעולות</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pages.map(page => (
                                                <tr key={`${page.bookName}-${page.number}`} className="border-b border-surface-variant/50 hover:bg-surface-variant/30">
                                                    <td className="p-4 text-on-surface">{page.bookName}</td>
                                                    <td className="p-4 text-on-surface font-bold">{page.number}</td>
                                                    <td className="p-4">
                                                        {editingPage?.bookName === page.bookName && editingPage?.number === page.number ? (
                                                            <select
                                                                value={editingPage.status}
                                                                onChange={(e) => setEditingPage({ ...editingPage, status: e.target.value })}
                                                                className="px-2 py-1 border rounded bg-background text-on-surface"
                                                            >
                                                                <option value="available">זמין</option>
                                                                <option value="in-progress">בטיפול</option>
                                                                <option value="completed">הושלם</option>
                                                            </select>
                                                        ) : (
                                                            <span className={`px-3 py-1 rounded-full text-sm ${
                                                                page.status === 'completed'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : page.status === 'in-progress'
                                                                        ? 'bg-blue-100 text-blue-800'
                                                                        : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {page.status === 'completed' ? 'הושלם' : page.status === 'in-progress' ? 'בטיפול' : 'זמין'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-on-surface">{page.claimedBy || '-'}</td>
                                                    <td className="p-4 text-on-surface/70 text-sm">
                                                        {page.completedAt 
                                                            ? new Date(page.completedAt).toLocaleDateString('he-IL')
                                                            : page.claimedAt 
                                                                ? new Date(page.claimedAt).toLocaleDateString('he-IL')
                                                                : '-'
                                                        }
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex gap-2">
                                                            {editingPage?.bookName === page.bookName && editingPage?.number === page.number ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleUpdatePage(page.bookName, page.number, { status: editingPage.status })}
                                                                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                                                                        title="שמור"
                                                                    >
                                                                        <span className="material-symbols-outlined">check</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setEditingPage(null)}
                                                                        className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                                                                        title="ביטול"
                                                                    >
                                                                        <span className="material-symbols-outlined">close</span>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        onClick={() => setEditingPage(page)}
                                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                                        title="ערוך"
                                                                    >
                                                                        <span className="material-symbols-outlined">edit</span>
                                                                    </button>
                                                                    {page.status !== 'available' && (
                                                                        <button
                                                                            onClick={() => {
                                                                                if (confirm('האם לשחרר את העמוד?')) {
                                                                                    handleUpdatePage(page.bookName, page.number, { status: 'available' })
                                                                                }
                                                                            }}
                                                                            className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                                                                            title="שחרר עמוד"
                                                                        >
                                                                            <span className="material-symbols-outlined">lock_open</span>
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {pages.length === 0 && (
                                    <div className="text-center py-12">
                                        <span className="material-symbols-outlined text-6xl text-on-surface/30 mb-4">
                                            description
                                        </span>
                                        <p className="text-on-surface/60">אין עמודים להצגה</p>
                                    </div>
                                )}
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

            {/* Add Book Modal */}
            {showAddBook && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="glass-strong p-8 rounded-2xl max-w-md mx-4 w-full">
                        <h3 className="text-2xl font-bold mb-4 text-on-surface">הוסף ספר חדש</h3>
                        <p className="text-on-surface/70 mb-4 text-sm">
                            הזן את שם הספר בדיוק כפי שהוא מופיע ב-GitHub Releases
                        </p>
                        <input
                            type="text"
                            value={newBookName}
                            onChange={(e) => setNewBookName(e.target.value)}
                            placeholder="שם הספר..."
                            className="w-full px-4 py-3 border border-surface-variant rounded-lg focus:outline-none focus:border-primary bg-white text-on-surface mb-6"
                            disabled={addingBook}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={handleAddBook}
                                disabled={addingBook}
                                className="flex-1 px-4 py-3 bg-primary text-on-primary rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {addingBook ? 'מוסיף...' : 'הוסף'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddBook(false)
                                    setNewBookName('')
                                }}
                                disabled={addingBook}
                                className="flex-1 px-4 py-3 glass rounded-lg hover:bg-surface-variant transition-colors disabled:opacity-50"
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
