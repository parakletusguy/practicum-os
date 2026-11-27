import { listNotebooks, logbookPath, saveNotebookDrafts, unlockNotebook } from "./notebook.mjs";

const path = logbookPath(location.pathname) || logbookPath(new URLSearchParams(location.search).get("logbook"));
const status = document.getElementById("status");
const unlock = document.getElementById("unlock");
const select = document.getElementById("notebook");
const passphrase = document.getElementById("passphrase");
const workspace = document.getElementById("workspace");
const form = document.getElementById("capture");
let notebook;
let editingId;
let busy = false;

function setEditor(draft) {
  form.reset();
  editingId = draft?.id;
  document.getElementById("editor-heading").textContent = draft ? "Edit saved entry" : "New entry";
  document.getElementById("cancel-edit").hidden = !draft;
  if (!draft) return;
  for (const field of form.elements) {
    if (field.name === "competenciesTagged") field.checked = draft.competenciesTagged.includes(field.value);
    else if (field.name && Object.hasOwn(draft, field.name)) field.value = draft[field.name];
  }
}

function renderDrafts() {
  const list = document.getElementById("drafts");
  list.replaceChildren();
  if (!notebook.drafts.length) {
    const empty = document.createElement("li");
    empty.textContent = "No entries saved on this device.";
    list.append(empty);
  }
  for (const draft of notebook.drafts) {
    const item = document.createElement("li");
    const title = document.createElement("p");
    title.textContent = draft.activityTitle + " · " + draft.eventDate + (draft.error ? " · " + draft.error : "");
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "secondary";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => {
      if (busy) return;
      setEditor(draft);
      form.elements.activityTitle.focus();
    });
    item.append(title, edit);
    list.append(item);
  }
}

unlock.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  busy = true;
  try {
    notebook = await unlockNotebook(path, select.value, passphrase.value);
    unlock.hidden = true;
    workspace.hidden = false;
    status.textContent = "Notebook unlocked.";
    setEditor();
    renderDrafts();
    form.elements.eventDate.focus();
  } catch (error) {
    status.textContent = error.message;
  } finally {
    passphrase.value = "";
    busy = false;
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy || !notebook) return;
  const values = new FormData(form);
  const raw = Object.fromEntries(values);
  const activityTitle = raw.activityTitle.trim();
  const activityDescription = raw.activityDescription.trim();
  const criticalReflection = raw.criticalReflection.trim();
  if (!activityTitle || !activityDescription || !criticalReflection || raw.endTime <= raw.startTime) {
    status.textContent = "Enter the activity details and an end time later than the start time.";
    return;
  }
  const clientRef = raw.clientRef.trim().toUpperCase();
  const text = [activityTitle, activityDescription, criticalReflection].join(" ");
  if ((clientRef && !/^CASE-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(clientRef)) ||
      /\b\S+@\S+\.\S+\b|\b(?:\+?234|0)(?:[\s.-]?\d){10}\b|\b\d{11,}\b/i.test(text)) {
    status.textContent = "Use an anonymous case code and remove contact or identification details.";
    return;
  }
  busy = true;
  try {
    const id = editingId || crypto.randomUUID();
    const draft = {
      id, eventDate: raw.eventDate, startTime: raw.startTime, endTime: raw.endTime,
      category: raw.category, scopeLevel: raw.scopeLevel, clientRef: clientRef || ("CASE-ANON-" + id.slice(0, 8).toUpperCase()),
      activityTitle, activityDescription, criticalReflection, competenciesTagged: values.getAll("competenciesTagged"),
    };
    notebook = await saveNotebookDrafts(notebook, [...notebook.drafts.filter((entry) => entry.id !== id), draft]);
    status.textContent = "Entry saved on this device.";
    setEditor();
    renderDrafts();
  } catch (error) {
    status.textContent = error.message;
  } finally {
    busy = false;
  }
});

document.getElementById("cancel-edit").addEventListener("click", () => { if (!busy) setEditor(); });
document.getElementById("lock").addEventListener("click", () => {
  if (busy) return;
  notebook = undefined;
  setEditor();
  document.getElementById("drafts").replaceChildren();
  workspace.hidden = true;
  unlock.hidden = false;
  status.textContent = "Notebook locked.";
  passphrase.focus();
});

if (path) {
  const back = document.getElementById("return-link");
  back.href = path;
  back.hidden = false;
}

try {
  const ids = await listNotebooks(path);
  for (const [index, id] of ids.entries()) select.add(new Option("Notebook " + (index + 1), id));
  document.getElementById("notebook-picker").hidden = ids.length < 2;
  unlock.hidden = !ids.length;
  if (!ids.length) status.textContent = "Connect and set up offline access in your student logbook before using this device offline.";
} catch {
  status.textContent = "This browser could not open offline storage.";
}
