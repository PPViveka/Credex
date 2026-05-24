'use client';

import React, { useState } from 'react';
import styles from './page.module.css';
import SpendForm from '../components/SpendForm';

const FAQS = [
  {
    question: 'How does the AI Spend Audit work?',
    answer: 'We analyze your active AI tool counts, plans, and monthly spend. Our deterministic, finance-literate rules engine applies strict optimization formulas—such as identifying ghost seats, flagging plan minimum constraints (e.g., Claude Team\'s 5-seat minimum), mapping IDE redundancies (Cursor + Copilot), and computing API context tipping points—to spot immediate cash-saving opportunities.',
  },
  {
    question: 'Do you require read-access to our bank cards or Stripe API?',
    answer: 'Absolutely not. This is a privacy-first, zero-integration audit. You simply input your current plans, active seats, and monthly invoices manually. The calculation is done instantly in a secure serverless environment. We will never ask you to link a bank account, credit card, or corporate financial credential.',
  },
  {
    question: 'Why does the audit sometimes recommend flat-rate plans over usage-based API keys?',
    answer: 'Many teams assume API keys are always cheaper. However, because modern AI coding assistants (like Cursor or Windsurf) send massive context windows (entire files and codebase directories) on every single autocomplete and edit request, solo power users can easily rack up $80+/month in raw API invoices. Flat-rate retail plans (like Cursor Pro or Claude Pro) represent a massive cost-arbitrage asset for power users who need high-volume, high-context developer interactions.',
  },
  {
    question: 'What are Credex Credits and how do they save us money?',
    answer: 'Credex sources surplus, pre-paid AI infrastructure credits from venture-backed startups that over-forecasted their annual AI usage or pivoted. We verify these credits and sell them to active startups at a substantial discount (typically 20% to 30% off retail rates). Through the audit, if we identify high savings, we help you acquire these identical credits, cutting your bills immediately while preserving your exact tech stack.',
  },
  {
    question: 'What happens to my data after the audit is generated?',
    answer: 'Your audit details and calculated savings are stored securely in our database to generate your report. Your personal details (such as company name, role, and email) are strictly confidential and are stripped from the shareable public version of the URL, ensuring your team can share savings achievements on Twitter or Slack without leaking proprietary billing details.',
  },
];

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(prev => (prev === index ? null : index));
  };

  return (
    <div className={styles.page}>
      {/* Background Decorative Glow (complementing body globals) */}
      <div className="bg-glow-blue" />

      {/* Header Nav */}
      <header className={styles.header}>
        <div className={styles.logoArea}>
          <div className={styles.logoDot} />
          <span>credex</span>
          <span className={styles.betaBadge}>audit</span>
        </div>
        <a 
          href="https://credex.rocks" 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.navLink}
        >
          back to credex.rocks
        </a>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.promoBadge}>
          <span>🚀 Free 45-Second Audit — No Integration Required</span>
        </div>
        <h1 className={styles.headline}>
          Stop Burning Cash on Redundant AI Tools.
        </h1>
        <p className={styles.subheadline}>
          Instantly audit your startup's AI subscriptions, identify ghost seats, and capture up to 30% savings with defensible, number-backed reports.
        </p>

        {/* Core Interactive Audit Form */}
        <SpendForm />
      </section>

      {/* Social Proof Block */}
      <section className={styles.socialProof}>
        <div className={styles.sectionDivider} />
        <h3 className={styles.proofTitle}>TRUSTED BY COGNIZANT FOUNDERS & TECH LEADS</h3>
        
        <div className={styles.proofGrid}>
          {/* Testimonial 1 */}
          <div className={styles.testimonialCard}>
            <p className={styles.quoteText}>
              "Credex saved us $1,240/month in duplicate Claude and ChatGPT seats within 10 seconds of running their audit. Highly recommend for any lean team."
            </p>
            <div className={styles.authorRow}>
              <div className={styles.avatarMock}>SS</div>
              <div className={styles.authorMeta}>
                <span className={styles.authorName}>Siddharth S.</span>
                <span className={styles.authorTitle}>CTO, Vektor AI (Seed Stage)</span>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className={styles.testimonialCard}>
            <p className={styles.quoteText}>
              "We realized half our developers were expensing individual Cursor Pro licenses on top of our enterprise GitHub Copilot subscription. This tool resolved the compliance mess in one click."
            </p>
            <div className={styles.authorRow}>
              <div className={styles.avatarMock}>ER</div>
              <div className={styles.authorMeta}>
                <span className={styles.authorName}>Elena R.</span>
                <span className={styles.authorTitle}>VP of Engineering, FluxCore (Series A)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className={styles.faqSection}>
        <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
        <div className={styles.faqList}>
          {FAQS.map((faq, index) => {
            const isActive = activeFaq === index;
            return (
              <div 
                key={index} 
                className={`${styles.faqCard} ${isActive ? styles.faqCardActive : ''}`}
              >
                <button 
                  className={styles.faqHeader} 
                  onClick={() => toggleFaq(index)}
                  aria-expanded={isActive}
                >
                  <span>{faq.question}</span>
                  <span className={styles.faqChevron}>▼</span>
                </button>
                <div className={styles.faqBody} style={{ maxHeight: isActive ? '200px' : '0' }}>
                  <div className={styles.faqContent}>
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
