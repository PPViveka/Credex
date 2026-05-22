# Product Metrics & Instrumentation - AI Spend Audit

This document defines the quantitative metrics framework, tracking priorities, and pivot thresholds for the AI Spend Audit product.

---

## ⭐️ The North Star Metric: Annualized Saved Value Captured (ASVC)

Our North Star metric is **Annualized Saved Value Captured (ASVC)**.

$$\text{ASVC} = \sum \left(\text{Annualized Savings Surfaced in Audits} \times \text{Conversion to Credex Credit Customer}\right)$$

*   **Why this metric?** 
    Unlike a vanity metric like Completed Audits, or user engagement metrics like Daily Active Users (DAU)—which score poorly for a tool used once a quarter—ASVC directly bridges **customer value** with **business value**. 
    *   If a customer runs an audit, discovers $1,200/year in waste, and buys Credex credits to capture that discount, they succeed (save cash) and Credex succeeds (generates GP margin). 
    *   If we complete 10,000 audits but capture $0 in savings, the tool has failed its strategic purpose as a lead-generation asset.

---

## 📈 The Three Input Drivers

The North Star metric is driven by three specific, highly actionable input metrics:

### 1. Audit Qualification Rate (AQR)
*   **Definition:** The percentage of completed audits that surface $\ge \$200/\text{month}$ in defensible potential savings.
*   **Strategic Importance:** AQR measures **traffic quality**. If AQR is low (e.g., < 10%), it means we are attracting solo developers on optimal individual accounts who have no waste to optimize. We need a high AQR to ensure we are attracting startups with actual bloat.

### 2. Lead-Capture Conversion Rate (LCCR)
*   **Definition:** The percentage of qualified audit viewers (savings $\ge \$200/\text{mo}$) who submit their email and team metadata on the results screen.
*   **Strategic Importance:** LCCR measures **value perception**. It tells us if our results layout is sufficiently compelling and trustworthy to overcome the friction of the "email gate."

### 3. Consultation Booking Velocity (CBV)
*   **Definition:** The percentage of captured leads with high savings ($> \$500/\text{mo}$) who complete a Credex consultation booking.
*   **Strategic Importance:** CBV measures **sales funnel efficiency**. It tells us if the prospect is ready to act on our recommendations and buy credits immediately, or if there is friction in our booking flow.

---

## 🛠️ First-Priority Instrumentation Plan

Using lightweight analytics (e.g., Vercel Analytics, PostHog, or custom serverless events), we will track:
1.  **Form Completion Drop-Off:** Ingest funnel steps per tool in the Spend Form to identify if a specific input screen has high cognitive load and causes abandonment.
2.  **Savings Toggle Interactions:** Clicks on "View Downgrade Details" or "Show Pricing Sources" tabs, which measure user engagement and trust in our recommendations.
3.  **CTA Click CTR:** Individual Click-Through Rates on the "Book Credex Consultation" button vs. the "Notify Me of Future Optimizations" signup.

---

## 🔄 The Pivot Trigger

We will monitor our funnels closely. We have defined a strict **Pivot Trigger** threshold:

$$\text{Qualified Lead Booking Rate (QLBR)} < 2\%$$

If we complete **200 qualified audits** (showing savings $> \$500/\text{mo}$), and fewer than 4 users book a consultation or submit their lead details, we will execute a product pivot:
*   **Why?** This indicates that either:
    1.  *Trust Deficit:* Founders don't trust our deterministic audit logic or recommendations.
    2.  *Low Pain Threshold:* A saving of $500/month is not large enough to overcome their inertia of changing billing cards or switching software tools.
*   **The Pivot Strategy:** 
    *   *If Trust is the issue:* Redesign the results page to feature deep, interactive math breakdowns and embed our `PRICING_DATA.md` sources directly as hover-tooltips.
    *   *If Pain is the issue:* Reposition the GTM strategy to target mid-market startups (30–100 employees) where the potential waste is $\ge \$5,000/\text{month}$, raising the stakes of the audit.
