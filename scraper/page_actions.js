var s = document.createElement('script');
s.src = chrome.extension.getURL('/scraper/type_injected.js');
s.onload = function() {
    s.remove();
};
(document.head || document.documentElement).appendChild(s);

/*var s = document.createElement('script');
s.src = chrome.extension.getURL('/thirdparty/jquery-3.1.1.min.js');
s.onload = function() {
    s.remove();
};
(document.head || document.documentElement).appendChild(s);*/

var userActionEvent = new Event('actionFinished');
var userActionEventInternal = new Event('actionFinishedInternal');

var navigationErrorEvent = new Event('errorOccured');
var navigationErrorEventInternal = new Event('errorOccuredInternal');

var triggerEvent = new Event('somethingHappened');

//--------- CHECK PARAMETERS --------------
var checkStartedTimestamp;
var checkElapsedTime;

//--------- SCROLLING PARAMETERS ----------
var scrolledToEndOfPage = false;
var scrollingStatusCheckCounter = 0;

var superMinimumDelay = 25;
var minimumDelay = 50;

var originalDelay = 0;
var subtaskStarted = 0;

function reportNavigationStatus(communicationRegime, status) {
    if (communicationRegime === "content-content") {
        if (status === "finish") {
            window.dispatchEvent(userActionEventInternal);
        }
        if (status === "error") {
            window.dispatchEvent(navigationErrorEventInternal);
        }
    }
    if (communicationRegime === "content-background") {
        if (status === "finish") {
            window.dispatchEvent(userActionEvent);
        }
        if (status === "error") {
            window.dispatchEvent(navigationErrorEvent);
        }
    }
}

function check(description, communicationRegime) {
    duration = description.duration;
    property = description.property;
    inverseCheckLogic = description.inverseCheckLogic;
    happenMode = description.happenMode;

    targetSelector = (description.selector === "") ? "undefinedTag" : description.selector;
    //presence, count
    targetPopulationType = description.target;
    targetPopulationTotal = description.total;
    //class
    targetClass = description.class;
    //attribute
    targetAttributeName = description.attributeName;
    targetAttributeValue = description.attributeValue;
    //content
    targetContainsText = description.containsText;

    console.log("ntScraper: already waiting for " + checkElapsedTime + " ms");
    if ($(targetSelector).length >= 1 || property === "presence") {
        console.log("ntScraper: performing check");
        switch (property) {
            case "presence":
            case "count":
                if (targetPopulationType === "elements") {
                    checkSuccessFlag = Boolean($(targetSelector).length >= targetPopulationTotal);
                }
                if (targetPopulationType === "children") {
                    checkSuccessFlag = Boolean($(targetSelector).first().children().length >= targetPopulationTotal);
                }
                break;

            case "class":
                checkSuccessFlag = Boolean($(targetSelector).hasClass(targetClass));
                break;

            case "attribute":
                checkSuccessFlag = Boolean($(targetSelector).attr(targetAttributeName) === targetAttributeValue);
                break;

            case "content":
                checkSuccessFlag = Boolean($(targetSelector).text().toLowerCase().indexOf(targetContainsText.toLowerCase()) >= 0);
                break;
        }
    } else {
        console.log("ntScraper: error when checking - can't find element");
        reportNavigationStatus(communicationRegime, "error");
        return false;
    }

    if (inverseCheckLogic) {
        checkSuccessFlag = !(checkSuccessFlag);
    }

    if (checkSuccessFlag) {
        console.log("ntScraper: successful check");
        status = (happenMode === "good") ? "finish" : "error";
        reportNavigationStatus(communicationRegime, status);
    } else {
        console.log("ntScraper: unsuccesful check, retrying");
        if (checkElapsedTime < duration) {
            setTimeout(function() {
                checkElapsedTime = Date.now() - checkStartedTimestamp;
                check(description, communicationRegime);
            }, minimumDelay);
        } else {
            status = (happenMode === "good") ? "error" : "finish";
            reportNavigationStatus(communicationRegime, status);
        }
    }
}

function wait(description, communicationRegime) {
    reason = description.reason;
    duration = description.duration;
    persistence = description.persistence;
    lifeId = description.lifeId;

    switch(reason) {
        case "delay":
            setTimeout(function() {
                reportNavigationStatus(communicationRegime, "finish");
            }, duration);
            break;

        case "ajax":
            function reactOnTreeModification() {
                if (persistence === true) {
                    window.dispatchEvent(triggerEvent);

                    switch (lifeId) {
                        case "fungusBot":
                            initializeFungusBot();
                            break;
                    }
                } else {
                    $(document).unbind("DOMSubtreeModified", reactOnTreeModification);
                    reportNavigationStatus(communicationRegime, "finish");
                }
            }

            $(document).bind("DOMSubtreeModified", reactOnTreeModification);
            break;
    }
}

