function createContextMenu() {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: "askai-selection",
            title: "AskAI ✨",
            contexts: ["selection"]
        });
    });
}


chrome.runtime.onInstalled.addListener(() => {
    createContextMenu();
});


createContextMenu();


async function ensureContentScript(tabId) {

    try {

        await chrome.tabs.sendMessage(tabId, {
            type: "PING"
        });

        return true;

    } catch (error) {

        console.log("Content script not found. Injecting...");

        try {

            await chrome.scripting.executeScript({
                target: {
                    tabId: tabId
                },
                files: ["content.js"]
            });

            await chrome.scripting.insertCSS({
                target: {
                    tabId: tabId
                },
                files: ["style.css"]
            });

            return true;

        } catch (injectError) {

            console.error(
                "Could not inject AskAI:",
                injectError
            );

            return false;
        }
    }
}


chrome.contextMenus.onClicked.addListener(
    async (info, tab) => {

        if (
            info.menuItemId !==
            "askai-selection"
        ) {
            return;
        }

        if (!tab || !tab.id) {
            return;
        }

        const ready =
            await ensureContentScript(tab.id);

        if (!ready) {
            return;
        }

        try {

            await chrome.tabs.sendMessage(
                tab.id,
                {
                    type: "ASK_AI",
                    selectedText:
                        info.selectionText || ""
                }
            );

        } catch (error) {

            console.error(
                "Could not communicate with AskAI:",
                error
            );

        }
    }
);


chrome.action.onClicked.addListener(
    async (tab) => {

        if (!tab || !tab.id) {
            return;
        }

        const ready =
            await ensureContentScript(tab.id);

        if (!ready) {
            return;
        }

        try {

            await chrome.tabs.sendMessage(
                tab.id,
                {
                    type: "ASK_AI"
                }
            );

        } catch (error) {

            console.error(
                "Could not communicate with AskAI:",
                error
            );

        }
    }
);