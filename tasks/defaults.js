var defaultTask = new Object();
var defaultSubtasks = new Object();
var defaultActions = new Object();

//------- CONSTANT PARAMETERS DURING TASK EXECUTION -------
//general task parameters (get changed after each task initialization)
defaultTask.taskName = ""; //any string
defaultTask.investigationStatusPreset = "disabled"; //boolean
defaultTask.inventSelectorValuePreset = ""; //any string

//pagination parameters
defaultTask.targetPages = "rootPageOnly"; //rootPageOnly, vaultPages
defaultTask.suppressReloadBetweenTasks = false; //boolean
defaultTask.forceNewWindowForNewTask = false; //boolean
defaultTask.rootPageHost = ""; //any string
defaultTask.rootPageSubref = ""; //any string
defaultTask.pageUrlPrefix = "https://"; //any string
defaultTask.pageUrlSuffix = ""; //any string

//saving regime
defaultTask.savingRegime = "rewrite"; //rewrite, merge

//maximum time task can hang in without subtasks sequence propagation
defaultTask.freezeLimit = 45000; //any number

//------- VARIABLE PARAMETERS DURING TASK EXECUTION -------
defaultTask.taskId = ""; //any string, timestamp in fact
defaultTask.windowId = ""; //any string
defaultTask.tabId = ""; //any string
defaultTask.pendingTabUpdate = false; //boolean
defaultTask.currentPageUrl = ""; //any string
defaultTask.currentSearchTask = ""; //any string
defaultTask.lastTimeProgressChanged = ""; //any string, timestamp in fact

//--------- NAVIGATION --------
defaultSubtasks["navigation"] = new Object();
defaultSubtasks["navigation"].purpose = "navigation"; //"navigation"
defaultSubtasks["navigation"].frameUrlKey = "";
defaultSubtasks["navigation"].causesReload = false; //boolean
defaultSubtasks["navigation"].reloadType = "update"; //update, webNavigation
defaultSubtasks["navigation"].stepMinimumLength = 50; //any integer, ms
defaultSubtasks["navigation"].errorHandling = "hard"; //superhard, hard, medium, soft

defaultActions["navigation"] = new Object();

defaultActions["navigation"]["scroll"] = new Object();
defaultActions["navigation"]["scroll"].approach = "conservative"; //conservative, modern
defaultActions["navigation"]["scroll"].approachSelector = ""; //custom scrolling div selector
defaultActions["navigation"]["scroll"].regime = "toValue";
defaultActions["navigation"]["scroll"].showStopper = "default";
defaultActions["navigation"]["scroll"].step = 100;
defaultActions["navigation"]["scroll"].period = 10;
defaultActions["navigation"]["scroll"].selector = "";
defaultActions["navigation"]["scroll"].offset = 0;
defaultActions["navigation"]["scroll"].checkLimit = 10;

defaultActions["navigation"]["click"] = new Object();
defaultActions["navigation"]["click"].selector = "";
defaultActions["navigation"]["click"].jQueryStyle = false;
defaultActions["navigation"]["click"].mouseEvent = "click";

defaultActions["navigation"]["setInputValue"] = new Object();
defaultActions["navigation"]["setInputValue"].selector = "";
defaultActions["navigation"]["setInputValue"].inputAreaType = "input";
defaultActions["navigation"]["setInputValue"].inputApproach = "contentScript"; //contentScript, injectedScript
defaultActions["navigation"]["setInputValue"].source = "searchTasks";
defaultActions["navigation"]["setInputValue"].textPrefix = "";
defaultActions["navigation"]["setInputValue"].text = "";
defaultActions["navigation"]["setInputValue"].textSuffix = "";

defaultActions["navigation"]["wait"] = new Object();
defaultActions["navigation"]["wait"].reason = "delay"; //delay, ajax
defaultActions["navigation"]["wait"].duration = 50;
defaultActions["navigation"]["wait"].persistence = false;
defaultActions["navigation"]["wait"].lifeId = "";

//check is performed every 50 ms (minimumDelay constant)
//total time of check is controlled by stepMinimumLength
defaultActions["navigation"]["check"] = new Object();
defaultActions["navigation"]["check"].duration = 1000;
defaultActions["navigation"]["check"].selector = "";
defaultActions["navigation"]["check"].property = "presence"; //presence, count, class, attribute, content
defaultActions["navigation"]["check"].inverseCheckLogic = false; //true OR false; to be able to choose do we want smth appeating or disappearing to be an event
defaultActions["navigation"]["check"].happenMode = "good" //good - means if check was successful - it's what we want, bad - means if check was UNsuccesful - that's an error
defaultActions["navigation"]["check"].class = "";
defaultActions["navigation"]["check"].attributeName = "";
defaultActions["navigation"]["check"].attributeValue = "";
defaultActions["navigation"]["check"].containsText = "";
defaultActions["navigation"]["check"].containsSource = "tasks_archive";
defaultActions["navigation"]["check"].target = "elements"; //elements, children
defaultActions["navigation"]["check"].total = 1;

