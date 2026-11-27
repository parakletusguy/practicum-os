export function isEvidencePathForAllocation(path: string, allocationId: string) {
  const prefix = allocationId + "/";
  return path.startsWith(prefix) && /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(path.slice(prefix.length));
}
