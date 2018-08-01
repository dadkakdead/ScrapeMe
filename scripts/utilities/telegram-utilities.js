var botBirthdayTimestamp = Date.now();
var botBirthdayMidnight = sameDayMidnight(new Date());

var firstMessageDate, firstMessageTime, lastMessageDate, lastMessageTime;

//for smooth infinite scrolling
var nMessagesLimit = 5;
var nMessagesLoadedCounter = 0;

var datesTextArrayLoaded = [];
var lastMessageLoadedDate = "";
var lastMessageLoadedTime = "";

previousCountValue = 0;
currentCountValue = 0;

jQuery.fn.removeWithoutLeaking = function() {
    this.each(function(i,e) {
        if(e.parentNode) {
            e.parentNode.removeChild(e);
        }
    });
};

var fullChannel_stopScrollingCondition = function(scrollingFunction, communicationRegime) {
    $("div.im_history_messages_peer:not('.ng-hide')").find("div.im_service_message span.im_message_date_split_text").each(function() {
        datesTextArrayLoaded[datesTextArrayLoaded.length] = $(this).text();
    });
    //oldest loaded message
    firstMessageLoadedDate = $("div.im_history_messages_peer:not('.ng-hide')").find("div.im_history_message_wrap").find("div.im_service_message span.im_message_date_split_text").first().text();

    //first ever message in thread
    lastMessageLoadedDate = (lastMessageLoadedDate === "") ? $("div.im_history_messages_peer:not('.ng-hide')").find("div.im_history_message_wrap").find("div.im_service_message span.im_message_date_split_text").last().text() : lastMessageLoadedDate;
    lastMessageLoadedTime = (lastMessageLoadedTime === "") ? $("div.im_history_messages_peer:not('.ng-hide')").find("div.im_history_message_wrap").find("span.im_message_date_text").last().attr("data-content") : lastMessageLoadedTime;

    //captured period in days
    capturedPeriodInDays = (Date.parse(lastMessageLoadedDate) - Date.parse(firstMessageLoadedDate)) / 24 / 60 / 60 / 1000;

    //filter for flood channels; if more than 6 messages a day - it's flood channel
    messagesFrequency = 0;
    if (capturedPeriodInDays > 2) {
        messagesFrequency = nMessagesLoadedCounter / capturedPeriodInDays;
        if (messagesFrequency > 6) {
            return reportNavigationStatus(communicationRegime, "error");
        }
    }

    console.log("ntScraper Stats: First message from " +  firstMessageLoadedDate);
    console.log("ntScraper Stats: Last message from " + lastMessageLoadedDate);
    console.log("ntScraper Stats: Loaded " + nMessagesLoadedCounter + " messages");
    console.log("ntScraper Stats: Captured range " + capturedPeriodInDays + " days; " + messagesFrequency + " messages per day");

    if ($("div.im_history_messages_peer:not('.ng-hide') [ng-switch-when='messageActionChannelCreate']").length > 0) {
        nMessagesOnScreenTotal = $("div.im_history_messages_peer:not('.ng-hide')").find("div.im_history_message_wrap").length;
        nMessagesOnScreenProcessed = $("div.im_history_messages_peer:not('.ng-hide')").find("div.im_history_message_wrap.mLoaded, div.im_history_message_wrap.mRemoved").length;
        nMessagesLoadedCounter = nMessagesLoadedCounter + (nMessagesOnScreenTotal - nMessagesOnScreenProcessed);

        return reportNavigationStatus(communicationRegime, "finish");
    } else {
        //tag the elements - messages
        $($("div.im_history_messages_peer:not('.ng-hide')").find("div.im_history_message_wrap").get().reverse()).each(function(){
            if ($(this).attr("id") === undefined) {
                nMessagesLoadedCounter = nMessagesLoadedCounter + 1;
                $(this).attr("id", "m" + nMessagesLoadedCounter);
                $(this).addClass("mLoaded");
            }
        });

        //mark and remove all messages over the limit
        if ($(".mLoaded").length > nMessagesLimit) {
            if ($(".mRemoved").length === 0) {
                $("div.im_history_messages_peer:not('.ng-hide')").find("div.im_service_message span.im_message_date_split_text").addClass("mRemoved");

                $($(".mLoaded").get().reverse()).each(function(){
                    if ($(".mLoaded").length > nMessagesLimit) {
                        $(this).removeClass("mLoaded");
                        $(this).addClass("mRemoved");
                    }
                });
            } else {
                $(".mRemoved").removeWithoutLeaking();
            }
        }

        currentCountValue = nMessagesLoadedCounter;
        if (currentCountValue > previousCountValue) {
            chrome.runtime.sendMessage({controllerCommand: "forceProgressChange"});
            previousCountValue = currentCountValue;
        }

        return scrollingFunction();
    }
}

