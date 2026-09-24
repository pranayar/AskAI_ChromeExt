let aiBox = null;


// ============================================================
// MESSAGE HANDLER
// ============================================================

chrome.runtime.onMessage.addListener((message) => {

    // Used by background.js to check whether
    // the content script is already running.
    if (message.type === "PING") {
        return;
    }

    if (message.type !== "ASK_AI") {
        return;
    }

    const selectedText =
        message.selectedText ||
        window.getSelection().toString().trim();

    if (!selectedText) {
        showMessage("Please highlight some text first.");
        return;
    }

    askAI(selectedText);
});


// ============================================================
// SEND REQUEST TO NODE.JS / QWEN
// ============================================================

async function askAI(selectedText) {

    showLoading();

    try {

        const response = await fetch(
            "http://localhost:3000/ask",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    text: selectedText
                })
            }
        );


        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error(
                "The AI server returned an invalid response."
            );
        }


        if (!response.ok) {

            throw new Error(
                data.error ||
                "The AI request failed."
            );

        }


        if (!data.response) {

            throw new Error(
                "The AI returned an empty response."
            );

        }


        showResponse(data.response);

    } catch (error) {

        console.error(
            "AskAI error:",
            error
        );

        showMessage(
            "Could not connect to AskAI.\n\n" +
            "Make sure the Node.js server is running."
        );
    }
}


// ============================================================
// GET POSITION OF SELECTED TEXT
// ============================================================

function getSelectionPosition() {

    const selection =
        window.getSelection();


    if (
        !selection ||
        selection.rangeCount === 0
    ) {

        return {
            left: 20,
            top: 20,
            position: "below"
        };

    }


    const range =
        selection.getRangeAt(0);


    const rect =
        range.getBoundingClientRect();


    const popupWidth = 400;

    const popupHeight = 300;

    const margin = 16;

    const gap = 12;


    // --------------------------------------------------------
    // Horizontal position
    // --------------------------------------------------------

    let left =
        rect.left +
        (rect.width / 2) -
        (popupWidth / 2);


    // Don't go off the left side

    if (left < margin) {
        left = margin;
    }


    // Don't go off the right side

    if (
        left + popupWidth >
        window.innerWidth - margin
    ) {

        left =
            window.innerWidth -
            popupWidth -
            margin;

    }


    // --------------------------------------------------------
    // Vertical position
    // --------------------------------------------------------

    let top;

    let position;


    const spaceBelow =
        window.innerHeight -
        rect.bottom;


    const spaceAbove =
        rect.top;


    // Prefer below if there is enough space

    if (
        spaceBelow >=
        popupHeight + gap
    ) {

        top =
            rect.bottom + gap;

        position = "below";

    }

    // Otherwise put it above

    else if (
        spaceAbove >=
        popupHeight + gap
    ) {

        top =
            rect.top -
            popupHeight -
            gap;

        position = "above";

    }

    // If neither has enough room,
    // choose whichever has more space.

    else if (
        spaceBelow >=
        spaceAbove
    ) {

        top =
            rect.bottom + gap;

        position = "below";

    }

    else {

        top =
            rect.top -
            popupHeight -
            gap;

        position = "above";

    }


    // Keep within viewport

    if (top < margin) {
        top = margin;
    }


    if (
        top + popupHeight >
        window.innerHeight - margin
    ) {

        top =
            window.innerHeight -
            popupHeight -
            margin;

    }


    return {
        left,
        top,
        position
    };
}


// ============================================================
// CREATE POPUP
// ============================================================

function createBox() {

    removeBox();


    aiBox =
        document.createElement("div");


    aiBox.id =
        "askai-box";


    // Prevent the webpage from
    // affecting the popup's layout.

    aiBox.style.position = "fixed";

    aiBox.style.zIndex =
        "2147483647";


    document.body.appendChild(
        aiBox
    );


    positionBox();


    return aiBox;
}


// ============================================================
// POSITION POPUP
// ============================================================

function positionBox() {

    if (!aiBox) {
        return;
    }


    const position =
        getSelectionPosition();


    aiBox.style.left =
        `${position.left}px`;


    aiBox.style.top =
        `${position.top}px`;


    aiBox.dataset.position =
        position.position;
}


// ============================================================
// LOADING UI
// ============================================================

function showLoading() {

    const box =
        createBox();


    box.innerHTML = `

        <div class="askai-header">

            <div class="askai-title">

                <span class="askai-icon">
                    ✨
                </span>

                <span>
                    AskAI
                </span>

            </div>


            <button
                class="askai-close"
                aria-label="Close"
                type="button"
            >
                ×
            </button>

        </div>


        <div class="askai-body">

            <div class="askai-loading">

                <div class="askai-spinner"></div>

                <span>
                    Thinking...
                </span>

            </div>

        </div>

    `;


    setupCloseButton();
}


// ============================================================
// RESPONSE UI
// ============================================================

function showResponse(response) {

    const box =
        createBox();


    box.innerHTML = `

        <div class="askai-header">

            <div class="askai-title">

                <span class="askai-icon">
                    ✨
                </span>

                <span>
                    AskAI
                </span>

            </div>


            <button
                class="askai-close"
                aria-label="Close"
                type="button"
            >
                ×
            </button>

        </div>


        <div
            class="askai-body askai-response"
        ></div>

    `;


    const responseElement =
        box.querySelector(
            ".askai-response"
        );


    // IMPORTANT:
    // textContent prevents AI output
    // from being interpreted as HTML.

    responseElement.textContent =
        response;


    setupCloseButton();
}


// ============================================================
// ERROR / MESSAGE UI
// ============================================================

function showMessage(message) {

    const box =
        createBox();


    box.innerHTML = `

        <div class="askai-header">

            <div class="askai-title">

                <span class="askai-icon">
                    ✨
                </span>

                <span>
                    AskAI
                </span>

            </div>


            <button
                class="askai-close"
                aria-label="Close"
                type="button"
            >
                ×
            </button>

        </div>


        <div class="askai-body"></div>

    `;


    const body =
        box.querySelector(
            ".askai-body"
        );


    body.textContent =
        message;


    setupCloseButton();
}


// ============================================================
// CLOSE BUTTON
// ============================================================

function setupCloseButton() {

    const closeButton =
        aiBox?.querySelector(
            ".askai-close"
        );


    if (!closeButton) {
        return;
    }


    closeButton.addEventListener(
        "click",
        () => {

            removeBox();

        }
    );
}


// ============================================================
// REMOVE POPUP
// ============================================================

function removeBox() {

    if (aiBox) {

        aiBox.remove();

        aiBox = null;

    }
}


// ============================================================
// CLOSE WHEN CLICKING OUTSIDE
// ============================================================

document.addEventListener(
    "mousedown",
    (event) => {

        if (!aiBox) {
            return;
        }


        if (
            aiBox.contains(event.target)
        ) {

            return;

        }


        // Don't immediately close
        // while the user is interacting
        // with the page selection.

        const selection =
            window.getSelection();


        if (
            selection &&
            selection.toString().trim()
        ) {

            return;

        }


        removeBox();

    },
    true
);


// ============================================================
// REPOSITION WHEN WINDOW RESIZES
// ============================================================

window.addEventListener(
    "resize",
    () => {

        if (aiBox) {
            positionBox();
        }

    }
);