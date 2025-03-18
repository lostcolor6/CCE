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

// Store volume settings for each tab
const tabVolumes = {};

// Listen for messages from the popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "setVolume") {
        const { tabId, volume } = message;
        tabVolumes[tabId] = volume;

        // Save the volume in Chrome storage for persistence
        chrome.storage.local.set({ [tabId]: volume });

        // Apply the volume to the tab
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (volume) => {
                const audios = document.querySelectorAll("audio, video");
                audios.forEach(audio => audio.volume = volume);
            },
            args: [volume]
        });
    }
});

// Reapply volume when a tab updates or reloads
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
        chrome.storage.local.get([tabId.toString()], (result) => {
            const volume = result[tabId];
            if (volume !== undefined) {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: (volume) => {
                        const audios = document.querySelectorAll("audio, video");
                        audios.forEach(audio => audio.volume = volume);
                    },
                    args: [volume]
                });
            }
        });
    }
});

// Clean up when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    delete tabVolumes[tabId];
    chrome.storage.local.remove(tabId.toString());
});

