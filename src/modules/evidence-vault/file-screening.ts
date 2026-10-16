const FILE_SIGNATURES: Record<string, number[]> = {
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/jpg": [0xff, 0xd8, 0xff],
};

const PII_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:\+?234|0)(?:[\s.-]?\d){10}\b/,
  /\b\d{11,}\b/,
];

function startsWith(buffer: Buffer, signature: number[]) {
  return signature.every((byte, index) => buffer[index] === byte);
}

/**
 * Verifies the content actually corresponds to its declared safe type. This
 * intentionally excludes macro-capable office files; production document
 * scanning should be added as a separate, fail-closed service before enabling
 * additional formats.
 */
export function screenEvidenceFile(buffer: Buffer, mimeType: string): string | null {
  const signature = FILE_SIGNATURES[mimeType];
  if (signature && !startsWith(buffer, signature)) {
    return "The file content does not match its declared type.";
  }

  if (mimeType === "application/pdf") {
    const header = buffer.subarray(0, Math.min(buffer.length, 1_024)).toString("latin1");
    if (!header.includes("%PDF-")) return "The PDF header is invalid.";
  }

  if (mimeType === "text/plain") {
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch {
      return "Plain-text evidence must be valid UTF-8.";
    }
    if (text.includes("\u0000")) return "Plain-text evidence contains unsafe binary data.";
    if (PII_PATTERNS.some((pattern) => pattern.test(text))) {
      return "Plain-text evidence appears to contain personal data. Remove it before uploading.";
    }
  }

  return null;
}
