# FitJourney Game - Modern Tech Stack Guide

## Architecture Overview

**Pre-Generated Content Strategy**: All knowledge base, quiz questions and avatar images are generated offline using AI tools, reviewed by agents/humans, and stored in database. No runtime AI generation to minimize costs and latency. Users primarily interact online with offline fallback for content viewing.

## Frontend Stack

### Core Framework
- **SvelteKit 5** with App Router
  - Built-in PWA support
  - Server-side rendering for SEO (each quiz as discoverable page)
  - Image optimization for avatar assets
  - Built-in API routes for backend logic

### UI/Styling
- **Tailwind CSS** for rapid UI development
- **Framer Motion** for avatar animations and transitions
- **Radix UI** or **shadcn/ui** for accessible components
- **Lucide React** for consistent iconography

### PWA Features
- **next-pwa** for service worker and manifest generation
- **Web Push API** for notifications (no third-party service needed initially)
- **Cache API** for offline content viewing fallback

### State Management
- **Zustand** (lightweight, TypeScript-first)
- **React Query/TanStack Query** for server state and caching
- **LocalStorage** for offline progress persistence and sync when online

## Backend Stack

### Database
- **PostgreSQL** on **Supabase** (free tier: 500MB, 2 concurrent connections)
  - Built-in auth, real-time subscriptions
  - PostgREST API auto-generation
  - Row Level Security for user data
  - Built-in file storage for avatar images

### ORM/Database Layer
- **Drizzle ORM** (lightweight, TypeScript-first, works with Supabase)

### Authentication
- **Supabase Auth** (built-in social logins, email auth)

### File Storage
- **Supabase Storage** for avatar images (1GB free)

## Deployment & Infrastructure

### Hosting
- **Vercel** (SvelteKit optimized, generous free tier)
  - Automatic deployments from Git
  - Built-in analytics
  - Edge functions for global performance

### Domain & CDN
- **Vercel domains** (free .vercel.app subdomain initially)
- Static files (Images etc) to be stored on Vercel also. 

### Monitoring
- **Vercel Analytics** (free tier)

## Key Libraries & Tools

### Core Utilities
```typescript
// Package.json key dependencies
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.0.0",
  "framer-motion": "^10.0.0",
  "zustand": "^4.0.0",
  "@tanstack/react-query": "^5.0.0",
  "drizzle-orm": "^0.29.0",
  "@supabase/supabase-js": "^2.0.0",
  "next-pwa": "^5.6.0"
}
```

### Social Sharing
- **next-share** for social platform integrations
- **html2canvas** for screenshot generation of results
- **Open Graph meta tags** via SvelteKit built-in support

### Form Handling
- **React Hook Form** with **Zod** validation
- **@hookform/resolvers** for Zod integration

### Payments (Phase 2)
- **Stripe** (simple pricing, good TypeScript support)
- **@stripe/stripe-js** and **@stripe/react-stripe-js**

### Testing
- **Vitest** (faster than Jest, built-in TypeScript support)
- **Playwright** (end-to-end testing when needed)

## Development Workflow

### Initial Setup Commands
```bash
# Create SvelteKit project with TypeScript
npx create-next-app@latest fitness-game --typescript --tailwind --app

# Add essential dependencies
npm install @supabase/supabase-js drizzle-orm zustand @tanstack/react-query framer-motion

# Add PWA support
npm install next-pwa

# Add UI components
npm install @radix-ui/react-* lucide-react

# Development tools
npm install -D drizzle-kit @types/node
```

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3090
```

## Content Generation Pipeline

### Quiz Questions
1. **AI Generation**: Use Cursor/ChatGPT to generate questions,  in structured JSON
2. **AI Review**: Use Claude/GPT to review for accuracy and difficulty
3. **Human Review**: Final expert validation
4. **Database Import**: Bulk insert via Drizzle/SQL scripts

### Avatar Generation
1. **AI Image Generation**: DALL-E/Midjourney for avatar variations
2. **Batch Processing**: Create all state combinations offline
3. **Optimization**: Compress/resize for web delivery
4. **CDN Upload**: Store on Supabase/Cloudinary

## Performance Optimizations

### Image Handling
- **SvelteKit Image component** for automatic optimization
- **WebP format** with JPEG fallbacks
- **Responsive images** for different screen sizes
- **Lazy loading** for avatar assets

### Caching Strategy
- **Static Generation** for quiz pages (ISR for updates)
- **SWR/React Query** for user-specific data
- **Service Worker** for offline content viewing fallback
- **CDN caching** for static assets

### Bundle Optimization
- **Dynamic imports** for heavy components
- **Tree shaking** with proper import patterns
- **Code splitting** by route/feature

## Scaling Considerations

### Database Scaling
- **Read replicas** when traffic grows
- **Connection pooling** via Supabase/PgBouncer
- **Query optimization** with proper indexing

### API Rate Limiting
- **Upstash Redis** for rate limiting (free tier available)
- **SvelteKit middleware** for request throttling

### Global Performance
- **Vercel Edge Functions** for global API responses
- **Supabase Edge** for database proximity
- **Multi-region CDN** via Cloudflare

## Cost Breakdown (Monthly)

### Free Tier Limits
- **Vercel**: 100GB bandwidth, unlimited static sites
- **Supabase**: 500MB database, 1GB storage, 2GB bandwidth
- **Cloudflare**: Unlimited bandwidth (on free plan)

### Estimated Costs at Scale
- **10K MAU**: ~$20-50/month (primarily database and storage)
- **100K MAU**: ~$200-500/month (need paid tiers)
- **Stripe fees**: 2.9% + 30¢ per transaction

## Security Considerations

### Data Protection
- **Row Level Security** in Supabase for user data isolation
- **Input validation** with Zod schemas
- **CSRF protection** via SvelteKit built-in features
- **Rate limiting** on quiz attempts and sharing

### Content Security
- **Image validation** for user-uploaded content (if added later)
- **XSS prevention** via proper escaping
- **API route protection** with authentication middleware

## Deployment Strategy

### CI/CD Pipeline
1. **GitHub integration** with Vercel for auto-deploys
2. **Preview deployments** for testing
3. **Database migrations** via Drizzle Kit
4. **Environment promotion** (dev → staging → prod)

### Launch Checklist
- [ ] SSL certificate (automatic via Vercel)
- [ ] Custom domain setup
- [ ] Analytics integration
- [ ] Error monitoring
- [ ] Performance monitoring
- [ ] Social media meta tags
- [ ] Sitemap generation

This stack prioritizes speed of development while maintaining scalability and keeping costs minimal during the MVP phase. The pre-generated content strategy eliminates expensive runtime AI costs while the modern tooling ensures rapid iteration capability.