'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './SpendForm.module.css';
import { ToolId, AuditInput, ToolInput } from '../lib/types';
import { PRICING_REGISTRY } from '../lib/auditEngine';

interface ToolFormState {
  active: boolean;
  planId: string;
  seats: number;
  monthlySpend: number;
}

const DEFAULT_TOOLS_STATE: Record<ToolId, ToolFormState> = {
  cursor: { active: false, planId: 'pro', seats: 1, monthlySpend: 20 },
  copilot: { active: false, planId: 'business', seats: 1, monthlySpend: 19 },
  windsurf: { active: false, planId: 'pro', seats: 1, monthlySpend: 15 },
  claude: { active: false, planId: 'pro', seats: 1, monthlySpend: 20 },
  chatgpt: { active: false, planId: 'plus', seats: 1, monthlySpend: 20 },
  gemini: { active: false, planId: 'pro', seats: 1, monthlySpend: 20 },
  'anthropic-api': { active: false, planId: 'api', seats: 1, monthlySpend: 50 },
  'openai-api': { active: false, planId: 'api', seats: 1, monthlySpend: 50 },
};

const STEPS = [
  { id: 1, label: 'Startup Info' },
  { id: 2, label: 'Select Stack' },
  { id: 3, label: 'Configure Spend' },
];

