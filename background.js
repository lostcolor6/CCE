// Handle tab ID requests from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getTabId' && sender.tab) {
        sendResponse({tabId: sender.tab.id});
    }
    return true; // Keep message channel open for async response
});

// Track tabs that have ever played sound and their volumes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.audible !== undefined) {
        chrome.action.setBadgeText({
            tabId: tabId,
            text: changeInfo.audible ? "🔊" : ""
        });

        if (changeInfo.audible) {
            chrome.storage.sync.get(['soundTabs'], (result) => {
                const soundTabs = result.soundTabs || {};
                soundTabs[tabId] = {
                    title: tab.title,
                    lastUpdated: Date.now(),
                    volume: soundTabs[tabId]?.volume || 1 // Preserve existing volume
                };
                chrome.storage.sync.set({ soundTabs });
            });
        }
    }
});

// Clean up closed tabs
chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.sync.get(['soundTabs'], (result) => {
        const soundTabs = result.soundTabs || {};
        delete soundTabs[tabId];
        chrome.storage.sync.set({ soundTabs });
    });
});

