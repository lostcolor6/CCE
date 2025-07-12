(function() {
    let tabId;
    let audioContext;
    let gainNode;
    let connectedElements = new WeakSet();

    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);
        }
    }

    function setVolume(volume) {
        document.querySelectorAll("video, audio").forEach(media => {
            if (volume > 1.0) {
                // Use Web Audio API for amplification
                initAudioContext();
                media.volume = 1.0; // Max native volume
                gainNode.gain.value = volume; // Apply boost
                
                // Connect element to gain node if not already connected
                if (!connectedElements.has(media)) {
                    try {
                        const source = audioContext.createMediaElementSource(media);
                        source.connect(gainNode);
                        connectedElements.add(media);
                    } catch (e) {
                        console.warn('Could not connect media element to Web Audio API:', e);
                    }
                }
            } else {
                // Normal volume: use element's native volume
                media.volume = volume;
                if (gainNode) gainNode.gain.value = 1.0;
            }
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
