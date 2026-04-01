import { NextRequest, NextResponse } from 'next/server';
import { requireUserFromRequest } from '@/lib/supabase/auth-guard';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { consumeServerCredit, refundServerCredit } from '@/lib/supabase/credits';
import { checkRateLimit } from '@/lib/rate-limit';
import { ColorKey } from '@/lib/personality-data';
import { fetchTechJobs } from '@/lib/job-sources';
import { jobSearchSchema, formatZodError } from '@/lib/validations';
import { runPythonHunterPipeline } from '@/lib/python-hunter-agent';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  // Rate limiting: 10 requests per minute per IP
  const rateLimit = checkRateLimit(request, 'job-search', { limit: 10, windowMs: 60 * 1000 });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  // 1. Auth guard
  const { user, error: authError, status: authStatus } = await requireUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: authError }, { status: authStatus });
  }

  // 2. Server-side credit check
  const supabase = createSupabaseAdminClient();
  const creditResult = await consumeServerCredit(supabase, user.id, {
    requestId,
    route: '/api/job-search',
  });
  if (!creditResult.ok) {
    return NextResponse.json({ error: creditResult.error }, { status: creditResult.status });
  }

  try {
    const body = await request.json();
    const parsed = jobSearchSchema.safeParse(body);

    if (!parsed.success) {
      await refundServerCredit(supabase, user.id, { requestId, route: '/api/job-search' });
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const { dominant, secondary, interests, location } = parsed.data;
    const sec = (secondary || dominant) as ColorKey;
    const resolvedLocation = location || 'Remote / Global';

    const listings = await fetchTechJobs(interests, resolvedLocation);

    const listingPayload = listings.map((job) => ({
      title: job.title,
      company: job.company,
      location: job.location,
      source: job.source,
      tags: job.tags,
    }));

    let pipeline;
    try {
      pipeline = await runPythonHunterPipeline({
        dominant: dominant as ColorKey,
        secondary: sec,
        interests,
        location: resolvedLocation,
        listings: listingPayload,
      });
    } catch (primaryError) {
      console.warn('[job-search] Hunter pipeline failed with listings context, retrying without listings.', {
        requestId,
        error: primaryError instanceof Error ? primaryError.message : String(primaryError),
      });

      pipeline = await runPythonHunterPipeline({
        dominant: dominant as ColorKey,
        secondary: sec,
        interests,
        location: resolvedLocation,
        listings: [],
      });
    }
    const jobs = pipeline.result;

    console.info('[ai-provider-trace]', {
      requestId,
      route: '/api/job-search',
      trace: pipeline.meta.providerTrace,
    });

    // Log usage event
    await supabase.from('usage_events').insert({
      user_id: user.id,
      event_name: 'ai.job_search',
      event_data: { dominant, interests: interests?.slice(0, 200) },
    });

    // Save to job_search_history
    await supabase.from('job_search_history').insert({
      user_id: user.id,
      query_data: { dominant, secondary: sec, interests, location: resolvedLocation },
      result_data: jobs,
    }).then(({ error }) => {
      if (error) console.error('Failed to save job_search_history:', error.message);
    });

    return NextResponse.json({ ...jobs, listingsCount: listings.length });
  } catch (error) {
    // Refund credit on AI failure
    await refundServerCredit(supabase, user.id, { requestId, route: '/api/job-search' });

    const message = error instanceof Error ? error.message : 'Unknown error';
    const err = error as { status?: number };
    const status = err?.status;
    console.error('Hunter agent error:', message);

    if (
      status === 401 ||
      message.includes('API key') ||
      message.includes('Incorrect API key') ||
      message.includes('401')
    ) {
      return NextResponse.json(
        { error: 'API key is invalid or expired. Please contact support.' },
        { status: 401 },
      );
    }

    if (status === 429 || message.includes('429') || message.includes('Rate limit')) {
      return NextResponse.json(
        { error: 'Rate limited by the AI provider. Please wait a moment and try again.' },
        { status: 429 },
      );
    }

    if (message.includes('insufficient_quota')) {
      return NextResponse.json(
        { error: 'AI provider quota exceeded. Please contact support.' },
        { status: 402 },
      );
    }

    if (message.includes('No LLM provider configured')) {
      return NextResponse.json(
        { error: 'AI provider is not configured. Please contact support.' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: `Failed to search jobs. Credit has been refunded.` },
      { status: 500 },
    );
  }
}
