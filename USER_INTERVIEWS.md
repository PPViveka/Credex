# User Interviews - AI Spend Audit

This file documents three real conversations conducted with potential users (founders, engineering managers, and solo developers) to identify real-world paint points and refine the product design of the AI Spend Audit tool.

---

## 👥 Interview 1: Siddharth S.
*   **Role & Stage:** Co-founder & CTO of a pre-seed SaaS startup (5 developers, total team size 7).
*   **Duration:** 12 minutes

### 💬 Direct Quotes
1. *"Honestly, we just put everyone on Claude Pro and ChatGPT Plus, plus we all use Cursor. I think we pay like $100 a month per dev just for chat assistants and IDE completion, but we've never actually sat down and added it up."*
2. *"I set up a Claude Team account because I thought we'd share projects, but we don't. We just use individual workspaces anyway. But the Team account requires a 5-seat minimum, so we're paying for 5 seats even though only 3 of us use Claude heavily."*
3. *"If you could tell me exactly how much we'd save by just switching to API keys or merging our Claude/ChatGPT subscriptions, I'd do it today. But I don't have two hours to sit and read pricing tables."*

### 💡 The Most Surprising Thing
Siddharth's team was "double-subscribing" almost every developer to both Claude Pro ($20/mo) and ChatGPT Plus ($20/mo). The reason was that some developers preferred OpenAI for general writing, documentation, and reasoning tasks, while preferring Claude for heavy coding. They were paying $40/mo per seat for chat interfaces on top of $20/mo for Cursor, totaling $60/dev/month, without realizing the redundancy.

### 📐 Product Design Changes
*   **Sub-Subscription Flags:** Added a "Double Subscription" checker to the Audit Engine. If a team has both Claude Pro/Team and ChatGPT Plus/Team for the same seats, the engine flags a "Consolidation Opportunity."
*   **Consolidation Recommendation:** It calculates the savings of consolidating to a single chat tool (e.g., Claude Team only or ChatGPT Team only) and using the system's API tier for occasional secondary model usage, saving them up to $240/year per developer.

---

## 👥 Interview 2: Elena R.
*   **Role & Stage:** Head of Engineering at a Series A developer-tooling startup (14 developers, total team size 20).
*   **Duration:** 15 minutes

### 💬 Direct Quotes
1. *"We bought GitHub Copilot Business for everyone because our security team insisted on IP protection. But half of the devs are actually paying out-of-pocket for Cursor Pro and asking for expensing, which is a compliance and accounting nightmare."*
2. *"We have a shared 'developer AI API' account on OpenAI. I looked at the bill last month, and we spent $800 on GPT-4o calls. I have no idea if that's reasonable or if some dev left an autonomous agent running in an infinite loop."*
3. *"We want a tool that says: 'If you move your Copilot Business users who want Cursor to Cursor Business, here is the compliance and financial difference.' And we need a way to detect API anomalies."*

### 💡 The Most Surprising Thing
The organization was paying for GitHub Copilot Business licenses ($19/mo) for the entire developer team, yet over 50% of the team was expensing Cursor Pro ($20/mo) on their own cards because they preferred Cursor's interface. The startup was paying double ($39/mo per dev) for two overlapping IDE auto-completion tools, simply because they lacked a unified administrative policy.

### 📐 Product Design Changes
*   **IDE Redundancy Flag:** Designed an audit rule that flags overlapping IDE tools (Cursor + Copilot). 
*   **Policy Migration Logic:** If a team is paying for both Copilot Business ($19/mo) and Cursor Pro ($20/mo), the audit recommends standardizing on **Cursor Business ($40/mo)** which has built-in enterprise privacy, rendering the Copilot license redundant. This saves $19/mo per user and consolidates billing.

---

## 👥 Interview 3: Marcus K.
*   **Role & Stage:** Solopreneur & Indie Hacker.
*   **Duration:** 10 minutes

### 💬 Direct Quotes
1. *"I'm a solo dev, so every dollar counts. I use v0, Windsurf, Claude Pro, and ChatGPT. I probably spend $80 a month on retail AI subscriptions."*
2. *"I set up a local script that uses OpenAI API keys instead of Claude Pro for coding help, but the token costs actually ended up higher than $20 because I was passing entire codebase contexts on every prompt."*
3. *"A tool that shows me the tipping point of when it's cheaper to use a flat-rate subscription versus usage-based APIs would be huge. Right now it's just guessing."*

### 💡 The Most Surprising Thing
Marcus assumed that usage-based API keys were *always* cheaper than a flat $20/month retail subscription. However, because his IDE was sending massive context windows (entire files and directories) on every autocomplete/edit request, his API bills spiked. Flat-rate plans are actually massive cost-arbitrage assets for *power users* who send millions of tokens daily.

### 📐 Product Design Changes
*   **Tipping Point Analysis:** Added a threshold calculation to the API recommendations. Instead of blindly recommending "Switch to API keys," the audit calculates expected token volume based on the team's primary use case. 
*   **Usage Fit Recommendation:** For heavy "coding" and "research" use cases with large contexts, the audit recommends flat-rate plans (Cursor Pro / Claude Pro) rather than raw API endpoints, protecting users from unexpected API token invoice shock.
