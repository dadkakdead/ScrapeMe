//UI logic: disable checkbox if active window was reloaded
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    chrome.storage.local.get(["scraperParameters"], function(storageResponse) {
        scraperParameters = JSON.parse(storageResponse["scraperParameters"]);

        if (scraperParameters.investigationTabId === tabId) {
            scraperParameters.investigationStatus = "disabled";
            chrome.storage.local.set({"scraperParameters" : JSON.stringify(scraperParameters)});
        }
    });
});

//UI logic: shut off investigation tools for tab we left previously
chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.storage.local.get(["scraperParameters"], function(storageResponse) {
        scraperParameters = JSON.parse(storageResponse["scraperParameters"]);

        if (scraperParameters.investigationTabId !== activeInfo.tabId) {
            chrome.tabs.sendMessage(activeInfo.tabId, {controllerCommand: "switchInvestigation", state: {investigationStatus: "disabled", inventSelectorStatus: scraperParameters.inventSelectorStatus}})
        }
    });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'loading') {
        return;
    }

    if (changeInfo.status === "complete") {
        if ((getWkr(tabId) !== null) && (getWkr(tabId).pendingTabUpdate === true)) {
            getWkr(tabId).pendingTabUpdate = false;

            getWkr(tabId).currentPageUrl = tab.url;

            if (getWkr(tabId).pageCurrentSubtask.action === "goToPage") {
                getWkr(tabId).pageCurrentSubtask.status = "finished";
            }

            if (getWkr(tabId).getStatus() === "not started") {
                console.log("ntScraper Log: " + "-" + getWkr(tabId).taskName + "-" + " starting");
            }

            continueTask(tabId);
        }
    }
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo){
    rmvWkr(tabId);
});

function restartTask(tabId) {
    taskName = vaultCache["workersVault"][tabId].taskName;

    notifyAdministrator(tabId, "restarted");
    concludeTask(tabId);

    initTask(taskName);
}

function concludeTask(tabId) {
    chrome.tabs.get(parseInt(tabId), function(tab) {
        if (tab === undefined) {
            rmvWkr(tabId);
        } else {
            chrome.tabs.remove(parseInt(tabId), function(){
                rmvWkr(tabId);
            });
        }
    });
}

//seed action initiated from button click
function initTask(taskName) {
    if (tasksManager(taskName).isEmpty() === false) {
        chrome.storage.local.get(["scraperParameters"], function(storageResponse) {
            scraperParameters = JSON.parse(storageResponse["scraperParameters"]);
            incognitoMode = (scraperParameters.incognitoMode === "active") ? true : false;

            chrome.windows.create({url: chrome.extension.getURL('/controller/placeholder.html'), incognito: incognitoMode}, function(window){
                console.log("ntScraper Log: " + "-" + taskName + "-" + " initializing");
                windowId = window.id;
                tabId = window.tabs[0].id;
                setWkr(windowId, tabId, taskName);
                notifyAdministrator(tabId, "started");
                runTask(tabId);
            });
        });
    }
}

//navigate to root page
function runTask(tabId) {
    getWkr(tabId).resetSubtaskSequence();

    searchMotivatedTask = (getWkr(tabId).includesSearchAction()) && (String(getNextFreeInVault("searchTasksVault", tabId)).length > 0);
    linksMotivatedTask = (getWkr(tabId).targetPages === "vaultPages") && (String(getNextFreeInVault("linksVault", tabId)).length > 0);

    if ((getWkr(tabId).targetPages === "rootPageOnly" || linksMotivatedTask) && (getWkr(tabId).includesSearchAction() === false || searchMotivatedTask)) {
        //pick the url of new root page
        if (getWkr(tabId).targetPages === "rootPageOnly") {
            url =  getWkr(tabId).pageUrlPrefix + getWkr(tabId).rootPageHost + getWkr(tabId).rootPageSubref + getWkr(tabId).pageUrlSuffix;
        }
        if (getWkr(tabId).targetPages === "vaultPages") {
            url = getWkr(tabId).pageUrlPrefix + reserveNextFreeInVault("linksVault", tabId) + getWkr(tabId).pageUrlSuffix;
        }

        //go to next page
        if (getWkr(tabId).suppressReloadBetweenTasks === false) {
            console.log("ntScraper Log: " + "-" + getWkr(tabId).taskName + "-" + " loading root page");
            getWkr(tabId).pendingTabUpdate = true;
            chrome.tabs.update(tabId, {highlighted: true, active: true, url: url});
        } else {
            console.log("ntScraper Log: " + "-" + getWkr(tabId).taskName + "-" + " starting");
            continueTask(tabId);
        }
    } else {
        console.log("ntScraper Log: " + "-" + getWkr(tabId).taskName + "-" + " is finished");
        notifyAdministrator(tabId, "finishedOk");

        concludeTask(tabId);
    }
}

