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
        console.log('🔐 JWT callback started:', { 
          email: user.email, 
          provider: account.provider 
        });

        // Generate deterministic UUID directly without UserIdentityService dependency
        try {
          const { v5: uuidv5 } = require('uuid');
          const WIKIGAIALAB_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
          const deterministicId = user.email ? uuidv5(user.email.toLowerCase().trim(), WIKIGAIALAB_NAMESPACE) : account.providerAccountId;
          
          // Set basic token data
          token.id = deterministicId;
          token.email = user.email || '';
          token.name = user.name || '';
          token.picture = user.image || '';
          token.isAdmin = false;
          token.role = 'user';

          console.log('✅ JWT callback - Basic auth successful:', {
            id: token.id,
            email: token.email,
            provider: account.provider
          });

          // Try to ensure user exists in database (non-blocking)
          try {
            const { createClient } = require('@supabase/supabase-js');
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
            
            if (supabaseUrl && supabaseKey && user.email) {
              const supabase = createClient(supabaseUrl, supabaseKey);
              
              // Try to upsert user (don't fail auth if this fails)
              const { data: dbUser, error: dbError } = await supabase
                .from('users')
                .upsert({
                  id: deterministicId,
                  email: user.email,
                  name: user.name || 'Unknown User',
                  image: user.image,
                  role: 'user',
                  is_admin: false,
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'id',
                  ignoreDuplicates: false
                })
                .select('id, email, name, image, role, is_admin')
                .single();

              if (!dbError && dbUser) {
                console.log('✅ JWT callback - Database user sync successful:', {
                  id: dbUser.id,
                  email: dbUser.email
                });
                
                // Update token with database info
                token.isAdmin = dbUser.is_admin || false;
                token.role = dbUser.role || 'user';
              } else {
                console.warn('⚠️ JWT callback - Database user sync failed (non-blocking):', dbError?.message);
              }
            }
          } catch (dbError) {
            console.warn('⚠️ JWT callback - Database sync error (non-blocking):', dbError);
            // Don't fail authentication if database sync fails
          }
        } catch (uuidError) {
          console.error('❌ JWT callback - UUID generation failed:', uuidError);
          
          // Last resort: use provider account ID
          token.id = account.providerAccountId;
          token.email = user.email || '';
          token.name = user.name || '';
          token.picture = user.image || '';
          token.isAdmin = false;
          token.role = 'user';
          token.error = 'uuid_generation_failed';
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