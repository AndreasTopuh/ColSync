import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getBearerToken } from '@/lib/supabase/auth-guard';
import {
  getEmailJsConfig,
  mapEmailJsFailureReason,
  sendEmailJsTemplate,
} from '@/lib/emailjs';

export async function POST(req: NextRequest) {
  // Rate limiting: 3 requests per minute per IP
  const { checkRateLimit } = await import('@/lib/rate-limit');
  const rateLimit = checkRateLimit(req, 'request-code', { limit: 3, windowMs: 60 * 1000 });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = (await req.json().catch(() => null)) as { note?: string; tier?: string } | null;

    const tier = payload?.tier === 'pro20' ? 'pro20' : 'starter5';

    const requestNote = payload?.note?.slice(0, 500) || null;
    const requesterEmail = userData.user.email || 'unknown@local';

    const { data: insertedRequest, error: insertError } = await supabase
      .from('premium_code_requests')
      .insert({
        user_id: userData.user.id,
        email: requesterEmail,
        note: requestNote,
        status: 'pending',
        requested_tier: tier,
      })
      .select('id')
      .single();

    if (insertError || !insertedRequest) {
      return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
    }

    await supabase.from('usage_events').insert({
      user_id: userData.user.id,
      event_name: 'premium.code_requested',
      event_data: { via: 'dashboard' },
    });

    const emailConfig = getEmailJsConfig();

    let adminEmailStatus: 'sent' | 'failed' | 'skipped' = 'skipped';
    let adminEmailReason: string | null = null;

    if (emailConfig.serviceId && emailConfig.contactTemplateId && emailConfig.publicKey) {
      const requestedAt = new Date().toISOString();
      const safeRequestNote = requestNote || 'No additional note.';

      try {
        await sendEmailJsTemplate({
          serviceId: emailConfig.serviceId,
          templateId: emailConfig.contactTemplateId,
          publicKey: emailConfig.publicKey,
          params: {
            app_name: 'ColSync',
            requester_email: requesterEmail,
            user_id: userData.user.id,
            request_id: insertedRequest.id,
            requested_tier: tier,
            note: safeRequestNote,
            requested_at: requestedAt,
            time: requestedAt,
            name: requesterEmail,
            title: `Premium Code Request - ${tier === 'pro20' ? 'Pro (20 credits)' : 'Starter (5 credits)'}`,
            support_email: emailConfig.supportEmail,
            to_email: emailConfig.supportEmail,
            to_name: 'ColSync Admin',
            from_name: requesterEmail,
            from_email: emailConfig.supportEmail,
            reply_to: requesterEmail,
            email: requesterEmail,
            subject: `Premium code request - ${requesterEmail}`,
            message:
              `User ${requesterEmail} requested a premium code.<br><br>` +
              `Pack: ${tier}<br>Request ID: ${insertedRequest.id}<br><br>` +
              `Note: ${safeRequestNote}<br><br>User ID: ${userData.user.id}`,
          },
          privateKey: emailConfig.privateKey,
        });
        adminEmailStatus = 'sent';
      } catch (emailErr) {
        console.error('Failed to send admin request email', emailErr);
        adminEmailStatus = 'failed';
        adminEmailReason = mapEmailJsFailureReason(emailErr);
      }
    }

    // Auto-reply to user is handled by the Contact Us template's built-in Auto-Reply tab in EmailJS.
    // No separate auto-reply email is sent from code to avoid duplicate emails.

    return NextResponse.json({
      ok: true,
      notifications: {
        adminEmail: adminEmailStatus,
        adminEmailReason,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
