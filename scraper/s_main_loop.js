// *************************
// ******** GLOBALS ********
// *************************

var subtaskPublic = new Object();
var stepMinimumLength = 0;

chrome.runtime.onConnect.addListener(function(port) {
    if (port.name === "scrapingPort") {
        port.onMessage.addListener(function(subtaskLocal) {
            //copy task parameters into global variable to access it in content script
            subtaskPublic = subtaskLocal;

            //set minimum time to spend on the page
            stepMinimumLength = subtaskPublic.stepMinimumLength;

            function navigationSendData() {
                console.log("ntScraper: " + "send data to storage");
                port.postMessage({subject: "data", content: JSON.stringify(scrapingController(true))});
                window.dispatchEvent(partPageScrapingEvent);
            }

            function navigationDropConnection() {
                //remove all possible event listeners
                window.removeEventListener('taskInitialized', navigationMakeFirstStep, false);
                window.removeEventListener('firstStepFinished', navigationCheckForCaptcha, false);
                window.removeEventListener('captchaChecked', navigationMakeStep, false);
                window.removeEventListener('intermediateStepFinished', navigationSendData, false);
                window.removeEventListener('partOfPageScraped', navigationCheckStatusInProgress, false);
                window.removeEventListener('intermediateStepFinished', navigationCheckStatusInProgress, false);
                window.removeEventListener('fullPageScraped', navigationDropConnection, false);

                //send last message via port
                if (subtaskPublic.pageDumpRegime === "atTheEnd") {
                    navigationSendData();
                }

                //make last preparations for moving to next page
                if (subtaskPublic.paginationRegime === "multiplePages") {
                    subtaskPublic.nextPageUrl = navigationGetNextPageUrl();
                }

                subtaskPublic.captchaStatus = (captchaDetectedFlag) ? true : false;

                //send last mesage from page
                port.postMessage({subject: "subtask", content: subtaskPublic});
                port.disconnect();
            }

            //add all necessary listeners for consistent scraping loop
            window.addEventListener('taskInitialized', navigationMakeFirstStep, false);
            window.addEventListener('firstStepFinished', navigationCheckForCaptcha, false);
            window.addEventListener('captchaChecked', navigationMakeStep, false);
            if (subtaskPublic.pageDumpRegime === "onTheFly") {
                window.addEventListener('intermediateStepFinished', navigationSendData, false);
                window.addEventListener('partOfPageScraped', navigationCheckStatusInProgress, false);
            } else {
                window.addEventListener('intermediateStepFinished', navigationCheckStatusInProgress, false);
            }
            window.addEventListener('fullPageScraped', navigationDropConnection, false);

            //start scraping
            window.dispatchEvent(initializationEvent);
        });
    }
});

function scrapingController(scrapingLoopFlag) {
    scrapingFunction = (subtaskPublic.description.partOfPageId === "") ? subtaskPublic.taskName : subtaskPublic.taskName + "_" + subtaskPublic.description.partOfPageId;

    console.log("ntScraper: " + "scraping data");
    if (window[scrapingFunction] !== undefined) {
        var dataVault = window[scrapingFunction]()
    } else {
        console.log("ntScraper: " + "scrape function not found");
        var dataVault = new Object();
    }

    if (scrapingLoopFlag) {
        return dataVault;
    } else {
        chrome.runtime.sendMessage({controllerCommand: "saveDataToStorage", content: JSON.stringify(dataVault)});
    }
}

function navigationGetNextPageUrl() {
    nextPageUrlFunction = subtaskPublic.taskName + "_getNextPageUrl"

    if (window[nextPageUrlFunction] !== undefined) {
        return window[nextPageUrlFunction]()
    } else {
        return String("");
    }
}