function continueTask(tabId) {
    getWkr(tabId).lastTimeProgressChanged = Date.now();

    taskStatus = getWkr(tabId).getStatus("verbose");

    if (taskStatus === "not started") {
        setScraperParameterUtil({controllerCommand: "setScraperParameter", parameter: "investigationStatus", status: getWkr(tabId).investigationStatusPreset, selector: getWkr(tabId).inventSelectorValuePreset});
        getWkr(tabId).goToFirstSubtask("propagate");
        taskStatus = getWkr(tabId).getStatus("verbose");
    }

    if (taskStatus === "finished") {
        if (getWkr(tabId).isComplex() === true) {
            if (getWkr(tabId).includesSearchAction()) {
                searchTaskAsIS = getElementByTabId("searchTasksVault", tabId);
                vaultCache["searchTasksVault"][searchTaskAsIS].status = "finished";
                vaultStatistics["searchTasksVault"].waitingLength -= 1;
            }
            if (getWkr(tabId).targetPages === "vaultPages") {
                pageUrlAsIs = getElementByTabId("linksVault", tabId);
                vaultCache["linksVault"][pageUrlAsIs].status = "finished";
                vaultStatistics["linksVault"].waitingLength -= 1;
            }
            console.log("ntScraper Log: " + "-" + getWkr(tabId).taskName + "-" + " starting again");
            if (getWkr(tabId).forceNewWindowForNewTask === true) {
                taskName = getWkr(tabId).taskName;
                concludeTask(tabId);
                setTimeout(function(){
                    initTask(taskName);
                }, 2500);
            } else {
                runTask(tabId);
            }
            return;
        } else {
            console.log("ntScraper Log: " + "-" + getWkr(tabId).taskName + "-" + " is finished");
            notifyAdministrator(tabId, "finishedOk");
            concludeTask(tabId);
        }
    }

    if (taskStatus === "in progress") {
        console.log("ntScraper Log: " + "-" + getWkr(tabId).taskName + "-" + " continues");
        if (getWkr(tabId).pageCurrentSubtask.status === "finished") {
            getWkr(tabId).goToNextSubtask("propagate");
        }

        if (getWkr(tabId).pageCurrentSubtask.purpose === "navigation") {
            navigationUtility(tabId);
        }

        if (getWkr(tabId).pageCurrentSubtask.purpose === "scraping") {
            if (getWkr(tabId).pageCurrentSubtask.paginationRegime === "singlePage" || (getWkr(tabId).pageCurrentSubtask.paginationRegime === "multiplePages" && getWkr(tabId).pageCurrentSubtask.nextPageUrl === "")) {
                scrapingUtility(tabId);
            } else {
                url = getWkr(tabId).pageCurrentSubtask.nextPageUrl;
                getWkr(tabId).pageCurrentSubtask.nextPageUrl = "";

                getWkr(tabId).pendingTabUpdate = true;
                chrome.tabs.update(tabId, {highlighted: true, active: true, url: url});
            }
        }

        if (getWkr(tabId).pageCurrentSubtask.purpose === "steering") {
            if (getWkr(tabId).pageCurrentSubtask.action === "loop") {
                anchorSubtask = getWkr(tabId).pageCurrentSubtask.description.anchorSubtask;

                getWkr(tabId).goToFirstSubtask("propagate");
                for (i = 1; i < anchorSubtask; i++) {
                    getWkr(tabId).goToNextSubtask("propagate");
                }

                continueTask(tabId);
            }
            if (getWkr(tabId).pageCurrentSubtask.action === "goToPage") {
                getWkr(tabId).pendingTabUpdate = true;
                chrome.tabs.update(tabId, {highlighted: true, active: true, url: getWkr(tabId).pageCurrentSubtask.description.nextPageUrl});
            }
        }
    }
}

