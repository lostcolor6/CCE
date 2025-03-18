document.addEventListener("DOMContentLoaded", async () => {
    let slidersDiv = document.getElementById("sliders");
    slidersDiv.innerHTML = ""; // Clear existing sliders

    // Get all tabs that have ever played sound
    const { soundTabs } = await chrome.storage.sync.get(['soundTabs']);
    const currentTabs = await chrome.tabs.query({});

    if (soundTabs) {
        Object.entries(soundTabs).forEach(([tabId, tabInfo]) => {
            // Check if tab still exists
            if (currentTabs.some(tab => tab.id === Number(tabId))) {
                // Create container for slider and label
                let container = document.createElement("div");
                container.className = "slider-container";

                // Create label with tab title
                let label = document.createElement("span");
                label.textContent = tabInfo.title || "Untitled Tab";
                label.className = "tab-label";
                label.onclick = () => {
                    chrome.tabs.update(Number(tabId), { active: true });
                };

                // Create slider
                let slider = document.createElement("input");
                slider.type = "range";
                slider.min = "0";
                slider.max = "2";
                slider.step = "0.02";
                // Ensure volume is properly parsed and slider position is correct
                const initialVolume = parseFloat(tabInfo.volume);
                slider.value = isNaN(initialVolume) ? 1 : initialVolume;
                slider.className = "slider";
                slider.dataset.tabId = tabId;

                // Create percentage display
                let percentage = document.createElement("span");
                percentage.className = "percentage";
                percentage.textContent = `${Math.round(parseFloat(slider.value) * 50)}%`;

                slider.oninput = () => {
                    const volume = parseFloat(slider.value);
                    // Update percentage display
                    percentage.textContent = `${Math.round(volume * 50)}%`;
                    // Update storage
                    chrome.storage.sync.get(['soundTabs'], (result) => {
                        const soundTabs = result.soundTabs || {};
                        if (soundTabs[tabId]) {
                            soundTabs[tabId].volume = volume;
                            chrome.storage.sync.set({ soundTabs });
                        }
                    });
                    
                    // Update tab volume
                    chrome.scripting.executeScript({
                        target: { tabId: Number(tabId) },
                        function: setVolume,
                        args: [volume]
                    });
                };

                
                container.appendChild(label);
                container.appendChild(percentage);
                container.appendChild(slider);
                slidersDiv.appendChild(container);
            }
        });
    }
});

function setVolume(volume) {
    document.querySelectorAll("video, audio").forEach(media => {
        media.volume = volume;
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const volumeSlider = document.getElementById("volume-slider");

    // Get the current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        const tabId = currentTab.id;

        // Load the saved volume for the current tab
        chrome.storage.local.get([tabId.toString()], (result) => {
            const savedVolume = result[tabId];
            if (savedVolume !== undefined) {
                volumeSlider.value = savedVolume * 100; // Slider expects 0-100
            }
        });

        // Listen for slider changes
        volumeSlider.addEventListener("input", (event) => {
            const volume = event.target.value / 100; // Convert to 0-1 range

            // Send the volume to the background script
            chrome.runtime.sendMessage({
                type: "setVolume",
                tabId: tabId,
                volume: volume
            });
        });
    });
});
