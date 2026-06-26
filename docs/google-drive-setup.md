# Google Drive Image Picker Setup

Brightletter uses Google Picker with the narrow `drive.file` permission. Users
sign in only when they click **Choose from Drive**, and Brightletter can access
only the file they select.

## Google Cloud

1. Create or select a Google Cloud project.
2. Enable the Google Drive API and Google Picker API.
3. Configure the OAuth consent screen and add the
   `https://www.googleapis.com/auth/drive.file` scope.
4. Create an OAuth 2.0 Client ID for a web application.
5. Add these Authorized JavaScript origins:
   - `http://127.0.0.1:5173`
   - `http://localhost:5173`
   - `https://brightletter-email-builder.vercel.app`
6. Create an API key and restrict it to the Brightletter website origins, the
   Google Picker API, and the Google Drive API.
7. Copy the Cloud project number. This is the Picker App ID.

If the OAuth app remains in Testing mode, add each intended Google account as a
test user. Publish the consent screen before making the picker broadly
available.

## Vercel

Add these variables to Production and Preview:

```text
VITE_GOOGLE_CLIENT_ID
VITE_GOOGLE_API_KEY
VITE_GOOGLE_APP_ID
```

Redeploy Brightletter after adding or changing the values. These values are
included in the browser bundle by design, so the OAuth client and API key must
be restricted in Google Cloud.

## References

- https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- https://developers.google.com/workspace/drive/picker/guides/overview
- https://developers.google.com/identity/oauth2/web/guides/use-token-model
