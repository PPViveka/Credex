# Credex AI Spend Audit — Full-Stack Optimization Platform

**Credex AI Spend Audit** is a high-converting, finance-literate lead-generation platform designed for startups to instantly evaluate software seat allocations, remove licensing redundancies, and unlock immediate discounts through pre-paid surplus AI developer credits. By inputting manual tool counts and metadata, startups receive instant, number-backed CFO advisory breakdowns, personalized executive summaries, and secure redaction toggles for viral public sharing.

---

## 🚀 Live Demonstration & Media

- **Staging Instance**: [https://credex-audit.vercel.app](https://credex-audit.vercel.app)
- **Product Overview Walkthrough**: [walkthrough.md](file:///C:/Users/visha/.gemini/antigravity-ide/brain/d616ec11-e142-4b23-84c5-bda2782699e1/walkthrough.md)

### Product Interface Previews
- **Dashboard Savings Hero**: Displays monthly/annual savings figures with linear comparison cost gauges.
- **Itemized CFO Recommendations**: Tool-by-tool cards detailing seat waste and IDE overlaps.
- **Privacy-First Redacted View**: Toggleable redact mode stripping all lead email/company details.

---

## 🛠️ Installation & Developer Operations

This project is built using **Next.js 16 (App Router)**, **TypeScript**, and **Vanilla CSS Modules**, running on Node.js.

### 1. Setup Local Environment Variables
Create a `.env.local` file in the project root. (See [.env.local.example](file:///c:/viveka/credex%20assignment/.env.local.example) for detailed templates):
```bash
# Supabase Database Keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic Claude API (For fractional CFO summaries)
ANTHROPIC_API_KEY=sk-ant-...

# Resend Transactional Email (For dispatching audit links)
RESEND_API_KEY=re_...
```
*Note: The application automatically runs in a **graceful mock fallback mode** if these keys are missing, saving audits locally to `lib/mockDb.json` and printing transactional HTML emails to your terminal logs.*

### 2. Run the Development Server
Install dependencies and launch the Turbopack compiler:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Execute the Automated Test Suite
Run our comprehensive deterministic billing tests using Vitest:
```bash
npm run test
```

### 4. Compile Production Builds
Ensure zero compile errors or TypeScript warnings exist:
```bash
npm run build
npm run lint
```

---

## 🧠 5 Key Architectural Decisions & Engineering Trade-Offs

### 1. Full-Stack Security Separation (Next.js App Router vs. Client-Only)
- **Decision**: We executed all database writes, transaction email triggers, and LLM text generation strictly inside server-side API routes (`/api/*`) and Server Components, passing raw client inputs as structured payloads.
- **Trade-Off**: This approach adds network latency between the frontend form and backend APIs. However, it is an absolute necessity to prevent exposing sensitive credentials (`ANTHROPIC_API_KEY`, `RESEND_API_KEY`) to the user's browser, securing the platform from reverse-engineering or key theft.

### 2. Mathematical Determinism vs. LLM Calculations
- **Decision**: All financial audit rules, seat optimizations, plan downgrades, and arbitrage calculations are hardcoded in pure TypeScript (`lib/auditEngine.ts`). We restricted the LLM (Claude) strictly to drafting personalized prose summaries.
- **Trade-Off**: Writing deterministic algorithms requires mapping edge cases and pricing tiers manually. However, this eliminates LLM hallucinations, ensuring audit results are mathematically precise, finance-compliant, and 100% reproducible across tests.

### 3. Vanilla CSS Modules vs. Tailwind Utility Classes
- **Decision**: We rejected Tailwind CSS and styled the platform using native CSS Custom Properties (variables) and localized CSS Modules (`*.module.css`).
- **Trade-Off**: Writing raw CSS files takes longer than utility classes. However, it keeps JSX components extremely clean, prevents unoptimized stylesheet bloat, and optimizes rendering performance, helping us secure a Lighthouse Performance score $\ge 85$.

### 4. Dual-State Storage Layer with In-Memory JSON Fallback
- **Decision**: We implemented a database layer in `lib/db.ts` that dynamically detects the presence of Supabase keys. If present, it writes to live PostgreSQL. If missing, it writes to a localized `lib/mockDb.json` file inside the repository.
- **Trade-Off**: Writing localized file fallback code requires managing file system operations (`fs`) on serverless routes. However, it ensures the application is highly portable, running out-of-the-box for grading or offline testing, and preserving generated audits even after local server restarts.

### 5. Interactive Public Redactor Toggle for Viral Social Loops
- **Decision**: Instead of generating two separate routing paths for private and public audits, we built a single dynamic route `/audit/[id]` with a query-parameter detector (`?view=public`) and an interactive toggle bar.
- **Trade-Off**: This requires managing a unified React client state that handles conditional text rendering. However, it lets the founder instantly preview their shareable link in real-time, verifying that their name, email, and company are fully stripped before publishing on Slack or Twitter, drastically increasing user trust and viral loops.
