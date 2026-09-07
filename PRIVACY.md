# Privacy

LaunchPad is a browser extension that runs locally. It has no LaunchPad account system, telemetry service, advertising SDK, hosted database or developer-operated backend.

## What is stored

- Shortcuts, app/account links, theme, optional avatar URL, arXiv categories and filters, Scour profile URL and panel preferences are stored in Chrome extension storage.
- Settings are written locally first, then to Chrome's sync area. Chrome decides whether that area is synchronized with your signed-in browsers. Sync failure is shown without discarding the successful local save.
- Feed caches are kept in extension-page local storage. They are tied to their source/category where relevant. Scour preview data is kept in memory for the current page.
- A bounded local diagnostic log records source/storage failures. It is not uploaded to the developer.

Avoid putting secrets in shortcut, profile or avatar URLs. Extension settings are not a password manager, and Chrome sync may copy them to other signed-in browsers.

## Requests to other services

Opening a new tab can contact arXiv, OSS Insight and GitHub for research content. Scour is contacted after a profile is connected. Site favicons and Google product icons are requested to identify shortcuts; this exposes the relevant hostname to the icon service. A custom avatar URL is contacted only when configured.

Using the search box navigates to Google or the address you entered. An address containing an embedded username or password is rejected locally and is not forwarded to Google. Voice search uses the browser's speech-recognition implementation, which may process audio through its provider. LaunchPad does not itself record, store or upload an audio file. Google Lens opens Google's website.

Article previews request an optional permission for the selected HTTPS origin. Preview fetches omit credentials and do not follow redirects. Normal feed requests use the browser's same-origin credential policy. Previews may display an image supplied by the article metadata; that request can contact the image host. Preview requests/images suppress the referring page URL.

These services receive normal network information, including your IP address, and their own privacy policies apply. LaunchPad does not read your Google profile, sign-in status, browsing history, passwords, cookies API or unrelated tabs.

## Permissions and control

- `storage`: save settings locally and in Chrome's sync area.
- Required source host permissions: arXiv, Scour, OSS Insight and GitHub endpoints.
- Optional HTTPS host permissions: requested for individual preview origins after you select Preview.

You can disconnect Scour by clearing its profile field, remove the custom avatar URL, or manage extension site access in Chrome's extension details. Disable the extension to stop new-tab behavior. Removing the extension clears its local extension storage; Chrome-managed sync/site data follow Chrome's own settings.

## Reports

When reporting a problem, redact personal URLs and do not attach your complete extension storage or diagnostic log. The project only receives information you deliberately submit through GitHub or another contact channel.
