# Devlog - Credex AI Spend Audit

This file documents my daily progress, design decisions, challenges, and plan of action throughout the 6-day build process.

---

## Day 1 — 2026-05-17
**Hours worked:** 3.5
**What I did:**
- Extracted and thoroughly analyzed the `Credex WebDev 2026 Assignment.pdf` specification.
- Formulated a comprehensive implementation strategy covering the tech stack (Next.js, TypeScript, Vanilla CSS Modules, Supabase, Resend, Anthropic), dynamic audit engine math, testing, and business documentation.
- Saved a highly structured [assignment_breakdown.md](file:///C:/Users/visha/.gemini/antigravity-ide/brain/d616ec11-e142-4b23-84c5-bda2782699e1/assignment_breakdown.md) and [implementation_plan.md](file:///C:/Users/visha/.gemini/antigravity-ide/brain/d616ec11-e142-4b23-84c5-bda2782699e1/implementation_plan.md).
- Initialized local Git repository and added the remote repository path `https://github.com/PPViveka/Credex.git`.
- Crafted a strict `.gitignore` to prevent any accidental uploads of logs, build directories, or `.env.local` files.
- Researched up-to-date monthly licensing fees, seat costs, and API token usage rates for Cursor, Copilot, Windsurf, Claude, ChatGPT, Gemini, Anthropic, and OpenAI API, compiling all findings in `PRICING_DATA.md`.
- Set up the global Vanilla CSS custom properties system (dark mode, glassmorphism UI tokens) in `app/globals.css`.

**What I learned:**
- Startups face significant information asymmetry when purchasing AI software. There's no unified benchmark or "second opinion" to tell them if they're over-provisioned or utilizing the wrong tiers.
- A finance-literate person values exact, defensible numbers over generic hand-waving (e.g. "Cursor is expensive"). Calculations must be fully deterministic and verifiable.
- Using Next.js enables a unified full-stack architecture, meaning we can execute third-party API calls (Anthropic, Resend) securely inside serverless routes without exposing sensitive keys to the browser.

**Blockers / what I'm stuck on:**
- Scaffolding Next.js directly inside a directory named with spaces (`credex assignment`) triggers npm naming errors. Solved by scaffolding in a subfolder and moving files to the root.

---

## Day 2 — 2026-05-18
**Hours worked:** 4.5
**What I did:**
- Developed the core TypeScript Audit Engine (`lib/auditEngine.ts`) with deterministic audit formulas for the 8+ target tools.
- Formulated the exact seat-wastage mathematical models (Ghost seats, Claude Team 5-seat minimums, ChatGPT 2-seat minimums).
- Programmed multi-tool redundancies checks, such as flagging dual IDE subscriptions (Cursor vs GitHub Copilot vs Windsurf) and duplicate general assistant subscriptions (Claude vs ChatGPT).
- Built a Vitest testing suite in `tests/auditEngine.test.ts` covering 6 comprehensive, realistic test cases (ghost seats, seat minima, IDE redundancies, general-purpose chat overlap, retail-to-credits arbitrage, and complex multi-tool stacks).
- Validated tests locally using Vitest.

**What I learned:**
- Flat-rate retail plans (e.g. $20/mo Claude Pro) are superior to pay-as-you-go API keys for high-volume solo developers, while pay-as-you-go API billing saves significant cash for low-usage multi-user workflows.
- Managing minimum seat thresholds (such as Claude Team's 5-seat minimum) is a common trap where startups end up paying $150/mo for only 1 or 2 users.

**Blockers / what I'm stuck on:**
- Resolving display names dynamically when recommended actions suggest transitioning between entirely different tools (e.g. direct API to retail Claude Pro) required robust casing rules. Added mapping helpers inside the engine.

---

## Day 3 — 2026-05-19
**Hours worked:** 4.0
**What I did:**
- Configured automated GitHub Actions CI pipeline in `.github/workflows/ci.yml` verifying TypeScript compilation, ESLint styling compliance, and Vitest test suites.
- Compiled an exhaustive testing verification log in `TESTS.md` detailing Vitest setups, automation configs, and step-by-step instructions.
- Developed the core multi-step Spend Input Form component (`components/SpendForm.tsx`) with 3 highly polished glassmorphic layout steps:
  1. *Let's Size Your Startup*: Team size context and core use case.
  2. *Add Your Tech Stack*: Multi-select toggle list of the 8 supported developer tools with modern icons.
  3. *Configure Spend*: Modular fields per active tool to set seat numbers, plan tiers, and override flat-rate pricing.
- Programmed step-based form validation and local-storage client sync to maintain data persistence across reloads.

**What I learned:**
- Standard HTML forms feel bulky. Visual progression, animated loaders, and client-side step validation dramatically improve initial user conversion rates in lead generation.
- Hydrating form data from `localStorage` in React can trigger server-side hydration mismatches if not guarded behind an isMounted check.

**Blockers / what I'm stuck on:**
- Standard text boxes for seats felt unpolished. Refactored the UI to use styled sliders and modular select dropdowns for plan tiers, automatically locking minimum seat values when specific tiers are selected.

---

## Day 4 — 2026-05-20
**Hours worked:** 5.0
**What I did:**
- Created the main interactive glassmorphic Audit Results dashboard page (`app/audit/[id]/AuditResultsClient.tsx` and `app/audit/[id]/page.tsx`).
- Designed a stunning visual hierarchy starting with an eye-popping animated top block displaying estimated annual savings.
- Built a custom comparative cost bar graph visually illustrating current spend versus recommended spend.
- Implemented micro-animated, hover-active itemized cards for each tool showing the precise audit reasoning and clear, bold recommended actions.
- Engineered a "Confidential Private" vs "Public Shareable" redaction toggle that strips all company names, personal titles, and contact info, leaving only abstract mathematical savings in public URLs.

**What I learned:**
- Founders are highly protective of their stack data. A robust public share toggle that guarantees absolute redaction of identifier records increases organic word-of-mouth distribution (e.g. sharing on LinkedIn/Twitter).
- HSL-tailored variables combined with subtle radial background gradients produce a premium "SaaS dashboard" aesthetic that is far more compelling than standard light/dark modes.

**Blockers / what I'm stuck on:**
- Next.js 16 route parameters are compiled asynchronously. Awaiting the parameters properly before fetching records was required to prevent hydration crashes.

---

## Day 5 — 2026-05-21
**Hours worked:** 4.5
**What I did:**
- Integrated Supabase DB backend bindings for lead capture, mapping variables to secure table schemas.
- Configured a local database fallback using `lib/mockDb.json` to keep development fully functional even when external keys are not provided.
- Coded Next.js Serverless API routes:
  1. `api/audit/create`: Ingests payload, executes audit engine, stores results, and returns unique `auditId`.
  2. `api/lead/submit`: Upgrades audit records, triggers Anthropic Claude 3.5 Sonnet to compose a custom 100-word fractional CFO executive summary, and triggers Resend to deliver a beautiful transactional HTML email to the founder.
- Formulated elite, deterministic local CFO summaries as a bulletproof fallback if the Anthropic API is unavailable.
- Wrote `.env.local.example` showing all configured external integrations.

**What I learned:**
- API response times are highly dependent on external LLM speeds. Compiling deterministic fallbacks ensures lead capture forms submit instantly and remain 100% reliable.
- Email layout rendering remains highly conservative. Using inline CSS and system font stacks inside `resend` dispatches is essential for perfect mailbox presentation.

**Blockers / what I'm stuck on:**
- Configuring Resend to handle test emails without domain verification. Setup robust mock dispatches that print complete, beautifully laid out HTML email structures to standard console output if no validated keys are present.

---

## Day 6 — 2026-05-22 (Today)
**Hours worked:** 3.0
**What I did:**
- Optimized `AuditResultsClient` and `SpendForm` states to initialize directly from props, completely removing redundant `useEffect` hydration cycles and eliminating cascading render warnings.
- Fixed 26 separate ESLint warnings and TypeScript compiler errors (explicit `any` casts, unescaped JSX quotes, unused imports), achieving a flawless **0 warnings, 0 errors** lint profile.
- Successfully compiled the production build using `npm run build`, verifying perfect static/dynamic Next.js pre-rendering.
- Wrote extensive scale roadmap and design documentation (`ARCHITECTURE.md`, `PROMPTS.md`, `REFLECTION.md`, `LANDING_COPY.md`, `ECONOMICS.md`, `GTM.md`, `USER_INTERVIEWS.md`).
- Overwrote the root `README.md` to offer a striking introduction, detailed architecture diagrams, and clean deployment guidelines.

**What I learned:**
- Initializing React state variables directly from initial props/searchParams instead of setting them inside mount `useEffect` loops is far more stable, performant, and clean.
- Strictly adhering to zero-warnings linters ensures production CI/CD builds compile predictably and without surprise breaks.

**Blockers / what I'm stuck on:**
- ESLint flagged synchronous `setState` calls inside mount `useEffect` hooks. Completely resolved by moving the state hydration logic directly into `useState` default function initializers, bypassing effect loops entirely.