//run one more scrolling check; if we need to scroll -> run scrolling loop again, if we don't -> report action as finished
function scrollingLoopWrapper(stopScrollingCondition, scrollingLoop, communicationRegime) {
    return stopScrollingCondition(scrollingLoop, communicationRegime);
}

var noExtraStopScrollingCondition = function(scrollingFunction, communicationRegime) {
    return scrollingFunction();
}

function scrollPage(description, communicationRegime, customStopScrollingCondition){
    approach = description.approach;
    approachSelector = description.approachSelector;
    regime = description.regime;
    step = description.step;
    period = description.period;
    selector = description.selector;
    offset = (regime === "toTheEnd") ? (step > 0 ) ? Number.MAX_SAFE_INTEGER  : 0 : description.offset;
    checkLimit = description.checkLimit;

    function continueScrolling(){
        if (scrolledToEndOfPage) {
            scrollingStatusCheckCounter += 1;
            if (scrollingStatusCheckCounter < checkLimit) {
                scrollingLoopWrapper(customStopScrollingCondition, scrollingLoop, communicationRegime);
            } else {
                if (regime === "toTheEnd" || regime === "toBalance") {
                    reportNavigationStatus(communicationRegime, "finish");
                }
                if (regime === "toTheEndCustom" || regime === "toValue" || regime === "toElement") { //either value not reached or element not found
                    reportNavigationStatus(communicationRegime, "error");
                }
            }
        } else {
            scrollingStatusCheckCounter = 0;
            scrollingLoopWrapper(customStopScrollingCondition, scrollingLoop, communicationRegime);
        }
    }

    //define scrolling loop
    var scrollingLoop = function() {
        setTimeout(function() {
            //conservative approach - scroll the window
            if (regime === "toBalance") {
                if ($(selector).offset().top > offset) {
                    step = Math.abs(step) * 1.0;
                } else {
                    step = Math.abs(step) * -1.0;
                }
            }

            if (approach === "conservative") {
                pageYOffsetBefore = window.pageYOffset;
                window.scrollTo(0, (window.pageYOffset + step < 0) ? 0 : window.pageYOffset + step);
                pageYOffsetAfter = window.pageYOffset;
            }
            //modern approach - scroll the div
            if (approach === "modern") {
                pageYOffsetBefore = $(approachSelector).scrollTop();
                $(approachSelector).scrollTop($(approachSelector).scrollTop() + step);
                $(approachSelector).triggerHandler('scroll');
                pageYOffsetAfter = $(approachSelector).scrollTop();
            }

            if (Math.abs(pageYOffsetBefore - pageYOffsetAfter) > 0) {
                scrolledToEndOfPage = false;
            } else {
                scrolledToEndOfPage = true;
            }

            switch(regime) {
                case "toBalance":
                    if (Math.abs($(selector).offset().top - offset) < (Math.abs(step) + 1)) {
                        reportNavigationStatus(communicationRegime, "finish");
                    } else {
                        continueScrolling();
                    }
                    break;

                case "toElement":
                    if ($(selector).length > 0){
                        if (approach === "conservative") {
                            window.scrollTo(0, $(selector).offset().top);
                        }
                        if (approach === "modern") {
                            $(approachSelector).scrollTop($(selector).offset().top);
                        }
                        reportNavigationStatus(communicationRegime, "finish");
                    } else {
                        continueScrolling();
                    }
                    break;
                case "toTheEndCustom":
                case "toTheEnd":
                case "toValue":
                    if ((pageYOffsetAfter > parseInt(offset) && step > 0) || (pageYOffsetAfter < parseInt(offset) && step < 0)) {
                        if (approach === "conservative") {
                            window.scrollTo(0, parseInt(offset));
                        }
                        if (approach === "modern") {
                            $(approachSelector).scrollTop(parseInt(offset));
                        }
                        reportNavigationStatus(communicationRegime, "finish");
                    } else {
                        continueScrolling();
                    }
                    break;
            }
        }, period);
    }

    scrollingLoop();
}

function clickElement(description, causesReload, reloadType, communicationRegime) {
    var selector = description.selector;
    var jQueryStyle = description.jQueryStyle;
    var mouseEventName = description.mouseEvent;

    if (($(selector).length > 0) && (String($(selector).css("display")) !== "none")) {
        if (jQueryStyle) {
            $(selector).click();
        } else {
            //$(selector)[0].dispatchEvent(new MouseEvent(mouseEventName, {bubbles:!0}));
            $(selector)[0].dispatchEvent(new MouseEvent(mouseEventName));
        }

        if (causesReload === false || reloadType === "webNavigation") {
            reportNavigationStatus(communicationRegime, "finish");
        }
    } else {
        //console.log("ntScraper: " + $(selector).length + " elements to click on");
        //console.log("ntScraper: " + "css display: " + String($(selector).css("display")));
        reportNavigationStatus(communicationRegime, "error");
    }
}