function navigationUtility(tabId) {
    console.log("ntScraper Log: " + "-" + getWkr(tabId).taskName + "-" + " performing navigation subtask");
    chrome.webNavigation.getAllFrames({tabId: tabId}, function(framesList){
        //identify the frame to interact with
        frameId = null;
        if (getWkr(tabId).pageCurrentSubtask.frameUrlKey === "") {
            frameId = 0;
        } else {
            for (i = 0; i < framesList.length; i++) {
                if (String(framesList[i].url).indexOf(getWkr(tabId).pageCurrentSubtask.frameUrlKey) >= 0) {
                    frameId = framesList[i].frameId;
                }
            }
        }
        //if found - start navigation
        if (frameId !== null) {
            var port1 = chrome.tabs.connect(tabId, {name: "navigationPort", frameId: frameId});

            //take the value from vault
            if (getWkr(tabId).pageCurrentSubtask.action === "setInputValue" && getWkr(tabId).pageCurrentSubtask.description.source === "searchTasks") {
                getWkr(tabId).pageCurrentSubtask.description.text = reserveNextFreeInVault("searchTasksVault", tabId);
            }

            //take the value from vault
            if (getWkr(tabId).pageCurrentSubtask.action === "check" && getWkr(tabId).pageCurrentSubtask.description.containsSource === "searchTasks") {
                getWkr(tabId).pageCurrentSubtask.description.contains =  getElementByTabId("searchTasksVault", tabId);
            }

            //focus on the window you want to interact with
            if (getWkr(tabId).pageCurrentSubtask.action === "click" || getWkr(tabId).pageCurrentSubtask.action === "setInputValue") {
                chrome.windows.update(getWkr(tabId).windowId, {focused: true}, function(window) {
                    port1.postMessage(getWkr(tabId).pageCurrentSubtask);
                });
            } else {
                port1.postMessage(getWkr(tabId).pageCurrentSubtask);
            }

            //messages are used only for error handling
            port1.onMessage.addListener(function(request) {
                console.log("ntScraper Log: " + "-" + getWkr(tabId).taskName + "-" + " processing message from tab " + tabId);
                if (request.purpose === "errorHandling") {
                    getWkr(tabId).pageCurrentSubtask.status = "error";
                    port1.postMessage({purpose: "errorHandling", action: "dropSubtask", originalDelay: request.originalDelay, subtaskStarted: request.subtaskStarted});
                }
                if (request.purpose === "eventTriggering") {
                    console.log("ntScraper Log: " + "bump bump");
                }
            });

            //disconnection event states for end of navigation
            port1.onDisconnect.addListener(function() {
                console.log("ntScraper Log: " + "-" + getWkr(tabId).taskName + "-" + " navigation subtask finished");
                if (getWkr(tabId).pageCurrentSubtask.status === "in progress") {
                    console.log("ntScraper Log: " + "-" + getWkr(tabId).taskName + "-" + " navigation ok, go next");
                    getWkr(tabId).pageCurrentSubtask.status = "finished";

                    if (getWkr(tabId).pageCurrentSubtask.causesReload === true) {
                        if (getWkr(tabId).pageCurrentSubtask.reloadType === "webNavigation") {
                            var filter = {tabId: tabId, frameId: frameId, url: [{hostContains: getWkr(tabId).rootPageHost}]}

                            function webNavigationFinished(details) {
                                chrome.webNavigation.onCompleted.removeListener(webNavigationFinished, filter);
                                chrome.tabs.get(tabId, function(tab) {
                                    getWkr(tabId).currentPageUrl = tab.url;
                                    continueTask(tabId);
                                });
                            }

                            chrome.webNavigation.onCompleted.addListener(webNavigationFinished, filter);
                        }
                        if (getWkr(tabId).pageCurrentSubtask.reloadType === "update") {
                            getWkr(tabId).pendingTabUpdate = true;
                        }
                    } else {
                        console.log("ntScraper Log: " + "-" + getWkr(tabId).taskName + "-" + " continue after navigation, don't wait for loading");
                        continueTask(tabId);
                    }
                }
                if (getWkr(tabId).pageCurrentSubtask.status === "error") {
                    console.log("ntScraper Log: " + "-" + getWkr(tabId).taskName + "-" + " " + getWkr(tabId).pageCurrentSubtask.errorHandling + " error during navigation");
                    if (getWkr(tabId).pageCurrentSubtask.errorHandling === "superhard") {
                        //shut the worker
                        notifyAdministrator(tabId, "finishedError");
                        concludeTask(tabId);
                    } else if (getWkr(tabId).pageCurrentSubtask.errorHandling === "hard") {
                        //assume the task as done, skip and move to next
                        getWkr(tabId).finishSubtaskSequence();
                        continueTask(tabId);
                    } else if (getWkr(tabId).pageCurrentSubtask.errorHandling === "medium") {
                        //go straight to the last subtask
                        getWkr(tabId).goToLastSubtask("propagate");
                        continueTask(tabId);
                    } else if (getWkr(tabId).pageCurrentSubtask.errorHandling === "soft") {
                        //skip the subtask, proceed normally
                        getWkr(tabId).pageCurrentSubtask.status = "finished";
                        continueTask(tabId);
                    }
                }
            });
        } else {
            console.log("ntScraper Log: " + "-" + getWkr(tabId).taskName + "-" + " frame not found, restarting");
            restartTask(tabId);
        }
    });
}

