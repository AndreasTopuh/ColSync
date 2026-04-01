import { PremiumTier } from './premium';
import { getAccessToken } from './supabase/session';

interface RedeemResponse {
  tier: PremiumTier;
  creditsUsed: number;
  unlockedAt: string | null;
}

export interface UserResultRow {
  id: string;
  dominant_color: string;
  secondary_color: string;
  result_data: Record<string, unknown> | null;
  created_at: string;
}

export interface UserProfileResponse {
  fullName: string | null;
}

async function authedFetch<T>(input: RequestInfo | URL, init: RequestInit): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Please login first to use premium features.');
  }

  const res = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });

  const payload = (await res.json().catch(() => null)) as { error?: string } | T | null;
  if (!res.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload ? payload.error : undefined;
    throw new Error(message || 'Request failed');
  }

  return payload as T;
}

export async function redeemPremiumCode(code: string): Promise<RedeemResponse> {
  const data = await authedFetch<{ subscription: RedeemResponse }>('/api/premium/redeem', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  return data.subscription;
}

export async function requestPremiumCode(tier: 'starter5' | 'pro20', note?: string): Promise<{ notifications?: { adminEmail?: string; adminEmailReason?: string | null; autoReply?: string; autoReplyReason?: string | null } }> {
  return authedFetch('/api/premium/request-code', {
    method: 'POST',
    body: JSON.stringify({ tier, note }),
  });
}

export async function fetchServerSubscription(): Promise<RedeemResponse> {
  const data = await authedFetch<{ subscription: RedeemResponse }>('/api/subscription', {
    method: 'GET',
  });
  return data.subscription;
}

export async function fetchUserResults(): Promise<UserResultRow[]> {
  const data = await authedFetch<{ results: UserResultRow[] }>('/api/results', {
    method: 'GET',
  });
  return data.results;
}

export async function fetchUserProfile(): Promise<UserProfileResponse> {
  return authedFetch<UserProfileResponse>('/api/profile/me', {
    method: 'GET',
  });
}

export async function updateUserProfile(fullName: string): Promise<{ success: boolean }> {
  return authedFetch<{ success: boolean }>('/api/profile/me', {
    method: 'PUT',
    body: JSON.stringify({ fullName }),
  });
}
