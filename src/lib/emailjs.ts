import 'server-only';

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export interface EmailJsConfig {
  serviceId: string | null;
  contactTemplateId: string | null;
  autoReplyTemplateId: string | null;
  codeDeliveryTemplateId: string | null;
  publicKey: string | null;
  privateKey: string | null;
  supportEmail: string;
}

export function getEmailJsConfig(): EmailJsConfig {
  return {
    serviceId: readEnv('EMAILJS_SERVICE_ID'),
    contactTemplateId: readEnv('EMAILJS_TEMPLATE_CONTACT_ID'),
    autoReplyTemplateId: readEnv('EMAILJS_TEMPLATE_AUTOREPLY_ID'),
    codeDeliveryTemplateId: readEnv('EMAILJS_TEMPLATE_CODE_ID'),
    publicKey: readEnv('NEXT_PUBLIC_EMAILJS_PUBLIC_KEY') || readEnv('EMAILJS_PUBLIC_KEY'),
    privateKey: readEnv('EMAILJS_PRIVATE_KEY'),
    supportEmail:
      readEnv('EMAILJS_SUPPORT_EMAIL') ||
      readEnv('SUPPORT_EMAIL') ||
      'contactcolsync@gmail.com',
  };
}

export function resolveCodeDeliveryTemplate(config: EmailJsConfig): string | null {
  return config.codeDeliveryTemplateId;
}

export async function sendEmailJsTemplate(options: {
  serviceId: string;
  templateId: string;
  publicKey: string;
  privateKey?: string | null;
  params: Record<string, string>;
}) {
  const payload: Record<string, unknown> = {
    service_id: options.serviceId,
    template_id: options.templateId,
    user_id: options.publicKey,
    template_params: options.params,
  };

  if (options.privateKey) {
    payload.accessToken = options.privateKey;
  }

  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`EmailJS request failed: ${res.status} ${body}`);
  }
}

export function mapEmailJsFailureReason(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  if (lower.includes('strict mode') && lower.includes('private key')) {
    return 'missing_private_key';
  }
  if (lower.includes('401')) {
    return 'unauthorized';
  }
  if (lower.includes('403')) {
    return 'forbidden';
  }
  if (lower.includes('404')) {
    return 'template_not_found';
  }
  if (lower.includes('429')) {
    return 'rate_limited';
  }
  return 'unknown';
}
