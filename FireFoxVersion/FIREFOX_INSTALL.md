# Firefox Installation Guide

## How to Install Your Extension in Firefox

### Method 1: Temporary Installation (RECOMMENDED - Works on ANY Firefox)

**This method works on regular Firefox and doesn't require any special settings!**

1. Open **any Firefox version** (regular or Developer Edition)
2. Type `about:debugging` in the address bar and press Enter
3. Click "This Firefox" on the left sidebar
4. Click "Load Temporary Add-on..."
5. Navigate to your extension folder and select the `manifest.json` file (**NOT the .xpi file**)
6. Your extension will be loaded temporarily (until you restart Firefox)

### Method 2: Permanent Installation (ONLY Firefox Developer Edition/Nightly)

**IMPORTANT**: This ONLY works in Firefox Developer Edition, Nightly, or ESR - NOT regular Firefox!

1. **Download and install Firefox Developer Edition** if you haven't: https://www.mozilla.org/firefox/developer/
2. **Launch Firefox Developer Edition specifically** (make sure it says "Developer Edition" in the title)
3. Type `about:config` in the address bar and accept the warning
4. Search for `xpinstall.signatures.required` and double-click to set it to `false`
5. **RESTART Firefox Developer Edition** (this is crucial!)
6. **Run the packaging script**:
   - **Windows**: Double-click `package-firefox.bat` OR run `package-firefox.ps1` in PowerShell
   - **Manual**: Create a ZIP with ONLY these files: `manifest.json`, `background.js`, `content.js`, `popup.html`, `popup.css`, `popup.js`, `icon.PNG`
7. Rename the .zip file to .xpi
8. Drag and drop the .xpi file into Firefox Developer Edition

**If you get "not verified" error:**
- You're probably using regular Firefox instead of Developer Edition
- The setting wasn't applied properly
- You didn't restart Firefox after changing the setting
- Use Method 1 instead (temporary installation)

### Method 3: Publish to Firefox Add-ons (AMO)

1. Create a developer account at https://addons.mozilla.org
2. Package your extension as a .zip file
3. Submit for review through the developer portal

## Key Changes Made for Firefox Compatibility

1. **Manifest Version**: Changed from v3 to v2 (better Firefox support)
2. **Background Scripts**: Used `background.scripts` instead of `service_worker`
3. **Browser Action**: Changed `action` to `browser_action`
4. **Content Scripts**: Added automatic injection via manifest
5. **API Compatibility**: Added `browserAPI` wrapper to support both Chrome and Firefox
6. **Permissions**: Simplified permission structure

## Testing Your Extension

After installation, you should be able to:
- See the extension icon in the toolbar
- Open the popup by clicking the icon
- Control volume for audible tabs
- Toggle dark mode and bass boost features

## Troubleshooting

- If the extension doesn't appear, check the Browser Console (F12) for errors
- Make sure all file paths in the manifest are correct
- Verify that the icon file exists and is accessible
- Check that permissions are correctly set

## Browser Compatibility

This extension now works on:
- ✅ Firefox (all versions)
- ✅ Chrome/Chromium browsers
- ✅ Edge
- ✅ Other WebExtension-compatible browsers
