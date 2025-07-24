import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import { getUserIdentityService, type OAuthUserData } from "./auth/UserIdentityService"

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
        try {
          // Generate correlation ID for tracking
          const correlationId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const userIdentityService = getUserIdentityService(correlationId);

          // Prepare OAuth data for UserIdentityService
          const oauthData: OAuthUserData = {
            id: account.providerAccountId,
            email: user.email || '',
            name: user.name || '',
            image: user.image || undefined,
            provider: account.provider
          };

          // Resolve user with deterministic ID generation
          const resolvedUser = await userIdentityService.resolveUser(oauthData);

          // Set standardized token data
          token.id = resolvedUser.id;
          token.email = resolvedUser.email;
          token.name = resolvedUser.name;
          token.picture = resolvedUser.image;
          token.isAdmin = resolvedUser.isAdmin;
          token.role = resolvedUser.role;
          token.correlationId = correlationId;

          if (process.env.NODE_ENV === 'development') {
            console.log('🔐 JWT callback - User resolved:', {
              id: token.id,
              email: token.email,
              role: token.role,
              correlationId: correlationId,
              originalProvider: account.provider,
              originalId: account.providerAccountId
            });
          }
        } catch (error) {
          console.error('❌ JWT callback - User resolution failed:', error);
          
          // Fallback to basic token data to prevent auth failure
          token.id = user.email || 'unknown';
          token.email = user.email || '';
          token.name = user.name || '';
          token.picture = user.image || '';
          token.isAdmin = false;
          token.role = 'user';
          token.error = 'user_resolution_failed';
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
        
        // Add extended user data to session
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.role = token.role as string;
        
        // Include error information if user resolution failed
        if (token.error) {
          session.error = token.error as string;
        }
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
          provider: account?.provider,
          deterministic: 'using UserIdentityService'
        });
      }
    },
    signOut: async ({ token }) => {
      if (process.env.NODE_ENV === 'development') {
        console.log("👋 User signed out:", {
          email: token?.email,
          id: token?.id
        });
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
  trustHost: true, // Required for production deployment
} satisfies NextAuthConfig