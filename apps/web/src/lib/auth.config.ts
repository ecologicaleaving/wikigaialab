import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import { SupabaseAdapter } from "@auth/supabase-adapter"

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_KEY!,
  }),
  session: { 
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    session: async ({ session, user }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
      }
    },
    authorized: async ({ auth }) => {
      return !!auth
    },
  },
  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig