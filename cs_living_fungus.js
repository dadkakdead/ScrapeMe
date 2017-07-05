//----- Telegram Text Bot -----
//1. when message comes - go to that chat, scroll up for 50 messages (or until you find your own message),
//analyze content and reply with text (if ok)
//2. go chat to chat (they are organised in queue), processed one by ones

//maximum number of messages to cache from fresh open chat
var fungusMaxMessages = 50;

//loops' lengths
var fungusCheckInterval = 100; //period of check for unread dialogues
var fungusReportInterval = 1000; //period of logging bot activity to background page

//bot state
var fungusBotActivated = false; //changed after calling "fungusBot" for the first time
var fungusBotName = "";
var fungusDialoguesQueue = []; //list of dialogues to be processed
var fungusBotAsleep = true; //changed after bot finishes processing the queue
var fungusStepIterator = 0;
var fungusErrorIterator = 0;

//scroll until you get either <nMessagesRequest> messages loaded or you reach bot's last message
var fungusScrollingStopper = function(scrollingFunction) {
    nMessages = $("div.im_history_messages_peer.botCurrent").find("div.im_history_message_wrap").length;

    if (nMessages > fungusMaxMessages) {
        return reportNavigationStatus("content-content", "finish");
    } else {
        for (i = nMessages; i > Math.max(nMessages - fungusMaxMessages, 0); i--) {
            sender = $("div.im_history_messages_peer.botCurrent").find("div.im_history_message_wrap").eq(i).find("a.im_message_author").text().replace(/[\r\n]/g, "").trim();

            if (fungusBotName.indexOf(sender) >= 0 && sender !== "") {
                return reportNavigationStatus("content-content", "finish");
            }
        }

        return scrollingFunction();
    }
}

//read last <nMessagesRequest> messages after your last post and merge them in one string
function readHistoryStructure() {
    nMessages = $("div.im_history_messages_peer.botCurrent").find("div.im_history_message_wrap").length;

    historyBuffer = "";

    for (i = nMessages; i > Math.max(nMessages - fungusMaxMessages, 0); i--) {
        sender = $("div.im_history_messages_peer.botCurrent").find("div.im_history_message_wrap").eq(i).find("a.im_message_author").text().replace(/[\r\n]/g, "").trim();
        text = $("div.im_history_messages_peer.botCurrent").find("div.im_history_message_wrap").eq(i).find("div.im_message_text").text().trim().toLowerCase();

        if (fungusBotName.indexOf(sender) >= 0 && sender !== "") {
            return historyBuffer;
        } else {
            //messages will be split by vertical bar, words will be split by spaces
            historyBuffer = historyBuffer + "|" +  String(" " + text).replace(/\|/gm, "");
        }
    }
    return historyBuffer;
}

