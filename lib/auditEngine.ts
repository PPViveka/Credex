import { AuditInput, AuditResult, ToolAuditResult, ToolId } from './types';

// Centralized pricing registry matching PRICING_DATA.md
export const PRICING_REGISTRY: Record<ToolId, Record<string, { name: string; pricePerSeat: number; minSeats?: number }>> = {
  cursor: {
    hobby: { name: 'Hobby', pricePerSeat: 0 },
    pro: { name: 'Pro', pricePerSeat: 20 },
    business: { name: 'Business', pricePerSeat: 40 },
    enterprise: { name: 'Enterprise', pricePerSeat: 100 }
  },
  copilot: {
    individual: { name: 'Individual', pricePerSeat: 10 },
    business: { name: 'Business', pricePerSeat: 19 },
    enterprise: { name: 'Enterprise', pricePerSeat: 39 }
  },
  windsurf: {
    individual: { name: 'Individual (Free)', pricePerSeat: 0 },
    pro: { name: 'Pro', pricePerSeat: 15 },
    team: { name: 'Team', pricePerSeat: 30 },
    enterprise: { name: 'Enterprise', pricePerSeat: 75 }
  },
  claude: {
    free: { name: 'Free', pricePerSeat: 0 },
    pro: { name: 'Pro', pricePerSeat: 20 },
    max: { name: 'Max (Pro Max)', pricePerSeat: 40 },
    team: { name: 'Team', pricePerSeat: 30, minSeats: 5 }, // Claude Team has a 5-seat minimum ($150/mo base)
    enterprise: { name: 'Enterprise', pricePerSeat: 75 }
  },
  chatgpt: {
    free: { name: 'Free', pricePerSeat: 0 },
    plus: { name: 'Plus', pricePerSeat: 20 },
    team: { name: 'Team', pricePerSeat: 30, minSeats: 2 }, // ChatGPT Team has a 2-seat minimum
    enterprise: { name: 'Enterprise', pricePerSeat: 60 }
  },
  gemini: {
    free: { name: 'Free', pricePerSeat: 0 },
    pro: { name: 'Pro / Advanced', pricePerSeat: 20 },
    ultra: { name: 'Ultra / Workspace AI', pricePerSeat: 30 }
  },
  'anthropic-api': {
    api: { name: 'API Direct (Usage-based)', pricePerSeat: 0 }
  },
  'openai-api': {
    api: { name: 'API Direct (Usage-based)', pricePerSeat: 0 }
  }
};

/**
 * Runs the deterministic, finance-literate audit calculation on the user's stack inputs.
 */
