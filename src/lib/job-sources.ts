export interface JobListing {
  title: string;
  company: string;
  location: string;
  source: string;
  url?: string;
  tags: string[];
}

const FETCH_TIMEOUT_MS = 7000;

function fetchWithTimeout(input: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timer);
  });
}

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function toSearchKeywords(interests: string) {
  const base = [
    'software',
    'developer',
    'engineer',
    'frontend',
    'backend',
    'full stack',
    'data',
    'ai',
    'ml',
    'devops',
    'cloud',
    'security',
    'product',
    'ui ux',
  ];

  const fromInterests = interests
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((w) => w.length > 2);

  return Array.from(new Set([...fromInterests, ...base]));
}

function isTechRelevant(job: JobListing, keywords: string[]) {
  const haystack = normalizeText(
    `${job.title} ${job.company} ${job.location} ${job.tags.join(' ')}`,
  );

  return keywords.some((keyword) => haystack.includes(normalizeText(keyword)));
}

async function fetchRemotiveJobs(search: string): Promise<JobListing[]> {
  const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(search)}`;
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`Remotive ${response.status}`);
  }

  const data = (await response.json()) as {
    jobs?: Array<{
      title?: string;
      company_name?: string;
      candidate_required_location?: string;
      url?: string;
      tags?: string[];
    }>;
  };

  return (data.jobs || [])
    .filter((job) => job.title && job.company_name)
    .map((job) => ({
      title: job.title || 'Unknown role',
      company: job.company_name || 'Unknown company',
      location: job.candidate_required_location || 'Remote',
      url: job.url,
      source: 'Remotive',
      tags: job.tags || [],
    }));
}

async function fetchRemoteOkJobs(): Promise<JobListing[]> {
  const response = await fetchWithTimeout('https://remoteok.com/api', {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'colsync/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`RemoteOK ${response.status}`);
  }

  const data = (await response.json()) as Array<{
    position?: string;
    company?: string;
    location?: string;
    url?: string;
    tags?: string[];
  }>;

  return (data || [])
    .filter((row) => row.position && row.company)
    .map((row) => ({
      title: row.position || 'Unknown role',
      company: row.company || 'Unknown company',
      location: row.location || 'Remote',
      url: row.url,
      source: 'RemoteOK',
      tags: row.tags || [],
    }));
}

function dedupeJobs(jobs: JobListing[]) {
  const seen = new Set<string>();

  return jobs.filter((job) => {
    const key = `${normalizeText(job.title)}::${normalizeText(job.company)}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export async function fetchTechJobs(interests: string, location: string): Promise<JobListing[]> {
  const keywords = toSearchKeywords(interests);
  const primarySearch = keywords.slice(0, 4).join(' ');

  const [remotiveResult, remoteOkResult] = await Promise.allSettled([
    fetchRemotiveJobs(primarySearch),
    fetchRemoteOkJobs(),
  ]);

  const merged: JobListing[] = [];

  if (remotiveResult.status === 'fulfilled') {
    merged.push(...remotiveResult.value);
  }

  if (remoteOkResult.status === 'fulfilled') {
    merged.push(...remoteOkResult.value);
  }

  if (!merged.length) {
    return [];
  }

  const locationHint = location.toLowerCase().includes('remote')
    ? 'remote'
    : location.toLowerCase();

  const relevant = dedupeJobs(merged).filter((job) => {
    const locationMatch =
      locationHint === 'remote' || normalizeText(job.location).includes(locationHint);

    return locationMatch || isTechRelevant(job, keywords);
  });

  return relevant.slice(0, 40);
}
