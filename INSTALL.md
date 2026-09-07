# Install LaunchPad

LaunchPad is a Manifest V3 Chrome extension. Use Chrome 114 or newer; the current stable Chrome is recommended.

1. Download the release ZIP from the LaunchPad GitHub Releases page.
2. Extract it into a permanent folder. The folder must contain `manifest.json`.
3. Open `chrome://extensions`, enable **Developer mode**, and choose **Load unpacked**.
4. Select that folder, then open a new tab. Pin LaunchPad in Chrome's extension menu to use its popup.

No Node.js installation, account, API key or hosted backend is needed to run the extension. Connect a public Scour profile in Settings if you want that reading feed.

## Update without losing settings

Close existing LaunchPad tabs, replace the files in the **same permanent folder**, and select **Reload** on the extension card. Do not uninstall first. Moving an unpacked extension to another folder can change its identity and make its previous settings unavailable.

The extension does not update itself from GitHub. A GitHub download is a manual developer-mode installation, not a Chrome Web Store listing.

## Return to Chrome's normal new tab

Disable LaunchPad in `chrome://extensions`. Removing it also removes its local extension storage. Browser-managed sync and site data follow Chrome's own settings.
