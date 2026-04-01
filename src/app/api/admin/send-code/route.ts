import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isAdminEmail, getBearerToken } from '@/lib/supabase/auth-guard';
import { hashPremiumCode } from '@/lib/hash-code';
import {
  getEmailJsConfig,
  mapEmailJsFailureReason,
  resolveCodeDeliveryTemplate,
  sendEmailJsTemplate,
} from '@/lib/emailjs';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CS-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += '-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function maskCode(code: string): string {
  // Show only last 4 characters: CS-****-AB12 → ****AB12
  return code.length > 4 ? '****' + code.slice(-4) : '****';
}

function maskEmail(email: string): string {
  return email.replace(/(.{2}).+(@)/, '$1***$2');
}

const TIER_LABELS: Record<string, string> = {
  starter5: 'Starter (5 credits)',
  pro20: 'Pro (20 credits)',
};

export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user || !isAdminEmail(userData.user.email || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await req.json().catch(() => null)) as {
      requestId?: string;
      tier?: string;
    } | null;

    if (!body?.requestId || !body?.tier) {
      return NextResponse.json({ error: 'Missing fields: requestId, tier' }, { status: 400 });
    }

    const requestTier = body.tier === 'pro20' ? 'pro20' : 'starter5';

    const { data: requestRow, error: requestError } = await supabase
      .from('premium_code_requests')
      .select('id, email, user_id, status, note, requested_tier, generated_code, created_at')
      .eq('id', body.requestId)
      .single();

    if (requestError || !requestRow) {
      return NextResponse.json({ error: 'Premium code request not found' }, { status: 404 });
    }

    if (requestRow.status === 'approved' && requestRow.generated_code) {
      return NextResponse.json(
        {
          ok: true,
          code: requestRow.generated_code,
          emailStatus: 'skipped',
          emailReason: 'already_approved',
          sentTo: requestRow.email,
        },
        { status: 200 },
      );
    }

    const tier = requestRow.requested_tier === 'pro20' ? 'pro20' : requestTier;
    const code = generateCode();
    const requesterEmail = requestRow.email || '';

    // 1. Save code to premium_codes table
    const { error: codeInsertError } = await supabase.from('premium_codes').insert({
      code_hash: hashPremiumCode(code),
      tier,
      max_uses: 1,
      used_count: 0,
      expires_at: null,
      created_by: userData.user.email || 'admin',
    });

    if (codeInsertError) {
      console.error('Failed to insert premium code:', codeInsertError);
      return NextResponse.json({ error: `Failed to generate code: ${codeInsertError.message}` }, { status: 500 });
    }

    // 3. Mark request as approved and store the generated code
    await supabase
      .from('premium_code_requests')
      .update({ status: 'approved', generated_code: code, requested_tier: tier })
      .eq('id', body.requestId);

    // 4. Send code to USER via EmailJS using Contact Us template
    let emailStatus: 'sent' | 'failed' | 'skipped' = 'skipped';
    let emailReason: string | null = null;
    const emailConfig = getEmailJsConfig();
    const templateId = emailConfig.contactTemplateId;

    if (!templateId) {
      emailReason = 'missing_contact_template';
      console.error('Code delivery skipped: EMAILJS_TEMPLATE_CONTACT_ID not configured');
    }

    if (emailConfig.serviceId && templateId && emailConfig.publicKey && requesterEmail) {
      const activationLink = process.env.NEXT_PUBLIC_APP_URL?.trim()
        ? `${process.env.NEXT_PUBLIC_APP_URL!.trim().replace(/\/$/, '')}/dashboard`
        : 'https://colsync.dev/dashboard';
      try {
        console.log(`Sending code delivery email to ${maskEmail(requesterEmail)} using template ${templateId}`);
        await sendEmailJsTemplate({
          serviceId: emailConfig.serviceId,
          templateId,
          publicKey: emailConfig.publicKey,
          privateKey: emailConfig.privateKey,
          params: {
            to_email: requesterEmail,
            to_name: requesterEmail,
            from_name: 'ColSync Team',
            from_email: emailConfig.supportEmail,
            reply_to: emailConfig.supportEmail,
            email: requesterEmail,
            name: requesterEmail,
            requester_email: requesterEmail,
            support_email: emailConfig.supportEmail,
            request_id: body.requestId,
            requested_at: requestRow.created_at,
            note: requestRow.note || '',
            tier_label: TIER_LABELS[tier],
            code,
            activation_link: activationLink,
            time: new Date().toISOString(),
            subject: `Your ColSync Premium Code - ${TIER_LABELS[tier]}`,
            title: `Your Premium Code is Ready!`,
            message:
              `Your premium code is ready!\n\n` +
              `Code: ${code}\n` +
              `Pack: ${TIER_LABELS[tier]}\n\n` +
              `Open your ColSync dashboard (${activationLink}) and enter this code in the Activate Plan field.\n\n` +
              `If you need help, reply to ${emailConfig.supportEmail}.`,
          },
        });
        emailStatus = 'sent';
        console.log(`Code delivery email sent to ${maskEmail(requesterEmail)}`);
      } catch (emailErr) {
        console.error('Failed to send code email to user:', emailErr);
        emailStatus = 'failed';
        emailReason = mapEmailJsFailureReason(emailErr);
      }
    } else {
      console.error('Code delivery skipped - missing config:', {
        serviceId: !!emailConfig.serviceId,
        templateId: !!templateId,
        publicKey: !!emailConfig.publicKey,
        requesterEmail: !!requesterEmail,
      });
    }

    // 5. Log event (no plaintext code in logs)
    await supabase.from('usage_events').insert({
      user_id: userData.user.id,
      event_name: 'premium.code_generated',
      event_data: {
        tier,
        codeMasked: maskCode(code),
        requestId: body.requestId,
        emailStatus,
        emailReason,
      },
    });

    return NextResponse.json({ ok: true, codeMasked: maskCode(code), emailStatus, emailReason, sentTo: requesterEmail });
  } catch (err) {
    console.error('send-code error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
