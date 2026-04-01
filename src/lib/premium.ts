import { loadData, saveData, PlanTier } from './storage';

export type PremiumTier = PlanTier;

// IMPORTANT: Premium codes are validated SERVER-SIDE ONLY in /api/premium/redeem.
// Never store codes in client-side code.


const PLAN_LIMITS: Record<PremiumTier, number> = {
  free: 0,
  starter5: 3,
  pro20: 6,
};

const PLAN_LABELS: Record<PremiumTier, string> = {
  free: 'Free',
  starter5: 'Starter (3 credits)',
  pro20: 'Pro (6 credits)',
};

export interface PremiumStatus {
  tier: PremiumTier;
  unlockedAt: string | null;
  creditsUsed: number;
}

export function getPremiumStatus(): PremiumStatus {
  if (typeof window === 'undefined') {
    return { tier: 'free', unlockedAt: null, creditsUsed: 0 };
  }

  const data = loadData();
  return data.subscription;
}

// unlockPremium removed -code redemption is now server-only via /api/premium/redeem.
// Use redeemPremiumCode() from premium-api.ts instead.

export function isPremium(): boolean {
  return getPremiumStatus().tier !== 'free';
}

export function getPlanLabel(tier: PremiumTier): string {
  return PLAN_LABELS[tier];
}

export function getPlanLimit(tier: PremiumTier): number {
  return PLAN_LIMITS[tier];
}

export function getRemainingCredits(): number {
  const status = getPremiumStatus();
  return Math.max(0, PLAN_LIMITS[status.tier] - status.creditsUsed);
}

export function consumeAICredit(): boolean {
  const data = loadData();
  const limit = PLAN_LIMITS[data.subscription.tier];

  if (data.subscription.tier === 'free') {
    return false;
  }

  if (data.subscription.creditsUsed >= limit) {
    return false;
  }

  data.subscription.creditsUsed += 1;
  saveData(data);
  return true;
}

export function refundAICredit(): void {
  const data = loadData();
  data.subscription.creditsUsed = Math.max(0, data.subscription.creditsUsed - 1);
  saveData(data);
}

// Features access control
export const FEATURES = {
  test: { requiredTier: 'free' as PremiumTier, label: 'Personality Test' },
  basicResult: { requiredTier: 'free' as PremiumTier, label: 'Basic Results' },
  fullResult: { requiredTier: 'starter5' as PremiumTier, label: 'Full Detailed Results' },
  pdfDownload: { requiredTier: 'starter5' as PremiumTier, label: 'PDF Report Download' },
  fullProfile: { requiredTier: 'starter5' as PremiumTier, label: 'Full Personality Profile' },
  careerInsights: { requiredTier: 'starter5' as PremiumTier, label: 'Career Insights' },
  jobMatching: { requiredTier: 'starter5' as PremiumTier, label: 'AI Job Matching' },
  cvAudit: { requiredTier: 'starter5' as PremiumTier, label: 'CV Audit & Feedback' },
  roadmapBasic: { requiredTier: 'pro20' as PremiumTier, label: 'Learning Roadmap' },
  roadmapUpdate: { requiredTier: 'pro20' as PremiumTier, label: 'Roadmap Updates & Gamification' },
  dashboard: { requiredTier: 'free' as PremiumTier, label: 'Full Dashboard' },
};

const TIER_RANK: Record<PremiumTier, number> = {
  free: 0,
  starter5: 1,
  pro20: 2,
};

export function canAccess(feature: keyof typeof FEATURES): boolean {
  const status = getPremiumStatus();
  const required = FEATURES[feature].requiredTier;
  return TIER_RANK[status.tier] >= TIER_RANK[required];
}
