# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project commands
- Install deps: pnpm install
- Dev (spawns everything you need): pnpm dev
  - Runs: next dev (Turbopack) + npx supabase start + react-email dev (port 3001) + stripe listen --forward-to localhost:3000/api/webhooks/stripe
  - Ensure Supabase CLI and Stripe CLI are installed and authenticated
- Build: pnpm build
- Start (after build): pnpm start
- Lint: pnpm lint
- DB migrate (Drizzle “push” to POSTGRES_URL): pnpm migrate
- Regenerate OpenAPI types: pnpm generate
- Tests: none configured (no test script or config present)

Environment and configuration
- Env schema is enforced in lib/env.ts via @t3-oss/env-nextjs; the app will fail fast if required vars are missing
- Key groups you’ll typically need set before pnpm dev:
  - Supabase: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, POSTGRES_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_AUTH_HOOK_SECRET
  - Stripe: STRIPE_SECRET_KEY, STRIPE_*_PRODUCT_ID, STRIPE_CREDITS_METER_*, STRIPE_WEBHOOK_SECRET
  - Upstash (rate limit): UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
  - AI models/gateway: OPENAI_API_KEY, XAI_API_KEY, HUME_API_KEY, LMNT_API_KEY, LUMA_API_KEY, BF_API_KEY, AI_GATEWAY_API_KEY
  - Client analytics: NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST

High-level architecture
- Next.js App Router with route groups
  - app/(unauthenticated): Marketing pages (home, pricing, legal)
  - app/(authenticated): Gated UI; layout checks auth and subscription, provides ReactFlow, PostHog, and AI Gateway context
  - middleware.ts uses Supabase SSR to refresh sessions and redirects unauthenticated users away from non-public routes; excludes api/webhooks/*
- Data layer and schema
  - Drizzle ORM over Postgres (lib/database.ts), schema in schema.ts
    - project: stores canvas content (nodes/edges) + model choices, userId, etc.
    - profile: Stripe/customer/subscription linkage and onboarding flag
  - Drizzle migrations via drizzle-kit push (pnpm migrate)
- Auth, storage, email
  - Supabase auth (lib/supabase/server.ts, lib/supabase/middleware.ts); OAuth exchange in app/auth/oauth, email OTP confirm in app/auth/confirm
  - File storage via Supabase buckets (lib/upload.ts); images/audio/video written to files bucket and made public
  - react-email dev server (emails/*) is started by pnpm dev; production email sending via Resend, triggered by a Supabase auth webhook (app/api/webhooks/resend)
- Billing and usage
  - Stripe credit metering: lib/stripe.ts converts action costs to usage; getCredits server action previews upcoming invoice to compute remaining credits
  - Stripe webhook (app/api/webhooks/stripe) updates profile with customer/subscription/product changes
  - (authenticated)/layout.tsx maps Stripe product IDs to plan (hobby/pro) and gates features
- AI models and gateway
  - Vercel AI Gateway client in lib/gateway.tsx; providers/gateway loads available text models server-side and exposes them to the client via GatewayProviderClient
  - Model registries encode pricing and defaults:
    - lib/models/vision.ts (text+vision)
    - lib/models/image/* (image gen/edit)
    - lib/models/speech.ts (TTS)
    - lib/models/video/* (video gen)
  - Provider registry and icons in lib/providers.ts and lib/icons.tsx
- Canvas runtime (visual workflows)
  - ReactFlow-based canvas (components/canvas.tsx) with autosave to the project record via server actions (app/actions/project/*)
  - Node types under components/nodes (text, image, audio, video, code, file, tweet) share a NodeLayout wrapper, and most have Primitive vs Transform variants
  - Server actions back the nodes:
    - Image: app/actions/image/{create,edit}.ts (OpenAI/Vercel AI/Bedrock)
    - Video: app/actions/video/create.ts (Runway, Luma, Minimax, Replicate)
    - Speech: app/actions/speech/{create,transcribe}.ts (OpenAI, LMNT, Hume)
    - Tweet: app/actions/tweet/get.ts
  - Connection rules and graph helpers in lib/xyflow.ts and Canvas (prevents invalid links/cycles; aggregates content from nodes)
  - Drag-and-drop uploads create nodes via providers/node-dropzone.tsx; toolbar adds nodes centered in the viewport
- APIs and rate limiting
  - app/api/chat and app/api/code stream text via Vercel AI SDK and wrap models with reasoning middleware; costs are metered to Stripe
  - Upstash sliding window rate limiting applied per-IP in production (lib/rate-limit.ts)
- Analytics
  - PostHog client and SSR/CSR providers in lib/posthog.ts and providers/posthog-provider.tsx; Next rewrites configured in next.config.ts for ingestion endpoints
- Release automation
  - GitHub Actions release.yml runs npx auto shipit on main; scripts/skip-ci.js lets Vercel builds skip on [skip ci]

Operational notes
- Supabase: config at supabase/config.toml; pnpm dev calls npx supabase start locally
- Saving: Canvas debounces writes and updates project.content; server validates current user owns the project
- Env validation: Missing/invalid env vars are zod-validated and will fail fast—check lib/env.ts if pnpm dev crashes early
