/**
 * Add this script to the RSU registration form's Apps Script project.
 * Set the RSU_INTAKE_SECRET script property to the PracticumOS intake key.
 * Run setupRsuIntake once as the Google account responsible for the connection.
 *
 * @OnlyCurrentDoc
 */

const RSU_FORM_ID = "1g4LkZ6ZRBvH6MmhV9KzZJ-EsUuIggHvpOJVdZ_JBmfY";
const INTAKE_URL = "https://practicum-os.vercel.app/api/integrations/rsu-student-intake";
const LAST_SYNC = "RSU_LAST_SYNC";
const BATCH_SIZE = 40;

function setupRsuIntake() {
  const form = getRsuForm();
  sendResponses([]);
  const handlers = ScriptApp.getProjectTriggers().map(trigger => trigger.getHandlerFunction());
  if (!handlers.includes("receiveRsuRegistration")) {
    ScriptApp.newTrigger("receiveRsuRegistration").forForm(form).onFormSubmit().create();
  }
  if (!handlers.includes("syncRsuRegistrations")) {
    ScriptApp.newTrigger("syncRsuRegistrations").timeBased().everyHours(1).create();
  }
  syncRsuRegistrations();
}

function receiveRsuRegistration(event) {
  if (event.source.getId() !== RSU_FORM_ID) throw new Error("This is not the RSU registration form.");
  sendResponses([mapResponse(event.response)]);
}

function syncRsuRegistrations() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;

  try {
    const properties = PropertiesService.getScriptProperties();
    const checkpoint = Number(properties.getProperty(LAST_SYNC));
    const form = getRsuForm();
    const responses = checkpoint ? form.getResponses(new Date(checkpoint - 1000)) : form.getResponses();
    responses.sort((a, b) => a.getTimestamp().getTime() - b.getTimestamp().getTime());

    for (let index = 0; index < responses.length; index += BATCH_SIZE) {
      const batch = responses.slice(index, index + BATCH_SIZE);
      sendResponses(batch.map(mapResponse));
      properties.setProperty(LAST_SYNC, String(batch[batch.length - 1].getTimestamp().getTime()));
    }
  } finally {
    lock.releaseLock();
  }
}

function getRsuForm() {
  const form = FormApp.getActiveForm();
  if (!form || form.getId() !== RSU_FORM_ID) throw new Error("Open the Apps Script project attached to the RSU registration form.");
  return form;
}

function mapResponse(response) {
  const answers = Object.fromEntries(response.getItemResponses().map(answer => [
    answer.getItem().getTitle(), String(answer.getResponse()),
  ]));
  const student = {
    id: response.getId(),
    submittedAt: response.getTimestamp().toISOString(),
    firstName: answers["First name"],
    lastName: answers["Last name"],
    email: answers["Email address for PracticumOS"],
    matricNumber: answers["Matriculation number"],
    level: answers["Level"],
  };
  if ([student.firstName, student.lastName, student.email, student.matricNumber].some(value => !value?.trim())) {
    throw new Error("A registration did not contain all four roster fields. Check the form questions before syncing.");
  }
  return student;
}

function sendResponses(responses) {
  const secret = PropertiesService.getScriptProperties().getProperty("RSU_INTAKE_SECRET");
  if (!secret) throw new Error("Set the RSU_INTAKE_SECRET script property before running setup.");

  const result = UrlFetchApp.fetch(INTAKE_URL, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + secret },
    payload: JSON.stringify({ formId: RSU_FORM_ID, responses }),
    muteHttpExceptions: true,
  });
  const status = result.getResponseCode();
  if (status !== 200) throw new Error("PracticumOS rejected the response batch with HTTP status " + status + ".");
}
