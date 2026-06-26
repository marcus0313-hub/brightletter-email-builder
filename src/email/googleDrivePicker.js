const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
let cachedToken = null;
let cachedTokenExpiresAt = 0;

function loadScript(src, id) {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id);
    if (existing) {
      if (existing.dataset.loaded === "true") resolve();
      else existing.addEventListener("load", resolve, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => reject(new Error("Google Drive could not be loaded.")),
      { once: true },
    );
    document.head.appendChild(script);
  });
}

function loadPickerApi() {
  return new Promise((resolve, reject) => {
    window.gapi.load("picker", {
      callback: resolve,
      onerror: () => reject(new Error("Google Picker could not be loaded.")),
      timeout: 10000,
      ontimeout: () => reject(new Error("Google Picker took too long to load.")),
    });
  });
}

function requestAccessToken(clientId) {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) {
    return Promise.resolve(cachedToken);
  }

  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || "Google sign-in failed."));
          return;
        }
        cachedToken = response.access_token;
        cachedTokenExpiresAt =
          Date.now() + Math.max(0, Number(response.expires_in ?? 3600) - 60) * 1000;
        resolve(cachedToken);
      },
      error_callback: () => reject(new Error("Google sign-in was closed.")),
    });

    tokenClient.requestAccessToken({ prompt: "" });
  });
}

function openPicker({ accessToken, apiKey, appId }) {
  return new Promise((resolve, reject) => {
    const view = new window.google.picker.DocsView(
      window.google.picker.ViewId.DOCS_IMAGES,
    )
      .setIncludeFolders(false)
      .setSelectFolderEnabled(false);

    const builder = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(apiKey)
      .setTitle("Choose an image for your email")
      .setCallback((data) => {
        if (data.action === window.google.picker.Action.PICKED) {
          resolve(data.docs[0]);
        }
        if (data.action === window.google.picker.Action.CANCEL) {
          reject(new Error("Google Drive selection was cancelled."));
        }
      });

    if (appId) builder.setAppId(appId);
    builder.build().setVisible(true);
  });
}

export async function pickGoogleDriveImage({ clientId, apiKey, appId }) {
  if (!clientId || !apiKey) {
    throw new Error("Google Drive is not configured for this app.");
  }

  await Promise.all([
    loadScript("https://accounts.google.com/gsi/client", "google-identity-script"),
    loadScript("https://apis.google.com/js/api.js", "google-api-script"),
  ]);
  await loadPickerApi();

  const accessToken = await requestAccessToken(clientId);
  const document = await openPicker({ accessToken, apiKey, appId });
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(document.id)}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    cachedToken = null;
    cachedTokenExpiresAt = 0;
    throw new Error(
      response.status === 401
        ? "Your Google Drive session expired. Choose the image again."
        : "The selected Drive image could not be downloaded.",
    );
  }

  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) {
    throw new Error("Please choose an image file from Google Drive.");
  }

  return {
    blob,
    name: document.name || "Google Drive image",
  };
}
