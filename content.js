// Function to apply volume to media elements
let tabId;

// Get current tab ID from background script
chrome.runtime.sendMessage({action: 'getTabId'}, (response) => {
    tabId = response.tabId;
});

function applyVolume(volume) {
    document.querySelectorAll("video, audio").forEach(media => {
        media.volume = volume;
    });
}

// Get stored volume and apply it (after we have tabId)
function applyStoredVolume() {
    if (tabId) {
        chrome.storage.sync.get(['soundTabs'], (result) => {
            const volume = result.soundTabs?.[tabId]?.volume;
            if (volume !== undefined) {
                applyVolume(volume);
            }
        });
    }
}

// Reapply volume when we get the tab ID
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'tabIdReady') {
        applyStoredVolume();
    }
});

// Detect media playback
document.querySelectorAll("video, audio").forEach(media => {
    media.addEventListener('play', () => {
        if (tabId) {
            chrome.runtime.sendMessage({
                action: 'mediaPlaying',
                tabId: tabId
            });
        }
    });
});

// Watch for new media elements
const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
                // Get stored volume and apply it to new media
                if (tabId) {
                    chrome.storage.sync.get(['soundTabs'], (result) => {
                        const volume = result.soundTabs?.[tabId]?.volume;
                        if (volume !== undefined) {
                            node.volume = volume;
                        }
                    });
                }
            }
        });
    });
});

// Wait for DOM to be ready before setting up observer
function setupObserver() {
    if (document.body) {
        try {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } catch (error) {
            console.error('Failed to setup MutationObserver:', error);
        }
    } else {
        // If body isn't ready yet, wait for DOMContentLoaded
        document.addEventListener('DOMContentLoaded', setupObserver);
    }
}

// Start observing
setupObserver();

// Special handling for YouTube
if (window.location.hostname.includes('youtube.com')) {
    // Watch for YouTube's video change events
    const ytPlayer = document.getElementById('movie_player');
    if (ytPlayer) {
        ytPlayer.addEventListener('onStateChange', (event) => {
            // When video changes (state 1 is playing)
            if (event.data === 1 && tabId) {
                chrome.storage.sync.get(['soundTabs'], (result) => {
                    const volume = result.soundTabs?.[tabId]?.volume;
                    if (volume !== undefined) {
                        const video = document.querySelector('video');
                        if (video) {
                            video.volume = volume;
                        }
                    }
                });
            }
        });
    }
}

// Handle volume adjustment
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "setVolume") {
        applyVolume(message.volume);
    }
});
