'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './AuditResults.module.css';
import { ToolId, AuditResult } from '../../../lib/types';
import { AuditRecord } from '../../../lib/db';

interface AuditResultsClientProps {
  audit: AuditRecord;
}

export default function AuditResultsClient({ audit }: AuditResultsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for Privacy view (Private vs Public Shareable redact view)
  const [isPublicMode, setIsPublicMode] = useState<boolean>(false);
  
  // Lead info inputs
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('founder');
  
  // Action states
  const [leadSubmitted, setLeadSubmitted] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState<boolean>(false);
  const [newsletterEmail, setNewsletterEmail] = useState<string>('');

  // Hydrate views and check URL parameters on load
  useEffect(() => {
    // If the URL has a public view parameter, default to public redact mode
    const viewParam = searchParams.get('view');
    if (viewParam === 'public') {
      setIsPublicMode(true);
    }

    // Hydrate existing lead details if present in the database audit record
    if (audit.leadEmail) {
      setLeadSubmitted(true);
      setEmail(audit.leadEmail);
      if (audit.leadName) setName(audit.leadName);
      if (audit.leadCompany) setCompany(audit.leadCompany);
      if (audit.leadRole) setRole(audit.leadRole);
      if (audit.aiSummary) setAiSummary(audit.aiSummary);
    }
  }, [audit, searchParams]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadError(null);
    
    if (!email) {
      setLeadError('Please provide a valid email address.');
      return;
    }

    setIsUnlocking(true);

    try {
      const response = await fetch('/api/lead/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditId: audit.id,
          email,
          name,
          company,
          role
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to submit lead data.');
      }

      const data = await response.json();
      setAiSummary(data.aiSummary || '');
      setLeadSubmitted(true);
      
      // Update local storage record if needed
      localStorage.setItem(`credex_audit_unlocked_${audit.id}`, 'true');
    } catch (err: any) {
      console.error(err);
      setLeadError(err.message || 'Connection failed. Please try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubscribed(true);
    setNewsletterEmail('');
  };

  const copyShareLink = () => {
    const protocol = window.location.protocol;
    const host = window.location.host;
    const shareUrl = `${protocol}//${host}/audit/${audit.id}?view=public`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const { results, teamSize, useCase } = audit;
  const isHighSavings = results.totalMonthlySavings >= 500;

  // Icon mapping helper
  const getToolEmoji = (toolId: string): string => {
    switch (toolId) {
      case 'cursor': return '💻';
      case 'copilot': return '🤖';
      case 'windsurf': return '🏄‍♂️';
      case 'claude': return '🧠';
      case 'chatgpt': return '💬';
      case 'gemini': return '♊';
      case 'anthropic-api': return '🔌';
      case 'openai-api': return '⚡';
      default: return '🛠️';
    }
  };

  return (
    <div className={styles.container}>
      <div className="bg-glow-blue" />
      
      {/* Privacy Toggle Bar */}
      <div className={styles.privacyControls}>
        <div className={styles.privacyMessage}>
          {isPublicMode ? (
            <span className={styles.publicBadge}>🛡️ Public Share Mode Active (Personal Data Stripped)</span>
          ) : (
            <span>🔒 Confidential Private View</span>
          )}
        </div>
        <div className={styles.toggleButtons}>
          <button 
            className={`${styles.toggleBtn} ${!isPublicMode ? styles.toggleBtnActive : ''}`}
            onClick={() => setIsPublicMode(false)}
            disabled={searchParams.get('view') === 'public'} // locked in if public link loaded
          >
            Private View
          </button>
          <button 
            className={`${styles.toggleBtn} ${isPublicMode ? styles.toggleBtnActive : ''}`}
            onClick={() => setIsPublicMode(true)}
          >
            Public Share View
          </button>
        </div>
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoArea} onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
          <div className={styles.logoDot} />
          <span>credex</span>
          <span className={styles.betaBadge}>audit</span>
        </div>
        
        {leadSubmitted && (
          <button 
            className={`btn-primary ${styles.shareHeaderBtn}`} 
            onClick={copyShareLink}
          >
            {linkCopied ? 'Link Copied! ✓' : 'Copy Public Share Link 🔗'}
          </button>
        )}
      </header>

      {/* Hero Savings metrics */}
      <section className={styles.heroSection}>
        <div className={styles.heroCard}>
          <span className={styles.heroLabel}>ESTIMATED ANNUAL SAVINGS</span>
          <h1 className={styles.heroSavings}>
            ${results.totalAnnualSavings.toLocaleString()}
            <span className={styles.heroYear}>/yr</span>
          </h1>
          
          <div className={styles.heroGrid}>
            <div className={styles.heroMetric}>
              <span className={styles.metricLabel}>Current Spend</span>
              <span className={`${styles.metricValue} ${styles.metricCurrent}`}>
                ${results.totalCurrentSpend}/mo
              </span>
            </div>
            
            <div className={styles.heroArrow}>➔</div>

            <div className={styles.heroMetric}>
              <span className={styles.metricLabel}>Optimized Spend</span>
              <span className={`${styles.metricValue} ${styles.metricOptimized}`}>
                ${results.totalRecommendedSpend}/mo
              </span>
            </div>

            <div className={styles.heroArrow}>➔</div>

            <div className={styles.heroMetric}>
              <span className={styles.metricLabel}>Monthly Savings</span>
              <span className={`${styles.metricValue} ${styles.metricSavings}`}>
                ${results.totalMonthlySavings}/mo
              </span>
            </div>
          </div>

          {/* Graphical Spending Visualizer */}
          <div className={styles.spendBarContainer}>
            <div 
              className={styles.spendBarOptimized} 
              style={{ width: `${Math.max(15, (results.totalRecommendedSpend / (results.totalCurrentSpend || 1)) * 100)}%` }}
            >
              <span>{Math.round((results.totalRecommendedSpend / (results.totalCurrentSpend || 1)) * 100)}% Cost</span>
            </div>
            <div className={styles.spendBarSavings}>
              <span>Save ${results.totalMonthlySavings}/mo</span>
            </div>
          </div>

          <p className={styles.heroMeta}>
            Compiled for: <strong>{isPublicMode ? 'Anonymous Stack' : (company || 'Your Team')}</strong> • Use Case: <strong>{useCase}</strong> • Size: <strong>{teamSize} seats</strong>
          </p>
        </div>
      </section>

      {/* Dynamic CFO Summary Area */}
      <section className={styles.summarySection}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <div className={styles.advisorAvatar}>💼</div>
            <div>
              <h3>Fractional CFO Executive Summary</h3>
              <span className={styles.advisorSubtitle}>AI Strategy & Billing Optimization Desk</span>
            </div>
          </div>

          {!leadSubmitted ? (
            <div className={styles.leadLockWrapper}>
              <div className={styles.lockIcon}>🔓</div>
              <h4>Unlock Professional Spend Summary</h4>
              <p>Enter your contact details to generate the AI executive summary, unlock transactional PDF exports, and claim stack migration instructions.</p>
              
              <form onSubmit={handleLeadSubmit} className={styles.leadForm}>
                <div className={styles.leadFieldsGrid}>
                  <div className={styles.formGroup}>
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="you@company.com" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Siddharth S." 
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Company Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Acme AI" 
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Your Role</label>
                    <select value={role} onChange={e => setRole(e.target.value)}>
                      <option value="founder">Founder / CEO</option>
                      <option value="cto">CTO / VP Engineering</option>
                      <option value="finance">CFO / Finance Lead</option>
                      <option value="developer">Lead Architect / Developer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {leadError && (
                  <div className={styles.formError}>{leadError}</div>
                )}

                <button 
                  type="submit" 
                  className="btn-primary pulse-border"
                  disabled={isUnlocking}
                  style={{ width: '100%', marginTop: '20px' }}
                >
                  {isUnlocking ? 'Consulting Advisor Engine...' : 'Generate Executive Report & Unlock Summary'}
                </button>
              </form>
            </div>
          ) : (
            <div className={styles.summaryUnlockedContent}>
              <p className={styles.summaryText}>{aiSummary || 'Analyzing your results...'}</p>
              <div className={styles.summaryFooterActions}>
                <button className="btn-secondary" onClick={copyShareLink}>
                  {linkCopied ? 'Link Copied! ✓' : 'Share Report Link 🔗'}
                </button>
                <button 
                  className="btn-primary" 
                  onClick={() => alert('PDF report is compiling. A secure copy has been triggered to your registered email.')}
                >
                  Export Official PDF Report 📄
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Per-Tool Recommendation Grid */}
      <section className={styles.breakdownSection}>
        <h2 className={styles.sectionTitle}>Itemized Optimization Breakdown</h2>
        <p className={styles.sectionSubtitle}>Deterministic, billing-compliant allocations computed by the Credex Audit Engine.</p>

        <div className={styles.breakdownGrid}>
          {results.breakdown.map((item) => {
            const hasSavings = item.savings > 0;
            return (
              <div 
                key={item.toolId} 
                className={`${styles.breakdownCard} ${hasSavings ? styles.breakdownCardSavings : ''}`}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.toolIcon}>
                    {getToolEmoji(item.toolId)}
                  </div>
                  <div>
                    <h3 className={styles.toolTitle}>{item.toolName}</h3>
                    <span className={styles.currentPlanLabel}>
                      Current: {item.currentPlan} ({item.currentSeats} seat{item.currentSeats > 1 ? 's' : ''})
                    </span>
                  </div>
                  {hasSavings ? (
                    <div className={styles.savingsPill}>
                      Save ${item.savings}/mo
                    </div>
                  ) : (
                    <div className={`${styles.savingsPill} ${styles.savingsPillOptimal}`}>
                      Optimized ✓
                    </div>
                  )}
                </div>

                <div className={styles.comparisonGrid}>
                  <div className={styles.compColumn}>
                    <span className={styles.compLabel}>Current Monthly Spend</span>
                    <span className={styles.compValueCurrent}>${item.currentSpend}/mo</span>
                  </div>
                  <div className={styles.compArrow}>➔</div>
                  <div className={styles.compColumn}>
                    <span className={styles.compLabel}>Recommended Setup</span>
                    <span className={styles.compValueRec}>
                      {item.recommendedPlan === 'None' ? 'Cancel Subscription' : `${item.recommendedPlan} (${item.recommendedSeats} seat${item.recommendedSeats > 1 ? 's' : ''})`}
                    </span>
                  </div>
                </div>

                <div className={styles.actionBlock}>
                  <span className={styles.actionLabel}>Recommended Action:</span>
                  <strong className={styles.actionValue}>{item.recommendedAction}</strong>
                </div>

                <div className={styles.reasonBlock}>
                  <p>{item.reason}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Strategic Call to Action Section (Conditional on Savings size) */}
      <section className={styles.ctaSection}>
        {isHighSavings ? (
          <div className={`${styles.ctaCard} ${styles.ctaCardHigh}`}>
            <div className={styles.ctaBadge}>HIGH SAVINGS DETECTED</div>
            <h2>Acquire Identical Developer Licenses at 20% to 30% Off</h2>
            <p>
              Your startup qualifies for the <strong>Credex Venture Credit Program</strong>. We acquire pre-paid surplus enterprise credits from backed companies and redistribute them safely. Claim discounted seats for Cursor, Claude Pro, and OpenAI API directly, slashing your bills further.
            </p>
            
            <div className={styles.valuePropsRow}>
              <div className={styles.valueProp}>
                <span className={styles.valuePropIcon}>✓</span>
                <span>Identical Enterprise API Tiers</span>
              </div>
              <div className={styles.valueProp}>
                <span className={styles.valuePropIcon}>✓</span>
                <span>No Stack Migrations Required</span>
              </div>
              <div className={styles.valueProp}>
                <span className={styles.valuePropIcon}>✓</span>
                <span>20% to 30% Flat Discounts</span>
              </div>
            </div>

            <div className={styles.ctaBtnRow}>
              <a 
                href="https://calendly.com/credex-audit" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-primary pulse-border"
                style={{ textDecoration: 'none', display: 'inline-block' }}
              >
                Schedule 10-Minute Credit Activation Call
              </a>
              <button 
                className="btn-secondary"
                onClick={() => alert('Venture Credits Program documentation has been dispatched to your registered email.')}
              >
                Download Program PDF
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.ctaCard}>
            <div className={`${styles.ctaBadge} ${styles.ctaBadgeOptimal}`}>STACK OPTIMAL</div>
            <h2>Your AI Subscriptions are Exceptionally Sized!</h2>
            <p>
              Congratulations! Your audit reports negligible licensing waste, placing your company in the <strong>top 95% of software spending efficiency</strong>. 
            </p>
            <p>
              AI billing matrices, team plan thresholds, and API token pricing schemes change weekly. Join our <strong>StackOptimizers Newsletter</strong> to receive private briefs when new developer tools launch or provider tariffs shift.
            </p>

            <form onSubmit={handleNewsletterSubmit} className={styles.newsletterForm}>
              <input 
                type="email" 
                required 
                placeholder="enter your email address" 
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                disabled={newsletterSubscribed}
              />
              <button 
                type="submit" 
                className="btn-primary"
                disabled={newsletterSubscribed}
              >
                {newsletterSubscribed ? 'Subscribed! ✓' : 'Join StackOptimizers'}
              </button>
            </form>
            {newsletterSubscribed && (
              <span className={styles.subscribedNote}>Welcome! You'll receive our next bi-weekly billing brief.</span>
            )}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <span>credex spend audit</span>
          <p>© 2026 Credex, Inc. Premium Developer Optimization Assets.</p>
        </div>
        <div className={styles.footerLinks}>
          <a href="https://credex.rocks" target="_blank" rel="noopener noreferrer">About Credex</a>
          <a href="https://credex.rocks" target="_blank" rel="noopener noreferrer">Discounted Credits</a>
          <a href="https://credex.rocks" target="_blank" rel="noopener noreferrer">Security & Privacy</a>
        </div>
      </footer>
    </div>
  );
}