function getFungusName(regime){
    if (regime === "next" || typeof(regime) === "object") {
        fungusStepIterator = fungusStepIterator + 1;
    }
    if (regime === "same") {
        //do nothing
    }

    setTimeout(function() {
        switch (parseInt(fungusStepIterator)) {
            case 1:
                console.log("Bowling Log: checking UI loaded");
                checkStartedTimestamp = Date.now();
                checkElapsedTime = 0;
                check({duration: 60000, property: "presence", inverseCheckLogic: false, happenMode: "good", selector: "div.tg_page_head", target: "elements", total: 1, class: "", attributeName: "", attributeValue: "", containsText: ""}, "content-content");
                break;

            case 2:
                console.log("Bowling Log: checking connection being established");
                checkStartedTimestamp = Date.now();
                checkElapsedTime = 0;
                check({duration: 1000, property: "content", inverseCheckLogic: false, happenMode: "good", selector: "div.tg_page_head", target: "elements", total: 1, class: "", attributeName: "", attributeValue: "", containsText: "Connecting"}, "content-content");
                break;

            case 3:
                console.log("Bowling Log: checking connection established");
                checkStartedTimestamp = Date.now();
                checkElapsedTime = 0;
                check({duration: 1000, property: "content", inverseCheckLogic: true, happenMode: "good", selector: "div.tg_page_head", target: "elements", total: 1, class: "", attributeName: "", attributeValue: "", containsText: "Connecting"}, "content-content");
                break;

            case 4:
                console.log("Bowling Log: check menu");
                checkStartedTimestamp = Date.now();
                checkElapsedTime = 0;
                check({duration: 10000, property: "presence", inverseCheckLogic: false, happenMode: "good", selector: "a.tg_head_btn.dropdown-toggle", target: "elements", total: 1, class: "", attributeName: "", attributeValue: "", containsText: ""}, "content-content");
                break;

            case 5:
                console.log("Bowling Log: go to menu");
                clickElement({selector: "a.tg_head_btn.dropdown-toggle", jQueryStyle: false, mouseEvent: "click"}, false, "none", "content-content");
                break;

            case 6:
                console.log("Bowling Log: check menu is shown");
                checkStartedTimestamp = Date.now();
                checkElapsedTime = 0;
                check({duration: 10000, property: "class", inverseCheckLogic: false, happenMode: "good", selector: "div.tg_head_logo_dropdown.dropdown", target: "elements", total: 1, class: "open", attributeName: "", attributeValue: "", containsText: ""}, "content-content");
                break;

            case 7:
                console.log("Bowling Log: click to settings");
                clickElement({selector: "div.tg_head_logo_dropdown.dropdown.open > ul > li:eq(2) > a", jQueryStyle: false, mouseEvent: "click"}, false, "none", "content-content");
                break;

            case 8:
                console.log("Bowling Log: check profile page shown");
                checkStartedTimestamp = Date.now();
                checkElapsedTime = 0;
                check({duration: 10000, property: "presence", inverseCheckLogic: false, happenMode: "good", selector: "div.settings_modal_wrap.md_modal_wrap", target: "elements", total: 1, class: "", attributeName: "", attributeValue: "", containsText: ""}, "content-content");
                break;

            case 9:
                console.log("Bowling Log: save bot name");
                fungusBotName = $("div.peer_modal_profile_name").text();
                clickElement({selector: "a.md_modal_action.md_modal_action_close", jQueryStyle: false, mouseEvent: "click"}, false, "none", "content-content");
                break;

            case 10:
                console.log("Bowling Log: close profile page");
                clickElement({selector: "a.tg_head_btn.dropdown-toggle", jQueryStyle: false, mouseEvent: "click"}, false, "none", "content-content");
                break;

            case 11:
                if (fungusBotName.length > 0) {
                    console.log("Bowling Log: starting " + fungusBotName);
                    window.removeEventListener('actionFinishedInternal', getFungusName, false);
                    window.removeEventListener('errorOccuredInternal', resolveGetFungusNameError, false);
                    startfungusBot();
                } else {
                    //try again
                    fungusStepIterator = 0;
                    getFungusName("next");
                }
                break;
        }
    }, superMinimumDelay);
}

function resolveGetFungusNameError() {
    console.log("Bowling Log: resolve error at step " + fungusStepIterator);

    switch (parseInt(fungusStepIterator)) {
        case 1:
            //repeat step 1 if error
            cungusStepIterator = 1;
            break;

        case 2:
            //try not to look for connecting
            fungusStepIterator = 3;
            break;

        case 3:
            //retry
            fungusStepIterator = 2;
            break;

        default:
            //nothing
    }

    fungusErrorIterator = fungusErrorIterator + 1;

    if (fungusErrorIterator <= 10) {
        setTimeout(function() {
            console.log("Bowling Log: repeating step " + fungusStepIterator);
            getFungusName("same");
        }, 1000);
    }
}

