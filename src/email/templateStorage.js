const DATABASE_NAME = "brightletter";
const DATABASE_VERSION = 1;
const TEMPLATE_STORE = "templates";
const FALLBACK_KEY = "brightletter-saved-templates";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(TEMPLATE_STORE)) {
        database.createObjectStore(TEMPLATE_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readFallbackTemplates() {
  try {
    return JSON.parse(localStorage.getItem(FALLBACK_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeFallbackTemplates(templates) {
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(templates));
}

function runTransaction(mode, operation) {
  return openDatabase().then(
    (database) =>
      new Promise((resolve, reject) => {
        const transaction = database.transaction(TEMPLATE_STORE, mode);
        const store = transaction.objectStore(TEMPLATE_STORE);
        const request = operation(store);
        let result;

        request.onsuccess = () => {
          result = request.result;
        };
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => {
          database.close();
          resolve(result);
        };
        transaction.onerror = () => reject(transaction.error);
      }),
  );
}

export async function loadSavedTemplates() {
  try {
    const templates = await runTransaction("readonly", (store) => store.getAll());
    return templates.sort((left, right) =>
      String(right.savedAt).localeCompare(String(left.savedAt)),
    );
  } catch {
    return readFallbackTemplates();
  }
}

export async function saveTemplateRecord(template) {
  try {
    await runTransaction("readwrite", (store) => store.put(template));
  } catch {
    const templates = readFallbackTemplates();
    const next = [
      template,
      ...templates.filter((item) => item.id !== template.id),
    ];
    writeFallbackTemplates(next);
  }

  return template;
}

export async function deleteTemplateRecord(templateId) {
  try {
    await runTransaction("readwrite", (store) => store.delete(templateId));
  } catch {
    const templates = readFallbackTemplates();
    writeFallbackTemplates(templates.filter((item) => item.id !== templateId));
  }

  return templateId;
}
