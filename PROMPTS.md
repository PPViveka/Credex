# Prompt Engineering Inventory — Credex AI Spend Audit

This document catalogues the prompt architecture, negative constraints, failed iterations, and engineering insights developed to drive the personalized fractional CFO summary in the **Credex AI Spend Audit** platform.

---

## 1. System Design Objectives
To build trust with startup founders and finance leads, the generated audit summary must meet four strict criteria:
1. **Strict Length Limitation**: Must remain under **100 words** to fit neatly in our glassmorphic results UI without causing scrolling fatigue.
2. **Professional CFO Persona**: Speak with absolute authority, utilizing precise finance terminology (e.g., unit economics, run rate, redundant overhead, SaaS over-provisioning).
3. **Number-Backed Assertions**: Explicitly mention calculated savings figures (e.g. monthly and annual numbers) and connect them to direct tactical steps.
4. **No Conversational Fluff**: Zero introductory or concluding pleasantries (e.g. "Here is your summary:") or formatting artifacts (such as markdown headers or lists).

---

## 2. Failed Prompt Iterations & Post-Mortem Analysis

### Iteration 1: The "Simple Summary" Prompt (FAILED)
> **Prompt**:
> `Write an audit summary for this startup's AI spend based on the results: $240/mo savings on Claude seats. Keep it short and professional.`
- **Resulting Output**:
  > *"Sure! Here is a summary of your AI tool spend audit results. It looks like your startup is currently spending $450 a month, but you could save $240 a month. The audit suggests downgrading your Claude Team plan because you have less than 5 people. That is a great way to save cash! I hope this summary helps your startup stay lean. Let me know if you need anything else!"*
- **Post-Mortem Failures**:
  - **Conversational Overhead**: Included useless chatter ("Sure! Here is...", "Let me know if..."), wasting 20% of the word count.
  - **Weak Advisory Tone**: Used colloquial phrases ("great way to save cash!", "I hope this helps"), losing the elite fractional CFO positioning.
  - **No Constraint Controls**: Failed to strictly cap length.

---

### Iteration 2: Persona-Driven with Word Cap (FAILED)
> **Prompt**:
> `You are a startup fractional CFO. Write a 100-word executive summary for an AI Spend Audit. Highlight the savings numbers: monthly savings is $400, annual is $4800. Highlight that GitHub Copilot is duplicate because they have Cursor.`
- **Resulting Output**:
  > *### Executive Spend Summary*
  > *As your fractional CFO, I have reviewed your AI subscription configurations. Your team is currently experiencing significant software redundancy. By standardizing on Cursor for your engineering flow, you can immediately cancel your duplicate GitHub Copilot subscriptions, yielding an immediate savings of **$400 per month** (or **$4,800 annually**).*
  > *This optimization instantly improves your monthly operational cash flow, allowing you to reallocate vital resources toward direct growth. Please execute these cancellations immediately in your billing portals to capture these gains.*
- **Post-Mortem Failures**:
  - **Formatting Injection**: Injected markdown headers (`### Executive Spend Summary`) which broke the unified font hierarchy of our frontend card container.
  - **Excessive Length**: The output ran to 92 words but failed to address general use cases or seat over-provisioning in other tools due to narrow instructions.

---

## 3. Final Production Prompt Architecture (SUCCESS)

To achieve perfect formatting compliance and elite finance advisory copy, we established a **Negative Constraint Directive** and passed a raw, structured text dump of the mathematical audit breakdown.

### The Production Prompt Template
```typescript
const prompt = `Write a concise, professional 100-word spend optimization executive summary for a startup founder based on these AI Spend Audit results:
Team size: ${teamSize}
Primary Stack Use Case: ${useCase}
Current Monthly AI Tool Spend: $${results.totalCurrentSpend}
Recommended Monthly Spend: $${results.totalRecommendedSpend}
Potential Monthly Savings: $${results.totalMonthlySavings}

Per-Tool Audit Breakdown:
${breakdownDescription}

Strict Guidelines:
1. Keep it under 100 words. Be incredibly direct and punchy.
2. Adopt the tone of an elite, finance-literate fractional CFO and SaaS optimization expert.
3. Highlight the single largest saving opportunity (e.g. duplicate subscriptions or ghost seats) and double-down on the strategic value of removing that waste.
4. Do NOT include markdown styling other than normal paragraphs. Avoid placeholders or introductory filler text. Output exactly the paragraph.`;
```

### Strategic Design Elements of the Final Prompt
1. **Raw Breakdown Injection**: Rather than passing generic variables, the prompt ingests a textified string of per-tool metrics (`Current -> Recommended -> Action -> Reason`), allowing the LLM to dynamically compare other tools in the stack and pick the highest-leverage recommendation.
2. **Negative Formatting Constraints**: Explicitly forbids lists, markdown headings, bold markers, and conversational filler. The prompt demands "exactly the paragraph", ensuring seamless rendering in our glassmorphism text container.
3. **Role-Locking**: Establishes the precise role ("fractional CFO and SaaS optimization expert") to lock the vocabulary choice to finance-literate tokens (e.g. "cash efficiency", "administrative waste", "operational velocity").