function makeFungusStep(regime){
    //if this is new step or step triggered by successful execution of previos step (in that case regime is Event)
    if (regime === "next" || typeof(regime) === "object") {
        fungusStepIterator = fungusStepIterator + 1;
    }
    if (regime === "same") {
        //do nothing
    }

    setTimeout(function() {
        switch (fungusStepIterator) {
            case 1:
                //if the dialogue is not yet selected
                if ($("li.im_dialog_wrap.botCurrent").hasClass("active") === false) {
                    //cache info about histories order
                    historiesStructureOld = getHistoriesSystem();
                    makeFungusStep("next");
                } else {
                    //go straight to step 6 (5 + 1): scrolling down
                    fungusStepIterator = 5;
                    markNewHistoryStructureAsCurrent();
                    makeFungusStep("next");
                }
                break;

            case 2:
                //click on this dialogue
                clickElement({selector: "a.im_dialog.botCurrent", jQueryStyle: false, mouseEvent: "mousedown"}, false, "none", "content-content");
                break;

            case 3:
                //wait until dialogue becomes active, periodically check the state
                if ($("li.im_dialog_wrap.botCurrent").hasClass("active") === false) {
                    makeFungusStep("same");
                } else {
                    makeFungusStep("next");
                }
                break;

            case 4:
                //update info about how histories are shown now, compare to old version
                historiesStructureNew = getHistoriesSystem();

                if (areHistoriesSystemsEqual(historiesStructureNew, historiesStructureOld) === false && isThereOnlyOneHistoryUp(historiesStructureNew) === true) {
                    markNewHistoryStructureAsCurrent();
                    makeFungusStep("next");
                } else {
                    makeFungusStep("same");
                }
                break;

            case 5:
                //scroll up to get all the history you need
                scrollPage({approach: "modern", approachSelector: "div.im_history_scrollable_wrap.nano-content", regime: "toTheEnd", step: -100, period: 50, offset: 0, selector: "", checkLimit: 50}, "content-content", fungusScrollingStopper);
                break;

            case 6:
                //scroll down to see what is new
                scrollPage({approach: "modern", approachSelector: "div.im_history_scrollable_wrap.nano-content", regime: "toTheEnd", step: 100, period: 50, offset: 10000, selector: "", checkLimit: 1}, "content-content", noExtraStopScrollingCondition);
                break;

            case 7:
                fungusBestAnswer = "";

                historyToBeAnalyzed = readHistoryStructure();

                //read the last  messages; set value bases on it
                historyMessages = historyToBeAnalyzed.split("|");
                for (i = 0; i < historyMessages.length; i++) {
                    messageWords = historyMessages[i].split(" ");

                    //if message is longer than 7 symbols and is longer than 2 words
                    if (historyMessages[i].length > 7 && messageWords.length >= 2) {
                        //make a candidate from first three words
                        candidateString = "";
                        for (j = 0; j < Math.min(messageWords.length, 3); j++) {
                            candidateString = candidateString + " " + messageWords[j].trim();
                        }
                        candidateString = filterLyricsQuery(candidateString);

                        //check it
                        pL1 = parseInt(String(lyrics1.toLowerCase()).indexOf(String(candidateString.trim().toLowerCase())));
                        if (pL1 > 0) {
                            fungusBestAnswer = getLineOfSong(lyrics1, pL1) +  " Прёт Интро? Давай пятюню, братишка!";
                            break;
                        }
                        pL2 = parseInt(String(lyrics2.toLowerCase()).indexOf(String(candidateString.trim().toLowerCase())));
                        if (pL2 > 0) {
                            fungusBestAnswer = getLineOfSong(lyrics2, pL2) + " Тащишься по велику, да, понимаю. Респект. ";
                            break;
                        }
                        pL3 = parseInt(String(lyrics3.toLowerCase()).indexOf(String(candidateString.trim().toLowerCase())));
                        if (pL3 > 0) {
                            fungusBestAnswer = getLineOfSong(lyrics3, pL3) + " Ваще не могу из башки выкинуть этот Тает лёд... ";
                            break;
                        }
                        pL4 = parseInt(String(lyrics4.toLowerCase()).indexOf(String(candidateString.trim().toLowerCase())));
                        if (pL4 > 0) {
                            fungusBestAnswer = getLineOfSong(lyrics4, pL4) + " Плюсую за копов - качество. ";
                            break;
                        }
                    }
                }

                if (String(historyToBeAnalyzed).indexOf("влага в клубе") >= 0) {
                    fungusBestAnswer = "https://yandex.ru/pogoda/moscow";
                }

                if (String(historyToBeAnalyzed).indexOf("наши басы") >= 0) {
                    fungusBestAnswer = "https://www.youtube.com/watch?v=m0-yYhLgp_I";
                }

                typingAreaSelector = $("div.im_bottom_panel_wrap").find("div.composer_rich_textarea").getPath();
                setInputValue({selector: typingAreaSelector, inputAreaType: "div", textPrefix: "", text: fungusBestAnswer, textSuffix: ""}, "content-content");
                break;

            case 8:
                typingAreaContent = $("div.im_bottom_panel_wrap").find("div.composer_rich_textarea").text();
                if (typingAreaContent.length > 0) {
                    //send the message if you have anything to say
                    clickElement({selector: "button.btn.btn-md.im_submit.im_submit_send", jQueryStyle: false, mouseEvent: "mousedown"}, false, "none", "content-content");
                } else {
                    //consider dialogue as processed, move next
                    removeDialogueFromQueue();
                    goToNextDialogue();
                }
                break;

            case 9:
                //check the icon disappeared after you looked through the messages; if not, just skip assuming you did your best here
                checkStartedTimestamp = Date.now();
                checkElapsedTime = 0;
                check({duration: 5000, property: "class", inverseCheckLogic: false, happenMode: "good", selector: "span.im_dialog_badge.badge.botCurrent", target: "elements", total: 1, class: "ng-hide", attributeName: "", attributeValue: "", containsText: ""}, "content-content");
                break;

            case 10:
                //go to the next dialogue
                removeDialogueFromQueue();
                goToNextDialogue();
                break;
        }
    }, superMinimumDelay);
}

