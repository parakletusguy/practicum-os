import "server-only";

import { createHash } from "node:crypto";
import {
  EmailDeliveryKind,
  EmailDeliveryStatus,
  type Prisma,
  SystemRole,
} from "@prisma/client";
import { db } from "@/lib/db";
import {
  assertEmailDeliveryConfigured,
  EmailDeliveryConfigurationError,
  EmailDeliveryProviderError,
  sendEmailWithResend,
} from "@/lib/email/resend";
import { createPostingLetterPdf, type PostingLetterDocument } from "@/lib/email/posting-letter-pdf";

const MAX_DELIVERY_ATTEMPTS = 5;
const DELIVERY_LEASE_MS = 10 * 60_000;
const ESCALATION_AFTER_MS = 24 * 60 * 60_000;
const IDEMPOTENCY_WINDOW_MS = 23 * 60 * 60_000;

type PostingDeliveryInput = {
  tenantId: string;
  allocationId: string;
  studentEmail: string;
  hostEmail: string | null;
  studentName: string;
  hostName: string;
  reference: string;
};

type QueueResult = {
  queued: Prisma.EmailDeliveryCreateManyInput[];
  missing: string[];
};

function fingerprint(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 24);
}

function idempotencyKey(kind: EmailDeliveryKind, subjectId: string, recipient: string) {
  return `practicumos:${kind.toLowerCase()}:${subjectId}:${fingerprint(recipient)}`;
}

function nonEmptyEmail(value: string | null | undefined) {
  const email = value?.trim().toLowerCase();
  return email || null;
}

/** Creates queue records without changing delivery state. Call inside the same
 * database transaction that marks a posting as issued. */
export function createPostingEmailDeliveries(input: PostingDeliveryInput): QueueResult {
  const studentEmail = nonEmptyEmail(input.studentEmail);
  const hostEmail = nonEmptyEmail(input.hostEmail);
  const missing: string[] = [];
  if (!studentEmail) missing.push(`${input.studentName}: student email`);
  if (!hostEmail) missing.push(`${input.hostName}: host organisation email`);
  if (!studentEmail || !hostEmail) return { queued: [], missing };

  const recipientMap = new Map<string, { recipient: string; subject: string }>();
  for (const recipient of [
    {
      recipient: studentEmail,
      subject: `Your official practicum posting: ${input.reference}`,
    },
    {
      recipient: hostEmail,
      subject: `Official practicum posting letter: ${input.studentName}`,
    },
  ]) {
    // A shared mailbox receives one official copy, with the host-facing subject.
    recipientMap.set(recipient.recipient, recipient);
  }

  return {
    queued: Array.from(recipientMap.values()).map(({ recipient, subject }) => ({
      tenantId: input.tenantId,
      allocationId: input.allocationId,
      kind: EmailDeliveryKind.POSTING_LETTER,
      recipient,
      subject,
      idempotencyKey: idempotencyKey(EmailDeliveryKind.POSTING_LETTER, input.allocationId, recipient),
    })),
    missing,
  };
}

/** Queues the initial alert for its assigned academic supervisor. The alert
 * remains visible in-app if no supervisor email is available. */
export async function queueInitialAlertNotification(alertId: string) {
  const alert = await db.earlyWarningAlert.findUnique({
    where: { id: alertId },
    include: {
      allocation: {
        include: {
          academicSupervisor: { select: { email: true } },
          cycle: { select: { tenantId: true } },
        },
      },
    },
  });
  const recipient = nonEmptyEmail(alert?.allocation.academicSupervisor?.email);
  if (!alert || !recipient) return 0;

  const result = await db.emailDelivery.createMany({
    data: [{
      tenantId: alert.allocation.cycle.tenantId,
      alertId: alert.id,
      kind: EmailDeliveryKind.EARLY_WARNING,
      recipient,
      subject: `[${alert.severity}] Practicum alert: ${alert.title}`,
      idempotencyKey: idempotencyKey(EmailDeliveryKind.EARLY_WARNING, alert.id, recipient),
    }],
    skipDuplicates: true,
  });
  return result.count;
}

