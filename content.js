// Detect media playback
document.querySelectorAll("video, audio").forEach(media => {
    media.addEventListener('play', () => {
        chrome.runtime.sendMessage({
            action: 'mediaPlaying',
            tabId: chrome.devtools.inspectedWindow.tabId
        });
    });
});

// Handle volume adjustment
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "setVolume") {
        document.querySelectorAll("video, audio").forEach(media => {
            media.volume = message.volume;
        });
    }
});
