(function() {
    let tabId;
    let audioContext;
    let gainNode;
    let bassBoostFilter;
    let connectedElements = new WeakSet();

    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            gainNode = audioContext.createGain();
            
            // Create bass boost filter
            bassBoostFilter = audioContext.createBiquadFilter();
            bassBoostFilter.type = 'lowshelf';
            bassBoostFilter.frequency.value = 200; // Boost frequencies below 200Hz
            bassBoostFilter.gain.value = 0; // Start with no boost
            
            // Connect audio chain: source -> bassBoost -> gain -> destination
            bassBoostFilter.connect(gainNode);
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
                
                // Connect element to audio chain if not already connected
                if (!connectedElements.has(media)) {
                    try {
                        const source = audioContext.createMediaElementSource(media);
                        source.connect(bassBoostFilter); // Connect to bass boost first
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

    function setBassBoost(boostLevel) {
        if (bassBoostFilter) {
            // boostLevel: 0-10 (0 = no boost, 10 = maximum boost)
            bassBoostFilter.gain.value = boostLevel * 2; // Scale to 0-20dB
        }
    }

    function applyStoredVolume() {
        chrome.storage.local.get([String(tabId)], (data) => {
            const savedVolume = data[tabId] !== undefined ? data[tabId] / 100 : 1;
            setVolume(savedVolume);
        });
    }

    function applyStoredBassBoost() {
        chrome.storage.local.get([`bass_${tabId}`], (data) => {
            const savedBassBoost = data[`bass_${tabId}`] !== undefined ? data[`bass_${tabId}`] : 0;
            setBassBoost(savedBassBoost);
        });
    }

    // Get tab ID from background script
    chrome.runtime.sendMessage({ action: "getTabId" }, (id) => {
        tabId = id;
        applyStoredVolume();
        applyStoredBassBoost();
    });

    // Listen for volume and bass boost updates from popup
    chrome.runtime.onMessage.addListener((message) => {
        if (message.tabId === tabId) {
            if (message.action === "updateVolume") {
                setVolume(message.volume);
            } else if (message.action === "updateBassBoost") {
                setBassBoost(message.bassBoost);
            }
        }
    });

    // Apply volume and bass boost when tab becomes active
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            applyStoredVolume();
            applyStoredBassBoost();
        }
    });

    // Watch for new media elements and apply stored settings
    const observer = new MutationObserver(() => {
        applyStoredVolume();
        applyStoredBassBoost();
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
