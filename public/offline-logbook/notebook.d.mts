export interface NotebookDraft {
  id: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  category: string;
  clientRef: string;
  activityTitle: string;
  activityDescription: string;
  criticalReflection: string;
  competenciesTagged: string[];
  scopeLevel: "INDEPENDENT" | "CO_PRACTICE" | "DIRECT_SUPERVISION";
  error?: string;
}

export interface OfflineNotebook {
  record: { id: string; path: string; revision: number; salt: Uint8Array; iv: Uint8Array; ciphertext: ArrayBuffer };
  key: CryptoKey;
  scope: string;
  drafts: NotebookDraft[];
}

export function logbookPath(path: string | null): string | null;
export function listNotebooks(path: string): Promise<string[]>;
export function unlockNotebook(path: string, id: string, passphrase: string): Promise<OfflineNotebook>;
export function openOrCreateNotebook(path: string, scope: string, passphrase: string, allowCreate?: boolean): Promise<OfflineNotebook>;
export function saveNotebookDrafts(notebook: OfflineNotebook, drafts: NotebookDraft[]): Promise<OfflineNotebook>;
