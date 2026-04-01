import { QuizResult } from './quiz-engine';

const STORAGE_KEY = 'colsync_data';

export interface StoredProfile {
  name: string;
  email: string;
  createdAt: string;
}

export interface StoredResult {
  result: QuizResult;
  persona: Record<string, unknown> | null;
  timestamp: string;
}

export interface StoredJobSearch {
  query: { interests: string; location: string };
  results: Record<string, unknown>;
  timestamp: string;
}

export interface StoredCVAudit {
  matchScore: number;
  atsScore: number;
  jobTitle: string;
  timestamp: string;
  fullResult: Record<string, unknown>;
}

export interface StoredRoadmap {
  weeks: Array<{
    week: number;
    focus: string;
    completed: boolean;
    resources?: string[];
    milestone?: string;
    note?: string;
  }>;
  timestamp: string;
}

export type PlanTier = 'free' | 'starter5' | 'pro20';

export interface StoredSubscription {
  tier: PlanTier;
  unlockedAt: string | null;
  creditsUsed: number;
}

export interface ColSyncData {
  profile: StoredProfile | null;
  results: StoredResult[];
  jobSearches: StoredJobSearch[];
  cvAudits: StoredCVAudit[];
  roadmap: StoredRoadmap | null;
  subscription: StoredSubscription;
  lastUserId?: string;
}

const defaultData: ColSyncData = {
  profile: null,
  results: [],
  jobSearches: [],
  cvAudits: [],
  roadmap: null,
  subscription: {
    tier: 'free',
    unlockedAt: null,
    creditsUsed: 0,
  },
};

function normalizeData(data: Partial<ColSyncData> | null | undefined): ColSyncData {
  return {
    profile: data?.profile ?? defaultData.profile,
    results: data?.results ?? defaultData.results,
    jobSearches: data?.jobSearches ?? defaultData.jobSearches,
    cvAudits: data?.cvAudits ?? defaultData.cvAudits,
    roadmap: data?.roadmap ?? defaultData.roadmap,
    subscription: {
      tier: data?.subscription?.tier ?? defaultData.subscription.tier,
      unlockedAt: data?.subscription?.unlockedAt ?? defaultData.subscription.unlockedAt,
      creditsUsed: data?.subscription?.creditsUsed ?? defaultData.subscription.creditsUsed,
    },
    lastUserId: data?.lastUserId,
  };
}

export function loadData(): ColSyncData {
  if (typeof window === 'undefined') return defaultData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as Partial<ColSyncData>;
    return normalizeData(parsed);
  } catch {
    return defaultData;
  }
}

export function saveData(data: ColSyncData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveProfile(profile: StoredProfile): void {
  const data = loadData();
  data.profile = profile;
  saveData(data);
}

export function saveResult(result: QuizResult, persona: Record<string, unknown> | null = null): void {
  const data = loadData();
  // Only keep the latest result in localStorage (history lives in DB)
  data.results = [{
    result,
    persona,
    timestamp: new Date().toISOString(),
  }];
  saveData(data);
}

export function saveJobSearch(
  query: { interests: string; location: string },
  results: Record<string, unknown>,
): void {
  const data = loadData();
  // Only keep the latest job search in localStorage (history lives in DB)
  data.jobSearches = [{
    query,
    results,
    timestamp: new Date().toISOString(),
  }];
  saveData(data);
}

export function saveCVAudit(
  matchScore: number,
  atsScore: number,
  jobTitle: string,
  fullResult: Record<string, unknown>,
): void {
  const data = loadData();
  // Only keep the latest CV audit in localStorage (history lives in DB)
  data.cvAudits = [{
    matchScore,
    atsScore,
    jobTitle,
    timestamp: new Date().toISOString(),
    fullResult,
  }];
  saveData(data);
}

export function saveRoadmap(weeks: StoredRoadmap['weeks']): void {
  const data = loadData();
  data.roadmap = {
    weeks,
    timestamp: new Date().toISOString(),
  };
  saveData(data);
}

export function getLatestResult(): StoredResult | null {
  const data = loadData();
  return data.results[0] || null;
}

export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function setSubscription(subscription: StoredSubscription): void {
  const data = loadData();
  data.subscription = subscription;
  saveData(data);
}

/**
 * Ensure localStorage is scoped to the current user.
 * If a different user logs in on the same browser,
 * wipe user-specific cached data (jobs, CV audits, roadmap, results).
 */
export function ensureUserScope(userId: string): void {
  const data = loadData();
  if (data.lastUserId && data.lastUserId !== userId) {
    // Different user — clear stale data
    data.jobSearches = [];
    data.cvAudits = [];
    data.results = [];
    data.roadmap = null;
  }
  data.lastUserId = userId;
  saveData(data);
}
