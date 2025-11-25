'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'

export default function UploadPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [file, setFile] = useState(null)
    const [bookName, setBookName] = useState('')
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState(null)
    const [recentUploads, setRecentUploads] = useState([])
    const [loadingUploads, setLoadingUploads] = useState(true)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login')
        } else if (status === 'authenticated') {
            loadRecentUploads()
        }
    }, [status, router])

    const loadRecentUploads = async () => {
        try {
            setLoadingUploads(true)
            const response = await fetch(`/api/upload-book?userId=${session.user.id}`)
            const result = await response.json()

            if (result.success) {
                setRecentUploads(result.uploads.slice(0, 5)) // רק 5 אחרונים
            }
        } catch (error) {
            console.error('Error loading uploads:', error)
        } finally {
            setLoadingUploads(false)
        }
    }

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile) {
            setFile(selectedFile)
            // אם לא הוזן שם, השתמש בשם הקובץ
            if (!bookName) {
                setBookName(selectedFile.name.replace(/\.(txt|pdf)$/i, ''))
            }
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!file) {
            setMessage({ type: 'error', text: 'אנא בחר קובץ להעלאה' })
            return
        }

        if (!bookName.trim()) {
            setMessage({ type: 'error', text: 'אנא הזן שם לספר' })
            return
        }

        setUploading(true)
        setMessage(null)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('bookName', bookName.trim())
            formData.append('userId', session.user.id)
            formData.append('userName', session.user.name)

            const response = await fetch('/api/upload-book', {
                method: 'POST',
                body: formData
            })

            const result = await response.json()

            if (result.success) {
                setMessage({
                    type: 'success',
                    text: `✅ הספר "${bookName}" הועלה בהצלחה!`
                })
                // נקה את הטופס
                setFile(null)
                setBookName('')
                // אפס את input הקובץ
                document.getElementById('file-input').value = ''
                // טען מחדש את ההעלאות
                loadRecentUploads()
            } else {
                setMessage({
                    type: 'error',
                    text: `❌ ${result.error || 'שגיאה בהעלאת הקובץ'}`
                })
            }
        } catch (error) {
            console.error('Upload error:', error)
            setMessage({
                type: 'error',
                text: '❌ שגיאה בהעלאת הקובץ'
            })
        } finally {
            setUploading(false)
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

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
                            <span className="material-symbols-outlined text-5xl text-primary">
                                upload_file
                            </span>
                        </div>
                        <h1 className="text-4xl font-bold mb-2 text-on-surface">
                            שליחת ספר חדש
                        </h1>
                        <p className="text-on-surface/70">
                            העלה קובץ טקסט של ספר לספרייה
                        </p>
                    </div>

                    {/* Upload Form */}
                    <div className="glass-strong p-8 rounded-2xl">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Book Name */}
                            <div>
                                <label className="block text-sm font-bold text-on-surface mb-2">
                                    שם הספר *
                                </label>
                                <input
                                    type="text"
                                    value={bookName}
                                    onChange={(e) => setBookName(e.target.value)}
                                    placeholder="לדוגמה: מסכת ברכות"
                                    className="w-full px-4 py-3 bg-surface border-2 border-surface-variant rounded-lg focus:outline-none focus:border-primary transition-colors text-on-surface"
                                    required
                                />
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-bold text-on-surface mb-2">
                                    קובץ טקסט *
                                </label>
                                <div className="relative">
                                    <input
                                        id="file-input"
                                        type="file"
                                        accept=".txt"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        required
                                    />
                                    <label
                                        htmlFor="file-input"
                                        className="flex items-center justify-center gap-3 w-full px-6 py-8 bg-surface border-2 border-dashed border-surface-variant rounded-lg hover:border-primary transition-colors cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-4xl text-primary">
                                            description
                                        </span>
                                        <div className="text-center">
                                            {file ? (
                                                <>
                                                    <p className="font-medium text-on-surface">{file.name}</p>
                                                    <p className="text-sm text-on-surface/60">
                                                        {(file.size / 1024).toFixed(2)} KB
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="font-medium text-on-surface">לחץ לבחירת קובץ</p>
                                                    <p className="text-sm text-on-surface/60">קבצי TXT בלבד</p>
                                                </>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-blue-600 mt-0.5">
                                        info
                                    </span>
                                    <div className="text-sm text-blue-800">
                                        <p className="font-bold mb-2">הנחיות:</p>
                                        <ul className="space-y-1">
                                            <li>• הקובץ חייב להיות בפורמט TXT</li>
                                            <li>• הטקסט יישמר עם פרטי המשתמש שהעלה אותו</li>
                                            <li>• ניתן להעלות רק קובץ אחד בכל פעם</li>
                                            <li>• הקובץ יישמר בשרת ויהיה זמין לכולם</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Message */}
                            {message && (
                                <div className={`p-4 rounded-lg ${message.type === 'success'
                                    ? 'bg-green-50 border-2 border-green-200 text-green-800'
                                    : 'bg-red-50 border-2 border-red-200 text-red-800'
                                    }`}>
                                    <p className="font-medium">{message.text}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={uploading || !file}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-primary text-on-primary rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
                                >
                                    {uploading ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin">
                                                progress_activity
                                            </span>
                                            <span>מעלה...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined">upload</span>
                                            <span>העלה ספר</span>
                                        </>
                                    )}
                                </button>

                                <Link
                                    href="/dashboard"
                                    className="px-6 py-4 border-2 border-surface-variant text-on-surface rounded-lg hover:bg-surface transition-colors flex items-center justify-center"
                                >
                                    ביטול
                                </Link>
                            </div>
                        </form>
                    </div>

                    {/* Recent Uploads */}
                    <div className="mt-8 glass p-6 rounded-xl">
                        <h2 className="text-xl font-bold mb-4 text-on-surface flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">history</span>
                            <span>העלאות אחרונות שלך</span>
                        </h2>

                        {loadingUploads ? (
                            <div className="text-center py-4">
                                <span className="material-symbols-outlined animate-spin text-3xl text-primary">
                                    progress_activity
                                </span>
                            </div>
                        ) : recentUploads.length > 0 ? (
                            <div className="space-y-3">
                                {recentUploads.map((upload) => (
                                    <div key={upload.id} className="flex items-center gap-4 p-4 bg-surface rounded-lg">
                                        <span className="material-symbols-outlined text-primary text-3xl">
                                            description
                                        </span>
                                        <div className="flex-1">
                                            <p className="font-medium text-on-surface">{upload.bookName}</p>
                                            <p className="text-sm text-on-surface/60">
                                                {new Date(upload.uploadedAt).toLocaleDateString('he-IL', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <div className="text-left">
                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${upload.status === 'approved'
                                                ? 'bg-green-100 text-green-800'
                                                : upload.status === 'rejected'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {upload.status === 'approved' ? 'אושר' : upload.status === 'rejected' ? 'נדחה' : 'ממתין'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-on-surface/60 text-center py-4">
                                עדיין לא העלית ספרים
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
