import { NextRequest, NextResponse } from 'next/server';
import { requireUserFromRequest } from '@/lib/supabase/auth-guard';
import { QuizResult } from '@/lib/quiz-engine';
import { checkRateLimit } from '@/lib/rate-limit';
import { analyzeSchema, formatZodError } from '@/lib/validations';
import { runPythonProfilerPipeline } from '@/lib/python-profiler-agent';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  // Rate limiting: 10 requests per minute per IP
  const rateLimit = checkRateLimit(request, 'analyze', { limit: 10, windowMs: 60 * 1000 });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  // Auth guard -profiler is free but still requires login
  const { user, error: authError, status: authStatus } = await requireUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: authError }, { status: authStatus });
  }

  try {
    const body = await request.json();
    const parsed = analyzeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const result: QuizResult = parsed.data;

    const pipeline = await runPythonProfilerPipeline(result as unknown as Record<string, unknown>);

    console.info('[ai-provider-trace]', {
      requestId,
      route: '/api/analyze',
      trace: pipeline.meta.providerTrace,
    });

    return NextResponse.json(pipeline.result);
  } catch (error) {
    console.error('Profiler agent error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze personality. Please try again.' },
      { status: 500 },
    );
  }
}
