import crypto from "crypto";

export function generateEventChecksum(payload: {
  allocationId: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  verifiedMinutes: number;
  activityTitle: string;
  activityDescription: string;
  criticalReflection: string;
}): string {
  const content = `${payload.allocationId}|${payload.eventDate}|${payload.startTime}|${payload.endTime}|${payload.verifiedMinutes}|${payload.activityTitle}|${payload.activityDescription}|${payload.criticalReflection}`;
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function validateClientDeidentification(clientRef: string): {
  valid: boolean;
  sanitizedRef: string;
  warning?: string;
} {
  const trimmed = clientRef.trim();

  // If empty, generate a standardized anonymous code
  if (!trimmed) {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    return {
      valid: true,
      sanitizedRef: `CASE-ANON-${randomId}`,
      warning: "Client reference defaulted to anonymized identifier.",
    };
  }

  // Detect potential real phone numbers or plain names
  const isPhone = /^\+?[0-9]{7,15}$/.test(trimmed.replace(/[\s-]/g, ""));
  if (isPhone) {
    return {
      valid: false,
      sanitizedRef: "REDACTED",
      warning: "PII Violation: Telephone numbers cannot be used as client references.",
    };
  }

  // Clean reference
  return {
    valid: true,
    sanitizedRef: trimmed.toUpperCase(),
  };
}
