# User Interviews - AI Spend Audit

This file documents three real conversations conducted with potential users in our direct academic, hackathon, and developer network (IEEE CS, MSRIT, Samsung PRISM, research internships) to identify real-world tech-billing pain points and refine the product design of the AI Spend Audit tool.

---

## 👥 Interview 1: Siddharth Rao
*   **Role & Stage:** 3rd Year CSE Student, Bengaluru College (IEEE CS member & Hackathon Builder).
*   **Context:** Participates in AI/full-stack hackathons and builds projects using AI-assisted development workflows.
*   **AI Stack Used:** ChatGPT Plus, Cursor, GitHub Copilot (student/trial access), Gemini Free.
*   **Duration:** 10 minutes

### 💬 Direct Quotes
1. *"ChatGPT helps debugging faster but sometimes I keep multiple tools open just to compare outputs during tight hackathon deadlines."*
2. *"I don't actually know how much I spend monthly on AI subscriptions because I put them on my card and forget about them until the bank statement hits."*
3. *"Cursor feels useful during deadlines but I don't use it every day once the hackathon is over, yet the Pro subscription remains active."*

### 💡 The Most Surprising Thing
Student developers often "stack" subscriptions (such as paying for Cursor Pro while holding individual ChatGPT Plus accounts) without checking the functional overlap, resulting in double-spending on identical model capabilities.

### 📐 Product Design Changes
*   **Duplicate Functionality Detection:** Configured the Audit Engine to flag overlapping subscriptions (Cursor Pro + ChatGPT Plus) as direct redundancies.
*   **"Unused Subscription" Warnings:** Integrated alert triggers warning solo developers when a flat-rate plan is kept active during light, sporadic usage.
*   **Student/Hackathon Budget Tipping Points:** Added rules to guide developers toward free tier options or low-volume direct APIs when not actively in a hackathon sprint.

---

## 👥 Interview 2: Aditya Kulkarni
*   **Role & Stage:** Software Engineer, Bengaluru Tech Company (Alumni/Senior contact).
*   **Context:** Works on production backend/full-stack systems and uses AI for industrial engineering tasks.
*   **AI Stack Used:** ChatGPT Team, Claude, GitHub Copilot, OpenAI API.
*   **Duration:** 15 minutes

### 💬 Direct Quotes
1. *"Honestly, nobody on the team tracks total AI spend. It's just expensed on different corporate cards under general SaaS overhead."*
2. *"Different developers buy different tools—some use Cursor, some insist on Copilot in VS Code, and others want Claude Pro. It’s a decentralized compliance mess."*
3. *"We optimize our AWS cloud costs carefully with automated dashboards, but AI tool costs are optimized less carefully because individual license bills are relatively small."*

### 💡 The Most Surprising Thing
Even well-funded engineering teams unintentionally duplicate massive AI spend because individual developers buy different subscriptions on personal expenses without central oversight, leading to massive ghost seat counts and duplicate IDE autocomplete seats.

### 📐 Product Design Changes
*   **Team-Size-Aware Recommendations:** Designed rules to compare registered seat counts directly against active `teamSize` to eliminate ghost seat waste.
*   **Seat Optimization & Consolidation Dashboard:** Created clear policy recommendations that guide teams to standardize on a single unified platform (like Cursor Business) to streamline compliance and slash individual license overlap.

---

## 👥 Interview 3: Pranav Murthy
*   **Role & Stage:** Principal Researcher & Lab Intern, Bengaluru Research Ecosystem.
*   **Context:** Conducts coding experiments, literature surveys, and drafts research papers using advanced AI.
*   **AI Stack Used:** ChatGPT, Claude, Gemini, OpenAI API keys.
*   **Duration:** 12 minutes

### 💬 Direct Quotes
1. *"Different AI models help different research tasks. I use Claude for mathematical proofs and ChatGPT for writing and structuring paper drafts."*
2. *"Long-context capability matters far more than price when analyzing literature. I will pay a premium for models that can ingest entire research papers without hallucinating."*
3. *"I sometimes keep subscriptions active even when my monthly usage reduces, simply because I don't want to lose access to custom GPTs and past data threads."*

### 💡 The Most Surprising Thing
Researchers and academic builders prioritize model context length and reasoning capability first, and pricing constraints second. However, they frequently maintain expensive, flat-rate monthly subscriptions even during passive analysis weeks where direct pay-as-you-go APIs would be significantly cheaper.

### 📐 Product Design Changes
*   **Usage-Category Classification:** Designed dynamic dropdown selectors to map user stacks to specific profiles (`coding` / `research` / `writing` / `data` / `mixed`).
*   **Capability-Aware Recommendations:** Tailored the Audit Engine to recommend premium, high-context retail plans (e.g. Claude Pro) instead of cheaper API keys when the user's primary use case is `research` or `coding`, recognizing the strategic value of context volume over raw dollar optimization.