var weekOnly_stopScrollingCondition = function(scrollingFunction, communicationRegime) {
    nMessages = $("div.im_history_messages_peer:not('.ng-hide')").find("div.im_history_message_wrap").length;
    nServiceMessages = $("div.im_history_messages_peer:not('.ng-hide')").find("div.im_service_message span.im_message_date_split_text").length;

    console.log("Found " +  nMessages + " message(s).");
    console.log("Found " +  nServiceMessages + " service message(s).");

    firstMessageDate = undefined;
    firstMessageTime = undefined;
    lastMessageDate = undefined;
    lastMessageTime = undefined;

    if (nMessages + nServiceMessages > 0) {
        $("div.im_history_messages_peer:not('.ng-hide')").find("div.im_history_message_wrap").each(function(){
            if (firstMessageDate === undefined) {
                if ($(this).find("div.im_service_message span.im_message_date_split_text").length > 0) {
                    firstMessageDate = $(this).find("div.im_service_message span.im_message_date_split_text").text();
                }
            }

            if (firstMessageDate !== undefined && firstMessageTime === undefined) {
                if ($(this).find("span.im_message_date_text").length > 0) {
                    firstMessageTime = $(this).find("span.im_message_date_text").attr("data-content");
                }
            }

            if ($(this).find("div.im_service_message span.im_message_date_split_text").length > 0) {
                lastMessageDate = $(this).find("div.im_service_message span.im_message_date_split_text").text();
            }

            if (lastMessageDate !== undefined) {
                if ($(this).find("span.im_message_date_text").length > 0) {
                    lastMessageTime = $(this).find("span.im_message_date_text").attr("data-content");
                }
            }
        });

        if (firstMessageDate !== undefined && firstMessageTime !== undefined && lastMessageDate !== undefined && lastMessageTime !== undefined) {
            firstMessageTimeFull = firstMessageDate + " " + firstMessageTime;
            firstMessageTimestamp = Date.parse(firstMessageTimeFull);

            lastMessageTimeFull = lastMessageDate + " " + lastMessageTime;
            lastMessageTimestamp = Date.parse(lastMessageTimeFull);

            dtDaysRange = (lastMessageTimestamp - firstMessageTimestamp) / 24 / 60 / 60 / 1000; //in days
            dtDaysRangeLegible = Math.round(dtDaysRange * 1000) / 1000; //two digit precision

            dtDaysFromLastPost = (botBirthdayTimestamp - lastMessageTimestamp) / 24 / 60 / 60 / 1000; //in days
            dtDaysFromLastPostLegible = Math.round(dtDaysFromLastPost * 1000) / 1000;

            dtDaysFromOldestPostLegible = dtDaysRangeLegible + dtDaysFromLastPostLegible;
            console.log("First message from " +  firstMessageTimeFull);
            console.log("Last message from " + lastMessageTimeFull);
            console.log("ntScraper info: Loaded " + nMessages + " messages");
            console.log("ntScraper info: The oldest post loaded " + firstMessageTimeFull + ", " + dtDaysFromOldestPostLegible + " days ago");
            console.log("ntScraper info: Last post on " + lastMessageTimeFull + ", " + dtDaysFromLastPostLegible + " days ago");
            console.log("ntScraper info: Range " + dtDaysRangeLegible + " days");

            if (($("div.im_history_messages_peer:not('.ng-hide') [ng-switch-when='messageActionChannelCreate']").length > 0) || ((dtDaysFromLastPost < 7) && ((dtDaysFromLastPost + dtDaysRange) > 7)) || ((dtDaysFromLastPost > 7) && (dtDaysRange > 7)) || ((nMessages > 100) && ((nMessages / dtDaysRangeLegible) > 24))) {
                return reportNavigationStatus(communicationRegime, "finish");
            } else {
                return scrollingFunction();
            }
        } else {
            return scrollingFunction();
        }
    } else {
        return reportNavigationStatus(communicationRegime, "finish");
    }
}
