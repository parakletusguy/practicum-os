const DATABASE = "PracticumOS_OfflineNotebook";
const STORE = "notebooks";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function logbookPath(path) {
  return typeof path === "string" && /^\/[a-z0-9][a-z0-9-]*\/student\/logbook\/?$/.test(path)
    ? path.replace(/\/$/, "") : null;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" }).createIndex("path", "path");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function read(operation) {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE);
      const request = operation(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

async function write(record, expectedRevision) {
  const db = await openDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, "readwrite");
      const store = transaction.objectStore(STORE);
      const request = store.get(record.id);
      let changed = false;
      request.onsuccess = () => {
        if ((request.result?.revision ?? null) !== expectedRevision) {
          changed = true;
          transaction.abort();
        } else {
          store.put(record);
        }
      };
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(changed
        ? new Error("The notebook changed in another tab. Unlock it again before saving.")
        : transaction.error);
    });
  } finally {
    db.close();
  }
}

async function notebookId(scope) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode("PracticumOS offline notebook:" + scope));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function deriveKey(passphrase, salt) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, hash: "SHA-256", iterations: 600000 }, material,
    { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

function authenticatedData({ id, path, revision }) {
  return encoder.encode(JSON.stringify([id, path, revision]));
}

async function protect(record, key, content) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: authenticatedData(record) },
    key, encoder.encode(JSON.stringify(content)));
  return { ...record, iv, ciphertext };
}

async function decrypt(record, passphrase) {
  try {
    const key = await deriveKey(passphrase, record.salt);
    const plaintext = await crypto.subtle.decrypt({
      name: "AES-GCM", iv: record.iv, additionalData: authenticatedData(record),
    }, key, record.ciphertext);
    const { scope, drafts } = JSON.parse(decoder.decode(plaintext));
    return { record, key, scope, drafts };
  } catch {
    throw new Error("Could not unlock the notebook with that passphrase.");
  }
}

export async function listNotebooks(path) {
  const normalized = logbookPath(path);
  if (!normalized) return [];
  const records = await read((store) => store.index("path").getAll(normalized));
  return records.map(({ id }) => id);
}

export async function unlockNotebook(path, id, passphrase) {
  const record = await read((store) => store.get(id));
  if (!record || record.path !== logbookPath(path)) throw new Error("This notebook is unavailable.");
  return decrypt(record, passphrase);
}

export async function openOrCreateNotebook(path, scope, passphrase, allowCreate = true) {
  const normalized = logbookPath(path);
  if (!normalized || !scope) throw new Error("This placement is unavailable for offline capture.");
  if (!crypto.subtle) throw new Error("A secure browser connection is required to set up a notebook.");
  if (passphrase.length < 12 || passphrase.length > 200) throw new Error("Use a passphrase between 12 and 200 characters.");
  const id = await notebookId(scope);
  const existing = await read((store) => store.get(id));
  if (existing) {
    const notebook = await unlockNotebook(normalized, id, passphrase);
    if (notebook.scope !== scope) throw new Error("This notebook belongs to a different placement.");
    return notebook;
  }
  if (!allowCreate) throw new Error("No offline notebook exists for this placement.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt);
  const record = await protect({ id, path: normalized, revision: 0, salt }, key, { scope, drafts: [] });
  await write(record, null);
  return { record, key, scope, drafts: [] };
}

export async function saveNotebookDrafts(notebook, drafts) {
  const { id, path, revision, salt } = notebook.record;
  const record = await protect({ id, path, revision: revision + 1, salt }, notebook.key, { scope: notebook.scope, drafts });
  await write(record, revision);
  return { ...notebook, record, drafts };
}
