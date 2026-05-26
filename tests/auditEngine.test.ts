import { describe, it, expect } from 'vitest';
import { runAudit } from '../lib/auditEngine';
import { AuditInput } from '../lib/types';

describe('AI Spend Audit Engine - Finance-Literate Unit Tests', () => {
  
  // -------------------------------------------------------------
  // Test Scenario 1: Ghost Seats (Seat Over-provisioning)
  // -------------------------------------------------------------
  it('should identify ghost seats and recommend reducing seat counts', () => {
    const input: AuditInput = {
      teamSize: 5,
      primaryUseCase: 'coding',
      tools: [
        {
          toolId: 'cursor',
          planId: 'pro',
          seats: 10,
          monthlySpend: 200 // 10 seats * $20
        }
      ]
    };

    const result = runAudit(input);

    expect(result.totalMonthlySavings).toBe(100); // Reducing 5 extra seats saves 5 * $20 = $100
    expect(result.totalAnnualSavings).toBe(1200);
    expect(result.isAlreadyOptimal).toBe(false);
    
    const cursorResult = result.breakdown.find(t => t.toolId === 'cursor')!;
    expect(cursorResult.recommendedSeats).toBe(5);
    expect(cursorResult.recommendedSpend).toBe(100);
    expect(cursorResult.recommendedAction).toBe('Reduce Seats to 5');
    expect(cursorResult.reason).toContain('You have 10 seats registered but your team size is 5');
  });

  // -------------------------------------------------------------
  // Test Scenario 2: Claude Team 5-Seat Minimum Wastage
  // -------------------------------------------------------------
  it('should flag Claude Team 5-seat minimum wastage for small teams', () => {
    const input: AuditInput = {
      teamSize: 2,
      primaryUseCase: 'mixed',
      tools: [
        {
          toolId: 'claude',
          planId: 'team',
          seats: 5,
          monthlySpend: 150 // Claude Team flat $150 minimum (5 seats * $30)
        }
      ]
    };

    const result = runAudit(input);

    expect(result.totalMonthlySavings).toBe(110); // Downgrade to 2 Pro seats * $20 = $40. Savings = 150 - 40 = $110
    const claudeResult = result.breakdown.find(t => t.toolId === 'claude')!;
    expect(claudeResult.recommendedPlan).toBe('Pro');
    expect(claudeResult.recommendedSeats).toBe(2);
    expect(claudeResult.recommendedSpend).toBe(40);
    expect(claudeResult.recommendedAction).toBe('Downgrade to Pro (Individual)');
    expect(claudeResult.reason).toContain('bills a 5-seat minimum');
  });

  // -------------------------------------------------------------
  // Test Scenario 3: IDE Completion Redundancy (Cursor + Copilot)
  // -------------------------------------------------------------
  it('should flag redundant IDE autocompletion subscriptions', () => {
    const input: AuditInput = {
      teamSize: 4,
      primaryUseCase: 'coding',
      tools: [
        {
          toolId: 'cursor',
          planId: 'pro',
          seats: 4,
          monthlySpend: 80
        },
        {
          toolId: 'copilot',
          planId: 'business',
          seats: 4,
          monthlySpend: 76 // 4 * $19
        }
      ]
    };

    const result = runAudit(input);

    // Should cancel Copilot Business completely, saving $76/mo
    expect(result.totalMonthlySavings).toBe(76);
    
    const copilotResult = result.breakdown.find(t => t.toolId === 'copilot')!;
    expect(copilotResult.recommendedPlan).toBe('None');
    expect(copilotResult.recommendedSeats).toBe(0);
    expect(copilotResult.recommendedSpend).toBe(0);
    expect(copilotResult.recommendedAction).toBe('Cancel GitHub Copilot');
    expect(copilotResult.reason).toContain('autocomplete');
  });

  // -------------------------------------------------------------
  // Test Scenario 4: Chat Assistant Duplication & Usecase Consolidation
  // -------------------------------------------------------------
  it('should recommend consolidating dual chat subscriptions based on tech usecase', () => {
    const input: AuditInput = {
      teamSize: 3,
      primaryUseCase: 'coding',
      tools: [
        {
          toolId: 'claude',
          planId: 'pro',
          seats: 3,
          monthlySpend: 60
        },
        {
          toolId: 'chatgpt',
          planId: 'plus',
          seats: 3,
          monthlySpend: 60
        }
      ]
    };

    const result = runAudit(input);

    // Usecase is coding -> Keep Claude, cancel ChatGPT, saving 3 * $20 = $60/mo
    expect(result.totalMonthlySavings).toBe(60);
    
    const chatgptResult = result.breakdown.find(t => t.toolId === 'chatgpt')!;
    expect(chatgptResult.recommendedPlan).toBe('None');
    expect(chatgptResult.recommendedSpend).toBe(0);
    expect(chatgptResult.recommendedAction).toBe('Cancel ChatGPT');
    expect(chatgptResult.reason).toContain('primary use case is \'coding\', Claude is superior');
  });

  // -------------------------------------------------------------
  // Test Scenario 5: API Direct Power User Arbitrage
  // -------------------------------------------------------------
  it('should recommend flat-rate retail plans for solo API power users', () => {
    const input: AuditInput = {
      teamSize: 1,
      primaryUseCase: 'coding',
      tools: [
        {
          toolId: 'anthropic-api',
          planId: 'api',
          seats: 1,
          monthlySpend: 85 // spending $85/mo on API tokens
        }
      ]
    };

    const result = runAudit(input);

    // Switch to flat-rate Claude Pro ($20/mo), saving $65/mo
    expect(result.totalMonthlySavings).toBe(65);
    
    const apiResult = result.breakdown.find(t => t.toolId === 'anthropic-api')!;
    expect(apiResult.recommendedPlan).toBe('Pro');
    expect(apiResult.recommendedSpend).toBe(20);
    expect(apiResult.recommendedAction).toBe('Switch to Claude Pro');
    expect(apiResult.reason).toContain('switching to a flat $20/mo retail subscription');
  });

  // -------------------------------------------------------------
  // Test Scenario 6: Already Optimal Setup (Honesty Check)
  // -------------------------------------------------------------
  it('should verify correct configurations yield zero manufacturing savings', () => {
    const input: AuditInput = {
      teamSize: 10,
      primaryUseCase: 'mixed',
      tools: [
        {
          toolId: 'chatgpt',
          planId: 'team',
          seats: 10,
          monthlySpend: 250 // 10 * $25 annual billing rate
        }
      ]
    };

    const result = runAudit(input);

    expect(result.totalMonthlySavings).toBe(0);
    expect(result.isAlreadyOptimal).toBe(true);
    
    const chatgptResult = result.breakdown.find(t => t.toolId === 'chatgpt')!;
    expect(chatgptResult.recommendedAction).toBe('Maintain Current Plan');
    expect(chatgptResult.recommendedSpend).toBe(250);
  });
});
