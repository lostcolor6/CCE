chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {
        chrome.scripting.executeScript({
            target: { tabId },
            files: ["content.js"]
        });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getTabId") {
        sendResponse(sender.tab.id);
    }
});

