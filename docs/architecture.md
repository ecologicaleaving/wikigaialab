Understood! You've selected YOLO Mode. I will now generate a complete draft of the WikiGaiaLab Fullstack Architecture Document (architecture.md), integrating insights from the PRD and the UI/UX Specification.

This document will cover the entire technology stack, data models, API design, component architecture, deployment, security, and more, providing a unified architectural blueprint for your project.

Generating the Fullstack Architecture Document now...

==================== START: docs/architecture.md ====================

WikiGaiaLab Fullstack Architecture Document
Introduction

This document outlines the complete fullstack architecture for WikiGaiaLab, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

Starter Template or Existing Project

N/A - Greenfield project based on explicit technology stack choices from PRD. The project will be built from scratch, allowing for optimal architectural alignment with chosen frameworks and patterns.

Change Log
Date	Version	Description	Author
17/07/2025	1.0	Initial Fullstack Architecture draft	Winston (Architect)
High Level Architecture
Technical Summary

WikiGaiaLab will be built as a modern, full-stack application leveraging the Next.js framework for a unified frontend and backend (API Routes). It will employ a Monorepo structure for efficient management of distinct yet interconnected components. Supabase will serve as the primary PostgreSQL database and authentication provider, simplifying real-time data needs and user management. Deployment will be primarily on Vercel for the Next.js application, integrated with Stripe for payments and Resend/SendGrid for email notifications. This architecture supports rapid development, scalability, and maintainability, aligning with the PRD's goals of community engagement and AI-powered features.

Platform and Infrastructure Choice

Based on the PRD's requirements for Next.js, Supabase, and Vercel deployment, the recommended platform is Vercel + Supabase.

Rationale:

Vercel provides an optimized deployment environment for Next.js applications, offering seamless CI/CD, global CDN, serverless functions (for API Routes), and integrated analytics. This directly supports the NFR for performance and scalability (NFR1, NFR2) and aligns with the PRD's explicit mention of Vercel for frontend deployment.

Supabase offers a robust PostgreSQL database, integrated authentication (including Google OAuth as per FR1), and file storage, all within a developer-friendly platform. This covers core data and authentication needs, reducing setup complexity and aligning with the PRD's specific technology choices.

This combination streamlines the fullstack development and deployment process, minimizing operational overhead and accelerating time-to-market, which is crucial for a new social innovation experiment.

Key Services: Next.js (via Vercel), Supabase (PostgreSQL, Auth, Storage), Stripe, Resend/SendGrid, OpenAI/Anthropic API.
Deployment Host and Regions: Vercel (global CDN, serverless functions deployed to nearest region), Supabase (region to be chosen based on primary user base location, e.g., Europe for GDPR compliance).

Repository Structure

Structure: Monorepo
Monorepo Tool: npm workspaces (or pnpm workspaces for more advanced caching)
Package Organization:

apps/web: The main Next.js application (frontend and API routes).

packages/database: Contains shared database schema, types, migrations.

packages/ui: Shared UI components (optional, for future scalability/reusability).

packages/types: Shared TypeScript interfaces and types (e.g., for problems, users, votes).

packages/ai-sdk: Custom AI utility functions or wrappers.

Rationale: A monorepo centralizes code, simplifies dependency management, and facilitates code sharing (e.g., types, validation logic) between frontend and backend components within the Next.js app, aligning with NFR8 for maintainability. This also prepares the project for future independent apps (FR9, NFR7) by allowing them to be added as new apps/ or packages/.

Architecture Diagram
Generated mermaid
graph TD
    A[User] --HTTPS--> B(Next.js Frontend on Vercel)
    B --API Calls--> C(Next.js API Routes on Vercel)
    C --GraphQL/REST--> D(Supabase Database)
    C --Auth Callback--> F(Supabase Auth)
    C --AI API Calls--> G(OpenAI/Anthropic API)
    C --Payments--> H(Stripe API)
    H --Webhook--> C
    C --Emails--> I(Resend/SendGrid)
    D --Realtime Subscriptions--> B
    F --User Management--> D
    G --AI Response--> C
    B --Client-side Render--> A
    C --Data Storage--> J(Supabase Storage)
    J --File Access--> B

Architectural Patterns

Jamstack/Serverless Architecture: (For Frontend via Next.js and API Routes on Vercel) Enables high performance, scalability, and reduced operational overhead by leveraging CDN-served static assets and serverless functions for dynamic content. Rationale: Aligns with NFR1 (10,000 concurrent users) and NFR6 (99.9% uptime), and explicitly requested Next.js.

Component-Based UI: (For Frontend) Building the UI with reusable React components using TypeScript and Tailwind CSS. Rationale: Ensures maintainability, reusability, and consistency across the application (NFR8) and adheres to the UI/UX spec's component library approach.

Service-Oriented Backend (within Next.js API Routes): Logical separation of concerns within API routes, with dedicated services for business logic (e.g., problemsService, votesService). Rationale: Improves maintainability and testability for backend logic (NFR8).

Database-as-a-Service (Supabase): Leveraging Supabase's managed PostgreSQL for data storage, real-time subscriptions, and built-in authentication. Rationale: Simplifies database management, reduces infrastructure burden, and provides real-time features (FR3) out-of-the-box.

Event-Driven (for Notifications): Utilizing webhooks from Stripe and Supabase, and internal events for triggering email notifications (FR5). Rationale: Decouples concerns, improves responsiveness, and scales notification handling.

API Gateway Pattern: (Implicit via Next.js API Routes) Next.js API Routes act as a lightweight API gateway, providing a single entry point for frontend communication with various backend services (Supabase, Stripe, AI APIs). Rationale: Centralizes authentication, validation, and request routing.

Tech Stack
Cloud Infrastructure

Provider: Vercel (for Next.js application hosting, CDN, Serverless Functions) & Supabase (for managed PostgreSQL database, Auth, Storage).

Key Services:

Vercel: Next.js Hosting, Serverless Functions (API Routes), Vercel Analytics, Edge Network.

Supabase: PostgreSQL Database, Supabase Auth, Supabase Storage, Realtime.

Stripe: Payment Gateway, Stripe Connect (future for individual app monetization).

Resend/SendGrid: Email sending for notifications.

OpenAI/Anthropic: AI API for AI-powered features.

Deployment Regions: Vercel's global edge network (automatic closest region), Supabase region (e.g., eu-west-1 for GDPR compliance).

Technology Stack Table
Category	Technology	Version	Purpose	Rationale
Frontend Language	TypeScript	5.3+	Primary language for type safety	Enforces strong typing, improves code quality, better tooling.
Frontend Framework	Next.js	14+	Full-stack React framework	App Router for flexible routing, server components, API routes for backend, optimized for Vercel deployment. (NFR8)
UI Component Library	Custom + Shadcn UI	N/A	Reusable, accessible UI components	Builds upon a headless component library for flexibility and custom styling with Tailwind.
State Management	React Context + Zustand	Latest	Local & global state management	React Context for global user/auth state, Zustand for simpler, reactive local state.
Backend Language	TypeScript	5.3+	Primary language for type safety	Consistency with frontend, strong typing.
Backend Framework	Next.js API Routes	14+	Backend API endpoints	Leverages Next.js ecosystem for unified development, serverless deployment.
API Style	REST	N/A	Standard API communication	Widely adopted, easy to integrate, suitable for CRUD operations.
Database	PostgreSQL	Latest	Relational data storage	Robust, ACID compliant, flexible schema, strong community.
Cache	Redis (via Upstash/Vercel KV)	N/A	API response/data caching	Improves performance (NFR2), reduces load on DB/external APIs (NFR10).
File Storage	Supabase Storage	N/A	Store app-related assets (images)	Integrated with Supabase ecosystem, simplifies asset management.
Authentication	Supabase Auth	N/A	User registration & login	Google OAuth (FR1), robust, managed service, RLS for security (NFR5).
Frontend Testing	Jest, React Testing Library	Latest	Unit & integration tests for UI	Standard tools for React, efficient component testing.
Backend Testing	Jest, Supertest	Latest	Unit & integration tests for API	Standard for Node.js, facilitates API endpoint testing.
E2E Testing	Playwright	Latest	End-to-end user flow testing	Cross-browser, robust for simulating full user journeys (NFR3).
Build Tool	Next.js (Webpack/Turbopack)	14+	Optimized build process	Built-in with Next.js, handles bundling, transpilation.
Bundler	Next.js (Webpack/Turbopack)	14+	Code bundling for deployment	Integrated with Next.js build process.
IaC Tool	N/A (Vercel/Supabase Managed)	N/A	Infrastructure as Code	Managed services reduce need for custom IaC for core infra.
CI/CD	GitHub Actions	N/A	Automated testing & deployment	Standard for GitHub repos, integrates with Vercel.
Monitoring	Vercel Analytics, Sentry	N/A	Application performance & error tracking	Built-in for Vercel, Sentry for detailed error logging.
Logging	Winston/Pino	Latest	Structured logging for backend	Production-grade logging, integrates with monitoring.
CSS Framework	Tailwind CSS	3.x	Utility-first CSS framework	Rapid UI development, highly customizable, efficient bundle size.
Data Models
User

Purpose: Stores user information, authentication details, and platform activity.

Key Attributes:

id: UUID - Unique user identifier (from Supabase Auth).

email: TEXT - User's email address.

name: TEXT - User's display name.

avatar_url: TEXT - URL to user's profile picture.

auth_provider: TEXT - e.g., 'google' (from FR1).

created_at: TIMESTAMP - Timestamp of user creation.

last_login_at: TIMESTAMP - Last login timestamp.

total_votes_cast: INT - Count of problems user has voted on (for FR8, FR14).

total_problems_proposed: INT - Count of problems user has proposed (for FR14).

is_admin: BOOLEAN - Flag for admin users (for FR11, FR12).

stripe_customer_id: TEXT - Stripe customer ID (for FR10).

subscription_status: TEXT - Active, Cancelled, etc. (for FR10).

TypeScript Interface
Generated typescript
interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  auth_provider: string;
  created_at: string;
  last_login_at: string;
  total_votes_cast: number;
  total_problems_proposed: number;
  is_admin: boolean;
  stripe_customer_id: string | null;
  subscription_status: 'active' | 'cancelled' | 'trialing' | null;
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END
Relationships

One-to-many with Problem (proposer).

Many-to-many with Problem (voters) via Vote table.

One-to-many with Subscription.

Problem

Purpose: Stores details about problems proposed by the community.

Key Attributes:

id: UUID - Unique problem identifier.

proposer_id: UUID - Foreign key to User table (FR2).

title: TEXT - Title of the problem (max 100 chars) (FR2).

description: TEXT - Detailed description (max 1000 chars) (FR2).

category_id: UUID - Foreign key to Category table (FR2).

status: TEXT - 'Proposed', 'In Development', 'Completed' (FR6, FR12).

vote_count: INT - Real-time vote counter (FR3).

created_at: TIMESTAMP - Timestamp of proposal.

updated_at: TIMESTAMP - Last update timestamp.

TypeScript Interface
Generated typescript
interface Problem {
  id: string;
  proposer_id: string;
  title: string;
  description: string;
  category_id: string;
  status: 'Proposed' | 'In Development' | 'Completed';
  vote_count: number;
  created_at: string;
  updated_at: string;
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END
Relationships

Many-to-one with User (proposer).

Many-to-many with User (voters) via Vote table.

Many-to-one with Category.

One-to-one with App (when developed).

Vote

Purpose: Tracks which user voted for which problem.

Key Attributes:

user_id: UUID - Foreign key to User table (FR4).

problem_id: UUID - Foreign key to Problem table (FR4).

created_at: TIMESTAMP - Timestamp of vote.

TypeScript Interface
Generated typescript
interface Vote {
  user_id: string;
  problem_id: string;
  created_at: string;
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END
Relationships

Many-to-one with User.

Many-to-one with Problem.

Composite primary key (user_id, problem_id) to ensure one vote per user per problem.

Category

Purpose: Organizes problems into distinct categories.

Key Attributes:

id: UUID - Unique category identifier.

name: TEXT - Name of the category (FR16).

description: TEXT - Description of the category.

order_index: INT - Display order of categories (for FR16).

is_active: BOOLEAN - Flag to soft delete/hide categories (for FR16).

TypeScript Interface
Generated typescript
interface Category {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END
Relationships

One-to-many with Problem.

App

Purpose: Stores information about AI-powered applications developed based on problems.

Key Attributes:

id: UUID - Unique app identifier.

problem_id: UUID - Foreign key to Problem table (links app to its original problem).

name: TEXT - Name of the application (FR9).

description: TEXT - Detailed description of the app.

base_features: JSONB - List/description of free features (FR9).

premium_features: JSONB - List/description of premium features (FR9).

access_model: TEXT - 'freemium', 'subscription', 'one-time'.

slug: TEXT - URL-friendly identifier for app page.

created_at: TIMESTAMP

updated_at: TIMESTAMP

is_published: BOOLEAN - Whether the app is visible in catalog.

TypeScript Interface
Generated typescript
interface App {
  id: string;
  problem_id: string;
  name: string;
  description: string;
  base_features: string[]; // Or more complex structure
  premium_features: string[]; // Or more complex structure
  access_model: 'freemium' | 'subscription' | 'one-time';
  slug: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END
Relationships

One-to-one with Problem.

Many-to-many with User (via UserAppAccess table or implicit via Vote for premium access).

API Specification

The API will be primarily handled by Next.js API Routes, providing a RESTful interface.

REST API Specification
Generated yaml
openapi: 3.0.0
info:
  title: WikiGaiaLab API
  version: 1.0.0
  description: API for managing problems, votes, users, and applications for WikiGaiaLab.
servers:
  - url: /api
    description: Production API (relative path for Next.js API Routes)
paths:
  /auth/google:
    post:
      summary: Authenticate user with Google OAuth
      description: Initiates Google OAuth flow via Supabase.
      tags:
        - Auth
      responses:
        '200':
          description: Redirect to Google login or success page.
  /problems:
    get:
      summary: Get all problems
      description: Retrieves a list of all proposed problems, with optional filters.
      tags:
        - Problems
      parameters:
        - in: query
          name: category
          schema:
            type: string
          description: Filter problems by category ID.
        - in: query
          name: status
          schema:
            type: string
            enum: [Proposed, In Development, Completed]
          description: Filter problems by status.
        - in: query
          name: sort
          schema:
            type: string
            enum: [popularity, date]
          description: Sort problems by popularity (vote_count) or creation date.
      responses:
        '200':
          description: A list of problems.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Problem'
    post:
      summary: Propose a new problem
      description: Allows authenticated users to propose a new problem.
      tags:
        - Problems
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - title
                - description
                - category_id
              properties:
                title:
                  type: string
                  maxLength: 100
                description:
                  type: string
                  maxLength: 1000
                category_id:
                  type: string
                  format: uuid
      responses:
        '201':
          description: Problem successfully proposed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Problem'
  /problems/{id}/vote:
    post:
      summary: Vote for a problem
      description: Allows authenticated users to vote for a specific problem.
      tags:
        - Problems
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
            format: uuid
          description: The problem ID.
      responses:
        '200':
          description: Vote successfully cast.
          content:
            application/json:
              schema:
                type: object
                properties:
                  problem_id:
                    type: string
                    format: uuid
                  new_vote_count:
                    type: integer
        '409':
          description: User has already voted for this problem.
  /admin/problems/{id}/status:
    patch:
      summary: Update problem status (Admin)
      description: Allows admins to change the status of a problem.
      tags:
        - Admin
      security:
        - BearerAuth: []
        - AdminRole: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
            format: uuid
          description: The problem ID.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - status
              properties:
                status:
                  type: string
                  enum: [Proposed, In Development, Completed]
      responses:
        '200':
          description: Problem status updated successfully.
components:
  schemas:
    Problem:
      type: object
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
        description:
          type: string
        vote_count:
          type: integer
        status:
          type: string
          enum: [Proposed, In Development, Completed]
        created_at:
          type: string
          format: date-time
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
securitySchemes:
  BearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
  AdminRole:
    type: apiKey
    in: header
    name: X-Admin-Token # Example for admin specific check, actual impl via JWT claims
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Yaml
IGNORE_WHEN_COPYING_END
Components
Auth Module

Responsibility: Handles user registration, authentication (Google OAuth), session management, and user data fetching.
Key Interfaces:

signInWithGoogle(): Initiates Google OAuth flow.

signOut(): Logs out the current user.

getCurrentUser(): Fetches authenticated user's details.
Dependencies: Supabase Auth, Supabase Database.
Technology Stack: Next.js API Routes, Supabase Auth SDK (client-side and server-side).

Problem Module

Responsibility: Manages problem creation, retrieval, filtering, and real-time updates.
Key Interfaces:

proposeProblem(data): Creates a new problem.

getProblems(filters): Fetches problems with filters.

getProblemDetails(id): Fetches single problem details.

updateProblemStatus(id, status) (Admin only): Changes problem status.
Dependencies: Supabase Database.
Technology Stack: Next.js API Routes, Supabase PostgREST.

Voting Module

Responsibility: Manages user votes for problems, ensures single vote per problem per user, and updates vote counts.
Key Interfaces:

voteForProblem(problemId): Records a user's vote.

hasUserVoted(userId, problemId): Checks if a user has already voted.
Dependencies: Supabase Database.
Technology Stack: Next.js API Routes, Supabase Realtime (for live vote counts).

App Module

Responsibility: Manages application catalog, access control, and specific app functionalities.
Key Interfaces:

getApps(filters): Fetches list of developed apps.

getAppDetails(slug): Fetches details for a specific app.

checkAppAccess(userId, appSlug): Determines if user has premium access.
Dependencies: Supabase Database, Stripe (for premium subscriptions), AI APIs (for app logic).
Technology Stack: Next.js API Routes, Supabase PostgREST, client-side React components.

Payment Module

Responsibility: Handles Stripe payment processing, subscription management, and webhook events.
Key Interfaces:

createCheckoutSession(planId): Initiates Stripe checkout.

handleStripeWebhook(event): Processes Stripe events (e.g., successful payment, subscription changes).
Dependencies: Stripe API, Supabase Database.
Technology Stack: Next.js API Routes, Stripe Node.js SDK, Supabase PostgREST.

Admin Module

Responsibility: Provides tools for platform oversight, content moderation, and user management.
Key Interfaces:

getPlatformStats(): Fetches overall platform metrics.

updateProblem(id, data): Edits problem details.

manageUsers(userId, action): Grant/revoke access, ban users.

manageCategories(data): Create/edit/delete categories.
Dependencies: Supabase Database.
Technology Stack: Next.js API Routes, Supabase PostgREST.

Component Diagrams
Generated mermaid
graph TD
    User --> Frontend(Next.js App)
    Frontend --> AuthModule
    Frontend --> ProblemModule
    Frontend --> VotingModule
    Frontend --> AppModule
    Frontend --> AdminModule(Admin UI)
    
    AuthModule --> SupabaseAuth(Supabase Auth Service)
    ProblemModule --> SupabaseDB(Supabase Database)
    VotingModule --> SupabaseDB
    AppModule --> SupabaseDB
    AppModule --Subscription Status--> PaymentModule
    AppModule --AI Features--> AIApi(OpenAI/Anthropic)
    AdminModule --> SupabaseDB
    AdminModule --> PaymentModule
    
    PaymentModule --> Stripe(Stripe API)
    Stripe --Webhook--> NextJsApiRoutes(Next.js API Routes)
    NextJsApiRoutes --> PaymentModule
    NextJsApiRoutes --> ProblemModule
    NextJsApiRoutes --> VotingModule
    NextJsApiRoutes --> AppModule
    NextJsApiRoutes --> AdminModule
    
    subgraph Backend Logic
        C1[Auth Service]
        C2[Problem Service]
        C3[Voting Service]
        C4[App Service]
        C5[Payment Service]
        C6[Admin Service]
    end
    
    NextJsApiRoutes --Delegates to--> C1 & C2 & C3 & C4 & C5 & C6
    
    style Frontend fill:#f9f,stroke:#333,stroke-width:2px
    style SupabaseAuth fill:#9cf,stroke:#333,stroke-width:2px
    style SupabaseDB fill:#9cf,stroke:#333,stroke-width:2px
    style Stripe fill:#9cf,stroke:#333,stroke-width:2px
    style AIApi fill:#9cf,stroke:#333,stroke-width:2px
    style PaymentModule fill:#fcc,stroke:#333,stroke-width:2px
    style NextJsApiRoutes fill:#fcc,stroke:#333,stroke-width:2px
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Mermaid
IGNORE_WHEN_COPYING_END
External APIs
Stripe API

Purpose: Payment processing for subscriptions and one-time purchases (FR10).

Documentation: https://stripe.com/docs/api

Base URL(s): https://api.stripe.com/

Authentication: API Keys (Secret Key for server-side, Publishable Key for client-side Elements).

Rate Limits: Standard Stripe API limits apply. Design with exponential backoff for retries.

Key Endpoints Used:

POST /v1/checkout/sessions - Create new checkout session.

GET /v1/customers/{id} - Retrieve customer details.

GET /v1/subscriptions/{id} - Retrieve subscription details.

POST /v1/customers/{customer_id}/subscriptions - Create new subscription.

POST /v1/subscriptions/{id} - Update/cancel subscription.

Integration Notes:

Implement webhook endpoint for handling asynchronous Stripe events (e.g., checkout.session.completed, customer.subscription.updated).

**Stripe Webhook Implementation Details:**

**Webhook Endpoint:** `/api/webhooks/stripe`
- **Method:** POST
- **Authentication:** Stripe signature verification using webhook secret
- **Rate Limiting:** 100 requests per minute per IP
- **Idempotency:** Handle duplicate events using `event.id` tracking

**Webhook Events to Handle:**
```typescript
// Primary Events
- checkout.session.completed: User completed payment
- customer.subscription.updated: Subscription plan changed
- customer.subscription.deleted: Subscription cancelled
- invoice.payment_succeeded: Recurring payment successful
- invoice.payment_failed: Payment failed, handle retry logic

// Secondary Events
- customer.created: New customer in Stripe
- customer.updated: Customer details changed
- payment_method.attached: New payment method added
```

**Webhook Handler Structure:**
```typescript
// /pages/api/webhooks/stripe.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const signature = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ message: 'Invalid signature' });
  }

  // Handle duplicate events
  const { data: existingEvent } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .single();

  if (existingEvent) {
    return res.status(200).json({ message: 'Event already processed' });
  }

  // Log event for tracking
  await supabase.from('stripe_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    processed_at: new Date().toISOString(),
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ message: 'Webhook processing failed' });
  }

  return res.status(200).json({ message: 'Webhook processed successfully' });
}
```

**Error Handling & Retry Logic:**
- Failed webhook processing triggers retry with exponential backoff
- Dead letter queue for persistently failing events
- Admin notification for critical payment failures
- Comprehensive logging for debugging and monitoring

**Security Measures:**
- Signature verification using HMAC SHA256
- Rate limiting per IP address
- Input validation and sanitization
- Secure secret management via environment variables

Use Stripe Elements for secure client-side collection of payment details (PCI compliance).

OpenAI/Anthropic API

Purpose: Provide AI-powered functionality for apps (e.g., Volantino Generator) (FR9). The specific choice between OpenAI and Anthropic will be determined based on model capabilities, cost, and specific feature needs during app development.

**AI API Integration Architecture:**

**Primary Provider:** OpenAI (GPT-4o for premium features, GPT-4o-mini for basic features)
**Fallback Provider:** Anthropic Claude (Claude-3-sonnet for premium, Claude-3-haiku for basic)
**Local Fallback:** Pre-generated templates for critical app functionality

**Rate Limiting & Cost Control:**
```typescript
// Rate limiting per user tier
const RATE_LIMITS = {
  free: { requests: 5, window: '1h' },
  premium: { requests: 100, window: '1h' },
  admin: { requests: 1000, window: '1h' }
};

// Cost thresholds
const COST_THRESHOLDS = {
  daily: 50, // $50/day
  monthly: 1000, // $1000/month
  user: 5 // $5/user/month
};
```

**Multi-Provider Fallback Strategy:**
```typescript
// /lib/ai-service.ts
export class AIService {
  private providers = [
    { name: 'openai', client: openaiClient, priority: 1 },
    { name: 'anthropic', client: anthropicClient, priority: 2 },
    { name: 'fallback', client: fallbackTemplates, priority: 3 }
  ];

  async generateContent(prompt: string, options: AIOptions): Promise<AIResponse> {
    const userTier = await this.getUserTier(options.userId);
    
    // Check rate limits
    if (!(await this.checkRateLimit(options.userId, userTier))) {
      throw new RateLimitError('Rate limit exceeded');
    }

    // Check cost thresholds
    if (!(await this.checkCostThreshold())) {
      return this.useFallbackTemplates(prompt, options);
    }

    // Try providers in order of priority
    for (const provider of this.providers) {
      try {
        const result = await this.callProvider(provider, prompt, options);
        await this.logUsage(provider.name, result.tokens, result.cost);
        return result;
      } catch (error) {
        console.error(`Provider ${provider.name} failed:`, error);
        await this.logProviderError(provider.name, error);
        continue;
      }
    }

    throw new AIServiceError('All AI providers failed');
  }
}
```

**Caching Strategy:**
- **Redis caching** for identical prompts (24-hour TTL)
- **Database caching** for frequently used templates
- **Browser caching** for static fallback content

**Error Handling & Recovery:**
```typescript
// Graceful degradation levels
const DEGRADATION_LEVELS = {
  FULL_AI: 'Complete AI generation',
  TEMPLATE_AI: 'Template-based AI with customization',
  STATIC_TEMPLATE: 'Pre-built templates only',
  MANUAL_FALLBACK: 'User manual input required'
};

// Error recovery flow
async function handleAIFailure(error: AIError, context: AIContext) {
  switch (error.type) {
    case 'RATE_LIMIT':
      return await useTemplateWithCustomization(context);
    case 'COST_THRESHOLD':
      return await useStaticTemplate(context);
    case 'PROVIDER_DOWN':
      return await tryNextProvider(context);
    case 'INVALID_PROMPT':
      return await sanitizeAndRetry(context);
    default:
      return await useManualFallback(context);
  }
}
```

**Monitoring & Alerting:**
- Real-time cost tracking with automatic shutoffs
- Provider health monitoring with failover triggers
- Quality metrics for generated content
- Usage analytics per user tier and feature

**Cost Optimization:**
- Prompt engineering for token efficiency
- Response caching for common requests
- Batch processing for multiple requests
- Model selection based on complexity requirements

Documentation: https://platform.openai.com/docs/api-reference (for OpenAI), https://docs.anthropic.com/claude/reference/getting-started (for Anthropic)

Base URL(s): https://api.openai.com/v1/ or https://api.anthropic.com/v1/

Authentication: API Keys.

Rate Limits: Specific to the chosen provider and plan. Implement caching (NFR10) and robust error handling with retries and fallbacks.

Key Endpoints Used:

POST /v1/chat/completions - Generate text/code completions.

POST /v1/images/generations - Generate images (if Volantino Generator uses image generation).

Integration Notes:

All AI API calls will be proxied through Next.js API Routes to protect API keys and apply caching/rate limiting (NFR10).

Implement a caching layer (e.g., Redis) for frequently requested AI generations to reduce costs and improve performance (NFR10).

Include fallback mechanisms if the primary AI API fails (NFR10).

Resend / SendGrid API

Purpose: Send automated email notifications (FR5).

Documentation: https://resend.com/docs/api-reference or https://docs.sendgrid.com/api-reference/

Base URL(s): Specific to the chosen provider.

Authentication: API Keys.

Rate Limits: Specific to the chosen provider and plan.

Key Endpoints Used:

POST /emails (Resend) or POST /mail/send (SendGrid) - Send email.

Integration Notes:

Implement an email queue system to handle sending asynchronously and gracefully (FR5, NFR6).

Use email templates for consistent branding and content (FR5).

Core Workflows
User Problem Proposal & Voting Flow
Generated mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant NR as Next.js API Route
    participant DB as Supabase DB
    participant EM as Email Module (Async)
    
    U->>FE: Navigates to "Propose Problem"
    FE->>U: Displays form
    U->>FE: Fills form & Submits
    FE->>NR: POST /api/problems (problem_data)
    NR->>DB: Insert new problem
    DB-->>NR: Problem created (id, initial_vote_count=1)
    NR-->>FE: Success response
    FE->>U: Redirect to Problem Detail Page
    
    Note over U,FE: User on Dashboard Problemi
    U->>FE: Clicks "Vote" on Problem Card
    FE->>NR: POST /api/problems/{id}/vote
    NR->>DB: Increment vote_count for problem
    NR->>DB: Insert vote (user_id, problem_id)
    DB-->>NR: Vote recorded, new count
    NR-->>FE: Success response (new vote_count)
    FE->>U: Optimistic UI update, then real-time subscription updates vote count
    
    Note over DB,EM: Problem reaches 50, 75, 100 votes (DB Trigger/Webhook/CRON)
    DB->>EM: NotifyProblemMilestone(problem_id, count)
    EM->>NR: Call internal email service
    NR->>EM: Send email notification to proposer
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Mermaid
IGNORE_WHEN_COPYING_END
User Login Flow
Generated mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant SB as Supabase Auth
    participant NR as Next.js API Route
    participant DB as Supabase DB
    
    U->>FE: Clicks "Sign in with Google"
    FE->>SB: signInWithOAuth({ provider: 'google', redirectTo: '/dashboard' })
    SB->>U: Redirects to Google login
    U->>SB: Authenticates with Google
    SB-->>FE: Redirects back to FE with session data
    FE->>NR: (Optional) Server-side session validation
    NR->>DB: (Optional) Check/update user profile
    DB-->>NR: User data
    NR-->>FE: User data/success
    FE->>U: Redirects to User Dashboard (protected route)
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Mermaid
IGNORE_WHEN_COPYING_END
App Premium Access Flow
Generated mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant NR as Next.js API Route
    participant DB as Supabase DB
    
    U->>FE: Navigates to App Catalog
    FE->>NR: GET /api/apps (fetches app list)
    NR->>DB: Query Apps and User's Votes/Subscriptions
    DB-->>NR: App data + access flags
    NR-->>FE: App data with 'hasPremiumAccess' flag
    FE->>U: Displays App Cards with "Premium"/"Free" badge, locked/unlocked UI
    
    U->>FE: Clicks on a Premium App
    FE->>NR: GET /api/apps/{slug}/details (authenticated)
    NR->>DB: Check if user_id voted for problem_id linked to app OR has active subscription
    DB-->>NR: Access status
    NR-->>FE: App data + premium features flag
    FE->>U: Renders app with appropriate features unlocked/locked
    
    alt User does NOT have premium access
        U->>FE: Clicks on locked Premium Feature
        FE->>U: Displays "Unlock Premium" CTA
    end
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Mermaid
IGNORE_WHEN_COPYING_END
Database Schema

The database schema will be managed in Supabase PostgreSQL, with Row Level Security (RLS) and appropriate indexes for performance.

**Database Migration & Rollback Strategy:**

**Migration Management:**
- **Supabase CLI** for version-controlled migrations
- **Staged rollout** (development → staging → production)
- **Zero-downtime migrations** using online schema changes
- **Backup-first approach** with automatic snapshots before migrations

**Migration File Structure:**
```
packages/database/migrations/
├── 001_initial_schema.sql
├── 002_add_categories.sql
├── 003_add_voting_system.sql
├── 004_add_stripe_integration.sql
├── 005_add_apps_table.sql
└── rollback/
    ├── 001_rollback_initial_schema.sql
    ├── 002_rollback_add_categories.sql
    └── ...
```

**Migration Workflow:**
```bash
# Development
supabase db reset --linked  # Reset local DB
supabase db migrate         # Apply migrations
supabase db push           # Push to remote staging

# Staging validation
supabase db diff           # Review changes
supabase db migrate --check # Validate migration

# Production deployment
supabase db backup         # Create backup
supabase db migrate --confirm # Apply with confirmation
```

**Rollback Procedures:**

**Immediate Rollback (< 1 hour):**
```sql
-- Each migration includes rollback instructions
-- Example: Rolling back voting system
BEGIN;
-- Drop new constraints
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_user_problem_unique;
-- Remove new columns
ALTER TABLE problems DROP COLUMN IF EXISTS vote_count;
-- Remove new tables
DROP TABLE IF EXISTS votes;
COMMIT;
```

**Data-Safe Rollback (> 1 hour):**
```typescript
// Rollback service for data preservation
export class RollbackService {
  async safeRollback(migrationId: string): Promise<RollbackResult> {
    // 1. Create data snapshot
    const snapshot = await this.createDataSnapshot();
    
    // 2. Apply schema rollback
    const rollbackResult = await this.applySchemaRollback(migrationId);
    
    // 3. Migrate data to previous schema
    const dataResult = await this.migrateDataToRollback(snapshot);
    
    // 4. Verify data integrity
    const verifyResult = await this.verifyDataIntegrity();
    
    return {
      success: rollbackResult.success && dataResult.success && verifyResult.success,
      snapshot: snapshot.id,
      logs: [...rollbackResult.logs, ...dataResult.logs, ...verifyResult.logs]
    };
  }
}
```

**Backup Strategy:**
- **Pre-migration backups** (automatic)
- **Daily incremental backups** (Supabase native)
- **Weekly full backups** stored in external S3
- **Point-in-time recovery** for last 7 days

**Migration Testing:**
```typescript
// Migration test suite
describe('Database Migrations', () => {
  beforeEach(async () => {
    await resetTestDatabase();
    await seedTestData();
  });

  it('should apply migration 005 without data loss', async () => {
    const beforeData = await captureDataSnapshot();
    await applyMigration('005_add_apps_table.sql');
    const afterData = await captureDataSnapshot();
    
    expect(afterData.users.length).toBe(beforeData.users.length);
    expect(afterData.problems.length).toBe(beforeData.problems.length);
  });

  it('should rollback migration 005 successfully', async () => {
    await applyMigration('005_add_apps_table.sql');
    const beforeRollback = await captureDataSnapshot();
    
    await rollbackMigration('005_add_apps_table.sql');
    const afterRollback = await captureDataSnapshot();
    
    expect(afterRollback.users).toEqual(beforeRollback.users);
    expect(afterRollback.problems).toEqual(beforeRollback.problems);
  });
});
```

**Production Deployment Checklist:**
- [ ] Database backup completed
- [ ] Migration tested in staging
- [ ] Rollback procedure verified
- [ ] Monitoring alerts configured
- [ ] Team notification sent
- [ ] Application maintenance mode ready
- [ ] Post-migration validation scripts prepared

Generated sql
-- Users Table (via Supabase Auth - public.users)
CREATE TABLE public.users (
    id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    email text UNIQUE NOT NULL,
    name text,
    avatar_url text,
    auth_provider text NOT NULL DEFAULT 'email', -- 'google', 'email' etc.
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_login_at timestamp with time zone,
    total_votes_cast integer DEFAULT 0 NOT NULL,
    total_problems_proposed integer DEFAULT 0 NOT NULL,
    is_admin boolean DEFAULT FALSE NOT NULL,
    stripe_customer_id text,
    subscription_status text -- 'active', 'cancelled', 'trialing' etc.
);

-- Problems Table
CREATE TABLE public.problems (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    proposer_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    category_id uuid REFERENCES public.categories(id) ON DELETE RESTRICT NOT NULL,
    status text NOT NULL DEFAULT 'Proposed', -- 'Proposed', 'In Development', 'Completed'
    vote_count integer DEFAULT 1 NOT NULL, -- Proposer's vote
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Votes Table (Composite Primary Key to ensure one vote per user per problem)
CREATE TABLE public.votes (
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    problem_id uuid REFERENCES public.problems(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (user_id, problem_id)
);

-- Categories Table
CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    order_index integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT TRUE NOT NULL
);

-- Apps Table
CREATE TABLE public.apps (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    problem_id uuid REFERENCES public.problems(id) ON DELETE RESTRICT UNIQUE NOT NULL, -- One app per problem
    name text NOT NULL,
    description text NOT NULL,
    base_features jsonb DEFAULT '[]'::jsonb NOT NULL,
    premium_features jsonb DEFAULT '[]'::jsonb NOT NULL,
    access_model text NOT NULL DEFAULT 'freemium', -- 'freemium', 'subscription', 'one-time'
    slug text UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_published boolean DEFAULT FALSE NOT NULL
);

-- Subscriptions Table (for Stripe)
CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    stripe_subscription_id text UNIQUE NOT NULL,
    stripe_price_id text NOT NULL, -- ID of the Stripe Price object
    status text NOT NULL, -- 'active', 'canceled', 'past_due', 'unpaid', etc.
    current_period_start timestamp with time zone NOT NULL,
    current_period_end timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX problems_proposer_id_idx ON public.problems (proposer_id);
CREATE INDEX problems_category_id_idx ON public.problems (category_id);
CREATE INDEX problems_status_vote_count_idx ON public.problems (status, vote_count DESC);
CREATE INDEX votes_problem_id_idx ON public.votes (problem_id);
CREATE INDEX apps_slug_idx ON public.apps (slug);
CREATE INDEX subscriptions_user_id_idx ON public.subscriptions (user_id);

-- RLS (Row Level Security) Policies
-- (These will be defined directly in Supabase for granular access control)
-- Example: Enable RLS on `problems` table
-- CREATE POLICY "Users can view problems" ON public.problems FOR SELECT USING (TRUE);
-- CREATE POLICY "Authenticated users can insert problems" ON public.problems FOR INSERT WITH CHECK (auth.uid() = proposer_id);
-- CREATE POLICY "Users can vote once per problem" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id AND NOT EXISTS (SELECT 1 FROM public.votes WHERE user_id = auth.uid() AND problem_id = NEW.problem_id));
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
SQL
IGNORE_WHEN_COPYING_END
Frontend Architecture
Component Architecture
Component Organization
Generated text
src/
├── app/                     # Next.js App Router (pages/layouts)
│   ├── (auth)/              # Auth-related routes (login, register)
│   ├── (dashboard)/         # Main user dashboard routes
│   │   ├── problems/        # Problem listing and detail pages
│   │   ├── apps/            # Application catalog and specific app pages
│   │   ├── profile/         # User profile and settings
│   │   └── admin/           # Admin dashboard routes
│   ├── api/                 # Next.js API Routes (backend logic)
│   └── layout.tsx           # Global layout
├── components/              # Reusable UI components (shared)
│   ├── ui/                  # Shadcn UI components (button, input, card, dialog)
│   ├── common/              # Global components (Header, Footer, Nav, LayoutWrapper)
│   ├── auth/                # Auth-specific components (GoogleSignInButton)
│   ├── problems/            # ProblemCard, ProblemDetail, ProblemForm
│   ├── apps/                # AppCard, AppAccessGate, VolantinoGenerator
│   └── admin/               # Admin specific components (TableFilter, StatCard)
├── hooks/                   # Custom React hooks (useAuth, useProblems, useVote)
├── lib/                     # Utility functions (supabase, stripe, email clients)
├── styles/                  # Tailwind CSS config & global styles
├── types/                   # Shared TypeScript types (Problem, User, App)
└── store/                   # Zustand stores (e.g., UI state, temporary data)
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Text
IGNORE_WHEN_COPYING_END
Component Template
Generated typescript
// src/components/ExampleComponent.tsx
import React from 'react';
import { cn } from '@/lib/utils'; // Example utility for Tailwind class merging

interface ExampleComponentProps {
  title: string;
  description?: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

const ExampleComponent: React.FC<ExampleComponentProps> = ({
  title,
  description,
  isActive = false,
  onClick,
  className,
}) => {
  return (
    <div
      className={cn(
        "p-4 border rounded-lg shadow-sm cursor-pointer",
        isActive ? "bg-blue-100 border-blue-400" : "bg-white border-gray-200",
        className
      )}
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="text-gray-600">{description}</p>}
      {isActive && <span className="text-blue-500 text-sm">Active!</span>}
    </div>
  );
};

export default ExampleComponent;
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END
State Management Architecture

Approach: Hybrid using React Context for global, application-wide state (e.g., authentication status, current user) and Zustand for local, component-specific, or feature-specific state that requires simple, reactive updates.

State Structure
Generated typescript
// src/store/authStore.ts (Example Zustand store for auth)
import { create } from 'zustand';
import { User } from '@/types/user'; // Shared type

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true, // Initial loading for session check
  login: (userData) => set({ user: userData, isLoading: false }),
  logout: () => set({ user: null, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

// src/context/SupabaseAuthContext.tsx (Example React Context for Supabase session)
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Supabase client
import { User } from '@/types/user'; // Shared type

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END
State Management Patterns

Centralized Authentication State: Managed via React Context/Provider pattern, consuming Supabase's onAuthStateChange events. This ensures authentication status and user data are globally accessible.

Feature-Specific Stores: Using Zustand for specific features (e.g., useProblemStore, useVoteStore) to manage UI state related to those features, reducing prop drilling and making state changes predictable.

Server Components & Data Fetching: Leveraging Next.js 14 App Router's Server Components for initial data fetching and rendering where possible, reducing client-side JavaScript bundle size and improving initial load performance.

Optimistic UI Updates: For actions like voting, immediately update the UI on the client and then confirm with a server response. Rollback on error.

Routing Architecture

Next.js App Router for file-system based routing.

Route Organization
Generated text
src/app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── (dashboard)/
│   ├── layout.tsx     # Layout for authenticated routes
│   ├── page.tsx       # User Dashboard
│   ├── problems/
│   │   ├── page.tsx   # Problems Dashboard
│   │   ├── [id]/
│   │   │   └── page.tsx # Problem Detail Page
│   │   └── propose/
│   │       └── page.tsx # Propose Problem Form
│   ├── apps/
│   │   ├── page.tsx   # App Catalog
│   │   ├── [slug]/
│   │   │   └── page.tsx # Specific App Page (e.g., Volantino Generator)
│   ├── profile/
│   │   ├── page.tsx   # User Profile
│   │   └── settings/
│   │       └── page.tsx # Personal Data / Notification Settings
│   └── admin/
│       ├── layout.tsx # Admin layout
│       ├── page.tsx   # Admin Dashboard Overview
│       ├── problems/  # Admin Problem Management
│       ├── users/     # Admin User Management
│       └── settings/  # Admin Platform Configuration
├── api/               # Next.js API Routes (backend)
│   ├── auth/
│   ├── problems/
│   ├── votes/
│   ├── apps/
│   ├── payments/
│   └── admin/
├── layout.tsx         # Root layout for entire application
├── page.tsx           # Homepage/Landing
└── global-error.tsx   # Global error boundary
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Text
IGNORE_WHEN_COPYING_END
Protected Route Pattern
Generated typescript
// src/app/(dashboard)/layout.tsx (Example of a protected layout)
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import React from 'react';
import Header from '@/components/common/Header'; // Assuming common header
import Footer from '@/components/common/Footer'; // Assuming common footer

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // This is a Server Component, so use Next.js redirect
    redirect('/login'); // Redirect unauthenticated users to login
  }

  // Fetch user details including is_admin if needed for admin routes
  // const { data: userProfile } = await supabase.from('users').select('is_admin').eq('id', session.user.id).single();
  // If this was an admin route, would check userProfile.is_admin

  return (
    <div className="flex flex-col min-h-screen">
      <Header user={session.user} /> {/* Pass user info to header */}
      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>
      <Footer />
    </div>
  );
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END
Frontend Services Layer

All API calls from the frontend will go through a centralized service layer, abstracting direct HTTP calls. This layer will primarily interact with Next.js API Routes.

API Client Setup
Generated typescript
// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// src/lib/api.ts (for internal API routes if not using Supabase client directly)
import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Base URL for Next.js API Routes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add an interceptor to include auth token if using custom API routes
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Centralized error handling
    if (error.response?.status === 401) {
      // Handle unauthorized
      console.error('Unauthorized access, redirecting to login...');
      // redirect('/login'); // Client-side redirect
    }
    return Promise.reject(error);
  }
);

export default api;
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END
Service Example
Generated typescript
// src/services/problemService.ts
import api from '@/lib/api'; // Or use Supabase client directly
import { Problem } from '@/types/problem'; // Shared type

export const problemService = {
  async getProblems(filters?: { category?: string; status?: string; sort?: string }): Promise<Problem[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.sort) params.append('sort', filters.sort);

    const response = await api.get<Problem[]>(`/problems?${params.toString()}`);
    return response.data;
  },

  async proposeProblem(title: string, description: string, categoryId: string): Promise<Problem> {
    const response = await api.post<Problem>('/problems', { title, description, categoryId });
    return response.data;
  },

  async voteForProblem(problemId: string): Promise<{ problem_id: string; new_vote_count: number }> {
    const response = await api.post<{ problem_id: string; new_vote_count: number }>(`/problems/${problemId}/vote`);
    return response.data;
  },

  async getProblemDetails(id: string): Promise<Problem> {
    const response = await api.get<Problem>(`/problems/${id}`);
    return response.data;
  },

  // Admin-only method (example)
  async updateProblemStatus(id: string, status: Problem['status']): Promise<Problem> {
    const response = await api.patch<Problem>(`/admin/problems/${id}/status`, { status });
    return response.data;
  },
};
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END
Backend Architecture

The backend logic will primarily reside within Next.js API Routes, which are serverless functions deployed on Vercel.

Service Architecture
Function Organization
Generated text
src/app/api/
├── auth/                       # Authentication related routes
│   ├── google/                 # Google OAuth callback
│   └── route.ts
├── problems/                   # Problem related routes
│   ├── [id]/
│   │   ├── vote/
│   │   │   └── route.ts        # POST /api/problems/[id]/vote
│   │   └── route.ts            # GET /api/problems/[id]
│   └── route.ts                # GET, POST /api/problems
├── admin/                      # Admin only routes
│   ├── problems/
│   │   ├── [id]/
│   │   │   └── status/
│   │   │       └── route.ts    # PATCH /api/admin/problems/[id]/status
│   │   └── route.ts
│   ├── users/
│   │   └── route.ts
│   └── route.ts                # Admin dashboard data
├── webhooks/                   # Webhook handlers (e.g., Stripe)
│   └── stripe/
│       └── route.ts
└── services/                   # Internal backend services/helpers (not API routes)
    ├── authService.ts
    ├── problemService.ts
    ├── voteService.ts
    ├── appService.ts
    ├── paymentService.ts
    ├── emailService.ts
    ├── adminService.ts
    ├── aiService.ts
    └── db.ts                   # Supabase client initialization
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Text
IGNORE_WHEN_COPYING_END
Function Template
Generated typescript
// src/app/api/problems/route.ts (Example Next.js API Route)
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Problem } from '@/types/problem'; // Shared type
import { problemService } from '@/services/server/problemService'; // Internal server service

// GET /api/problems
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const sort = searchParams.get('sort') || undefined;

    const problems = await problemService.getProblems({ category, status, sort });
    return NextResponse.json(problems);
  } catch (error) {
    console.error('Error fetching problems:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/problems
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, category_id } = await request.json();

    // Basic validation
    if (!title || !description || !category_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newProblem = await problemService.proposeProblem(session.user.id, { title, description, category_id });
    return NextResponse.json(newProblem, { status: 201 });
  } catch (error) {
    console.error('Error proposing problem:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END
Database Architecture

Supabase's managed PostgreSQL database.

Schema Design

Refer to the SQL DDL provided in the "Database Schema" section above.

Data Access Layer

A dedicated db.ts or supabaseClient.ts module will encapsulate Supabase client initialization. All interactions with the database (reads, writes, updates) from API routes will go through specific service files (problemService.ts, voteService.ts, etc.) which will use the Supabase client. This aligns with a simplified Repository pattern.

Generated typescript
// src/services/server/problemService.ts (Server-side service)
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Problem } from '@/types/problem';

export const problemService = {
  async getProblems(filters?: { category?: string; status?: string; sort?: string }): Promise<Problem[]> {
    const supabase = createServerComponentClient({ cookies });
    let query = supabase.from('problems').select('*');

    if (filters?.category) {
      query = query.eq('category_id', filters.category);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.sort === 'popularity') {
      query = query.order('vote_count', { ascending: false });
    } else { // Default sort by date
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async proposeProblem(proposerId: string, data: { title: string; description: string; category_id: string }): Promise<Problem> {
    const supabase = createServerComponentClient({ cookies });
    const { data: newProblem, error } = await supabase
      .from('problems')
      .insert({
        proposer_id: proposerId,
        title: data.title,
        description: data.description,
        category_id: data.category_id,
        vote_count: 1, // Proposer's initial vote
        status: 'Proposed'
      })
      .select('*')
      .single();

    if (error) throw error;
    return newProblem;
  },
  // ... other problem related methods
};
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END
Authentication and Authorization

Supabase Auth will handle core authentication (Google OAuth). Authorization will be managed through a combination of:

Supabase RLS (Row Level Security): For granular access control directly at the database level (e.g., users can only update their own profile, admins can see all data).

Next.js Middleware/API Route Guards: To check user sessions (auth-helpers-nextjs) and custom role-based authorization (e.g., is_admin flag from public.users table for admin routes).

Auth Flow
Generated mermaid
sequenceDiagram
    actor U as User
    participant F as Frontend (Next.js)
    participant NR as Next.js API Routes
    participant SA as Supabase Auth
    participant SD as Supabase DB
    
    U->>F: Request Protected Page
    F->>SA: Check Session (server-side, via auth-helpers-nextjs)
    alt No Active Session
        SA-->>F: Redirect to Login
        F->>U: Display Login Page
        U->>F: Click "Sign in with Google"
        F->>SA: Initiate OAuth Flow (client-side)
        SA->>U: Redirect to Google
        U->>Google: Authenticate
        Google->>SA: Callback
        SA-->>F: Redirect to Callback Route (e.g., /auth/callback)
        F->>SA: Exchange code for session (server-side)
        SA-->>F: Session & User data
        F->>NR: Store session in secure cookie
        NR-->>F: Redirect to Protected Page
        F->>U: Display Protected Content
    else Active Session
        SA-->>F: Session & User data
        F->>NR: Validate session / Check user role (if admin route)
        NR-->>F: Success
        F->>U: Display Protected Content
    end
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Mermaid
IGNORE_WHEN_COPYING_END
Middleware/Guards

Next.js Middleware or dedicated functions within API Routes will handle authorization checks.

Generated typescript
// src/middleware.ts (Example Next.js Middleware for auth)
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired and store new session
  // This is crucial for keeping the session alive and in sync
  await supabase.auth.getSession();

  // You can then access session from the request object in API Routes or Server Components
  // For protected routes, you can check session here and redirect if needed
  // Example for protecting /dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // User is not authenticated, redirect to login
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/login', '/api/:path*'],
};

// src/app/api/admin/route.ts (Example of an Admin route guard)
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { db } from '@/lib/db'; // Your DB client

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is an admin
  const { data: userProfile, error: userError } = await db.from('users').select('is_admin').eq('id', session.user.id).single();

  if (userError || !userProfile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  // Admin logic continues here...
  return NextResponse.json({ message: 'Welcome, Admin!' });
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END
Unified Project Structure
Generated text
WikiGaiaLab/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── main.yaml           # CI for pushes to main/next (lint, test)
│       └── deploy-vercel.yaml  # CD for deployments to Vercel
├── apps/                       # Application packages (monorepo structure)
│   └── web/                    # Main Next.js application (FE + BE API Routes)
│       ├── public/             # Static assets (images, favicons)
│       ├── src/
│       │   ├── app/            # App Router routes & layouts
│       │   │   ├── (auth)/     # Login, Register
│       │   │   ├── (dashboard)/# Authenticated routes & layout
│       │   │   │   ├── problems/
│       │   │   │   ├── apps/
│       │   │   │   ├── profile/
│       │   │   │   └── admin/
│       │   │   ├── api/        # Next.js API Routes (backend logic)
│       │   │   ├── layout.tsx  # Root layout
│       │   │   └── page.tsx    # Homepage
│       │   ├── components/     # Reusable UI components
│       │   │   ├── ui/         # Shadcn UI base components
│       │   │   └── common/     # WikiGaiaLab specific components
│       │   ├── hooks/          # Custom React hooks
│       │   ├── lib/            # Utility functions (Supabase client, API client, Tailwind)
│       │   ├── styles/         # Global CSS, Tailwind config
│       │   ├── store/          # Zustand stores
│       │   └── types/          # Frontend-specific types (refer to packages/shared for shared types)
│       ├── tests/              # Frontend & API route tests (Jest/RTL, Playwright)
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       ├── .env.local.example  # Example local environment variables
│       ├── next.config.mjs
│       ├── package.json        # Next.js app dependencies
│       └── tsconfig.json
├── packages/                   # Shared packages
│   ├── database/               # Shared DB types, migrations
│   │   ├── schema.sql          # SQL schema definitions
│   │   ├── migrations/         # Supabase migrations
│   │   └── package.json
│   ├── shared/                 # Shared TypeScript types & utilities
│   │   ├── src/
│   │   │   ├── types/          # Interfaces for Problem, User, App, etc.
│   │   │   └── utils/          # Shared validation, constants
│   │   └── package.json
│   ├── ui/                     # (Optional) Shared UI component library if needed in future
│   │   └── package.json
│   └── config/                 # Shared configs for ESLint, Prettier, TS
│       ├── eslint-preset/
│       ├── prettier-preset/
│       └── tsconfig-bases/
├── scripts/                    # Monorepo management scripts (e.g., seed database)
├── docs/                       # Project documentation
│   ├── prd.md
│   ├── front-end-spec.md
│   └── architecture.md
├── .env.example                # Root level environment template
├── package.json                # Root package.json with workspaces
├── pnpm-workspace.yaml         # pnpm workspace config (if using pnpm)
└── README.md                   # Project overview & setup instructions
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Text
IGNORE_WHEN_COPYING_END
Development Workflow
Local Development Setup
Prerequisites
Generated bash
# Node.js 20.x or higher
node -v

# npm or pnpm (recommended for monorepos)
npm -v
# or
pnpm -v

# Git
git --version

# Supabase CLI (optional, but recommended for local DB/migrations)
supabase help
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Bash
IGNORE_WHEN_COPYING_END
Initial Setup
Generated bash
# 1. Clone the monorepo
git clone <your-repo-url> WikiGaiaLab
cd WikiGaiaLab

# 2. Install root dependencies (using pnpm for example)
pnpm install

# 3. Create .env files
# Copy environment variables template
cp .env.example .env

# Create app-specific .env files
cp apps/web/.env.local.example apps/web/.env.local

# IMPORTANT: Fill in your actual Supabase, Stripe, AI API keys in .env and apps/web/.env.local

# 4. (Optional) Initialize Supabase locally if not using remote only
# supabase init
# supabase link --project-ref your-project-ref
# supabase db pull
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Bash
IGNORE_WHEN_COPYING_END
Development Commands
Generated bash
# Start all services (frontend & Next.js API Routes)
pnpm run dev # This script should run `next dev` inside apps/web

# Start frontend only (if separated, not typical for Next.js App Router)
# N/A for this fullstack architecture as API Routes are part of `next dev`

# Start backend only (if separated, not typical for Next.js App Router)
# N/A for this fullstack architecture as API Routes are part of `next dev`

# Run tests
pnpm test # Runs all tests in `apps/web/tests` (unit, integration)
pnpm playwright test # Runs E2E tests
pnpm lint # Runs ESLint for linting
pnpm format # Runs Prettier for formatting
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Bash
IGNORE_WHEN_COPYING_END
Environment Configuration
Required Environment Variables
Generated bash
# .env (Root level, mainly for infrastructure scripts or shared backend envs)
# SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
# STRIPE_SECRET_KEY=sk_test_...
# RESEND_API_KEY=re_...
# OPENAI_API_KEY=sk_... # Or ANTHROPIC_API_KEY=sk_...

# apps/web/.env.local (Frontend & Next.js API Routes)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Optional: If AI calls are made directly from frontend (less secure for production)
# NEXT_PUBLIC_OPENAI_API_KEY=sk_...
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Bash
IGNORE_WHEN_COPYING_END
Deployment Architecture
Deployment Strategy

Frontend Deployment:

Platform: Vercel

Build Command: pnpm build (or next build within apps/web context)

Output Directory: .next/ (managed by Next.js)

CDN/Edge: Vercel's global Edge Network for static assets and serverless function distribution, ensuring low latency globally.

Backend Deployment:

Platform: Vercel (Next.js API Routes run as Serverless Functions).

Build Command: Integrated with Next.js frontend build.

Deployment Method: Git-based deployment via GitHub Actions (configured to deploy to Vercel on merges to main).

Database: Supabase is a managed service, handling its own deployment and scaling.

CI/CD Pipeline
Generated yaml
# .github/workflows/main.yaml
name: CI on Push

on:
  push:
    branches:
      - main
      - next # For feature branches / staging environment

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Run ESLint
        run: pnpm lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Run Unit & Integration Tests
        run: pnpm test

  e2e-test:
    needs: test # Ensure unit/integration tests pass first
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Setup Playwright
        run: pnpm playwright install --with-deps
      - name: Run E2E Tests
        run: pnpm e2e-test # This should start dev server and run playwright
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Yaml
IGNORE_WHEN_COPYING_END
Environments
Environment	Frontend URL	Backend URL	Purpose
Development	localhost:3000	localhost:3000/api	Local development and testing
Staging	wikigaialab-staging.vercel.app	wikigaialab-staging.vercel.app/api	Pre-production testing, UAT
Production	wikigaialab.vercel.app	wikigaialab.vercel.app/api	Live environment for users
Security and Performance
Security Requirements

Frontend Security:

CSP Headers: Implement Content Security Policy (CSP) headers to mitigate XSS attacks and control resource loading.

XSS Prevention: All user-generated content rendered on the frontend will be properly sanitized to prevent Cross-Site Scripting. React naturally helps with this.

Secure Storage: Sensitive client-side data (e.g., JWTs) will be stored in HttpOnly cookies, managed by Supabase Auth Helpers.

Backend Security:

Input Validation: Strict server-side validation for all incoming API requests (e.g., Zod for schema validation).

Rate Limiting: Implement API rate limiting on critical endpoints (e.g., voting, problem proposal) to prevent abuse and denial-of-service.

CORS Policy: Configure Cross-Origin Resource Sharing (CORS) policies to allow requests only from trusted origins (your frontend URL).

Authentication Security:

Token Storage: JWTs managed by Supabase Auth Helpers, stored in secure HttpOnly cookies.

Session Management: Leverage Supabase's built-in session management.

Password Policy: Supabase handles password policies for email/password auth (not applicable for Google OAuth).

Performance Optimization

Frontend Performance:

Bundle Size Target: Aim for minimal JavaScript bundle size (e.g., <100KB gzipped for initial load).

Loading Strategy: Utilize Next.js automatic code splitting and lazy loading for routes and components.

Caching Strategy: Leverage Vercel's CDN for caching static assets and Next.js data caching for API responses.

Backend Performance:

Response Time Target: API responses under 200ms for critical paths.

Database Optimization: Ensure proper indexing (NFR1), optimize complex queries, and leverage Supabase features like materialized views where needed.

Caching Strategy: Implement Redis caching (via Upstash/Vercel KV) for frequently accessed, slow-changing data (NFR10) (e.g., problem lists, vote counts).

Testing Strategy
Testing Pyramid
Generated text
E2E Tests (Playwright)
         /        \
    Integration Tests (Jest/Supertest, RTL)
       /            \
  Frontend Unit (Jest/RTL)  Backend Unit (Jest)
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Text
IGNORE_WHEN_COPYING_END
Test Organization
Frontend Tests
Generated text
apps/web/tests/
├── unit/                       # Pure component/hook logic tests
│   ├── components/
│   ├── hooks/
│   └── lib/
├── integration/                # Component integration with mocked services
│   ├── pages/
│   └── flows/
└── e2e/                        # Playwright tests for full user flows
    ├── auth.spec.ts
    ├── problems.spec.ts
    └── apps.spec.ts
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Text
IGNORE_WHEN_COPYING_END
Backend Tests

(Next.js API Routes tests will reside within apps/web/tests/integration/api/ or apps/web/src/app/api/__tests__/)

Generated text
apps/web/tests/
├── unit/
│   ├── services/                 # Backend service logic tests
│   └── utils/
├── integration/
│   ├── api/                      # API Route integration tests (using Supertest)
│   ├── database/                 # DB interaction tests
│   └── webhooks/                 # Webhook handler tests
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Text
IGNORE_WHEN_COPYING_END
E2E Tests
Generated text
apps/web/tests/e2e/
├── auth.spec.ts                 # Login, Register, Logout flow
├── problems.spec.ts             # Propose, Vote, View Problems
├── apps.spec.ts                 # Browse Apps, Access Control
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Text
IGNORE_WHEN_COPYING_END
Test Examples
Frontend Component Test
Generated typescript
// apps/web/tests/unit/components/problems/ProblemCard.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProblemCard from '@/components/problems/ProblemCard'; // Adjust import path
import { Problem } from '@/types/problem'; // Shared type

// Mock the vote service or other external dependencies if necessary
jest.mock('@/services/problemService', () => ({
  problemService: {
    voteForProblem: jest.fn(() => Promise.resolve({ new_vote_count: 51 })),
  },
}));

const mockProblem: Problem = {
  id: '123',
  title: 'Test Problem',
  description: 'This is a test problem description.',
  vote_count: 50,
  status: 'Proposed',
  proposer_id: 'user1',
  category_id: 'cat1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('ProblemCard', () => {
  it('renders problem details correctly', () => {
    render(<ProblemCard problem={mockProblem} />);
    expect(screen.getByText('Test Problem')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument(); // Vote count
    expect(screen.getByText('Proposed')).toBeInTheDocument(); // Status
  });

  it('calls vote function on button click and updates count', async () => {
    // Mock for Supabase user session for authentication
    jest.mock('@supabase/auth-helpers-nextjs', () => ({
        createServerComponentClient: jest.fn(() => ({
            auth: {
                getSession: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'user-xyz' } } } })),
            },
        })),
        createRouteHandlerClient: jest.fn(() => ({
            auth: {
                getSession: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'user-xyz' } } } })),
            },
        })),
    }));

    const { problemService } = require('@/services/problemService'); // Re-import after mock
    render(<ProblemCard problem={mockProblem} />);
    const voteButton = screen.getByRole('button', { name: /vote/i }); // Assuming a button with accessible name "Vote"
    fireEvent.click(voteButton);
    expect(problemService.voteForProblem).toHaveBeenCalledWith('123');
    // For optimistic UI update and then re-render, would need more sophisticated testing for async updates
  });
});
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END
Backend API Test
Generated typescript
// apps/web/tests/integration/api/problems.test.ts
import request from 'supertest';
import { createServer } from 'http';
import { NextApiHandler } from 'next';
import { problemService } from '@/services/server/problemService'; // Mock this service

// Mock Next.js API route handler to test it directly
// This setup can be more complex for App Router, typically you mock the underlying services
// For App Router, you'd directly import and test the route handlers, or mock the `cookies()` function if it's a Server Component API route.
// This example is more illustrative for Pages Router API routes, but principle applies.

// For App Router API Routes, directly test the handler function:
// Assume this is `src/app/api/problems/route.ts` which exports `GET` and `POST`
jest.mock('@/services/server/problemService'); // Mock the service layer

describe('GET /api/problems', () => {
  it('should return 401 if unauthorized', async () => {
    // Mock supabase.auth.getSession to return no session
    jest.mock('@supabase/auth-helpers-nextjs', () => ({
      createServerComponentClient: jest.fn(() => ({
        auth: {
          getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
        },
      })),
      createRouteHandlerClient: jest.fn(() => ({
        auth: {
          getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
        },
      })),
    }));
    const { GET } = require('@/app/api/problems/route'); // Dynamically import after mocks

    const req = { url: 'http://localhost/api/problems', method: 'GET' } as any;
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('should return a list of problems if authorized', async () => {
    // Mock supabase.auth.getSession to return a session
    jest.mock('@supabase/auth-helpers-nextjs', () => ({
        createServerComponentClient: jest.fn(() => ({
            auth: {
                getSession: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'user-xyz' } } } })),
            },
        })),
        createRouteHandlerClient: jest.fn(() => ({
            auth: {
                getSession: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'user-xyz' } } } })),
            },
        })),
    }));

    const mockProblems = [{ id: '1', title: 'Problem 1' }] as Problem[];
    (problemService.getProblems as jest.Mock).mockResolvedValue(mockProblems);

    const { GET } = require('@/app/api/problems/route');
    const req = { url: 'http://localhost/api/problems', method: 'GET' } as any;
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mockProblems);
  });
});
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END
E2E Test
Generated typescript
// apps/web/tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow a user to sign in with Google', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in with Google' }).click();

    // Mock Google OAuth flow (in a real scenario, you'd handle external auth provider)
    // For Playwright, often this involves mocking network requests or stubbing auth.
    // Assuming successful redirect to dashboard after mock auth
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1')).toHaveText(/Welcome, .*!/); // Example text on dashboard
    await expect(page.getByRole('link', { name: 'Le Mie App' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Profilo' })).toBeVisible();
  });

  test('should allow a logged in user to logout', async ({ page }) => {
    // Pre-condition: user is logged in (e.g., using a state fixture or direct API login)
    await page.goto('/dashboard');
    // Assuming a way to ensure user is logged in for this test
    // For example, by setting local storage or cookies directly for test setup
    
    await page.getByRole('button', { name: 'User Menu' }).click(); // Click on profile icon/button
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    
    await page.waitForURL('/login'); // Should redirect to login page after logout
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
  });
});
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END
Coding Standards

These standards are MANDATORY for AI agents and human developers alike.

Critical Fullstack Rules

Type Sharing: Always define shared TypeScript types (e.g., for data models like Problem, User) in packages/shared/src/types and import them from there in both frontend (apps/web/src) and backend (apps/web/src/app/api and src/services/server). This ensures type consistency across the full stack.

API Calls: Never make direct HTTP calls from frontend components. Always use the problemService, appService, etc., from src/services/ to abstract API interactions. This centralizes error handling, authentication, and caching logic.

Environment Variables: Access environment variables strictly through process.env.NEXT_PUBLIC_... on the client and process.env.... on the server in Next.js, and ensure they are loaded via next.config.mjs or .env files. Never hardcode sensitive values.

Error Handling: All Next.js API Routes must use the standard error handling pattern (e.g., try-catch blocks returning NextResponse.json({ error: ... }, { status: ... })). Frontend components should gracefully handle API errors with user-friendly messages.

