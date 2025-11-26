'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { getAvatarColor, getInitial } from '@/lib/avatar-colors'

export default function Header() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full glass-strong">
      <div className="container mx-auto flex h-16 items-center justify-between px-8">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity mr-4">
          <Image src="/logo.png" alt="לוגו אוצריא" width={32} height={32} />
          <span className="text-xl font-bold text-black" style={{ fontFamily: 'FrankRuehl, serif' }}>ספריית אוצריא</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/library" className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors">
            <span className="material-symbols-outlined">library_books</span>
            <span>ספרייה</span>
          </Link>
          <Link href="/users" className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors">
            <span className="material-symbols-outlined">person</span>
            <span>משתמשים</span>
          </Link>
          <Link href="/upload" className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors">
            <span className="material-symbols-outlined">send</span>
            <span>שליחת ספרים</span>
          </Link>
          
          {session ? (
            <div className="flex items-center gap-4">
              {session.user.role === 'admin' && (
                <Link href="/admin" className="flex items-center gap-2 text-accent hover:text-accent/80 transition-colors">
                  <span className="material-symbols-outlined">admin_panel_settings</span>
                  <span>ניהול</span>
                </Link>
              )}
              <Link 
                href="/dashboard" 
                className="flex items-center justify-center hover:opacity-80 transition-opacity"
                title={session.user.name}
              >
                <div 
                  className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-base shadow-md hover:shadow-lg transition-shadow"
                  style={{ backgroundColor: getAvatarColor(session.user.name) }}
                >
                  {getInitial(session.user.name)}
                </div>
              </Link>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-2 px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary-container transition-colors"
              >
                <span className="material-symbols-outlined">logout</span>
                <span>התנתק</span>
              </button>
            </div>
          ) : (
            <Link href="/auth/login" className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary rounded-lg hover:bg-accent transition-colors">
              <span className="material-symbols-outlined">login</span>
              <span>התחבר</span>
            </Link>
          )}
        </nav>
        
        <button className="md:hidden text-on-surface">
          <span className="material-symbols-outlined text-3xl">menu</span>
        </button>
      </div>
    </header>
  )
}
