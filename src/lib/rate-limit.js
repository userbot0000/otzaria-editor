// Rate limiting middleware פשוט ויעיל
const rateLimit = new Map()

export function rateLimiter(options = {}) {
  const {
    interval = 60 * 1000, // 1 דקה
    uniqueTokenPerInterval = 500, // מקסימום 500 משתמשים שונים לדקה
    maxRequests = 10, // מקסימום 10 בקשות לדקה למשתמש
  } = options

  return {
    check: (limit = maxRequests, token) => {
      const tokenCount = rateLimit.get(token) || [0, Date.now()]
      
      // אם עבר הזמן, אפס את המונה
      if (Date.now() - tokenCount[1] > interval) {
        tokenCount[0] = 0
        tokenCount[1] = Date.now()
      }

      // בדוק אם עבר את הלימיט
      if (tokenCount[0] >= limit) {
        return { success: false, remaining: 0 }
      }

      // הוסף בקשה
      tokenCount[0] += 1
      rateLimit.set(token, tokenCount)

      // נקה tokens ישנים
      if (rateLimit.size > uniqueTokenPerInterval) {
        const now = Date.now()
        for (const [key, value] of rateLimit.entries()) {
          if (now - value[1] > interval) {
            rateLimit.delete(key)
          }
        }
      }

      return {
        success: true,
        remaining: limit - tokenCount[0]
      }
    }
  }
}

// יצירת limiter גלובלי
export const apiLimiter = rateLimiter({
  interval: 60 * 1000, // 1 דקה
  maxRequests: 10 // 10 בקשות לדקה
})

export const authLimiter = rateLimiter({
  interval: 15 * 60 * 1000, // 15 דקות
  maxRequests: 5 // 5 ניסיונות התחברות ל-15 דקות
})

// פונקציה עוזרת לקבלת IP
export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return ip
}
