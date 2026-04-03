(function() {
    // Use browser API for Firefox compatibility
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
    
    let tabId;
    let audioContext;
    let gainNode;
    let bassBoostFilter;
    let currentVolume = 1;
    let currentBassBoost = 0;
    let connectedElements = new WeakSet();

    function callApi(method, context, ...args) {
        try {
            const result = method.apply(context, args);
            if (result && typeof result.then === "function") {
                return result;
            }
            if (typeof browser !== 'undefined') {
                return Promise.resolve(result);
            }
        } catch (error) {
            return Promise.reject(error);
        }

        return new Promise((resolve, reject) => {
            try {
                method.apply(context, [...args, (value) => {
                    const lastError = browserAPI.runtime && browserAPI.runtime.lastError;
                    if (lastError) {
                        reject(new Error(lastError.message));
                    } else {
                        resolve(value);
                    }
                }]);
            } catch (error) {
                reject(error);
            }
        });
    }

    function clampVolume(volume) {
        if (Number.isNaN(volume)) {
            return 1;
        }
        return Math.max(0, Math.min(volume, 5));
    }

    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            gainNode = audioContext.createGain();
            
            // Create bass boost filter
            bassBoostFilter = audioContext.createBiquadFilter();
            bassBoostFilter.type = 'lowshelf';
            bassBoostFilter.frequency.value = 160; // Push the boost a little lower for headphones
            bassBoostFilter.gain.value = 0; // Start with no boost
            
            // Connect audio chain: source -> bassBoost -> gain -> destination
            bassBoostFilter.connect(gainNode);
            gainNode.connect(audioContext.destination);
        }
    }

    async function ensureAudioContextRunning() {
        initAudioContext();

        if (audioContext && audioContext.state === "suspended") {
            try {
                await audioContext.resume();
            } catch (error) {
                console.warn('Could not resume audio context:', error);
            }
        }
    }

    function connectMediaElement(media) {
        if (!audioContext || connectedElements.has(media)) {
            return;
        }

        try {
            const source = audioContext.createMediaElementSource(media);
            source.connect(bassBoostFilter);
            connectedElements.add(media);
        } catch (error) {
            console.warn('Could not connect media element to Web Audio API:', error);
        }
    }

    async function setVolume(volume) {
        currentVolume = clampVolume(volume);

        if (currentVolume > 1) {
            await ensureAudioContextRunning();
        }

        document.querySelectorAll("video, audio").forEach(media => {
            if (currentVolume > 1.0) {
                media.volume = 1.0;
                connectMediaElement(media);
            } else {
                media.volume = currentVolume;
            }
        });

        if (gainNode) {
            gainNode.gain.value = currentVolume > 1 ? currentVolume : 1.0;
        }
    }

    function setBassBoost(boostLevel) {
        currentBassBoost = Math.max(0, Math.min(parseInt(boostLevel, 10) || 0, 10));

        if (bassBoostFilter) {
            // boostLevel: 0-10 (0 = no boost, 10 = maximum boost)
            bassBoostFilter.gain.value = currentBassBoost * 3; // Scale to 0-30dB for a stronger effect
        }
    }

    async function applyStoredVolume() {
        if (tabId === undefined || tabId === null) {
            return;
        }

        const data = await callApi(browserAPI.storage.local.get, browserAPI.storage.local, [String(tabId)]);
        const savedVolume = data[String(tabId)];
        await setVolume(savedVolume !== undefined ? savedVolume / 100 : 1);
    }

    async function applyStoredBassBoost() {
        if (tabId === undefined || tabId === null) {
            return;
        }

        const data = await callApi(browserAPI.storage.local.get, browserAPI.storage.local, [`bass_${tabId}`]);
        const savedBassBoost = data[`bass_${tabId}`];
        setBassBoost(savedBassBoost !== undefined ? savedBassBoost : 0);
    }

    async function reapplyStoredSettings() {
        await Promise.all([applyStoredVolume(), applyStoredBassBoost()]);
    }

    // Get tab ID from background script
    callApi(browserAPI.runtime.sendMessage, browserAPI.runtime, { action: "getTabId" })
        .then((id) => {
            tabId = id;
            return reapplyStoredSettings();
        })
        .catch((error) => {
            console.warn('Could not resolve tab ID:', error);
        });

    // Listen for volume and bass boost updates from popup
    browserAPI.runtime.onMessage.addListener((message) => {
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
            reapplyStoredSettings().catch(() => {});
        }
    });

    window.addEventListener("pageshow", () => {
        reapplyStoredSettings().catch(() => {});
    });

    document.addEventListener("play", () => {
        reapplyStoredSettings().catch(() => {});
    }, true);

    // Watch for new media elements and apply stored settings
    const observer = new MutationObserver(() => {
        reapplyStoredSettings().catch(() => {});
    });

    function startObserver() {
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            document.addEventListener("DOMContentLoaded", startObserver, { once: true });
        }
    }

    startObserver();

    const reapplyInterval = window.setInterval(() => {
        if (!document.hidden) {
            reapplyStoredSettings().catch(() => {});
        }
    }, 7000);

    window.addEventListener("beforeunload", () => {
        window.clearInterval(reapplyInterval);
        observer.disconnect();
    });
})();
