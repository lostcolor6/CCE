(function() {
    let tabId;

    function setVolume(volume) {
        document.querySelectorAll("video, audio").forEach(media => {
            media.volume = volume;
        });
    }

    function applyStoredVolume() {
        chrome.storage.local.get([String(tabId)], (data) => {
            const savedVolume = data[tabId] !== undefined ? data[tabId] / 100 : 1;
            setVolume(savedVolume);
        });
    }

    // Get tab ID from background script
    chrome.runtime.sendMessage({ action: "getTabId" }, (id) => {
        tabId = id;
        applyStoredVolume();
    });

    // Listen for volume updates from popup
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "updateVolume" && message.tabId === tabId) {
            setVolume(message.volume);
        }
    });

    // Apply volume when tab becomes active
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            applyStoredVolume();
        }
    });

    // Watch for new media elements and apply stored volume
    const observer = new MutationObserver(applyStoredVolume);
    observer.observe(document.body, { childList: true, subtree: true });
})();