State Updates: Never mutate state directly in React components or Zustand stores. Always use the state setter functions (setState, dispatch, or Zustand's set function) to ensure immutability and proper re-renders.

Database Interactions (Server-side only): All direct database interactions must occur within Next.js API Routes or dedicated server-side services (e.g., src/services/server/problemService.ts). Never expose database client directly to frontend.

Supabase Client Initialization: Always initialize supabase client instances (e.g., createServerComponentClient, createRouteHandlerClient) within Server Components, Server Actions, or API Routes where cookies() can be accessed, or use the client-side createClient for browser-only operations. Do not mix.

Naming Conventions
Element	Frontend	Backend (Next.js API Routes/Services)	Example
Components	PascalCase	-	ProblemCard.tsx, AuthLayout.tsx
Hooks	use + PascalCase	-	useAuth.ts, useProblems.ts
API Routes	-	route.ts (within app/api/path/)	app/api/problems/[id]/route.ts
Services (Client)	camelCase	-	problemService.ts
Services (Server)	camelCase	camelCase (within services/server/)	problemService.ts (src/services/server/)
Database Tables	-	snake_case	public.problems, public.votes
Database Columns	-	snake_case	created_at, vote_count
UI Routes	kebab-case	-	/problems/propose, /profile/settings
Error Handling Strategy
Error Flow
Generated mermaid
sequenceDiagram
    actor U as User
    participant FE as Frontend
    participant NR as Next.js API Route
    participant BL as Business Logic Service
    participant DB as Supabase DB
    
    U->>FE: Triggers Action (e.g., Propose Problem)
    FE->>NR: API Call (e.g., POST /api/problems)
    NR->>BL: Call Business Logic (e.g., problemService.proposeProblem)
    alt Business Logic Error (Validation, DB Conflict)
        BL--x NR: CustomError (e.g., ProblemAlreadyExistsError)
        NR--x FE: Standardized API Error Response (400/409)
        FE->>U: Display User-Friendly Error Message (e.g., "Problem already exists.")
    else External API/DB Error
        BL->>DB: Database Operation (e.g., insert)
        DB--x BL: DB Error
        BL--x NR: InternalError (e.g., DatabaseError)
        NR->>FE: Standardized API Error Response (500)
        FE->>U: Display Generic Error Message (e.g., "An unexpected error occurred.")
        NR->>NR: Log Detailed Error to Sentry/Console
    else Success
        BL-->>NR: Success Data
        NR-->>FE: Success Data
        FE->>U: Update UI / Success Message
    end
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Mermaid
IGNORE_WHEN_COPYING_END
Error Response Format

All backend API routes will return a standardized JSON error format:

Generated typescript
interface ApiError {
  error: {
    code: string;           // A specific, internal error code (e.g., "VALIDATION_FAILED", "PROBLEM_NOT_FOUND", "DB_ERROR")
    message: string;        // A human-readable message, suitable for frontend display or logging
    details?: Record<string, any>; // Optional: specific details about the error (e.g., validation errors per field)
    timestamp: string;      // ISO 8601 timestamp of when the error occurred
    requestId: string;      // Optional: Unique ID for tracing the request across services
  };
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END
Frontend Error Handling

Frontend components will use React Query or custom hooks to handle API call errors, mapping them to user-friendly messages.

Generated typescript
// src/hooks/useProposeProblem.ts (Example hook for handling problem proposal)
import { useMutation } from '@tanstack/react-query';
import { problemService } from '@/services/problemService';

export function useProposeProblem() {
  return useMutation({
    mutationFn: ({ title, description, categoryId }: { title: string; description: string; categoryId: string }) =>
      problemService.proposeProblem(title, description, categoryId),
    onSuccess: (data) => {
      // Invalidate problems list query to refetch latest
      // queryClient.invalidateQueries(['problems']);
      alert('Problem proposed successfully!');
    },
    onError: (error: any) => {
      // Assume error.response.data is in ApiError format
      const errorMessage = error.response?.data?.error?.message || 'An unexpected error occurred.';
      alert(`Error: ${errorMessage}`);
      console.error('Propose problem failed:', error);
    },
  });
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END
Backend Error Handling

Next.js API Routes will use try-catch blocks. Internal service functions (problemService.ts, voteService.ts, etc.) will throw custom error classes or generic Error objects, which are then caught and transformed into the standardized ApiError format at the API route boundary before being sent to the client.

Generated typescript
// src/lib/errors.ts (Custom Error classes)
export class BaseApiError extends Error {
  constructor(public code: string, message: string, public details?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends BaseApiError {
  constructor(message: string = "Validation failed", details?: Record<string, any>) {
    super("VALIDATION_FAILED", message, details);
  }
}

export class ConflictError extends BaseApiError {
  constructor(message: string = "Resource conflict", details?: Record<string, any>) {
    super("CONFLICT_ERROR", message, details);
  }
}

// src/app/api/problems/route.ts (Simplified POST example with better error handling)
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { problemService } from '@/services/server/problemService';
import { ValidationError, ConflictError, BaseApiError } from '@/lib/errors'; // Import custom errors

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 });
  }

  try {
    const { title, description, category_id } = await request.json();

    const newProblem = await problemService.proposeProblem(session.user.id, { title, description, category_id });
    return NextResponse.json(newProblem, { status: 201 });

  } catch (error: any) {
    console.error('Error proposing problem:', error); // Log full error for internal debugging

    // Map specific errors to standardized API responses
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: { code: error.code, message: error.message, details: error.details, timestamp: new Date().toISOString() } }, { status: 400 });
    } else if (error instanceof ConflictError) {
      return NextResponse.json({ error: { code: error.code, message: error.message, details: error.details, timestamp: new Date().toISOString() } }, { status: 409 });
    } else if (error instanceof BaseApiError) {
      // Catch other custom API errors
      return NextResponse.json({ error: { code: error.code, message: error.message, details: error.details, timestamp: new Date().toISOString() } }, { status: 400 });
    } else {
      // Generic internal server error
      return NextResponse.json({ error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred.", timestamp: new Date().toISOString() } }, { status: 500 });
    }
  }
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END
Monitoring and Observability
Monitoring Stack

Frontend Monitoring: Vercel Analytics (for web vitals, page views, function invocations) + Sentry (for client-side JavaScript errors and performance monitoring).

Backend Monitoring: Vercel Analytics (for API Route invocations, cold starts, durations) + Sentry (for server-side errors, performance traces).

Error Tracking: Sentry (centralized error reporting and alerting for both frontend and backend).

Performance Monitoring: Vercel Analytics, Sentry Performance, and manual Lighthouse/Core Web Vitals checks.

Database Monitoring: Supabase Dashboard provides insights into query performance, database health, and resource usage.

Key Metrics

Frontend Metrics:

Core Web Vitals (Largest Contentful Paint, Cumulative Layout Shift, First Input Delay).

JavaScript errors (caught by Sentry).

API response times (from frontend perspective).

User interactions (clicks on vote, propose problem, etc.).

Page load times.

Backend Metrics:

Request rate (API Route invocations per second).

Error rate (percentage of failed API calls).

Response time (average, p95, p99 latencies).

Database query performance (via Supabase dashboard, slow query logs).

Serverless function cold starts.

Stripe webhook processing success/failure rates.

AI API call success/failure rates and latency.

Checklist Results Report

This section will be populated after executing the Architect Solution Validation Checklist against this document.

Next Steps

After completing the fullstack architecture:

Review with Product Owner: Share this comprehensive architecture document with Sarah, the Product Owner, to ensure it aligns with the overall project plan and backlog.

Begin Story Implementation: Once validated, stories can begin to be implemented by the Dev agent.

Set up Infrastructure: While Vercel and Supabase manage much of the infrastructure, there may be specific configurations (e.g., custom domains, environment variables, webhook setup) that need manual attention or can be automated by a DevOps agent if one is available.

Plan Rollback and Monitoring Procedures: Ensure the team understands the deployment and rollback strategies and that monitoring is fully configured before going live.

## Comprehensive Error Handling Framework

**Error Classification System:**

```typescript
export enum ErrorSeverity {
  LOW = 'low',           // Minor UX issues, non-critical features
  MEDIUM = 'medium',     // Feature degradation, user notification needed
  HIGH = 'high',         // Core functionality impacted, immediate attention
  CRITICAL = 'critical'  // System-wide failure, emergency response
}

export enum ErrorCategory {
  USER_INPUT = 'user_input',      // Validation, form errors
  AUTHENTICATION = 'auth',        // Login, permissions, tokens
  DATABASE = 'database',          // Connection, queries, migrations
  EXTERNAL_SERVICE = 'external',  // API calls, third-party services
  PAYMENT = 'payment',            // Stripe, transactions, billing
  AI_SERVICE = 'ai',              // OpenAI, Anthropic, rate limits
  SYSTEM = 'system',              // Server errors, infrastructure
  BUSINESS_LOGIC = 'business'     // Voting rules, problem states
}
```

**Error Handling Strategies by Category:**

**1. User Input Errors (Client-Side):**
```typescript
// Form validation with user-friendly messages
export const ValidationErrors = {
  PROBLEM_TITLE_TOO_SHORT: {
    code: 'TITLE_TOO_SHORT',
    message: 'Il titolo deve essere di almeno 10 caratteri',
    suggestion: 'Descrivi il problema in modo più dettagliato'
  },
  PROBLEM_TITLE_TOO_LONG: {
    code: 'TITLE_TOO_LONG',
    message: 'Il titolo non può superare i 100 caratteri',
    suggestion: 'Riassumi il problema in modo più conciso'
  },
  INVALID_EMAIL: {
    code: 'INVALID_EMAIL',
    message: 'Inserisci un indirizzo email valido',
    suggestion: 'Controlla che contenga @ e un dominio valido'
  }
};

// Client-side error handling
export function handleValidationError(error: ValidationError, field: string) {
  showFieldError(field, error.message, error.suggestion);
  trackError('validation', error.code, { field });
}
```

**2. Authentication Errors:**
```typescript
export const AuthErrors = {
  GOOGLE_OAUTH_FAILED: {
    severity: ErrorSeverity.HIGH,
    userMessage: 'Errore durante l\'accesso con Google',
    userAction: 'Riprova o contatta il supporto',
    recovery: async () => {
      // Clear auth state and retry
      await clearAuthState();
      return { canRetry: true, retryDelay: 2000 };
    }
  },
  TOKEN_EXPIRED: {
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Sessione scaduta',
    userAction: 'Effettua nuovamente l\'accesso',
    recovery: async () => {
      // Attempt token refresh
      return await refreshAuthToken();
    }
  },
  INSUFFICIENT_PERMISSIONS: {
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Non hai i permessi per questa azione',
    userAction: 'Contatta l\'amministratore se pensi sia un errore',
    recovery: async () => ({ canRetry: false })
  }
};
```

**3. Database Errors:**
```typescript
export const DatabaseErrors = {
  CONNECTION_FAILED: {
    severity: ErrorSeverity.CRITICAL,
    userMessage: 'Servizio temporaneamente non disponibile',
    userAction: 'Riprova tra qualche minuto',
    recovery: async () => {
      // Attempt connection retry with backoff
      return await retryWithBackoff(connectToDatabase, 3);
    }
  },
  CONSTRAINT_VIOLATION: {
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Operazione non consentita',
    userAction: 'Verifica i dati inseriti',
    recovery: async () => ({ canRetry: false })
  },
  QUERY_TIMEOUT: {
    severity: ErrorSeverity.HIGH,
    userMessage: 'Operazione in corso, attendi...',
    userAction: 'Non chiudere la pagina',
    recovery: async () => {
      // Implement query optimization or caching
      return { canRetry: true, retryDelay: 5000 };
    }
  }
};
```

**4. External Service Errors:**
```typescript
export const ExternalServiceErrors = {
  STRIPE_API_ERROR: {
    severity: ErrorSeverity.HIGH,
    userMessage: 'Errore nel processare il pagamento',
    userAction: 'Controlla i dati della carta e riprova',
    recovery: async (context: PaymentContext) => {
      // Log for admin review, use fallback payment method
      await logPaymentError(context);
      return { canRetry: true, fallbackAvailable: true };
    }
  },
  EMAIL_SERVICE_DOWN: {
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Conferma inviata, ma email di notifica in ritardo',
    userAction: 'Controlla la tua email tra qualche minuto',
    recovery: async () => {
      // Queue email for later delivery
      return await queueEmailForRetry();
    }
  },
  AI_SERVICE_RATE_LIMITED: {
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Troppe richieste, usa un template predefinito',
    userAction: 'Prova con un design preimpostato',
    recovery: async () => {
      // Switch to template-based generation
      return { canRetry: false, fallbackAvailable: true };
    }
  }
};
```

**Global Error Handler:**
```typescript
// Global error handling middleware
export class GlobalErrorHandler {
  static async handleError(error: Error, context: ErrorContext): Promise<ErrorResponse> {
    const errorId = generateErrorId();
    
    // Log error with context
    await this.logError(error, context, errorId);
    
    // Classify error
    const classification = this.classifyError(error);
    
    // Apply recovery strategy
    const recovery = await this.attemptRecovery(error, classification);
    
    // Notify monitoring systems
    await this.notifyMonitoring(error, classification, errorId);
    
    // Generate user-friendly response
    return this.generateUserResponse(error, classification, recovery, errorId);
  }
  
  private static async notifyMonitoring(error: Error, classification: ErrorClassification, errorId: string) {
    // Send to Sentry for error tracking
    Sentry.captureException(error, {
      tags: {
        severity: classification.severity,
        category: classification.category,
        errorId
      }
    });
    
    // Alert team for critical errors
    if (classification.severity === ErrorSeverity.CRITICAL) {
      await this.alertTeam(error, errorId);
    }
  }
}
```

**Error Recovery Patterns:**

```typescript
// Retry with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Circuit breaker pattern
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold = 5;
  private readonly recoveryTimeout = 60000; // 1 minute
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open');
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private isOpen(): boolean {
    return this.failures >= this.failureThreshold &&
           Date.now() - this.lastFailureTime < this.recoveryTimeout;
  }
}
```

**Error Monitoring & Alerting:**

```typescript
// Error analytics and monitoring
export class ErrorMonitoring {
  static async trackError(error: Error, context: ErrorContext) {
    // Send to analytics
    analytics.track('error_occurred', {
      errorType: error.constructor.name,
      severity: context.severity,
      userId: context.userId,
      feature: context.feature,
      timestamp: new Date().toISOString()
    });
    
    // Update error rate metrics
    await this.updateErrorMetrics(error, context);
  }
  
  static async checkErrorThresholds() {
    const errorRate = await this.getErrorRate('1h');
    
    if (errorRate > 0.05) { // 5% error rate
      await this.alertTeam('High error rate detected', {
        rate: errorRate,
        threshold: 0.05
      });
    }
  }
}
```

**User Experience During Errors:**

```typescript
// Error UI components
export const ErrorDisplay = {
  showRetryableError: (message: string, onRetry: () => void) => {
    toast.error(message, {
      action: {
        label: 'Riprova',
        onClick: onRetry
      }
    });
  },
  
  showFallbackOption: (message: string, fallbackAction: () => void) => {
    toast.warning(message, {
      action: {
        label: 'Usa alternativa',
        onClick: fallbackAction
      }
    });
  },
  
  showCriticalError: (message: string, errorId: string) => {
    modal.show({
      title: 'Errore del sistema',
      message: `${message}\n\nID Errore: ${errorId}`,
      actions: [
        { label: 'Ricarica pagina', onClick: () => window.location.reload() },
        { label: 'Contatta supporto', onClick: () => contactSupport(errorId) }
      ]
    });
  }
};
```

Story Manager Handoff

"Ciao! Ho completato la documentazione dell'architettura fullstack di WikiGaiaLab. Utilizza questo documento come riferimento principale per creare le storie, assicurandoti che ogni storia sia coerente con le scelte tecnologiche, i pattern di integrazione e gli standard di codifica definiti. Fai particolare attenzione alla sequenza logica delle storie per costruire l'applicazione in modo incrementale e mantenere l'integrità del sistema."

Developer Handoff

"Ciao! Ho completato l'architettura fullstack di WikiGaiaLab. Questo documento è la tua fonte di verità. Consulta le sezioni 'Coding Standards' e 'Test Strategy' per le linee guida di implementazione. Tutti i file condivisi (packages/shared/types) devono essere riutilizzati. Se hai dubbi sull'integrazione tra frontend e backend o con Supabase/Stripe/AI API, consulta le sezioni 'API Specification' e 'Components'."
==================== END: docs/architecture.md ====================

The comprehensive draft of the WikiGaiaLab Fullstack Architecture Document (architecture.md) is now complete. I've integrated details from your PRD and the UI/UX Specification to create a unified blueprint covering all key aspects.

Please take your time to review this document thoroughly. This is a critical artifact, and your feedback is essential to ensure it accurately reflects your vision and technical requirements.

Once you've reviewed it, we can:

Discuss any specific sections or suggest refinements.

Proceed to the Product Owner (Sarah) for a full validation using the po-master-checklist. This is the recommended next step to ensure all documents are consistent and ready for development.

Exit Architect persona and return to the BMad Orchestrator.

Ask me a question about the architecture or my role.