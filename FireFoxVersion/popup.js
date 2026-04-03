document.addEventListener("DOMContentLoaded", async () => {
    // Use browser API for Firefox compatibility
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
    
    const tabsList = document.getElementById("tabs-list");
    const themeToggle = document.getElementById("theme-toggle");
    const bassToggle = document.getElementById("bass-toggle");
    let bassBoostEnabled = false;

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

    async function getCurrentTabs() {
        const tabs = await callApi(browserAPI.tabs.query, browserAPI.tabs, { currentWindow: true });
        return tabs.filter(tab => typeof tab.url === "string" && /^https?:/i.test(tab.url));
    }

    async function getStoredData() {
        return await callApi(browserAPI.storage.local.get, browserAPI.storage.local, null);
    }

    async function setStoredData(data) {
        return await callApi(browserAPI.storage.local.set, browserAPI.storage.local, data);
    }

    async function sendTabMessage(tabId, message) {
        try {
            await callApi(browserAPI.tabs.sendMessage, browserAPI.tabs, tabId, message);
        } catch (error) {
            // Ignore tabs where the content script is not ready yet.
        }
    }

    // Load settings
    callApi(browserAPI.storage.local.get, browserAPI.storage.local, ["darkMode", "bassBoostEnabled"])
        .then((data) => {
            if (data.darkMode) {
                document.body.classList.add("dark-mode");
                themeToggle.checked = true;
            }
            if (data.bassBoostEnabled) {
                bassBoostEnabled = true;
                bassToggle.checked = true;
            }
        })
        .catch(() => {});

    // Toggle dark/white mode
    themeToggle.addEventListener("change", () => {
        document.body.classList.toggle("dark-mode");
        setStoredData({ darkMode: themeToggle.checked });
    });

    // Toggle bass boost visibility
    bassToggle.addEventListener("change", () => {
        bassBoostEnabled = bassToggle.checked;
        setStoredData({ bassBoostEnabled: bassBoostEnabled });
        updatePopup(); // Refresh to show/hide bass controls
    });

    // Convert slider position to volume percentage
    function sliderToVolume(sliderValue) {
        const pos = parseInt(sliderValue);
        if (pos <= 100) {
            // Fine control: 0-100% (1% increments)
            return pos;
        } else {
            // Coarse control: 100-500% (10% increments)
            return 100 + ((pos - 100) * 10);
        }
    }

    // Convert volume percentage to slider position
    function volumeToSlider(volume) {
        const vol = parseInt(volume);
        if (vol <= 100) {
            return vol;
        } else {
            return 100 + Math.round((vol - 100) / 10);
        }
    }

    async function updatePopup() {
        const tabs = await getCurrentTabs();
        const storedVolumes = await getStoredData();

        tabsList.innerHTML = "";
        tabs.forEach(tab => {
            const tabDiv = document.createElement("div");
            tabDiv.classList.add("tab-entry");
        
            const marqueeContainer = document.createElement("div");
            marqueeContainer.classList.add("marquee");
            const title = document.createElement("span");
            title.textContent = tab.title || tab.url;
            marqueeContainer.appendChild(title);
            
            marqueeContainer.onclick = () => callApi(browserAPI.tabs.update, browserAPI.tabs, tab.id, { active: true });
        
            const controlsDiv = document.createElement("div");
            controlsDiv.classList.add("controls");
            
            // Volume slider
            const volumeContainer = document.createElement("div");
            volumeContainer.classList.add("slider-container");
            
            const volumeLabel = document.createElement("span");
            volumeLabel.textContent = "Vol:";
            volumeLabel.classList.add("slider-label");
            
            const volumeSlider = document.createElement("input");
            volumeSlider.type = "range";
            volumeSlider.min = "0";
            volumeSlider.max = "140"; // 0-100 (fine) + 100-500 in 40 steps of 10% each
            
            // Set default value (100% = slider position 100)
            const storedVolume = storedVolumes[String(tab.id)] ?? 100;
            volumeSlider.value = volumeToSlider(storedVolume);
        
            const volumePercentage = document.createElement("span");
            volumePercentage.classList.add("volume-percentage");
            volumePercentage.textContent = sliderToVolume(volumeSlider.value) + "%";
        
            volumeSlider.oninput = () => {
                const volumePercent = sliderToVolume(volumeSlider.value);
                const volume = volumePercent / 100; // This now goes from 0.0 to 5.0
                volumePercentage.textContent = volumePercent + "%";
                setStoredData({ [tab.id]: volumePercent });
        
                sendTabMessage(tab.id, { action: "updateVolume", tabId: tab.id, volume });
            };
            
            volumeContainer.appendChild(volumeLabel);
            volumeContainer.appendChild(volumeSlider);
            volumeContainer.appendChild(volumePercentage);
            
            controlsDiv.appendChild(volumeContainer);
            
            // Bass boost slider (only show if enabled)
            if (bassBoostEnabled) {
                const bassContainer = document.createElement("div");
                bassContainer.classList.add("slider-container", "bass-container", "show");
                
                const bassLabel = document.createElement("span");
                bassLabel.textContent = "Bass:";
                bassLabel.classList.add("slider-label");
                
                const bassSlider = document.createElement("input");
                bassSlider.type = "range";
                bassSlider.min = "0";
                bassSlider.max = "10";
                bassSlider.value = storedVolumes[`bass_${tab.id}`] ?? 0;
                
                const bassValue = document.createElement("span");
                bassValue.classList.add("volume-percentage");
                bassValue.textContent = bassSlider.value;
                
                bassSlider.oninput = () => {
                    const bassBoost = parseInt(bassSlider.value);
                    bassValue.textContent = bassBoost;
                    setStoredData({ [`bass_${tab.id}`]: bassBoost });
                    
                    sendTabMessage(tab.id, { action: "updateBassBoost", tabId: tab.id, bassBoost });
                };
                
                bassContainer.appendChild(bassLabel);
                bassContainer.appendChild(bassSlider);
                bassContainer.appendChild(bassValue);
                
                controlsDiv.appendChild(bassContainer);
            }
        
            tabDiv.appendChild(marqueeContainer);
            tabDiv.appendChild(controlsDiv);
            tabsList.appendChild(tabDiv);
        });
    }

    browserAPI.tabs.onUpdated.addListener(() => {
        updatePopup().catch(() => {});
    });
    browserAPI.tabs.onRemoved.addListener(() => {
        updatePopup().catch(() => {});
    });

    updatePopup().catch(() => {});
});
