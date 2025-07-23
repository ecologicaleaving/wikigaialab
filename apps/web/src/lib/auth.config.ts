import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

// Validate required environment variables
if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error('GOOGLE_CLIENT_ID environment variable is required');
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('GOOGLE_CLIENT_SECRET environment variable is required');
}
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required');
}

// Log configuration only in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 NextAuth Configuration:', {
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nodeEnv: process.env.NODE_ENV,
  });
}

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt: async ({ token, user, account, profile }) => {
      if (user && account) {
        // Use Google's stable 'sub' identifier as the user ID
        // This ensures the same user always gets the same ID across sessions
        token.id = account.providerAccountId || profile?.sub || user.id || user.email;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔐 JWT callback - Setting user ID:', {
            id: token.id,
            email: token.email,
            providerAccountId: account.providerAccountId,
            sub: profile?.sub
          });
        }
      }
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
    authorized: async ({ auth }) => {
      return !!auth;
    },
    redirect: async ({ url, baseUrl }) => {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    signIn: async ({ user, account, profile }) => {
      if (process.env.NODE_ENV === 'development') {
        console.log("✅ Sign in successful:", { 
          user: user.email, 
          provider: account?.provider 
        });
      }
    },
    signOut: async ({ token }) => {
      if (process.env.NODE_ENV === 'development') {
        console.log("👋 User signed out:", token?.email);
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
  trustHost: true, // Required for production deployment
} satisfies NextAuthConfig