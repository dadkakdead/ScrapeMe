//links and searchTasks structure is the following:
//key -> key, previous key, next key, status, tabId
var vaultDataTypes = new Array("links", "searchTasks", "workers");

//main cache instance
var vaultCache = new Object();

//statistics about cache
var vaultStatistics = new Object();
var exportListLength;

//cache statuses
var loadingCacheEvent = new Event("loadCache");
window.addEventListener("loadCache", cacheLoader, false);
var vaultCacheLoading = false;

var dumpingCacheEvent = new Event("dumpCache");
window.addEventListener("dumpCache", cacheDumper, false);
var vaultCacheDumping = false;

//set default parameters right after installation
chrome.runtime.onInstalled.addListener(function(details) {
    chrome.storage.local.get(null, function(storageResponse) {
        var scraperParameters = new Object();

        //set default scraper parameters
        scraperParameters.investigationTabId = 0;
        scraperParameters.investigationStatus = "disabled";

        scraperParameters.inventSelectorStatus = "active";
        scraperParameters.inventSelectorValue = "";

        scraperParameters.cachePersistence = "active";

        scraperParameters.incognitoMode = "disabled";

        chrome.storage.local.set({"scraperParameters" : JSON.stringify(scraperParameters)});

        //create vaults (one for each vault name)
        for (var i = 0; i < vaultDataTypes.length; i++) {
            vaultName = vaultDataTypes[i] + "Vault";
            //if there is no such vault by the moment
            if (storageResponse.hasOwnProperty(vaultName) === false) {
                vaultObject = new Object();
                vaultObject[vaultName] = JSON.stringify(new Object());
                chrome.storage.local.set(vaultObject);
            }
        }
    });
});

//dump cache to storage before extension closes
chrome.runtime.onSuspend.addListener(function() {
    window.dispatchEvent(dumpingCacheEvent);
});

//--------- WORKERS ----------
function setWkr(windowId, tabId, taskName) {
    wkr = tasksManager(taskName);

    wkr.taskId = Date.now();
    wkr.lastTimeProgressChanged = Date.now();
    wkr.windowId = windowId;
    wkr.tabId = tabId;

    vaultCache["workersVault"][tabId] = wkr;
}

function getWkr(tabId) {
    if (vaultCache.hasOwnProperty("workersVault")) {
        if (vaultCache["workersVault"].hasOwnProperty(tabId)) {
            return vaultCache["workersVault"][tabId];
        } else {
            return null;
        }
    }
}

function rmvWkr(tabId) {
    if (vaultCache.hasOwnProperty("workersVault")) {
        if (vaultCache["workersVault"].hasOwnProperty(tabId)) {
            delete vaultCache["workersVault"][tabId];
        }
    }
}
//----------------------------


function getElementByTabId(vaultName, tabId) {
    for (elementKey in vaultCache[vaultName]) {
        if (vaultCache[vaultName][elementKey].status === "hold" && vaultCache[vaultName][elementKey].tabId === tabId) {
            return elementKey;
        }
    }
    return "";
}

function reserveNextFreeInVault(vaultName, tabId){
    return manageElementsInVault(vaultName, tabId, "propagate");
}

function getNextFreeInVault(vaultName, tabId){
    return manageElementsInVault(vaultName, tabId, "predict");
}

function manageElementsInVault(vaultName, tabId, regime) {
    for (elementKey in vaultCache[vaultName]) {
        element = vaultCache[vaultName][elementKey];
        if ((element.status === "waiting") || (element.status === "hold" && getWkr(element.tabId) === null)){
            if (regime === "propagate") {
                vaultCache[vaultName][elementKey].status = "hold";
                vaultCache[vaultName][elementKey].tabId = tabId;
            }
            if (regime === "predict") {
                //do nothing
            }
            return elementKey;
        }
    }
    return "";
}

function calculateExportListLength() {
    chrome.storage.local.get(null, function(storageResponse) {
        exportListLength = Object.keys(storageResponse).length;

        if (storageResponse.hasOwnProperty("scraperParameters")) {
            exportListLength = exportListLength - 1;
        }

        for (var i = 0; i < vaultDataTypes.length; i++) {
            if (storageResponse.hasOwnProperty(vaultName)) {
                exportListLength = exportListLength - 1;
            }
        }
    });
}

function cacheLoader() {
    if (Object.keys(vaultCache).length === 0 && vaultCacheLoading === false) {
        //lock the function temporarily
        vaultCacheLoading = true;

        chrome.storage.local.get(null, function(storageResponse) {
            for (var i = 0; i < vaultDataTypes.length; i++) {
                vaultName = vaultDataTypes[i] + "Vault";

                vaultCache[vaultName] = JSON.parse(storageResponse[vaultName]);

                if (vaultDataTypes[i] === "links" || vaultDataTypes[i] === "searchTasks") {
                    vaultListLength = Object.keys(vaultCache[vaultName]).length;
                    vaultWaitingLength = 0;

                    for (elementKey in vaultCache[vaultName]) {
                        element = vaultCache[vaultName][elementKey];

                        if (storageResponse.hasOwnProperty("workersVault")) {
                            if ((element.status === "waiting") || (element.status === "hold" && storageResponse["workersVault"].hasOwnProperty(element.tabId) === false)){
                                vaultWaitingLength += 1;
                            }
                        } else {
                            if ((element.status === "waiting") || (element.status === "hold")){
                                vaultWaitingLength += 1;
                            }
                        }

                    }

                    vaultStatistics[vaultName] = new Object();
                    vaultStatistics[vaultName].listLength = vaultListLength;
                    vaultStatistics[vaultName].waitingLength = vaultWaitingLength;
                }
            }

            vaultCacheLoading = false;

            calculateExportListLength();
        });
    }
}

function cacheDumper() {
    if (Object.keys(vaultCache).length > 0 && vaultCacheDumping === false) {
        vaultCacheDumping = true;

        for (var i = 0; i < vaultDataTypes.length; i++) {
            vaultName = vaultDataTypes[i] + "Vault";

            var vaultUpdated = new Object();
            vaultUpdated[vaultName] = JSON.stringify(vaultCache[vaultName]);

            chrome.storage.local.set(vaultUpdated);
        }

        vaultCacheDumping = false;
    }
}

function cacheReseter(dataType) {
    vaultName = dataType + "Vault";

    switch (dataType) {
        case "links":
        case "searchTasks":
            for (elementKey in vaultCache[vaultName]) {
                element = vaultCache[vaultName][elementKey];
                if (element.status === "finished" || element.status === "hold") {
                    vaultCache[vaultName][elementKey].status = "waiting";
                    vaultCache[vaultName][elementKey].tabId = "";
                }
            }

            vaultStatistics[vaultName].listLength = Object.keys(vaultCache[vaultName]).length;
            vaultStatistics[vaultName].waitingLength = vaultStatistics[vaultName].listLength;
            break;

        case "workers":
            for (elementKey in vaultCache[vaultName]) {
                concludeTask(vaultCache[vaultName][elementKey].tabId);
            }
            break;
    }
}
