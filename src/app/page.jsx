'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import OtzariaSoftwareHeader from '@/components/OtzariaSoftwareHeader'
import OtzariaSoftwareFooter from '@/components/OtzariaSoftwareFooter'
import { useState } from 'react'

export default function HomePage() {
  const [windowsModalOpen, setWindowsModalOpen] = useState(false)
  const [linuxModalOpen, setLinuxModalOpen] = useState(false)
  const [androidModalOpen, setAndroidModalOpen] = useState(false)
  const [macModalOpen, setMacModalOpen] = useState(false)

  const features = [
    {
      icon: 'library_books',
      title: 'ספרייה עשירה',
      description: 'מאגר ספרים תורניים רחב ומקיף, מסונן בקפידה לציבור התורני'
    },
    {
      icon: 'search',
      title: 'חיפוש מהיר',
      description: 'מנוע חיפוש חכם ומהיר המאפשר מציאת כל מידע בקלות'
    },
    {
      icon: 'devices',
      title: 'פלטפורמות מרובות',
      description: 'עובד על Windows, Linux, Android, iOS ו-macOS'
    },
    {
      icon: 'palette',
      title: 'ממשק מודרני',
      description: 'עיצוב נקי ופשוט עם תמיכה במצב כהה ובהתאמה אישית'
    },
    {
      icon: 'description',
      title: 'פורמטים מגוונים',
      description: 'תמיכה בקבצי TXT, DOCX ו-PDF'
    },
    {
      icon: 'volunteer_activism',
      title: 'חינם לחלוטין',
      description: 'התוכנה חינמית לחלוטין ותישאר כזו לעד'
    }
  ]

  return (
    <div className="min-h-screen">
      <OtzariaSoftwareHeader />

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* רקע מונפש */}
        <div className="absolute inset-0 bg-gradient-to-bl from-primary-container via-background to-secondary-container opacity-50"></div>
        
        {/* עיגולים מונפשים ברקע */}
        <motion.div
          className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* לוגו עם אנימציה */}
            <motion.div 
              className="mb-8 flex justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                duration: 1
              }}
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <img 
                  src="/logo.png" 
                  alt="לוגו אוצריא" 
                  className="w-32 h-32 drop-shadow-2xl"
                />
              </motion.div>
            </motion.div>
            
            {/* כותרת עם אנימציה */}
            <motion.h1 
              className="text-5xl md:text-6xl font-bold mb-6 text-on-background"
              style={{ fontFamily: 'FrankRuehl, serif' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              אוצריא
            </motion.h1>
            
            {/* תת-כותרת */}
            <motion.p 
              className="text-xl md:text-2xl mb-8 text-on-surface/80 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              מאגר תורני רחב עם ממשק מודרני ומהיר
            </motion.p>
            
            {/* תיאור */}
            <motion.p 
              className="text-lg mb-12 text-on-surface/70 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              לשימוש במחשב אישי או במכשיר הנייד, ללימוד תורה בקלות ובנוחות בכל מקום.
              תוכן הספרים מותאם לציבור התורני בסינון מוקפד, הממשק בנוי בטכנולוגיה מתקדמת
              לחוויית משתמש קלה ופשוטה שלא הכרתם.
            </motion.p>
            
            {/* כפתורים */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="#download" className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-on-primary rounded-lg text-lg font-medium hover:bg-accent transition-colors shadow-lg hover:shadow-xl">
                  <span className="material-symbols-outlined">download</span>
                  <span>הורד עכשיו</span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/about" className="flex items-center justify-center gap-2 px-8 py-4 glass border-2 border-primary text-primary rounded-lg text-lg font-medium hover:bg-primary-container transition-colors">
                  <span className="material-symbols-outlined">info</span>
                  <span>למד עוד</span>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-surface">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-on-surface">
            מה מייחד את אוצריא?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-6xl text-primary mb-4 block">
                  {feature.icon}
                </span>
                <h3 className="text-xl font-bold mb-2 text-on-surface">
                  {feature.title}
                </h3>
                <p className="text-on-surface/70">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-20 px-4 bg-background">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-on-surface">
            הורד את אוצריא
          </h2>
          <p className="text-center text-xl text-on-surface/70 mb-12">
            בחר את הפלטפורמה המתאימה לך
          </p>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            <button
              onClick={() => setWindowsModalOpen(true)}
              className="glass p-8 rounded-xl text-center hover:shadow-xl transition-all hover:scale-105 cursor-pointer border-2 border-transparent hover:border-primary"
            >
              <span className="material-symbols-outlined text-6xl text-primary mb-4 block">
                desktop_windows
              </span>
              <h3 className="text-xl font-bold mb-2 text-on-surface">Windows</h3>
              <p className="text-sm text-on-surface/70">Windows 10 ומעלה</p>
            </button>

            <button
              onClick={() => setLinuxModalOpen(true)}
              className="glass p-8 rounded-xl text-center hover:shadow-xl transition-all hover:scale-105 cursor-pointer border-2 border-transparent hover:border-primary"
            >
              <span className="material-symbols-outlined text-6xl text-primary mb-4 block">
                computer
              </span>
              <h3 className="text-xl font-bold mb-2 text-on-surface">Linux</h3>
              <p className="text-sm text-on-surface/70">כל ההפצות</p>
            </button>

            <button
              onClick={() => setAndroidModalOpen(true)}
              className="glass p-8 rounded-xl text-center hover:shadow-xl transition-all hover:scale-105 cursor-pointer border-2 border-transparent hover:border-primary"
            >
              <span className="material-symbols-outlined text-6xl text-primary mb-4 block">
                phone_android
              </span>
              <h3 className="text-xl font-bold mb-2 text-on-surface">Android</h3>
              <p className="text-sm text-on-surface/70">Google Play ו-APK</p>
            </button>

            <a
              href="https://apps.apple.com/us/app/otzaria/id6738098031"
              target="_blank"
              rel="noopener noreferrer"
              className="glass p-8 rounded-xl text-center hover:shadow-xl transition-all hover:scale-105 cursor-pointer border-2 border-transparent hover:border-primary"
            >
              <span className="material-symbols-outlined text-6xl text-primary mb-4 block">
                phone_iphone
              </span>
              <h3 className="text-xl font-bold mb-2 text-on-surface">iOS</h3>
              <p className="text-sm text-on-surface/70">App Store</p>
            </a>

            <button
              onClick={() => setMacModalOpen(true)}
              className="glass p-8 rounded-xl text-center hover:shadow-xl transition-all hover:scale-105 cursor-pointer border-2 border-transparent hover:border-primary"
            >
              <span className="material-symbols-outlined text-6xl text-primary mb-4 block">
                laptop_mac
              </span>
              <h3 className="text-xl font-bold mb-2 text-on-surface">macOS</h3>
              <p className="text-sm text-on-surface/70">Mac Intel & Apple Silicon</p>
            </button>
          </div>
        </div>
      </section>

      {/* Modals */}
      <DownloadModal
        isOpen={windowsModalOpen}
        onClose={() => setWindowsModalOpen(false)}
        platform="Windows"
        stableLinks={{
          msix: '#',
          exe: '#',
          portable: '#'
        }}
        devLinks={{
          msix: 'https://github.com/Y-PLONI/otzaria/releases/latest/download/otzaria.msix',
          exe: 'https://github.com/Y-PLONI/otzaria/releases/latest/download/otzaria-windows.exe',
          portable: 'https://github.com/Y-PLONI/otzaria/releases/latest/download/otzaria-windows.zip'
        }}
      />

      <DownloadModal
        isOpen={linuxModalOpen}
        onClose={() => setLinuxModalOpen(false)}
        platform="Linux"
        stableLinks={{
          deb: 'https://github.com/Sivan22/otzaria/releases'
        }}
        devLinks={{
          deb: 'https://github.com/Y-PLONI/otzaria/releases/latest/download/otzaria-linux.deb'
        }}
      />

      <DownloadModal
        isOpen={androidModalOpen}
        onClose={() => setAndroidModalOpen(false)}
        platform="Android"
        stableLinks={{
          playStore: 'https://play.google.com/store/apps/details?id=com.mendelg.otzaria'
        }}
        devLinks={{
          apk: 'https://github.com/Y-PLONI/otzaria/releases/latest/download/app-release.apk'
        }}
      />

      <DownloadModal
        isOpen={macModalOpen}
        onClose={() => setMacModalOpen(false)}
        platform="macOS"
        stableLinks={{
          zip: 'https://github.com/Sivan22/otzaria/releases'
        }}
        devLinks={{
          zip: 'https://github.com/Y-PLONI/otzaria/releases/latest/download/otzaria-macos.zip'
        }}
      />

      <OtzariaSoftwareFooter />
    </div>
  )
}

function DownloadModal({ isOpen, onClose, platform, stableLinks, devLinks }) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <div className="flex items-center justify-between p-6 border-b border-surface-variant">
          <h2 className="text-2xl font-bold text-on-surface">
            הורדת אוצריא ל-{platform}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-variant rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Stable Version */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary">verified</span>
              <h3 className="text-xl font-bold text-on-surface">גירסה יציבה (Stable)</h3>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">מומלץ</span>
            </div>
            <p className="text-sm text-on-surface/70 mb-4">גירסה יציבה ומומלצת לשימוש יומיומי</p>
            <div className="space-y-2">
              {renderDownloadOptions(platform, stableLinks)}
            </div>
          </div>

          {/* Dev Version */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-accent">code</span>
              <h3 className="text-xl font-bold text-on-surface">גירסת מפתחים (Dev) - v0.9.66+97</h3>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full">ניסיוני</span>
            </div>
            <p className="text-sm text-on-surface/70 mb-4">גירסה עם תכונות חדשות - עשויה להכיל באגים</p>
            <div className="space-y-2">
              {renderDownloadOptions(platform, devLinks)}
            </div>
          </div>

          <div className="pt-4 border-t border-surface-variant">
            <p className="flex items-center gap-2 text-sm text-on-surface/70">
              <span className="material-symbols-outlined text-primary">info</span>
              זקוק לעזרה? עיין במדריך ההתקנה המלא
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function renderDownloadOptions(platform, links) {
  const options = {
    Windows: [
      { key: 'msix', icon: 'package_2', title: 'MSIX Package', desc: 'התקנה מהירה דרך Windows Store' },
      { key: 'exe', icon: 'install_desktop', title: 'EXE Installer', desc: 'קובץ התקנה קלאסי' },
      { key: 'portable', icon: 'folder_zip', title: 'Portable (ZIP)', desc: 'גירסה ניידת ללא התקנה' }
    ],
    Linux: [
      { key: 'deb', icon: 'package_2', title: 'DEB Package', desc: 'עבור Ubuntu, Debian ונגזרותיהם' }
    ],
    Android: [
      { key: 'playStore', icon: 'shop', title: 'Google Play Store', desc: 'התקנה אוטומטית ועדכונים' },
      { key: 'apk', icon: 'android', title: 'APK File', desc: 'התקנה ידנית - דורש הרשאות' }
    ],
    macOS: [
      { key: 'zip', icon: 'folder_zip', title: 'macOS Package (ZIP)', desc: 'Intel & Apple Silicon' }
    ]
  }

  return options[platform]?.map(option => {
    const link = links[option.key]
    if (!link) return null

    return (
      <a
        key={option.key}
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 bg-surface-variant hover:bg-surface rounded-xl transition-all hover:scale-[1.02] border-2 border-transparent hover:border-primary"
      >
        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary">{option.icon}</span>
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-on-surface">{option.title}</h4>
          <p className="text-sm text-on-surface/70">{option.desc}</p>
        </div>
        <span className="material-symbols-outlined text-primary">download</span>
      </a>
    )
  })
}
