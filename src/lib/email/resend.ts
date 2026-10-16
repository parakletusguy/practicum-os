import "server-only";

import { Resend } from "resend";

export class EmailDeliveryConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailDeliveryConfigurationError";
  }
}

export class EmailDeliveryProviderError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = "EmailDeliveryProviderError";
    this.retryable = retryable;
  }
}

export type EmailAttachment = {
  filename: string;
  content: Buffer;
};

export type ResendEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
  attachments?: EmailAttachment[];
};

const SIMPLE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isSafeHeader(value: string) {
  return value.length > 0 && !/[\r\n]/.test(value);
}

function getConfiguration() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const replyTo = process.env.RESEND_REPLY_TO?.trim();

  if (!apiKey) {
    throw new EmailDeliveryConfigurationError("RESEND_API_KEY is not configured.");
  }
  if (!from || !isSafeHeader(from)) {
    throw new EmailDeliveryConfigurationError("RESEND_FROM_EMAIL is not configured safely.");
  }
  if (replyTo && (!SIMPLE_EMAIL.test(replyTo) || !isSafeHeader(replyTo))) {
    throw new EmailDeliveryConfigurationError("RESEND_REPLY_TO must be a valid email address.");
  }

  return { apiKey, from, replyTo };
}

/**
 * Checks only local configuration. Resend remains the authority on API-key
 * scope and verified sender domains when it accepts a message.
 */
export function assertEmailDeliveryConfigured() {
  getConfiguration();
}

export async function sendEmailWithResend(message: ResendEmail): Promise<string> {
  const { apiKey, from, replyTo } = getConfiguration();

  if (!SIMPLE_EMAIL.test(message.to) || !isSafeHeader(message.to)) {
    throw new EmailDeliveryProviderError("Recipient email address is invalid.", false);
  }
  if (!isSafeHeader(message.subject) || !message.subject.trim()) {
    throw new EmailDeliveryProviderError("Email subject is invalid.", false);
  }
  if (!message.idempotencyKey || message.idempotencyKey.length > 256) {
    throw new EmailDeliveryProviderError("Email idempotency key is invalid.", false);
  }

  let response;
  try {
    response = await new Resend(apiKey).emails.send(
      {
        from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        ...(replyTo ? { replyTo } : {}),
        ...(message.attachments?.length ? { attachments: message.attachments } : {}),
      },
      { idempotencyKey: message.idempotencyKey },
    );
  } catch (error) {
    throw new EmailDeliveryProviderError(
      error instanceof Error ? error.message : "Resend request failed.",
      true,
    );
  }

  if (response.error || !response.data?.id) {
    const status = response.error?.statusCode ?? 0;
    const messageText = response.error?.message ?? "Resend did not accept the email.";
    throw new EmailDeliveryProviderError(messageText, status === 0 || status === 429 || status >= 500);
  }

  return response.data.id;
}