function resolveFungusError() {
    removeDialogueFromQueue();
    goToNextDialogue();
}

function goToNextDialogue() {
    resetCurrentDialogue();

    if (fungusDialoguesQueue.length > 0) {
        //we always work with 0 element in queue
        badgeId = fungusDialoguesQueue[0];

        if (checkDialogueIsUnread($("#" + badgeId)) === true) {
            $("#" + badgeId).addClass("botCurrent");
            $("#" + badgeId).parents("li.im_dialog_wrap").addClass("botCurrent");
            $("#" + badgeId).parents("a.im_dialog").addClass("botCurrent");

            dialogueName = $("a.im_dialog.botCurrent").find("div.im_dialog_peer").text().replace(/[\r\n]/g, "").trim();

            fungusStepIterator = 0;
            makeFungusStep("next");
        } else {
            removeDialogueFromQueue();
            goToNextDialogue();
        }
    } else {
        fungusBotAsleep = true;
    }
}

function initializeFungusBot() {
    if (fungusBotActivated === false) {
        fungusBotActivated = true;

        window.addEventListener('actionFinishedInternal', getFungusName, false);
        window.addEventListener('errorOccuredInternal', resolveGetFungusNameError, false);

        //go extracting name of this user
        fungusStepIterator = 0;
        getFungusName("next");
    }
}

function startfungusBot() {
    //set event for content script <--> content script communication
    window.addEventListener('actionFinishedInternal', makeFungusStep, false);
    window.addEventListener('errorOccuredInternal', resolveFungusError, false);

    //LOOP: check we have dialogues  left
    fastloop = window.setInterval(function() {
        $($("span.im_dialog_badge.badge").get().reverse()).each(function() {
            //if there are some unread messages...
            if (checkDialogueIsUnread($(this)) === true) {
                //and this dialogues is not yet in queue (or has never been in queue) ...
                if ($(this).attr("id") === undefined || fungusDialoguesQueue.indexOf($(this).attr("id")) === -1){
                    addDialogueToQueue($(this));
                }
            }
        });

        if (fungusDialoguesQueue.length > 0) {
            if (fungusBotAsleep === true) {
                fungusBotAsleep = false;
                goToNextDialogue();
            }
        }
    }, fungusCheckInterval);

    //LOOP: send reports to background page
    slowloop = window.setInterval(function() {
        dialoguesToCheck = fungusDialoguesQueue.length;
        dialoguesTotal = $("span.im_dialog_badge.badge").length;

        statusMessage = String(dialoguesToCheck) + " out of " + String(dialoguesTotal) + " dialogues left to read";
        chrome.runtime.sendMessage({controllerCommand: "log", data: statusMessage});
    }, fungusReportInterval);
}

function addDialogueToQueue(badgeDomElement) {
    //set id to element for speed
    badgeId = "f" + String(Date.now());
    badgeDomElement.attr("id", badgeId);
    //add dialogue into queue
    fungusDialoguesQueue.push(badgeId);
}

function removeDialogueFromQueue() {
    fungusDialoguesQueue.shift();
}

function resetCurrentDialogue(){
    $(".botCurrent").each(function() {
        $(this).removeClass("botCurrent");
    });
}
