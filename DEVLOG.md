# Devlog - Credex AI Spend Audit

This file documents my daily progress, design decisions, challenges, and plan of action throughout the 7-day build process.

---

## Day 1 — 2026-05-22
**Hours worked:** 2
**What I did:**
- Extracted and thoroughly analyzed the `Credex WebDev 2026 Assignment.pdf` specification.
- Formulated a comprehensive implementation strategy covering the tech stack (Next.js, TypeScript, Vanilla CSS Modules, Supabase, Resend, Anthropic), dynamic audit engine math, testing, and business documentation.
- Saved a highly structured [assignment_breakdown.md](file:///C:/Users/visha/.gemini/antigravity-ide/brain/d616ec11-e142-4b23-84c5-bda2782699e1/assignment_breakdown.md) and [implementation_plan.md](file:///C:/Users/visha/.gemini/antigravity-ide/brain/d616ec11-e142-4b23-84c5-bda2782699e1/implementation_plan.md).
- Initialized a local Git repository and added the remote repository path `https://github.com/PPViveka/Credex.git`.
- Crafted a strict `.gitignore` to prevent any accidental uploads of logs, build directories, or `.env.local` files.
- Researched up-to-date monthly licensing fees, seat costs, and API token usage rates for Cursor, Copilot, Windsurf, Claude, ChatGPT, Gemini, Anthropic, and OpenAI API, compiling all findings and source links in `PRICING_DATA.md`.
- Scaffolding the Next.js App Router typescript project inside the `credex-spend-audit` directory to bypass npm naming restrictions caused by workspace spacing, which we will pull up to the repository root.

**What I learned:**
- Startups face significant information asymmetry when purchasing AI software. There's no unified benchmark or "second opinion" to tell them if they're over-provisioned or utilizing the wrong tiers.
- A finance-literate person values exact, defensible numbers over generic hand-waving (e.g. "Cursor is expensive"). Calculations must be fully deterministic and verifiable.
- Using Next.js enables a unified full-stack architecture, meaning we can execute third-party API calls (Anthropic, Resend) securely inside serverless routes without exposing sensitive keys to the browser.

**Blockers / what I'm stuck on:**
- Scaffolding Next.js directly inside a directory named with spaces (`credex assignment`) triggers npm naming errors. Solved by scaffolding in a subfolder and moving files to the root.

**Plan for tomorrow:**
- Move scaffolded Next.js files to the workspace root and verify compilation.
- Set up the global Vanilla CSS custom properties system (dark mode, glassmorphism UI tokens) in `app/globals.css`.
- Develop the core TypeScript Audit Engine (`lib/auditEngine.ts`) with deterministic audit formulas for the 8+ target tools.
- Write the input spend form and persist state using `localStorage`.
