'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import OtzariaSoftwareHeader from '@/components/OtzariaSoftwareHeader'
import OtzariaSoftwareFooter from '@/components/OtzariaSoftwareFooter'

export default function AboutOtzariaPage() {
  const [bookCount, setBookCount] = useState(0)

  useEffect(() => {
    // אנימציית ספירה
    const target = 7200
    const duration = 2000
    const steps = 60
    const increment = target / steps
    const stepDuration = duration / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setBookCount(target)
        clearInterval(timer)
      } else {
        setBookCount(Math.floor(current))
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [])

  const developers = [
    { name: 'sivan22', github: 'https://github.com/Sivan22', role: '(יוצר התוכנה)' },
    { name: 'Y.PL.', github: 'https://github.com/Y-PLONI' },
    { name: 'YOSEFTT', github: 'https://github.com/YOSEFTT' },
    { name: 'zevisvei', github: 'https://github.com/zevisvei' },
    { name: 'NHLOCAL', github: 'https://github.com/NHLOCAL/Shamor-Zachor', role: '(פיתוח "זכור ושמור")' },
    { name: 'evel-avalim', github: 'https://github.com/evel-avalim', role: '(פיתוח הגימטריות)' },
    { name: 'userbot', github: 'https://github.com/userbot000' }
  ]

  const organizations = [
    { name: 'ספריא', logo: 'https://raw.githubusercontent.com/Y-PLONI/otzaria/main/images/safria%20logo.png', url: 'https://www.sefaria.org/texts' },
    { name: 'דיקטה', logo: 'https://raw.githubusercontent.com/Y-PLONI/otzaria/main/images/dicta_logo.jpg', url: 'https://github.com/Dicta-Israel-Center-for-Text-Analysis/Dicta-Library-Download' },
    { name: 'אורייתא', logo: 'https://raw.githubusercontent.com/Y-PLONI/otzaria/main/images/Orayta.png', url: 'https://github.com/MosheWagner/Orayta-Books' },
    { name: 'ובלכתך בדרך', logo: 'https://raw.githubusercontent.com/Y-PLONI/otzaria/main/images/OnYourWay_logo.jpg', url: 'http://mobile.tora.ws' },
    { name: 'תורת אמת', logo: 'https://raw.githubusercontent.com/Y-PLONI/otzaria/main/images/toratemet.png', url: 'http://www.toratemetfreeware.com/index.html?downloads;1;' }
  ]

  return (
    <div className="min-h-screen">
      <OtzariaSoftwareHeader />

      <main className="py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-strong rounded-2xl p-8 md:p-12"
          >
            {/* Header */}
            <div className="flex items-center gap-6 mb-8 flex-col md:flex-row text-center md:text-right">
              <img
                src="/logo.png"
                alt="לוגו אוצריא"
                className="rounded-xl w-24 h-24"
              />
              <div>
                <h1 className="text-4xl font-bold text-on-surface mb-2" style={{ fontFamily: 'FrankRuehl, serif' }}>
                  אוצריא
                </h1>
                <p className="text-xl text-on-surface/70">מאגר תורני חינמי</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-primary-dark mb-6">
                זהו הכלי שלך ללימוד תורה פורה ומועיל, בקלות ובכל מקום
              </h2>
              <p className="text-lg text-on-surface/80 leading-relaxed mb-4">
                בין אם אתה בחור ישיבה שרוצה לעיין בראשונים או אחרונים על הסוגיא, או אברך שרוצה להקיף נושא בהלכה. 
                אם את מורה בבית יעקב שצריכה להכין שיעור על פרשת השבוע, או אם אתה רק רוצה ללמוד דף היומי במיטה, 
                אוצריא מספקת לך ספריה תורנית רחבה ונגישה בכל מקום.
              </p>
              <p className="text-lg text-on-surface/80 leading-relaxed">
                מגוון הספרים הרחב וממשק המשתמש הפשוט והנוח, מספקים חווית לימוד מענגת. לך נשאר רק לבחור מה ללמוד.
              </p>

              {/* Stats Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative overflow-hidden bg-gradient-to-br from-primary-container to-secondary-container rounded-2xl p-8 text-center my-8 border-4 border-primary"
              >
                <div className="relative z-10">
                  <div className="text-6xl font-bold text-primary-dark mb-2">
                    {bookCount.toLocaleString('he-IL')}
                  </div>
                  <div className="text-xl font-bold text-primary mb-2">זה המספר</div>
                  <div className="text-base text-on-surface/70">של הספרים הכלולים במאגר המובנה</div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
              </motion.div>
            </div>

            {/* Memorial Cards */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-primary-dark mb-6">תורמים</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="glass p-6 rounded-xl text-center border-2 border-accent-color">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-orange-600 text-2xl">local_fire_department</span>
                    <h3 className="font-bold text-on-surface">לע"נ ר' משה בן יהודה ראה ז"ל</h3>
                  </div>
                  <p className="text-sm text-on-surface/70">סכום משמעותי לפיתוח התוכנה</p>
                </div>

                <Link
                  href="/otzaria-software/donate"
                  className="glass p-6 rounded-xl text-center border-2 border-dashed border-primary hover:border-solid hover:bg-primary-container transition-all"
                >
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-orange-600 text-2xl">local_fire_department</span>
                    <h3 className="font-bold text-on-surface">מקום זה יכול להיות מונצח לע"נ יקירך</h3>
                  </div>
                  <p className="text-sm text-primary font-medium">לחץ כאן</p>
                </Link>

                <Link
                  href="/otzaria-software/donate"
                  className="glass p-6 rounded-xl text-center border-2 border-dashed border-primary hover:border-solid hover:bg-primary-container transition-all"
                >
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-orange-600 text-2xl">local_fire_department</span>
                    <h3 className="font-bold text-on-surface">מקום זה יכול להיות מונצח לע"נ יקירך</h3>
                  </div>
                  <p className="text-sm text-primary font-medium">לחץ כאן</p>
                </Link>
              </div>
            </div>

            {/* Developers */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-primary-dark mb-6">מפתחים</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {developers.map((dev, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-4 bg-surface-variant rounded-lg"
                  >
                    <span className="material-symbols-outlined text-on-surface/60">person</span>
                    <div>
                      <a
                        href={dev.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-dark font-medium transition-colors"
                      >
                        {dev.name}
                      </a>
                      {dev.role && <span className="text-sm text-on-surface/60 mr-2">{dev.role}</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Organizations */}
            <div>
              <h2 className="text-3xl font-bold text-primary-dark mb-6">תודות מיוחדות</h2>
              <p className="text-lg text-on-surface/70 mb-6">
                הפרויקט התאפשר הודות לעבודה המדהימה של ארגוני התורה הבאים:
              </p>
              <div className="flex flex-wrap gap-8 items-center justify-center">
                {organizations.map((org, index) => (
                  <motion.a
                    key={index}
                    href={org.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={org.logo}
                      alt={org.name}
                      className="object-contain h-16 w-auto"
                    />
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <OtzariaSoftwareFooter />
    </div>
  )
}
