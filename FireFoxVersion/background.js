// Use browser API for Firefox compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

browserAPI.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {
        // Firefox doesn't need explicit script injection with content_scripts in manifest
        // Content script will auto-inject, but we can still send a message if needed
        browserAPI.tabs.sendMessage(tabId, { action: "tabUpdated" }).catch(() => {
            // Ignore errors if content script not ready
        });
    }
});

browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getTabId" && sender.tab) {
        sendResponse(sender.tab.id);
    }
});