//--------- SCRAPING --------
defaultSubtasks["scraping"] = new Object();
defaultSubtasks["scraping"].purpose = "scraping"; //"scraping"
defaultSubtasks["scraping"].pageDumpRegime = "onTheFly"; //onTheFly, atTheEnd
defaultSubtasks["scraping"].paginationRegime = "singlePage"; //singlePage, multiplePages
defaultSubtasks["scraping"].currentPageUrl = ""; //any string
defaultSubtasks["scraping"].nextPageUrl = ""; //any string
defaultSubtasks["scraping"].captchaStatus = false; //boolean
defaultSubtasks["scraping"].stepMinimumLength = 50; //ms
defaultSubtasks["scraping"].errorHandling = "hard"; //superhard, hard, medium, soft

defaultActions["scraping"] = new Object();
defaultActions["scraping"]["scroll"] = new Object();
defaultActions["scraping"]["scroll"].stepLength = 500;
defaultActions["scraping"]["scroll"].stepPeriod = 200;
defaultActions["scraping"]["scroll"].checkLimit = 50;

defaultActions["scraping"]["click"] = new Object();
defaultActions["scraping"]["click"].selector = "";
defaultActions["scraping"]["click"].jQueryStyle = false;
defaultActions["scraping"]["click"].checkLimit = 1;

defaultActions["scraping"]["save"] = new Object();
defaultActions["scraping"]["save"].partOfPageId = "";
defaultActions["scraping"]["save"].checkLimit = 1;

//--------- UTILITIES --------
defaultSubtasks["steering"] = new Object();
defaultSubtasks["steering"].purpose = "steering"; //"steering"

defaultActions["steering"] = new Object();
defaultActions["steering"]["loop"] = new Object();
defaultActions["steering"]["loop"].anchorSubtask = 1; //index of subtask in subtask sequence; any integer > 0

defaultActions["steering"]["goToPage"] = new Object();
defaultActions["steering"]["goToPage"].nextPageUrl = ""; //any string

//---------- TASK CREATION ----------
function Task(settingsObject) {
    //crawling setup
    for (property in defaultTask) {
        if (settingsObject !== undefined && settingsObject[property] !== undefined) {
            this[property] = settingsObject[property];
        } else {
            this[property] = defaultTask[property];
        }
    }
    //crawling tasks
    this.pageSubtaskSequence = new Object();
    this.pageCurrentSubtask = new Object();
}

Task.prototype.addSubtask = function(subtask) {
    subtaskId = "st" + String(Object.keys(this.pageSubtaskSequence).length);

    this.pageSubtaskSequence[subtaskId] = new Object();
    //set subtask parameters
    for (property in defaultSubtasks[subtask.purpose]) {
        if (subtask !== undefined && subtask[property] !== undefined) {
            this.pageSubtaskSequence[subtaskId][property] = subtask[property];
        } else {
            this.pageSubtaskSequence[subtaskId][property] = defaultSubtasks[subtask.purpose][property];
        }
    }

    this.pageSubtaskSequence[subtaskId].action = subtask.action;
    this.pageSubtaskSequence[subtaskId].description = new Object();
    //set action parameters
    for (property in defaultActions[subtask.purpose][subtask.action]) {
        if (subtask.description !== undefined && subtask.description[property] !== undefined) {
            this.pageSubtaskSequence[subtaskId].description[property] = subtask.description[property];
        } else {
            this.pageSubtaskSequence[subtaskId].description[property] = defaultActions[subtask.purpose][subtask.action][property];
        }
    }

    this.pageSubtaskSequence[subtaskId].subtaskId = subtaskId;
    this.pageSubtaskSequence[subtaskId].status = "waiting";
}

//---------- TASK CONTROLLER ----------
Task.prototype.resetSubtaskSequence = function() {
    for (subtaskId in this.pageSubtaskSequence) {
        this.pageSubtaskSequence[subtaskId].status = "waiting";
    }
    this.pageCurrentSubtask = new Object();
}

Task.prototype.goToFirstSubtask = function(regime) {
    if (regime === "propagate") {
        this.resetSubtaskSequence();
        if (this.isEmpty() === false) {
            this.pageCurrentSubtask = this.pageSubtaskSequence["st0"];
            this.pageCurrentSubtask.status = "in progress";
        }
    } else if (regime === "predictNext") {
        return (this.isEmpty() === false) ? this.pageSubtaskSequence["st0"] : new Object();
    }
}