function setInputValue(description, communicationRegime) {
    selector = description.selector;
    inputAreaType = description.inputAreaType;
    inputApproach = description.inputApproach;

    fullText = description.textPrefix + description.text + description.textSuffix;

    if ($(selector).length > 0) {
        $(selector).focus();

        if (inputAreaType === "input") {
            if (inputApproach === "contentScript") {
                $(selector).val(fullText);
                reportNavigationStatus(communicationRegime, "finish");
            }
            if (inputApproach === "injectedScript") {
                $(selector).val();

                typingErrorFlag = Boolean(Math.random() <= 0.34);
                if (typingErrorFlag) {
                    fullTextWithError = addRandomChar(fullText);
                } else {
                    fullTextWithError = fullText;
                }

                var evtOut = new CustomEvent(
                	"setInputValueCsInj", {
                		detail: {
                            communicationRegime: communicationRegime,
                            status: "in progress",
                            selector: selector,
                            typingDirection: "forward",
                            textTyped: "",
                            textToType: fullTextWithError,
                            textToTypeClean: fullText,
                		    bubbles: true,
                	        cancelable: true
                        }
                	}
                );
                window.dispatchEvent(evtOut);
            }
        }
        if (inputAreaType === "div") {
            $(selector).text(fullText);
            reportNavigationStatus(communicationRegime, "finish");
        }
    } else {
        reportNavigationStatus(communicationRegime, "error");
    }
}

chrome.runtime.onConnect.addListener(function(port) {
    if (port.name === "navigationPort") {
        port.onMessage.addListener(function(request) {
            console.log("ntScraper: performing " + request.purpose + ", doing " + request.action + "'ing");
            if (request.purpose === "errorHandling") {
                subtaskStarted = request.subtaskStarted;
                originalDelay = request.originalDelay;
            } else {
                subtaskStarted = Date.now();
                originalDelay = Math.max(request.stepMinimumLength, minimumDelay);
            }

            function sendTriggerSignal() {
                port.postMessage({purpose: "eventTriggering"});
            }

            function sendErrorMessage() {
                port.postMessage({purpose: "errorHandling", action: "reportError", originalDelay: originalDelay, subtaskStarted: subtaskStarted});
            }

            function respondToUserActionRequest() {
                console.log("ntScraper: wait " + Math.max(originalDelay - (Date.now() - subtaskStarted), minimumDelay) + "ms more");

                setTimeout(function() {
                    window.removeEventListener('somethingHappened', sendTriggerSignal, false);
                    window.removeEventListener('errorOccured', sendErrorMessage, false);
                    window.removeEventListener('actionFinished', respondToUserActionRequest, false);
                    window.removeEventListener("setInputValueInjCs", setInputValueInjCs, false);

                    port.disconnect();
                }, Math.max(originalDelay - (Date.now() - subtaskStarted), minimumDelay));
            }

            function setInputValueInjCs(evtIn) {
                if (evtIn.detail.status === "finished") {
                    reportNavigationStatus(evtIn.detail.communicationRegime, "finish");
                }
                if (evtIn.detail.status === "error") {
                    reportNavigationStatus(evtIn.detail.communicationRegime, "error");
                }
            }

            window.addEventListener('somethingHappened', sendTriggerSignal, false);
            window.addEventListener('errorOccured', sendErrorMessage, false);
            window.addEventListener('actionFinished', respondToUserActionRequest, false);
            window.addEventListener("setInputValueInjCs", setInputValueInjCs, false);

            if (request.purpose === "errorHandling") {
                window.dispatchEvent(userActionEvent);
            }

            if (request.purpose === "navigation") {
                switch (request.action) {
                    case "scroll":
                        if (request.description.showStopper === "default") {
                            scrollPage(request.description, "content-background", noExtraStopScrollingCondition);
                        } else {
                            scrollPage(request.description, "content-background", window[request.description.showStopper + "_" + "stopScrollingCondition"]);
                        }
                        break;
                    case "click":
                        setTimeout(function() {
                            clickElement(request.description, request.causesReload, request.reloadType, "content-background");
                        }, originalDelay);
                        break;
                    case "setInputValue":
                        setTimeout(function() {
                            setInputValue(request.description, "content-background");
                        }, originalDelay);
                        break;
                    case "check":
                        checkStartedTimestamp = Date.now();
                        checkElapsedTime = 0;
                        check(request.description, "content-background");
                        break;
                    case "wait":
                        wait(request.description, "content-background");
                        break;
                }
            }
        });
    }
});
