import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getUserByEmailOrUsername, verifyPassword } from '@/lib/auth'
import { authLimiter, getClientIp } from '@/lib/rate-limit'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('נא למלא את כל השדות')
        }

        // Rate limiting - 5 ניסיונות ל-15 דקות
        const identifier = credentials.identifier.toLowerCase()
        const rateLimitResult = authLimiter.check(5, identifier)
        
        if (!rateLimitResult.success) {
          throw new Error('יותר מדי ניסיונות התחברות. נסה שוב בעוד 15 דקות')
        }

        const user = await getUserByEmailOrUsername(credentials.identifier)
        if (!user) {
          throw new Error('לא נמצא משתמש עם שם משתמש או אימייל זה')
        }

        const isValid = await verifyPassword(credentials.password, user.password)
        if (!isValid) {
          throw new Error('סיסמה שגויה')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
