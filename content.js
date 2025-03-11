// Get current tab ID
const tabId = chrome.devtools.inspectedWindow.tabId;

// Function to apply volume to media elements
function applyVolume(volume) {
    document.querySelectorAll("video, audio").forEach(media => {
        media.volume = volume;
    });
}

// Get stored volume and apply it
chrome.storage.sync.get(['soundTabs'], (result) => {
    const volume = result.soundTabs?.[tabId]?.volume;
    if (volume !== undefined) {
        applyVolume(volume);
    }
});

// Detect media playback
document.querySelectorAll("video, audio").forEach(media => {
    media.addEventListener('play', () => {
        chrome.runtime.sendMessage({
            action: 'mediaPlaying',
            tabId: tabId
        });
    });
});

// Watch for new media elements
const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
                // Get stored volume and apply it to new media
                chrome.storage.sync.get(['soundTabs'], (result) => {
                    const volume = result.soundTabs?.[tabId]?.volume;
                    if (volume !== undefined) {
                        node.volume = volume;
                    }
                });
            }
        });
    });
});

// Start observing the document body for new media elements
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Handle volume adjustment
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "setVolume") {
        applyVolume(message.volume);
    }
});
