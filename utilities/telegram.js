var historiesStructureOld = new Object();
var historiesStructureNew = new Object();

function checkDialogueIsUnread(badgeDomElement) {
    return Boolean (badgeDomElement.hasClass("ng-hide") === false && parseInt(badgeDomElement.text()) > 0);
}

function isThereOnlyOneHistoryUp(hS) {
    visibleCounter = 0;
    for (property in hS) {
        if (hS[property] === false) {
            visibleCounter = visibleCounter + 1;
        }
    }

    return (visibleCounter === 1) ? true : false;
}

function areHistoriesSystemsEqual(hS1, hS2) {
    if (Object.keys(hS1).length === Object.keys(hS2).length) {
        for (property in hS1) {
            if (hS2.hasOwnProperty(property)) {
                if (hS1[property] !== hS2[property]) {
                    return false;
                }
            } else {
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
}

function getHistoriesSystem() {
    var historiesStructure = Object();

    $("div.im_history_messages_peer").each(function() {
        if ($(this).attr("id") === undefined) {
            historyId = "fh" + Date.now();
            $(this).attr("id", historyId);
        }
        historiesStructure[$(this).attr("id")] = $(this).hasClass("ng-hide");
    });
    return historiesStructure;
}

function markNewHistoryStructureAsCurrent() {
    $("div.im_history_messages_peer").each(function() {
        if ($(this).hasClass("botCurrent") && $(this).hasClass("ng-hide") === false) {
            ///nothing
        }
        if ($(this).hasClass("botCurrent") && $(this).hasClass("ng-hide") === true) {
            $(this).removeClass("botCurrent");
        }
        if ($(this).hasClass("botCurrent") === false && $(this).hasClass("ng-hide") === false) {
            $(this).addClass("botCurrent");
        }
        if ($(this).hasClass("botCurrent") === false && $(this).hasClass("ng-hide") === true) {
            //nothing
        }
    });
}
