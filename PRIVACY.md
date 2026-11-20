# Privacy

LaunchPad is a browser extension that runs locally. It has no LaunchPad account system, telemetry service, advertising SDK, hosted database or developer-operated backend.

## What is stored

- Shortcuts, app/account links, theme, optional avatar URL, arXiv categories and filters, Scour profile URL, panel preferences and the search-suggestion switch are stored in Chrome extension storage.
- Settings are written locally first, then to Chrome's sync area. Chrome decides whether that area is synchronized with your signed-in browsers. Sync failure is shown without discarding the successful local save.
- Feed caches are kept in extension-page local storage. They are tied to their source/category where relevant. Scour preview data is kept in memory for the current page.
- Papers you save to the Saved list (title, link, authors, abstract, date and category, up to 200) stay in local extension storage on this device and are not synced.
- If you switch on the Google account picture, only its image URL and fetch time are kept in local extension storage on this device (re-checked with Google when a new tab opens or is shown again, at most once a minute) and are not synced. Disconnecting removes them.
- A bounded local diagnostic log records source/storage failures. It is not uploaded to the developer.

Avoid putting secrets in shortcut, profile or avatar URLs. Extension settings are not a password manager, and Chrome sync may copy them to other signed-in browsers.

## Requests to other services

Opening a new tab can contact arXiv, OSS Insight and GitHub for research content. Scour is contacted after a profile is connected. Shortcut and suggestion icons are read from Chrome's local favicon cache, so no icon request leaves your device; sites Chrome has no icon for show their first letter. Google product icons (Gmail, Docs, Drive, Calendar and the apps menu) are loaded from Google's `gstatic.com`. A custom avatar URL is contacted only when configured. The Google account picture contacts `www.googleapis.com` and Google's image host only after you switch it on.

Using the search box navigates to Google or the address you entered. An address containing an embedded username or password is rejected locally and is not forwarded to Google. Voice search uses the browser's speech-recognition implementation, which may process audio through its provider. LaunchPad does not itself record, store or upload an audio file. Google Lens opens Google's website. The AI Mode button opens Google AI Mode with the text in the search box.

Google search suggestions are off by default. When you switch them on in Settings, Chrome asks for access to `www.google.com`. While they are on, the text you type in the LaunchPad search box is sent to Google's suggestion service after a short pause, without cookies and without a referring page. Addresses with an embedded username or password are never sent. Switching suggestions off removes that site access. Chrome's own address bar is separate and follows Chrome's settings.

The arXiv panel's **HF Hot** source is optional. The first time you choose it, Chrome asks for access to `huggingface.co`; LaunchPad then reads the public Hugging Face Daily Papers list (no account or cookies are needed) and caches it locally. Without that access no Hugging Face request is made.

Article previews request an optional permission for the selected HTTPS origin. Preview fetches omit credentials and do not follow redirects. Normal feed requests use the browser's same-origin credential policy. Previews may display an image supplied by the article metadata; that request can contact the image host. Preview requests/images suppress the referring page URL.

The **Google account picture** in Settings is off by default. When you switch it on, Chrome asks for the `identity` permission and access to `www.googleapis.com`, and may ask you to approve the profile scope for the Google account signed in to Chrome. LaunchPad then requests an OAuth token from Chrome and reads only the profile picture URL from Google's userinfo endpoint (scope `userinfo.profile`; no email, contacts, Gmail or Drive data), without cookies. The token is kept by Chrome, not by LaunchPad. **Disconnect** drops Chrome's cached token, removes the saved picture and removes both permissions. When Chrome's signed-in account changes, the saved picture is discarded.

These services receive normal network information, including your IP address, and their own privacy policies apply. Apart from the opt-in account picture, LaunchPad does not read your Google profile or sign-in status, and it never reads browsing history, passwords, cookies API or unrelated tabs.

## Permissions and control

- `storage`: save settings locally and in Chrome's sync area.
- `favicon`: read site icons from Chrome's local favicon cache. Chrome may describe it as "Read the icons of the websites you visit"; LaunchPad requests only the icons of your shortcuts and suggestions.
- Required source host permissions: arXiv, Scour, OSS Insight and GitHub endpoints.
- Optional HTTPS host permissions: requested for individual preview origins after you select Preview, for `www.google.com` only when you switch on search suggestions, for `huggingface.co` only when you choose HF Hot, and for `www.googleapis.com` only when you switch on the Google account picture.
- Optional `identity`: requested together with `www.googleapis.com` only for the Google account picture.

You can disconnect Scour by clearing its profile field, remove the custom avatar URL, or manage extension site access in Chrome's extension details. Disable the extension to stop new-tab behavior. Removing the extension clears its local extension storage; Chrome-managed sync/site data follow Chrome's own settings.

## Reports

When reporting a problem, redact personal URLs and do not attach your complete extension storage or diagnostic log. The project only receives information you deliberately submit through GitHub or another contact channel.
