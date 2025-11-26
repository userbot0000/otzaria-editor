'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      setLoading(false)
      return
    }

    try {
      // שלב 1: הרשמה
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בהרשמה')
      }

      // שלב 2: התחברות אוטומטית
      const result = await signIn('credentials', {
        identifier: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        // אם ההתחברות נכשלה, נעביר לדף התחברות
        router.push('/auth/login?registered=true')
      } else {
        // הצלחה - מעבר לאיזור האישי
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-bl from-primary-container via-background to-secondary-container">
      <div className="w-full max-w-md">
        <div className="glass-strong rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Link href="/">
              <Image src="/logo.png" alt="לוגו אוצריא" width={80} height={80} />
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2 text-on-surface">
            הרשמה
          </h1>
          <p className="text-center text-on-surface/70 mb-8">
            הצטרף לקהילת עורכי אוצריא
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                שם משתמש
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface/50">
                  person
                </span>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pr-12 pl-4 py-3 border border-surface-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-on-surface"
                  placeholder="שם משתמש ייחודי"
                />
              </div>
              <p className="text-xs text-on-surface/60 mt-1">
                תוכל להתחבר עם שם המשתמש או האימייל
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                אימייל
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface/50">
                  email
                </span>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pr-12 pl-4 py-3 border border-surface-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-on-surface"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                סיסמה
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface/50">
                  lock
                </span>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pr-12 pl-4 py-3 border border-surface-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-on-surface"
                  placeholder="לפחות 6 תווים"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                אימות סיסמה
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface/50">
                  lock_reset
                </span>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pr-12 pl-4 py-3 border border-surface-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-on-surface"
                  placeholder="הזן סיסמה שוב"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-on-primary rounded-lg font-medium hover:bg-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  <span>נרשם...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">person_add</span>
                  <span>הירשם</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-on-surface/70">
              כבר יש לך חשבון?{' '}
              <Link href="/auth/login" className="text-primary font-medium hover:text-accent">
                התחבר
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-on-surface/60 hover:text-primary flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
              <span>חזרה לדף הבית</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