/** Escalates unresolved critical alerts to tenant coordinators after 24 hours.
 * The unique key makes the escalation safe to run on every scheduler tick. */
export async function queueCriticalAlertEscalations(now = new Date()) {
  const cutoff = new Date(now.getTime() - ESCALATION_AFTER_MS);
  const alerts = await db.earlyWarningAlert.findMany({
    where: { severity: "CRITICAL", isResolved: false, createdAt: { lte: cutoff } },
    include: {
      allocation: {
        include: {
          cycle: {
            include: {
              tenant: {
                include: {
                  memberships: {
                    where: {
                      status: "ACTIVE",
                      role: { in: [SystemRole.COORDINATOR, SystemRole.INSTITUTION_ADMIN] },
                    },
                    include: { person: { select: { email: true } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const pending: Prisma.EmailDeliveryCreateManyInput[] = [];
  for (const alert of alerts) {
    for (const membership of alert.allocation.cycle.tenant.memberships) {
      const recipient = nonEmptyEmail(membership.person.email);
      if (!recipient) continue;
      pending.push({
        tenantId: alert.allocation.cycle.tenantId,
        alertId: alert.id,
        kind: EmailDeliveryKind.EARLY_WARNING_ESCALATION,
        recipient,
        subject: `[ESCALATION: ${alert.severity}] ${alert.title}`,
        idempotencyKey: idempotencyKey(EmailDeliveryKind.EARLY_WARNING_ESCALATION, alert.id, recipient),
      });
    }
  }

  if (!pending.length) return 0;
  const result = await db.emailDelivery.createMany({ data: pending, skipDuplicates: true });
  return result.count;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function textToHtml(paragraphs: string[]) {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;line-height:1.55;color:#172033">${paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("")}</body></html>`;
}

function getAlertLink(tenantSlug: string) {
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!rawUrl) return null;
  try {
    const appUrl = new URL(rawUrl);
    if (appUrl.protocol !== "https:" && process.env.NODE_ENV === "production") return null;
    return new URL(`/${encodeURIComponent(tenantSlug)}/faculty/alerts`, appUrl).toString();
  } catch {
    return null;
  }
}

function retryAt(attemptCount: number) {
  const minutes = [5, 15, 60, 240][Math.max(0, attemptCount - 1)] ?? 240;
  return new Date(Date.now() + minutes * 60_000);
}

function postingLetterFromAllocation(allocation: NonNullable<Awaited<ReturnType<typeof getDelivery>>["allocation"]>, issuedAt: Date): PostingLetterDocument {
  const programme = allocation.cycle.programme;
  return {
    institutionName: allocation.cycle.tenant.name,
    departmentName: programme?.department.name ?? "Department of Social Work",
    programmeName: programme?.name ?? "Social Work Practicum",
    reference: allocation.postingLetterRef ?? `POSTING-${allocation.id.slice(0, 8).toUpperCase()}`,
    issueDate: issuedAt,
    hostOrganisation: {
      name: allocation.hostOrg.name,
      address: allocation.hostOrg.address,
      city: allocation.hostOrg.city,
      country: allocation.hostOrg.country,
    },
    student: {
      name: `${allocation.studentPerson.firstName} ${allocation.studentPerson.lastName}`,
      matricNumber: allocation.cohortStudent.matricNumber,
    },
    cycle: {
      academicYear: allocation.cycle.academicYear,
      requiredHours: allocation.cycle.requiredHours,
      startDate: allocation.cycle.startDate,
      endDate: allocation.cycle.endDate,
    },
    fieldSupervisorName: allocation.fieldSupervisor
      ? `${allocation.fieldSupervisor.firstName} ${allocation.fieldSupervisor.lastName}`
      : null,
    academicSupervisorName: allocation.academicSupervisor
      ? `${allocation.academicSupervisor.firstName} ${allocation.academicSupervisor.lastName}`
      : null,
  };
}

async function getDelivery(id: string) {
  return db.emailDelivery.findUniqueOrThrow({
    where: { id },
    include: {
      allocation: {
        include: {
          cycle: {
            include: {
              tenant: { select: { name: true, slug: true } },
              programme: { include: { department: { select: { name: true } } } },
            },
          },
          studentPerson: { select: { firstName: true, lastName: true, email: true } },
          cohortStudent: { select: { matricNumber: true } },
          hostOrg: { select: { name: true, email: true, address: true, city: true, country: true } },
          fieldSupervisor: { select: { firstName: true, lastName: true } },
          academicSupervisor: { select: { firstName: true, lastName: true } },
        },
      },
      alert: {
        include: {
          allocation: {
            include: {
              cycle: { include: { tenant: { select: { slug: true } } } },
              cohortStudent: { include: { person: { select: { firstName: true, lastName: true } } } },
              hostOrg: { select: { name: true } },
            },
          },
        },
      },
    },
  });
}

async function sendQueuedDelivery(deliveryId: string) {
  const delivery = await getDelivery(deliveryId);
  if (delivery.kind === EmailDeliveryKind.POSTING_LETTER) {
    if (!delivery.allocation) throw new Error("Posting-letter delivery is missing its allocation.");
    const letter = postingLetterFromAllocation(delivery.allocation, delivery.allocation.postedAt ?? delivery.createdAt);
    const isHostRecipient = delivery.recipient.toLowerCase() === delivery.allocation.hostOrg.email?.trim().toLowerCase();
    const recipientName = isHostRecipient
      ? delivery.allocation.hostOrg.name
      : `${delivery.allocation.studentPerson.firstName} ${delivery.allocation.studentPerson.lastName}`;
    const paragraphs = isHostRecipient
      ? [
          `Dear ${recipientName},`,
          `Attached is the official practicum posting and introduction letter for ${letter.student.name} (${letter.student.matricNumber}).`,
          `Please retain the reference ${letter.reference} for your placement records.`,
        ]
      : [
          `Dear ${recipientName},`,
          `Your official practicum posting letter is attached. You have been posted to ${letter.hostOrganisation.name}.`,
          `Please retain the reference ${letter.reference} and contact the field education office if any detail is incorrect.`,
        ];
    const pdf = await createPostingLetterPdf(letter);
    return sendEmailWithResend({
      to: delivery.recipient,
      subject: delivery.subject,
      text: paragraphs.join("\n\n"),
      html: textToHtml(paragraphs),
      idempotencyKey: delivery.idempotencyKey,
      attachments: [{ filename: `posting-letter-${letter.reference.replace(/[^a-zA-Z0-9._-]+/g, "-")}.pdf`, content: pdf }],
    });
  }

  if (!delivery.alert) throw new Error("Alert delivery is missing its alert.");
  const alert = delivery.alert;
  const allocation = alert.allocation;
  const studentName = `${allocation.cohortStudent.person.firstName} ${allocation.cohortStudent.person.lastName}`;
  const link = getAlertLink(allocation.cycle.tenant.slug);
  const escalation = delivery.kind === EmailDeliveryKind.EARLY_WARNING_ESCALATION;
  const paragraphs = [
    escalation ? "A critical practicum alert remains unresolved after 24 hours." : "A practicum early-warning alert requires attention.",
    `Student: ${studentName}. Host organisation: ${allocation.hostOrg.name}. Severity: ${alert.severity}.`,
    `${alert.title}. ${alert.description}`,
    ...(link ? [`Review the alert: ${link}`] : []),
  ];
  return sendEmailWithResend({
    to: delivery.recipient,
    subject: delivery.subject,
    text: paragraphs.join("\n\n"),
    html: textToHtml(paragraphs),
    idempotencyKey: delivery.idempotencyKey,
  });
}

export type EmailDeliveryRun = {
  attempted: number;
  sent: number;
  retried: number;
  failed: number;
  skipped: number;
  configurationError?: string;
};

/** Claims due work before contacting Resend, so concurrent cron invocations do
 * not double-send. Every retry reuses the same provider idempotency key. */
export async function processPendingEmailDeliveries(limit = 25): Promise<EmailDeliveryRun> {
  try {
    assertEmailDeliveryConfigured();
  } catch (error) {
    return {
      attempted: 0,
      sent: 0,
      retried: 0,
      failed: 0,
      skipped: 0,
      configurationError: error instanceof Error ? error.message : "Email delivery is not configured.",
    };
  }

  const now = new Date();
  const staleBefore = new Date(now.getTime() - DELIVERY_LEASE_MS);
  const candidates = await db.emailDelivery.findMany({
    where: {
      OR: [
        { status: { in: [EmailDeliveryStatus.PENDING, EmailDeliveryStatus.RETRY_SCHEDULED] }, nextAttemptAt: { lte: now } },
        { status: EmailDeliveryStatus.SENDING, lastAttemptAt: { lt: staleBefore } },
      ],
    },
    select: { id: true, status: true, attemptCount: true, lastAttemptAt: true },
    orderBy: { nextAttemptAt: "asc" },
    take: Math.min(Math.max(limit, 1), 100),
  });

  const result: EmailDeliveryRun = { attempted: 0, sent: 0, retried: 0, failed: 0, skipped: 0 };
  for (const candidate of candidates) {
    // Resend preserves idempotency keys for 24 hours. Do not risk a duplicate
    // message by retrying a request whose outcome can no longer be replayed.
    if (candidate.lastAttemptAt && now.getTime() - candidate.lastAttemptAt.getTime() > IDEMPOTENCY_WINDOW_MS) {
      const expired = await db.emailDelivery.updateMany({
        where: {
          id: candidate.id,
          status: candidate.status,
          lastAttemptAt: candidate.lastAttemptAt,
        },
        data: {
          status: EmailDeliveryStatus.FAILED,
          lastError: "Retry window expired before provider idempotency could be guaranteed.",
        },
      });
      if (expired.count === 1) result.failed++;
      else result.skipped++;
      continue;
    }
    const claimingStaleLease = candidate.status === EmailDeliveryStatus.SENDING;
    const claim = await db.emailDelivery.updateMany({
      where: claimingStaleLease
        ? { id: candidate.id, status: EmailDeliveryStatus.SENDING, lastAttemptAt: { lt: staleBefore } }
        : { id: candidate.id, status: candidate.status, nextAttemptAt: { lte: now } },
      data: {
        status: EmailDeliveryStatus.SENDING,
        attemptCount: { increment: 1 },
        lastAttemptAt: now,
        lastError: null,
      },
    });
    if (claim.count !== 1) {
      result.skipped++;
      continue;
    }

    result.attempted++;
    const attemptCount = candidate.attemptCount + 1;
    try {
      const providerMessageId = await sendQueuedDelivery(candidate.id);
      await db.emailDelivery.update({
        where: { id: candidate.id },
        data: {
          status: EmailDeliveryStatus.SENT,
          providerMessageId,
          sentAt: new Date(),
          lastError: null,
        },
      });
      result.sent++;
    } catch (error) {
      const providerError = error instanceof EmailDeliveryProviderError ? error : null;
      const canRetry = providerError?.retryable === true && attemptCount < MAX_DELIVERY_ATTEMPTS;
      const message = error instanceof Error ? error.message.slice(0, 1_000) : "Email delivery failed.";
      await db.emailDelivery.update({
        where: { id: candidate.id },
        data: canRetry
          ? { status: EmailDeliveryStatus.RETRY_SCHEDULED, nextAttemptAt: retryAt(attemptCount), lastError: message }
          : { status: EmailDeliveryStatus.FAILED, lastError: message },
      });
      console.error("Outbound email delivery failed", {
        deliveryId: candidate.id,
        retryScheduled: canRetry,
        error: message,
      });
      if (canRetry) result.retried++;
      else result.failed++;
    }
  }
  return result;
}

export function isEmailDeliveryConfigurationError(error: unknown) {
  return error instanceof EmailDeliveryConfigurationError;
}
