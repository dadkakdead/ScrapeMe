// Monitor workers activity (if it changes or not) and restart tasks that "freeze"
setInterval(function() {
    chrome.tabs.query({}, function(tabs) {
        for (tabId in vaultCache["workersVault"]) {
            tabStillExists = false;
            //check there is such tab
            for (i = 0; i < tabs.length; i++) {
                if (tabs[i].id === parseInt(tabId)) {
                    tabStillExists = true;
                    break;
                }
            }
            //react on that tab
            if (tabStillExists) {
                if (Date.now() - vaultCache["workersVault"][tabId].lastTimeProgressChanged > vaultCache["workersVault"][tabId].freezeLimit) {
                    restartTask(tabId);
                }
            } else {
                concludeTask(tabId);
            }
        }
    });
}, 500);

function setScraperParameterUtil(request){
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        chrome.storage.local.get(["scraperParameters"], function(storageResponse) {
            scraperParameters = JSON.parse(storageResponse["scraperParameters"]);

            switch (request.parameter) {
                case "investigationStatus":
                    scraperParameters["investigationTabId"] = tabs[0].id;
                    scraperParameters["investigationStatus"] = request.status;
                    scraperParameters["inventSelectorValue"] = (request.hasOwnProperty("selector")) ? request.selector : "";
                    break;

                case "inventSelectorStatus":
                    scraperParameters["inventSelectorStatus"] = request.status;
                    break;

                case "cachePersistence":
                    scraperParameters["cachePersistence"] = request.status;
                    break;

                case "incognitoMode":
                    scraperParameters["incognitoMode"] = request.status;
                    break;
            }

            console.log(scraperParameters);

            chrome.storage.local.set({"scraperParameters" : JSON.stringify(scraperParameters)}, function() {
                chrome.tabs.sendMessage(scraperParameters["investigationTabId"], {controllerCommand: "switchInvestigation", state: scraperParameters});
            });
        });
    });
}
