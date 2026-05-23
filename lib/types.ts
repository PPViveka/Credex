export type ToolId =
  | 'cursor'
  | 'copilot'
  | 'claude'
  | 'chatgpt'
  | 'anthropic-api'
  | 'openai-api'
  | 'gemini'
  | 'windsurf';

export interface ToolInput {
  toolId: ToolId;
  planId: string; // 'free' | 'pro' | 'business' | 'enterprise' | 'individual' | 'plus' | 'team' | 'api'
  seats: number;
  monthlySpend: number;
}

export interface AuditInput {
  teamSize: number;
  primaryUseCase: 'coding' | 'writing' | 'data' | 'research' | 'mixed';
  tools: ToolInput[];
}

export interface ToolAuditResult {
  toolId: ToolId;
  toolName: string;
  currentPlan: string;
  currentSeats: number;
  currentSpend: number;
  recommendedPlan: string;
  recommendedSeats: number;
  recommendedSpend: number;
  recommendedAction: string; // 'Maintain Current Plan' | 'Downgrade to Pro' | 'Switch to Copilot' etc.
  savings: number;
  reason: string;
}

export interface AuditResult {
  totalCurrentSpend: number;
  totalRecommendedSpend: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  isAlreadyOptimal: boolean;
  breakdown: ToolAuditResult[];
}
