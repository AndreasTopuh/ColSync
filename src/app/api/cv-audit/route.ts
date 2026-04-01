import { NextRequest, NextResponse } from 'next/server';
import { requireUserFromRequest } from '@/lib/supabase/auth-guard';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { consumeServerCredit, refundServerCredit } from '@/lib/supabase/credits';
import { checkRateLimit } from '@/lib/rate-limit';
import { cvAuditSchema, formatZodError } from '@/lib/validations';
import { runPythonCVPipeline } from '@/lib/python-cv-agent';

export const runtime = 'nodejs';

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  // Rate limiting: 10 requests per minute per IP
  const rateLimit = checkRateLimit(request, 'cv-audit', { limit: 10, windowMs: 60 * 1000 });
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
    route: '/api/cv-audit',
  });
  if (!creditResult.ok) {
    return NextResponse.json({ error: creditResult.error }, { status: creditResult.status });
  }

  try {
    const body = await request.json();
    const parsed = cvAuditSchema.safeParse(body);

    if (!parsed.success) {
      await refundServerCredit(supabase, user.id, { requestId, route: '/api/cv-audit' });
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const { cvText, jobDescription, uploadedDoc } = parsed.data;

    // Validate uploaded file size (base64 is ~33% larger than raw)
    if (uploadedDoc?.base64) {
      const estimatedBytes = (uploadedDoc.base64.length * 3) / 4;
      if (estimatedBytes > MAX_UPLOAD_SIZE_BYTES) {
        await refundServerCredit(supabase, user.id, { requestId, route: '/api/cv-audit' });
        return NextResponse.json(
          { error: 'File too large. Maximum size is 5 MB.' },
          { status: 400 },
        );
      }

      // Validate MIME type
      const allowedTypes = [
        'application/pdf',
        'text/plain',
        'text/markdown',
        'image/png',
        'image/jpeg',
        'image/webp',
      ];
      if (!allowedTypes.includes(uploadedDoc.mimeType)) {
        await refundServerCredit(supabase, user.id, { requestId, route: '/api/cv-audit' });
        return NextResponse.json(
          { error: `Unsupported file type: ${uploadedDoc.mimeType}. Use PDF, TXT, or image files.` },
          { status: 400 },
        );
      }
    }

    const effectiveCVText = cvText?.trim() || '';
    if (!effectiveCVText && !uploadedDoc) {
      await refundServerCredit(supabase, user.id, { requestId, route: '/api/cv-audit' });
      return NextResponse.json(
        { error: 'Please paste CV text or upload a CV file (PDF/image/text).' },
        { status: 400 },
      );
    }

    const pipelineOutput = await runPythonCVPipeline({
      cvText: effectiveCVText,
      jobDescription,
      uploadedDoc: uploadedDoc
        ? {
            name: uploadedDoc.name,
            mimeType: uploadedDoc.mimeType,
            base64: uploadedDoc.base64,
          }
        : undefined,
    });
    const pipeline = pipelineOutput.result;

    const audit = (pipeline.audit || {}) as Record<string, unknown>;

    console.info('[ai-provider-trace]', {
      requestId,
      route: '/api/cv-audit',
      trace: pipelineOutput.meta.providerTrace,
    });

    // Log usage event
    await supabase.from('usage_events').insert({
      user_id: user.id,
      event_name: 'ai.cv_audit',
      event_data: { jobDescription: jobDescription?.slice(0, 200) },
    });

    // Save to cv_audit_history
    await supabase.from('cv_audit_history').insert({
      user_id: user.id,
      job_title: jobDescription?.slice(0, 500) || 'General Audit',
      match_score: (audit.matchScore as number) || 0,
      ats_score: (audit.atsScore as number) || 0,
      result_data: {
        ...audit,
        summary: pipeline.summary,
        source: pipeline.source || 'python_agents_flow',
      },
    }).then(({ error }) => {
      if (error) console.error('Failed to save cv_audit_history:', error.message);
    });

    return NextResponse.json({
      ...audit,
      summary: pipeline.summary,
      source: pipeline.source || 'python_agents_flow',
    });
  } catch (error) {
    // Refund credit on failure
    await refundServerCredit(supabase, user.id, { requestId, route: '/api/cv-audit' });

    console.error('HR Expert agent error:', error);
    return NextResponse.json(
      { error: 'Failed to audit CV. Credit has been refunded. Please try again.' },
      { status: 500 },
    );
  }
}
