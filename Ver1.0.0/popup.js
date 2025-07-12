document.addEventListener("DOMContentLoaded", async () => {
    const tabsList = document.getElementById("tabs-list");
    const themeToggle = document.getElementById("theme-toggle");

    // Load dark mode setting
    chrome.storage.local.get(["darkMode"], (data) => {
        if (data.darkMode) {
            document.body.classList.add("dark-mode");
            themeToggle.checked = true;
        }
    });

    // Toggle dark/white mode
    themeToggle.addEventListener("change", () => {
        document.body.classList.toggle("dark-mode");
        chrome.storage.local.set({ darkMode: themeToggle.checked });
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
        const tabs = await chrome.tabs.query({ audible: true });
        const storedVolumes = await chrome.storage.local.get(null);

        tabsList.innerHTML = "";
        tabs.forEach(tab => {
            const tabDiv = document.createElement("div");
            tabDiv.classList.add("tab-entry");
        
            const marqueeContainer = document.createElement("div");
            marqueeContainer.classList.add("marquee");
            const title = document.createElement("span");
            title.textContent = tab.title;
            marqueeContainer.appendChild(title);
            
            marqueeContainer.onclick = () => chrome.tabs.update(tab.id, { active: true });
        
            const slider = document.createElement("input");
            slider.type = "range";
            slider.min = "0";
            slider.max = "140"; // 0-100 (fine) + 100-500 in 40 steps of 10% each
            
            // Set default value (100% = slider position 100)
            const storedVolume = storedVolumes[tab.id] || 100;
            slider.value = volumeToSlider(storedVolume);
        
            const percentage = document.createElement("span");
            percentage.classList.add("volume-percentage");
            percentage.textContent = sliderToVolume(slider.value) + "%";
        
            slider.oninput = () => {
                const volumePercent = sliderToVolume(slider.value);
                const volume = volumePercent / 100; // This now goes from 0.0 to 5.0
                percentage.textContent = volumePercent + "%";
                chrome.storage.local.set({ [tab.id]: volumePercent });
        
                chrome.tabs.sendMessage(tab.id, { action: "updateVolume", tabId: tab.id, volume });
            };
        
            tabDiv.appendChild(marqueeContainer);
            tabDiv.appendChild(slider);
            tabDiv.appendChild(percentage);
            tabsList.appendChild(tabDiv);
        });
    }

    chrome.tabs.onUpdated.addListener(updatePopup);
    chrome.tabs.onRemoved.addListener(updatePopup);

    updatePopup();
});