function scrapingUtility(tabId) {
    console.log("ntScraper: " + "-" + getWkr(tabId).taskName + "-" + " performing scraping");
    //setup the port for communication
    var port2 = chrome.tabs.connect(tabId, {name: "scrapingPort", frameId: 0});
    //moderate a subtask a bit, copy general task properties there
    subtaskToSend = getWkr(tabId).pageCurrentSubtask;
    subtaskToSend.rootPageHost = getWkr(tabId).rootPageHost;
    subtaskToSend.rootPageSubref = getWkr(tabId).rootPageSubref;

    //needed for proper data storage
    subtaskToSend.taskId = getWkr(tabId).taskId;
    subtaskToSend.taskName = getWkr(tabId).taskName;
    subtaskToSend.currentPageUrl = getWkr(tabId).currentPageUrl;
    subtaskToSend.currentSearchTask = getWkr(tabId).getSearchTask();

    //send the subtask
    port2.postMessage(subtaskToSend);

    //now listen to incoming scraping data
    port2.onMessage.addListener(function(request) {
        if (request.subject === "data") {

            contentParsed = JSON.parse(request.content);
            console.log(contentParsed);
            if (contentParsed.length === 0) {
                console.log("ntScraper: " + "-" + getWkr(tabId).taskName + "-" + " empty data set");
            }
            //decide how to save content depending on regime
            if (getWkr(tabId).savingRegime === "rewrite") {
                chrome.storage.local.set(contentParsed, function() {
                    calculateExportListLength();
                });
            }
            if (getWkr(tabId).savingRegime === "merge") {
                chrome.storage.local.get(Object.keys(contentParsed), function(storageResponse) {
                    for (key in contentParsed) {
                        if (storageResponse.hasOwnProperty(key) === true) {
                            //transform strings to objects first
                            oldData = JSON.parse(storageResponse[key]);
                            newData = JSON.parse(contentParsed[key]);
                            //merge new properties to existing data
                            for (prop in oldData) {
                                if (newData.hasOwnProperty(prop) === false) {
                                    newData[prop] = oldData[prop]
                                }
                            }
                            //update storage
                            storageResponse[key] = JSON.stringify(newData);
                        } else {
                            storageResponse[key] = contentParsed[key];
                        }
                    }
                    //update data in storage
                    chrome.storage.local.set(storageResponse, function() {
                        calculateExportListLength();
                    });
                });
            }
        }

        if (request.subject === "subtask") {
            if (request.content.paginationRegime === "singlePage" || (request.content.paginationRegime === "multiplePages" && request.content.nextPageUrl === "")) {
                getWkr(tabId).pageCurrentSubtask.status = "finished";
            } else {
                getWkr(tabId).pageCurrentSubtask.nextPageUrl = request.content.nextPageUrl;
            }
            continueTask(tabId);
        }
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.controllerCommand) {
        case 'log':
            console.log("ntScraper Log: " + request.data);
            sendResponse({controllerCommand: "log", status: "data logged to console"})
            break;

        case "getUrl":
            chrome.tabs.get(sender.tab.id, function(tab) {
                sendResponse({url: tab.url});
            });
            break;

        case "forceProgressChange":
            getWkr(sender.tab.id).lastTimeProgressChanged = Date.now();
            break;

        case "saveDataToStorage":
            chrome.storage.local.set(JSON.parse(request.content), function() {
                calculateExportListLength();
            });
            break;

        case "initTask":
            if (taskNames.indexOf(request.taskName) > -1) {
                chrome.storage.local.get(["scraperParameters"], function(storageResponse) {
                    if (JSON.parse(storageResponse.scraperParameters).cachePersistence === "disabled") {
                        //empty the storage except scraper settings
                        chrome.storage.local.get(["scraperParameters", "linksVault", "searchTasksVault", "workersVault"], function(sustainableCache) {
                            chrome.storage.local.clear(function() {
                                chrome.storage.local.set(sustainableCache, function() {
                                    exportListLength = 0;
                                    console.log("ntScraper Log: " + "export cache erased");
                                    initTask(request.taskName);
                                });
                            });
                        });
                    } else {
                        initTask(request.taskName);
                    }
                });
            } else {
                console.log("ntScraper Log: " + " couldn't find task with name " + request.taskName);
            }
            break;

        case 'retrieveScraperParameters':
            scraperParametersResponse = new Object();
            if (Object.keys(vaultCache).length > 0) {
                chrome.tabs.query({active: true}, function (tabs) {
                    chrome.storage.local.get(["scraperParameters"], function(storageResponse) {
                        scraperParametersResponse = JSON.parse(storageResponse.scraperParameters);

                        if (scraperParametersResponse.investigationTabId !== tabs[0].id) {
                            scraperParametersResponse.investigationStatus = "disabled";
                        }

                        scraperParametersResponse.exportListLength = exportListLength;

                        scraperParametersResponse.vaultStatistics = vaultStatistics;

                        delete scraperParametersResponse["investigationTabId"];

                        scraperParametersResponse.status = "done";
                        sendResponse(scraperParametersResponse);
                    });
                });
            } else {
                window.dispatchEvent(loadingCacheEvent);

                scraperParametersResponse.status = "loading";
                sendResponse(scraperParametersResponse);
            }
            break;

        case "setScraperParameter":
            setScraperParameterUtil(request);
            break;

        case 'exportScrapingResults':
            window.dispatchEvent(dumpingCacheEvent);

            chrome.tabs.create({url: chrome.extension.getURL('/export/index.html')});
            break;

        case 'resetVault':
            cacheReseter(request.dataType);
            break;

        case 'uploadFromWebpage':
            chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {controllerCommand: request.controllerCommand, dataType:request.dataType}, {frameId: 0}, function(response) {
                    vaultName = request.dataType + "Vault";

                    vaultCache[vaultName] = JSON.parse(response.data);
                    vaultStatistics[vaultName].listLength = Object.keys(vaultCache[vaultName]).length;
                    vaultStatistics[vaultName].waitingLength = vaultStatistics[vaultName].listLength;

                    window.dispatchEvent(dumpingCacheEvent);
                    sendResponse({status: "done"});
                });
            });
            break;
    }
    return true;
});