export function runAudit(input: AuditInput): AuditResult {
  const teamSize = input.teamSize;
  const useCase = input.primaryUseCase;
  const inputTools = input.tools;

  const breakdown: ToolAuditResult[] = [];
  let totalCurrentSpend = 0;
  let totalRecommendedSpend = 0;

  // Track active tool IDs to check for multi-tool redundancies
  const activeToolIds = new Set<ToolId>(inputTools.map(t => t.toolId));
  
  // Check for dual IDE subscriptions (Cursor and GitHub Copilot)
  const hasCursor = activeToolIds.has('cursor');

  // Check for dual general assistants (Claude and ChatGPT retail subscriptions)
  const hasClaude = activeToolIds.has('claude');
  const hasChatGPT = activeToolIds.has('chatgpt');

  for (const tool of inputTools) {
    const { toolId, planId, seats, monthlySpend } = tool;
    
    // Fallback registry matching if plan not found
    const toolPlans = PRICING_REGISTRY[toolId] || {};
    const planDetails = toolPlans[planId] || { name: planId, pricePerSeat: monthlySpend / (seats || 1) };
    
    const currentSpend = monthlySpend;
    totalCurrentSpend += currentSpend;

    let recPlan = planId;
    let recSeats = seats;
    let recSpend = currentSpend;
    let recAction = 'Maintain Current Plan';
    let reason = 'Your subscription is sized correctly for your team and use case.';

    // -------------------------------------------------------------
    // RULE 1: SEAT OVER-PROVISIONING (Paying for ghost seats)
    // -------------------------------------------------------------
    if (seats > teamSize && planId !== 'free' && !toolId.endsWith('-api')) {
      const perSeatCost = planDetails.pricePerSeat;
      
      // Let's account for minimum seat restrictions
      let targetSeats = teamSize;
      if (planDetails.minSeats && targetSeats < planDetails.minSeats) {
        targetSeats = planDetails.minSeats;
      }

      if (targetSeats < seats) {
        recSeats = targetSeats;
        recSpend = targetSeats * perSeatCost;
        recAction = `Reduce Seats to ${targetSeats}`;
        reason = `You have ${seats} seats registered but your team size is ${teamSize}. Saving ${seats - targetSeats} seat(s) cuts waste immediately.`;
      }
    }

    // -------------------------------------------------------------
    // RULE 2: CLAUDE TEAM MINIMUM SEATS WASTAGE
    // -------------------------------------------------------------
    if (toolId === 'claude' && planId === 'team' && teamSize < 5) {
      // Claude Team has a 5-seat minimum ($150/mo). If teamSize is small, paying for 5 seats is waste.
      const proPlan = toolPlans['pro'];
      const targetSpend = teamSize * proPlan.pricePerSeat;
      
      if (targetSpend < recSpend) {
        recPlan = 'pro';
        recSeats = teamSize;
        recSpend = targetSpend;
        recAction = 'Downgrade to Pro (Individual)';
        reason = `Claude Team bills a 5-seat minimum ($150/mo). Downgrading to ${teamSize} individual Pro account(s) saves $${currentSpend - targetSpend}/mo without losing core features.`;
      }
    }

    // -------------------------------------------------------------
    // RULE 3: IDE COMPLETION REDUNDANCY (Cursor + Copilot + Windsurf)
    // -------------------------------------------------------------
    if (toolId === 'copilot' && hasCursor && planId !== 'free') {
      // If they have Cursor AND Copilot, they are double paying for autocomplete. 
      // Cursor has elite built-in autocomplete (Copilot++), rendering Copilot redundant.
      recSeats = 0;
      recSpend = 0;
      recPlan = 'none';
      recAction = 'Cancel GitHub Copilot';
      reason = 'You are already paying for Cursor. Cursor includes its own built-in next-generation code autocomplete, making Copilot redundant.';
    }

    if (toolId === 'windsurf' && hasCursor && planId !== 'free') {
      // Dual IDE subscriptions (Cursor + Windsurf)
      recSeats = 0;
      recSpend = 0;
      recPlan = 'none';
      recAction = 'Cancel Windsurf';
      reason = 'You have both Cursor and Windsurf active. We recommend standardizing on Cursor for your team and canceling Windsurf to remove IDE overlap.';
    }

    // -------------------------------------------------------------
    // RULE 4: GENERAL CHAT ASSISTANT DUPLICATION (Claude Pro + ChatGPT Plus)
    // -------------------------------------------------------------
    if (toolId === 'chatgpt' && hasClaude && planId !== 'free' && planId !== 'api') {
      // If they are on both Claude Pro and ChatGPT Plus, we recommend consolidating.
      // If primary usecase is coding, we keep Claude. If writing/mixed, we keep ChatGPT.
      if (useCase === 'coding' || useCase === 'research') {
        recSeats = 0;
        recSpend = 0;
        recPlan = 'none';
        recAction = 'Cancel ChatGPT';
        reason = `Your team is double-subscribed to Claude and ChatGPT. Since your primary use case is '${useCase}', Claude is superior. Consolidate and cancel ChatGPT.`;
      }
    }

    if (toolId === 'claude' && hasChatGPT && planId !== 'free' && planId !== 'team' && planId !== 'api' && planId !== 'enterprise') {
      if (useCase === 'writing' || useCase === 'data' || useCase === 'mixed') {
        recSeats = 0;
        recSpend = 0;
        recPlan = 'none';
        recAction = 'Cancel Claude Pro';
        reason = `Your team is double-subscribed to Claude and ChatGPT. Since your primary use case is '${useCase}', ChatGPT is more versatile. Consolidate and cancel Claude.`;
      }
    }

    // -------------------------------------------------------------
    // RULE 5: ENTERPRISE PLAN OVERKILL FOR SMALL TEAMS
    // -------------------------------------------------------------
    if (planId === 'enterprise' && teamSize < 15 && !toolId.endsWith('-api')) {
      const businessPlan = toolPlans['business'] || toolPlans['team'] || toolPlans['pro'];
      if (businessPlan) {
        const targetSpend = recSeats * businessPlan.pricePerSeat;
        if (targetSpend < recSpend) {
          recPlan = toolPlans['business'] ? 'business' : (toolPlans['team'] ? 'team' : 'pro');
          recSpend = targetSpend;
          recAction = `Downgrade to ${toolPlans['business'] ? 'Business' : 'Team'}`;
          reason = `Enterprise contracts are overkill for teams under 15. Downgrading to the ${toolPlans['business'] ? 'Business' : 'Team'} plan retains core admin controls and slashes costs.`;
        }
      }
    }

    // -------------------------------------------------------------
    // RULE 6: API DIRECT VS FLAT-RATE ARBITRAGE (For solo developers)
    // -------------------------------------------------------------
    if (teamSize === 1 && (toolId === 'openai-api' || toolId === 'anthropic-api') && currentSpend > 40) {
      // If a solo dev is spending > $40/mo on API keys, they should buy flat-rate Claude/ChatGPT Pro!
      const isAnthropic = toolId === 'anthropic-api';
      const targetPlan = isAnthropic ? 'pro' : 'plus';
      
      recSeats = 1;
      recSpend = 20;
      recPlan = targetPlan;
      recAction = `Switch to ${isAnthropic ? 'Claude Pro' : 'ChatGPT Plus'}`;
      reason = `You are spending $${currentSpend}/mo on direct API usage. As a solo dev, switching to a flat $20/mo retail subscription gives you uncapped high-context interactions at half the price.`;
    }

    // -------------------------------------------------------------
    // RULE 7: RETAIL TO API MIGRATION FOR LOW USAGE
    // -------------------------------------------------------------
    if (teamSize <= 3 && planId !== 'free' && !toolId.endsWith('-api') && currentSpend > 0 && useCase === 'mixed' && (toolId === 'claude' || toolId === 'chatgpt') && planId === 'pro') {
      // If a very small team is paying for retail chat assistants but has extremely light, sporadic mixed usage,
      // switching to a pay-as-you-go API client can save significant cash if we assume low-volume token math.
      // E.g., low volume = $5/mo per user.
      const apiSpend = teamSize * 5;
      if (apiSpend < currentSpend) {
        // Let's suggest this as an optional optimization
        // (we won't force it unless it actually yields a net benefit)
      }
    }

    // -------------------------------------------------------------
    // FINAL CALCULATION FOR THIS TOOL
    // -------------------------------------------------------------
    const savings = Math.max(0, currentSpend - recSpend);
    totalRecommendedSpend += recSpend;

    let displayRecPlan = recPlan === 'none' ? 'None' : (toolPlans[recPlan]?.name || recPlan);
    
    if (recAction.startsWith('Switch to')) {
      const match = recAction.match(/Switch to (Claude Pro|ChatGPT Plus)/);
      if (match) {
        const targetToolId: ToolId = match[1].includes('Claude') ? 'claude' : 'chatgpt';
        const targetPlans = PRICING_REGISTRY[targetToolId];
        if (targetPlans && targetPlans[recPlan]) {
          displayRecPlan = targetPlans[recPlan].name;
        }
      }
    }

    breakdown.push({
      toolId,
      toolName: getToolDisplayName(toolId),
      currentPlan: planDetails.name,
      currentSeats: seats,
      currentSpend,
      recommendedPlan: displayRecPlan,
      recommendedSeats: recSeats,
      recommendedSpend: recSpend,
      recommendedAction: savings > 0 ? recAction : 'Maintain Current Plan',
      savings,
      reason: savings > 0 ? reason : recAction === 'Maintain Current Plan' ? reason : 'Your subscription is sized correctly.'
    });
  }

  const totalMonthlySavings = Math.max(0, totalCurrentSpend - totalRecommendedSpend);
  const totalAnnualSavings = totalMonthlySavings * 12;
  const isAlreadyOptimal = totalMonthlySavings < 10; // Optimal if saving less than $10/mo

  return {
    totalCurrentSpend,
    totalRecommendedSpend,
    totalMonthlySavings,
    totalAnnualSavings,
    isAlreadyOptimal,
    breakdown
  };
}

/**
 * Returns user-friendly display name for tools.
 */
function getToolDisplayName(toolId: ToolId): string {
  switch (toolId) {
    case 'cursor': return 'Cursor IDE';
    case 'copilot': return 'GitHub Copilot';
    case 'windsurf': return 'Windsurf IDE';
    case 'claude': return 'Claude AI';
    case 'chatgpt': return 'ChatGPT';
    case 'gemini': return 'Google Gemini';
    case 'anthropic-api': return 'Anthropic API';
    case 'openai-api': return 'OpenAI API';
    default: return toolId;
  }
}
