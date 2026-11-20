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

## Upgrading from 1.1.0 or earlier

From 1.2.0 the extension ID is fixed (`bhppmjiledkmeodkecnbdipllhlabplh`), which the Google account picture needs. Older unpacked installs had a folder-based ID, so the first upgrade starts with empty settings. To keep them:

1. On a LaunchPad new tab, open DevTools (`Cmd+Option+J` / `Ctrl+Shift+J`) and run:
   `Promise.all([chrome.storage.sync.get(null), chrome.storage.local.get(null)]).then(([s, l]) => { copy(JSON.stringify({ s, l })); console.log('copied'); })`
   then paste the clipboard into a text file.
2. Remove the old extension, then load the 1.2.0 folder with **Load unpacked**.
3. On a new LaunchPad tab, open DevTools and run `const d = <pasted JSON>; await chrome.storage.sync.set(d.s); await chrome.storage.local.set(d.l); location.reload();`

Later updates keep the same ID and only need the steps above in "Update without losing settings".

## Return to Chrome's normal new tab

Disable LaunchPad in `chrome://extensions`. Removing it also removes its local extension storage. Browser-managed sync and site data follow Chrome's own settings.