Task.prototype.goToLastSubtask = function(regime) {
    if (regime === "propagate") {
        if (this.isEmpty() === false) {
            this.finishSubtaskSequence();
            lastSubtaskId = "st" + String(Object.keys(this.pageSubtaskSequence).length - 1);

            this.pageCurrentSubtask = this.pageSubtaskSequence[lastSubtaskId];
            this.pageCurrentSubtask.status = "in progress";
        }
    } else if (regime === "predictNext") {
        return (this.isEmpty() === false) ? this.pageSubtaskSequence["st" + parseInt(this.pageSubtaskSequence.length - 1)] : new Object();
    }
}

Task.prototype.goToNextSubtask = function(regime) {
    if (regime === "propagate") {
        if (this.getStatus() === "in progress") {
            currentSubtaskId = this.pageCurrentSubtask.subtaskId;
            nextSubtaskId = "st" + String(parseInt(currentSubtaskId.replace("st", "")) + 1);

            if (this.pageSubtaskSequence.hasOwnProperty(nextSubtaskId)) {
                this.pageSubtaskSequence[currentSubtaskId].status = "finished";

                this.pageCurrentSubtask = this.pageSubtaskSequence[nextSubtaskId];
                this.pageCurrentSubtask.status = "in progress";
            } else {
                this.pageSubtaskSequence[currentSubtaskId].status = "finished";
                this.pageCurrentSubtask = new Object();
            }
        } else {
            this.goToFirstSubtask(regime);
        }
    } else if (regime === "predictNext") {
        if (this.getStatus() === "in progress") {
            currentSubtaskId = this.pageCurrentSubtask.subtaskId;
            nextSubtaskId = "st" + String(parseInt(currentSubtaskId.replace("st", "")) + 1);

            return (this.pageSubtaskSequence.hasOwnProperty(nextSubtaskId)) ? this.pageSubtaskSequence[nextSubtaskId] : new Object();
        } else {
            return this.goToFirstSubtask(regime);
        }
    }
}

Task.prototype.finishSubtaskSequence = function() {
    for (subtaskId in this.pageSubtaskSequence) {
        this.pageSubtaskSequence[subtaskId].status = "finished";
    }
    this.pageCurrentSubtask = new Object();
}


//---------- TASK INTROSPECTION ----------
Task.prototype.getStatus = function(regime) {
    var statusBuffer = String("");
    var subtasksFinished = 0;
    var subtasksWaiting = 0;

    for (subtaskId in this.pageSubtaskSequence) {
        statusBuffer += this.pageSubtaskSequence[subtaskId].action + ": " + this.pageSubtaskSequence[subtaskId].status + "; ";

        subtasksFinished += (this.pageSubtaskSequence[subtaskId].status === "finished") ? 1 : 0;
        subtasksWaiting += (this.pageSubtaskSequence[subtaskId].status === "waiting") ? 1 : 0;
    }
    //log sequence status
    if (regime === "verbose") {
        console.log("ntScraper: " + this.taskName + "| " + statusBuffer + subtasksFinished + " out of " + Object.keys(this.pageSubtaskSequence).length + " finished");
    }

    //return task status
    nSubtasksInTask = Object.keys(this.pageSubtaskSequence).length
    if (nSubtasksInTask > 0) {
        if (subtasksFinished === nSubtasksInTask) {
            return "finished";
        } else if (subtasksWaiting === nSubtasksInTask) {
            return "not started";
        } else {
            return "in progress";
        }
    } else {
        return "empty";
    }
}


Task.prototype.isEmpty = function() {
    return (Object.keys(this.pageSubtaskSequence).length > 0) ? false : true;
}

Task.prototype.isComplex = function() {
    if (this.targetPages === "vaultPages" || this.includesSearchAction()) {
        return true;
    } else {
        return false;
    }
}

Task.prototype.includesSearchAction = function() {
    for (subtaskId in this.pageSubtaskSequence) {
        if (this.pageSubtaskSequence[subtaskId].action === "setInputValue") {
            if (this.pageSubtaskSequence[subtaskId].description.source === "searchTasks"){
                return true;
            }
        }
    }
    return false;
}

Task.prototype.getSearchTask = function() {
    for (subtaskId in this.pageSubtaskSequence) {
        if (this.pageSubtaskSequence[subtaskId].action === "setInputValue" && this.pageSubtaskSequence[subtaskId].description.source === "searchTasks") {
            return this.pageSubtaskSequence[subtaskId].description.text;
        }
    }
    return "";
}
