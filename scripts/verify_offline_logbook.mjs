import assert from "node:assert/strict";

const baseURL = process.env.PRACTICUM_BROWSER_BASE_URL;
if (!baseURL) throw new Error("Set PRACTICUM_BROWSER_BASE_URL to a local or staging build.");
const { chromium } = await import(process.env.PRACTICUM_PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: process.env.PRACTICUM_BROWSER_CHANNEL || "chromium" });
const path = "/unilag/student/logbook";
const passphrase = "test-only offline passphrase";
const title = "Synthetic outreach entry";

try {
  const context = await browser.newContext({ baseURL });
  let page = await context.newPage();
  await page.goto("/offline-logbook/index.html");
  const seeded = await page.evaluate(async ({ path, passphrase }) => {
    const { openOrCreateNotebook } = await import("/offline-logbook/notebook.mjs");
    await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const notebook = await openOrCreateNotebook(path, "synthetic/actor/allocation", passphrase);
    return { path: notebook.record.path, cached: Boolean(await caches.match("/offline-logbook/index.html")) };
  }, { path, passphrase });
  assert.deepEqual(seeded, { path, cached: true });

  await context.setOffline(true);
  await page.close();
  page = await context.newPage();
  await page.goto(path);
  await page.getByRole("heading", { name: "Offline logbook", exact: true }).waitFor();
  await page.getByLabel("Passphrase").fill("incorrect passphrase");
  await page.getByRole("button", { name: "Unlock notebook" }).click();
  await page.getByText("Could not unlock the notebook with that passphrase.").waitFor();
  await page.getByLabel("Passphrase").fill(passphrase);
  await page.getByRole("button", { name: "Unlock notebook" }).click();
  await page.getByLabel("Activity date").fill("2026-11-27");
  await page.getByLabel("Start time").fill("09:00");
  await page.getByLabel("End time").fill("10:30");
  await page.getByLabel("Activity title").fill(title);
  await page.getByLabel("Activity description").fill("A synthetic practice outreach planning session.");
  await page.getByLabel("Critical reflection").fill("A synthetic note about preparing for outreach.");
  await page.getByRole("button", { name: "Save on this device" }).click();
  await page.getByText("Entry saved on this device.").waitFor();
  await page.close();

  page = await context.newPage();
  await page.goto(path);
  assert.equal(await page.getByText(title, { exact: false }).count(), 0);
  await page.getByLabel("Passphrase").fill(passphrase);
  await page.getByRole("button", { name: "Unlock notebook" }).click();
  await page.getByText(title, { exact: false }).waitFor();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  assert.equal(await page.getByLabel("Activity title").inputValue(), title);
  const storage = await page.evaluate(async (logbookPath) => {
    const encryptedRecord = await new Promise((resolve, reject) => {
      const request = indexedDB.open("PracticumOS_OfflineNotebook", 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("notebooks");
        const entries = transaction.objectStore("notebooks").getAll();
        transaction.oncomplete = () => { db.close(); resolve(entries.result[0]); };
        transaction.onabort = () => { db.close(); reject(transaction.error); };
      };
      request.onerror = () => reject(request.error);
    });
    return {
      ciphertext: encryptedRecord.ciphertext instanceof ArrayBuffer,
      plaintextFields: ["drafts", "scope", "passphrase", "key"].some((field) => Object.hasOwn(encryptedRecord, field)),
      privatePageCached: Boolean(await caches.match(logbookPath)),
    };
  }, path);
  assert.deepEqual(storage, { ciphertext: true, plaintextFields: false, privatePageCached: false });
  console.log("Offline reopening, passphrase protection, draft persistence, and cache isolation passed.");
} finally {
  await browser.close();
}
