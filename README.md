# Custom Chrome Extension (CCE)

Custom Chrome Extension (CCE) is a feature-rich browser extension designed to enhance the user experience on Chrome. It provides tools like tab-specific volume control, dark mode, and more planned features.

## Features

### Volume Control
- Adjust the volume of individual tabs using sliders.
- Displays the name of each tab above its slider.
- Syncs volume settings across tabs.
- Automatically applies saved volume settings when a tab is reloaded or revisited.

### Dark Mode
- Toggle between light and dark themes for the extension popup.
- Saves the user's theme preference for future sessions.

### Planned Features
- **YouTube MP3 Downloader**: Download audio from YouTube videos.
- **RAM Usage Display**: Monitor Chrome's memory usage.
- Additional features to be added in future updates.

---

## File Structure

### OldVersion
This folder contains the initial implementation of the extension.

- **`content.js`**: Handles media element volume control and observes DOM changes for new media elements.
- **`background.js`**: Manages tab-specific volume settings and communicates with the content script.
- **`popup.html`**: The user interface for controlling tab volumes.
- **`popup.js`**: Implements the logic for the popup UI, including slider functionality.
- **`manifest.json`**: Defines the extension's metadata and permissions.

### Ver1.0.0
This folder contains the updated version of the extension with improved functionality and a better user interface.

- **`content.js`**: Simplified and optimized for applying stored volume settings and handling new media elements.
- **`background.js`**: Handles script injection and tab-specific volume management.
- **`popup.html`**: Redesigned popup interface with a modern look and dark mode toggle.
- **`popup.js`**: Updated logic for managing tab volumes and dark mode.
- **`popup.css`**: Styles for the popup, including animations and dark mode support.
- **`manifest.json`**: Updated metadata and permissions for the new version.

---

## Installation

1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/lostcolor6/CCE.git
2. Open Chrome and navigate to chrome://extensions/.
3. Enable "Developer mode" in the top-right corner.
4. Click "Load unpacked" and select the `Ver1.0.0` folder.


## Permissions
The extension requires the following permissions (no need to do anything/ this is in `manifest.son`):

- Tabs: To query and update tab information.
- Storage: To save and retrieve volume settings and theme preferences.
- Scripting: To inject scripts into web pages for volume control.
- Host Permissions: To access all URLs for media element manipulation.
