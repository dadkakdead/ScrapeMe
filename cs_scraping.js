//--------- END OF ITERATIONS PARAMETERS ---------
var navigationCheckCounter = 0;

//scraping loop events
var initializationEvent = new Event('taskInitialized');
var firstStepEvent = new Event('firstStepFinished');
var intermediateStepEvent = new Event('intermediateStepFinished');
var noCaptchaEvent = new Event('captchaChecked');
var partPageScrapingEvent = new Event('partOfPageScraped');
var fullPageScrapingEvent = new Event('fullPageScraped');

//---------- CAPTCH FLAG ----------
var captchaDetectedFlag = false;

//---------- STEP LENGTH  ----------
var ticStep = 0;
var tocStep = 0;

function firstStepStatusListener() {
    window.removeEventListener('actionFinishedInternal', firstStepStatusListener, false);

    setTimeout(function () {
        console.log("Bowling: " + "first step done");
        window.dispatchEvent(firstStepEvent);
    }, minimumDelay);
}

function stepStatusListener() {
    console.log("Bowling: " + "step done");
    window.removeEventListener('actionFinishedInternal', stepStatusListener, false);

    setTimeout(function () {
        window.dispatchEvent(intermediateStepEvent);
    }, minimumDelay);
}

function navigationMakeFirstStep() {
    console.log("Bowling: " + "prepare for scraping the page");
    //--------- SCROLL & CLICK & SAVE ---------
    //nothing to do here, passing the puck to next function
    if (subtaskPublic.action === "scroll" || subtaskPublic.action === "click" || subtaskPublic.action === "save") {
        window.dispatchEvent(firstStepEvent);
    }
}

function navigationCheckForCaptcha() {
    console.log("Bowling: " + "check for captcha");
    captchaDetectedFlag = false;

    if (String(subtaskPublic.currentPageUrl).indexOf("google.com") >= 0) {
        captchaDetectedFlag = Boolean($("iframe[title='recaptcha widget']").length !== 0)
     }

    if (captchaDetectedFlag) {
        window.dispatchEvent(fullPageScrapingEvent);
    } else {
        window.dispatchEvent(noCaptchaEvent);
    }
}

function navigationMakeStep() {
    console.log("Bowling: " + "make scraping step");
    ticStep = Date.now();

    //--------- SCROLL ---------
    if (subtaskPublic.action === "scroll") {
        window.addEventListener('actionFinishedInternal', stepStatusListener, false);
        window.addEventListener('errorOccuredInternal', stepStatusListener, false);

        //stepC = 50;
        //periodC = stepC * subtaskPublic.description.stepPeriod / subtaskPublic.description.stepLength;
        stepC = 100;
        periodC = 40;

        scrollPage({approach: "conservative", regime: "toValue", step: stepC, period: periodC, offset: window.pageYOffset + subtaskPublic.description.stepLength, selector: "", checkLimit: subtaskPublic.description.checkLimit}, "content-content", noExtraStopScrollingCondition);
    }

    //--------- CLICK ---------
    if (subtaskPublic.action === "click") {
        window.addEventListener('actionFinishedInternal', stepStatusListener, false);
        window.addEventListener('errorOccuredInternal', stepStatusListener, false);

        clickElement(subtaskPublic.description, false, "none");
    }

    //--------- SAVE ---------
    if (subtaskPublic.action === "save") {
        setTimeout(function () {
            if (String(subtaskPublic.currentPageUrl).indexOf("tsear.ch") >= 0) {
                window.addEventListener('actionFinishedInternal', stepStatusListener, false);
                window.addEventListener('errorOccuredInternal', stepStatusListener, false);

                if ($("ul.pager > li.next > a").length > 0) {
                    offsetC = $("ul.pager > li.next > a").scrollTop();
                    scrollPage({approach: "conservative", regime: "toElement", step: 100, period: 40, offset: offsetC, selector: "", checkLimit: 10}, "content-content", noExtraStopScrollingCondition);
                }
            } else {
                window.dispatchEvent(intermediateStepEvent);
            }
        }, minimumDelay);
    }
}

function navigationGetNextPageUrl() {
    console.log("Bowling: " + "searching for next page");
    nextPageUrl = "";

    if (String(subtaskPublic.currentPageUrl).indexOf("google") >= 0) {
        nextPageUrl = "https://" + subtaskPublic.rootPageHost + $("#pnnext").attr("href");
    }

    if (String(subtaskPublic.currentPageUrl).indexOf("tsear.ch") >= 0) {
        if ($("ul.pager > li.next > a").length > 0) {
            nextPageUrl = "http://" + subtaskPublic.rootPageHost + $("ul.pager > li.next > a").attr("href");
        }
    }

    return nextPageUrl;
}

function navigationCheckStatusInProgress() {
    console.log("Bowling: " + "check whether we finished scraping the page");
    var inProgress = true;
    //--------- SCROLL ---------
    if (subtaskPublic.action === "scroll") {
        inProgress = (scrolledToEndOfPage) ? false : true;
    }

    //--------- CLICK ---------
    if (subtaskPublic.action === "click") {
        //nothing
    }

    //--------- SAVE ---------
    if (subtaskPublic.action === "save") {
        inProgress = false;
    }

    //propagate the check counter
    if (inProgress) {
        navigationCheckCounter = 0;
    } else {
        navigationCheckCounter = navigationCheckCounter + 1;
    }

    tocStep = Date.now();
    var stepTime = tocStep - ticStep;

    //wait for step duration to fully pass
    setTimeout(function(){
        //decide upon continuing scraping this page
        if ((inProgress) || (parseInt(navigationCheckCounter) < parseInt(subtaskPublic.description.checkLimit))) {
            //start scraping from the beginning
            console.log("Bowling: " + "start again");
            window.dispatchEvent(firstStepEvent);
        } else {
            //close the session
            console.log("Bowling: " + "drop the task, it's finished");
            window.dispatchEvent(fullPageScrapingEvent);
        }
    }, Math.max(stepMinimumLength - stepTime, minimumDelay));
}