export default function SpendForm() {
  const router = useRouter();
  
  // Guard SSR
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // State
  const [teamSize, setTeamSize] = useState<number>(1);
  const [primaryUseCase, setPrimaryUseCase] = useState<AuditInput['primaryUseCase']>('mixed');
  const [toolsState, setToolsState] = useState<Record<ToolId, ToolFormState>>(DEFAULT_TOOLS_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedMetadata = localStorage.getItem('credex_audit_metadata');
      const savedTools = localStorage.getItem('credex_audit_tools');
      
      if (savedMetadata) {
        const { teamSize: savedTeam, useCase: savedCase } = JSON.parse(savedMetadata);
        if (savedTeam) setTeamSize(savedTeam);
        if (savedCase) setPrimaryUseCase(savedCase);
      }
      
      if (savedTools) {
        setToolsState(JSON.parse(savedTools));
      }
    } catch (e) {
      console.error('Error loading saved form state', e);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('credex_audit_metadata', JSON.stringify({ teamSize, useCase: primaryUseCase }));
      localStorage.setItem('credex_audit_tools', JSON.stringify(toolsState));
    } catch (e) {
      console.error('Error writing form state to storage', e);
    }
  }, [teamSize, primaryUseCase, toolsState, mounted]);

  const handleToolToggle = (toolId: ToolId) => {
    setToolsState(prev => {
      const prevTool = prev[toolId];
      return {
        ...prev,
        [toolId]: {
          ...prevTool,
          active: !prevTool.active
        }
      };
    });
  };

  const handlePlanChange = (toolId: ToolId, planId: string) => {
    setToolsState(prev => {
      const prevTool = prev[toolId];
      const toolPlans = PRICING_REGISTRY[toolId] || {};
      const planDetails = toolPlans[planId];
      
      let seats = prevTool.seats;
      // Enforce minimum seat requirements automatically for Team/Claude minimums
      if (planDetails && planDetails.minSeats && seats < planDetails.minSeats) {
        seats = planDetails.minSeats;
      }
      
      const pricePerSeat = planDetails ? planDetails.pricePerSeat : 0;
      const calculatedSpend = pricePerSeat * seats;

      return {
        ...prev,
        [toolId]: {
          ...prevTool,
          planId,
          seats,
          monthlySpend: calculatedSpend
        }
      };
    });
  };

  const handleSeatsChange = (toolId: ToolId, seatsInput: number) => {
    const seats = Math.max(1, seatsInput);
    setToolsState(prev => {
      const prevTool = prev[toolId];
      const toolPlans = PRICING_REGISTRY[toolId] || {};
      const planDetails = toolPlans[prevTool.planId];
      
      const pricePerSeat = planDetails ? planDetails.pricePerSeat : 0;
      
      // Allow custom API pricing calculations without locking
      const calculatedSpend = toolId.endsWith('-api') 
        ? prevTool.monthlySpend 
        : pricePerSeat * seats;

      return {
        ...prev,
        [toolId]: {
          ...prevTool,
          seats,
          monthlySpend: calculatedSpend
        }
      };
    });
  };

  const handleSpendChange = (toolId: ToolId, monthlySpend: number) => {
    const spend = Math.max(0, monthlySpend);
    setToolsState(prev => ({
      ...prev,
      [toolId]: {
        ...prev[toolId],
        monthlySpend: spend
      }
    }));
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (teamSize < 1) {
        setError('Team size must be at least 1 person.');
        return;
      }
    }
    setError(null);
    setCurrentStep(prev => Math.min(STEPS.length, prev + 1));
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const activeTools: ToolInput[] = Object.entries(toolsState)
      .filter(([_, state]) => state.active)
      .map(([id, state]) => ({
        toolId: id as ToolId,
        planId: state.planId,
        seats: state.seats,
        monthlySpend: state.monthlySpend,
      }));

    if (activeTools.length === 0) {
      setError('Please select at least one active AI tool in your stack.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: AuditInput = {
        teamSize,
        primaryUseCase,
        tools: activeTools,
      };

      const response = await fetch('/api/audit/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to calculate audit.');
      }

      const data = await response.json();
      
      // Redirect to the newly calculated Audit Result page
      router.push(`/audit/${data.auditId}`);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unexpected connection error occurred.');
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null; // Avoid hydration mismatch

  // Icon mapping
  const getToolEmoji = (toolId: ToolId): string => {
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

  const getToolDisplayName = (toolId: ToolId): string => {
    switch (toolId) {
      case 'cursor': return 'Cursor';
      case 'copilot': return 'GitHub Copilot';
      case 'windsurf': return 'Windsurf';
      case 'claude': return 'Claude AI';
      case 'chatgpt': return 'ChatGPT';
      case 'gemini': return 'Google Gemini';
      case 'anthropic-api': return 'Anthropic API';
      case 'openai-api': return 'OpenAI API';
    }
  };

  const activeToolsCount = Object.values(toolsState).filter(t => t.active).length;

  return (
    <div className={styles.formContainer}>
      {/* Progress Indicator */}
      <div className={styles.stepIndicator}>
        <div 
          className={styles.stepLineProgress} 
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map(step => (
          <div 
            key={step.id} 
            className={`${styles.stepNode} ${
              currentStep === step.id 
                ? styles.stepNodeActive 
                : currentStep > step.id 
                ? styles.stepNodeDone 
                : ''
            }`}
          >
            {step.id}
            <span className={`${styles.stepLabel} ${currentStep === step.id ? styles.stepLabelActive : ''}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        {/* Step 1: Core Startup Metadata */}
        {currentStep === 1 && (
          <div>
            <h2 className={styles.stepTitle}>Let's Size Your Startup</h2>
            <p className={styles.stepSubtitle}>We need standard team context to calculate correct usage-fit allocations.</p>
            
            <div className={styles.fieldGrid}>
              <div className={styles.inputWrapper}>
                <label className={styles.label} htmlFor="teamSize">Total Team Size</label>
                <input
                  id="teamSize"
                  type="number"
                  min="1"
                  value={teamSize}
                  onChange={e => setTeamSize(parseInt(e.target.value) || 1)}
                  placeholder="e.g. 8"
                />
                <span className={styles.spendHint}>Includes developers, writers, and administrative roles.</span>
              </div>

              <div className={styles.inputWrapper}>
                <label className={styles.label} htmlFor="useCase">Primary Stack Use Case</label>
                <select
                  id="useCase"
                  value={primaryUseCase}
                  onChange={e => setPrimaryUseCase(e.target.value as AuditInput['primaryUseCase'])}
                >
                  <option value="mixed">Mixed/General Purpose</option>
                  <option value="coding">Engineering & Coding Heavy</option>
                  <option value="writing">Content & Copywriting Heavy</option>
                  <option value="data">Data Analytics & Scraping</option>
                  <option value="research">Scientific & Research Analysis</option>
                </select>
                <span className={styles.spendHint}>Helps target consolidation recommendations.</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Tool Stack Selection */}
        {currentStep === 2 && (
          <div>
            <h2 className={styles.stepTitle}>Select Your Active AI Stack</h2>
            <p className={styles.stepSubtitle}>Toggle the AI licenses, chatbots, and APIs your startup currently pays for.</p>
            
            <div className={styles.toggleGrid}>
              {(Object.keys(DEFAULT_TOOLS_STATE) as ToolId[]).map(toolId => {
                const active = toolsState[toolId].active;
                return (
                  <div 
                    key={toolId}
                    className={`${styles.toolCard} ${active ? styles.toolCardActive : ''}`}
                    onClick={() => handleToolToggle(toolId)}
                  >
                    <div className={styles.checkboxIndicator} />
                    <div className={styles.toolIcon}>
                      {getToolEmoji(toolId)}
                    </div>
                    <span className={styles.toolName}>{getToolDisplayName(toolId)}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Selected Tools: <strong>{activeToolsCount}</strong>
            </div>
          </div>
        )}

        {/* Step 3: Tool Configurations */}
        {currentStep === 3 && (
          <div>
            <h2 className={styles.stepTitle}>Configure Plan Details & Spend</h2>
            <p className={styles.stepSubtitle}>Provide active license seats and invoice values to benchmark your pricing.</p>
            
            {activeToolsCount === 0 ? (
              <div className={styles.emptyState}>
                <p>No tools selected. Go back and toggle active subscriptions.</p>
              </div>
            ) : (
              <div className={styles.configList}>
                {(Object.keys(toolsState) as ToolId[])
                  .filter(toolId => toolsState[toolId].active)
                  .map(toolId => {
                    const state = toolsState[toolId];
                    const availablePlans = PRICING_REGISTRY[toolId] || {};
                    
                    return (
                      <div key={toolId} className={styles.configCard}>
                        {/* Header/Info */}
                        <div className={styles.configCardHeader}>
                          <div className={styles.configToolIcon}>
                            {getToolEmoji(toolId)}
                          </div>
                          <span className={styles.configToolName}>{getToolDisplayName(toolId)}</span>
                        </div>

                        {/* Plan selection */}
                        <div className={styles.inputWrapper}>
                          <label className={styles.label}>Plan Tier</label>
                          <select
                            value={state.planId}
                            onChange={e => handlePlanChange(toolId, e.target.value)}
                          >
                            {Object.entries(availablePlans).map(([planKey, plan]) => (
                              <option key={planKey} value={planKey}>
                                {plan.name} {plan.pricePerSeat > 0 ? `($${plan.pricePerSeat}/mo)` : '(Free)'}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Seats */}
                        <div className={styles.inputWrapper}>
                          <label className={styles.label}>Seats</label>
                          <input
                            type="number"
                            min="1"
                            value={state.seats}
                            onChange={e => handleSeatsChange(toolId, parseInt(e.target.value) || 1)}
                            disabled={toolId.endsWith('-api')}
                          />
                        </div>

                        {/* Monthly Spend */}
                        <div className={styles.inputWrapper}>
                          <label className={styles.label}>Monthly Spend ($)</label>
                          <input
                            type="number"
                            min="0"
                            value={state.monthlySpend}
                            onChange={e => handleSpendChange(toolId, parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            borderRadius: '8px', 
            padding: '12px 16px', 
            color: '#f87171', 
            fontSize: '0.85rem',
            marginTop: '20px'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Button Row Navigation */}
        <div className={styles.btnRow}>
          {currentStep > 1 ? (
            <button type="button" className="btn-secondary" onClick={prevStep} disabled={isSubmitting}>
              Back
            </button>
          ) : (
            <div /> // placeholder for alignment
          )}

          {currentStep < STEPS.length ? (
            <button type="button" className="btn-primary" onClick={nextStep}>
              Next Step
            </button>
          ) : (
            <button 
              type="submit" 
              className="btn-primary pulse-border" 
              disabled={isSubmitting || activeToolsCount === 0}
            >
              {isSubmitting ? 'Running Audit Engine...' : 'Calculate AI Spend Audit'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
