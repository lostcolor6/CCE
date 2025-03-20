document.addEventListener("DOMContentLoaded", async () => {
    const tabsList = document.getElementById("tabs-list");

    async function updatePopup() {
        const tabs = await chrome.tabs.query({ audible: true });
        const storedVolumes = await chrome.storage.local.get(null);

        tabsList.innerHTML = "";
        tabs.forEach(tab => {
            const tabDiv = document.createElement("div");
            tabDiv.classList.add("tab-entry");

            const title = document.createElement("div");
            title.classList.add("tab-title");
            title.textContent = tab.title;
            title.onclick = () => chrome.tabs.update(tab.id, { active: true });

            const slider = document.createElement("input");
            slider.type = "range";
            slider.min = "0";
            slider.max = "100";
            slider.value = storedVolumes[tab.id] || 100;
            slider.oninput = () => {
                const volume = slider.value / 100;
                chrome.storage.local.set({ [tab.id]: slider.value });

                // Send message to content script in the specific tab
                chrome.tabs.sendMessage(tab.id, { action: "updateVolume", tabId: tab.id, volume });
            };

            tabDiv.appendChild(title);
            tabDiv.appendChild(slider);
            tabsList.appendChild(tabDiv);
        });
    }

    chrome.tabs.onUpdated.addListener(updatePopup);
    chrome.tabs.onRemoved.addListener(updatePopup);

    updatePopup();
});
