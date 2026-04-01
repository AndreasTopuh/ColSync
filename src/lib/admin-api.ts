import { getAccessToken } from './supabase/session';

export interface AdminUserSummary {
  id: string;
  email: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
}

export interface CodeRequestRow {
  id: string;
  user_id: string;
  email: string;
  note: string | null;
  status: string;
  requested_tier: string | null;
  generated_code: string | null;
  created_at: string;
}

export interface ReferralCodeRow {
  id: string;
  code: string;
  tier: 'starter5' | 'pro20';
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  createdAt: string;
  createdBy: string | null;
}

async function adminFetch<T>(url: string, init: RequestInit): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Please login first.');
  }

  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });

  const data = (await res.json().catch(() => null)) as { error?: string } | T | null;
  if (!res.ok) {
    const message = data && typeof data === 'object' && 'error' in data ? data.error : undefined;
    throw new Error(message || 'Request failed');
  }

  return data as T;
}

export async function fetchAdminUsers(): Promise<AdminUserSummary[]> {
  const payload = await adminFetch<{ users: AdminUserSummary[] }>('/api/admin/users', { method: 'GET' });
  return payload.users;
}

export async function fetchReferralCodes(): Promise<ReferralCodeRow[]> {
  const payload = await adminFetch<{ codes: ReferralCodeRow[] }>('/api/admin/referral-codes', { method: 'GET' });
  return payload.codes;
}

export async function fetchCodeRequests(): Promise<CodeRequestRow[]> {
  const payload = await adminFetch<{ requests: CodeRequestRow[] }>('/api/admin/code-requests', { method: 'GET' });
  return payload.requests;
}

export async function approveCodeRequest(input: {
  requestId: string;
  tier: 'starter5' | 'pro20';
}): Promise<{ codeMasked: string; emailStatus?: string; emailReason?: string | null; sentTo?: string }> {
  return adminFetch('/api/admin/send-code', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
