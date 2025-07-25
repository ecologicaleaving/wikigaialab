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
        // Store Google UID as stable authentication identifier
        const googleId = account.providerAccountId || profile?.sub || user.id;
        
        // Convert numeric Google ID to UUID for consistency
        let googleUuid = googleId;
        if (googleId && /^\d+$/.test(googleId)) {
          const { v5: uuidv5 } = require('uuid');
          const GOOGLE_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
          googleUuid = uuidv5(googleId, GOOGLE_NAMESPACE);
        }
        
        // Store both Google UUID (for login identity) and user info
        token.googleId = googleUuid;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        
        // Database user ID will be resolved in session callback by email lookup
        token.id = null; // Will be populated in session callback
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔐 JWT callback - Authentication identity:', {
            originalGoogleId: googleId,
            googleUuid: googleUuid,
            email: token.email,
            databaseId: 'will be resolved in session callback'
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
      console.log('🔐 Session callback called:', {
        hasToken: !!token,
        hasTokenEmail: !!token?.email,
        tokenEmail: token?.email,
        tokenGoogleId: token?.googleId,
        sessionUserId: session?.user?.id
      });
      
      if (token && token.email) {
        // Look up database user by email
        try {
          const { createClient } = require('@supabase/supabase-js');
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!
          );
          
          const { data: dbUser, error } = await supabase
            .from('users')
            .select('id, email, name, avatar_url, is_admin')
            .eq('email', token.email)
            .single();
          
          if (dbUser) {
            // Use database user ID for session
            session.user.id = dbUser.id;
            session.user.email = dbUser.email;
            session.user.name = dbUser.name || token.name as string;
            session.user.image = dbUser.avatar_url || token.picture as string;
            // CRITICAL: Add admin status to session
            (session.user as any).is_admin = dbUser.is_admin;
            
            if (process.env.NODE_ENV === 'development') {
              console.log('🔐 Session callback - Database user found:', {
                googleId: token.googleId,
                databaseId: dbUser.id,
                email: dbUser.email,
                isAdmin: dbUser.is_admin
              });
            }
          } else {
            // User not found in database, create them
            console.log('🔐 Session callback - Creating new database user:', {
              googleId: token.googleId,
              email: token.email
            });

            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert({
                id: token.googleId,
                email: token.email,
                name: token.name || 'User',
                avatar_url: token.picture,
                auth_provider: 'google',
                is_admin: false,
                subscription_status: 'free',
                total_votes_cast: 0,
                total_problems_proposed: 0,
                last_login_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select('id, email, name, avatar_url, is_admin')
              .single();

            if (newUser) {
              // Use new database user
              session.user.id = newUser.id;
              session.user.email = newUser.email;
              session.user.name = newUser.name;
              session.user.image = newUser.avatar_url || token.picture as string;
              // Add admin status to session (new users are not admin by default)
              (session.user as any).is_admin = newUser.is_admin;
              
              console.log('✅ Session callback - New user created:', {
                databaseId: newUser.id,
                email: newUser.email
              });
            } else {
              // Creation failed, fallback to Google UUID
              session.user.id = token.googleId as string;
              session.user.email = token.email as string;
              session.user.name = token.name as string;
              session.user.image = token.picture as string;
              
              console.error('❌ Session callback - User creation failed:', createError);
            }
          }
        } catch (dbError) {
          // Database error, fallback to Google info
          session.user.id = token.googleId as string;
          session.user.email = token.email as string;
          session.user.name = token.name as string;
          session.user.image = token.picture as string;
          
          console.error('🔐 Session callback - Database lookup failed:', {
            error: dbError instanceof Error ? dbError.message : 'Unknown error',
            stack: dbError instanceof Error ? dbError.stack : undefined,
            tokenEmail: token.email,
            tokenGoogleId: token.googleId,
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY
          });
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