/**
 * NextAuth type extensions for unified user identity
 * 
 * This file extends the default NextAuth types to include our custom user fields
 * and ensures type safety across the authentication system.
 */

import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image: string
      isAdmin: boolean
      role: string
    }
    error?: string
  }

  interface User {
    id: string
    email: string
    name: string
    image: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name: string
    picture: string
    isAdmin: boolean
    role: string
    correlationId?: string
    error?: string
    accessToken?: string
    refreshToken?: string
  }
}