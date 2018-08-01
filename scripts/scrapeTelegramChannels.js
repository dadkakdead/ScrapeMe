function scrapeTelegramChannels(){
    var channelStats = new Object();

    var channelDateValue = "";
    var channelDateKey = "";

    //save the moment we started scraping channel
    var subtaskTimestamp = Date.now();

    var channelName = $("div.tg_head_peer_title_wrap span.tg_head_peer_title").text();
    var channelSize = $("div.tg_head_peer_title_wrap span.tg_head_peer_status span:first").text().replace("members", "").replace("member", "").trim();
    var channelId = subtaskPublic.currentSearchTask;

    nMessagesLoaded = $("div.im_history_messages_peer:not('.ng-hide')").find("div.im_history_message_wrap").length;
    nMessagesLoadedProcessed = 0;

    // scrape the messages
    $("div.im_history_messages_peer:not('.ng-hide')").find("div.im_history_message_wrap").each(function() {
        nMessagesLoadedProcessed = nMessagesLoadedProcessed + 1;

        if ($(this).find("div.im_service_message span.im_message_date_split_text").length > 0) {
            channelDateValue = $(this).find("span.im_message_date_split_text").text();
            channelDateKey = String(Date.parse(channelDateValue));
        }

        if (channelDateKey.length > 0) {
            if (channelStats.hasOwnProperty(channelDateKey) === false) {
                channelStats[channelDateKey] = new Object();

                channelStats[channelDateKey].sequenceNumber = "---";
                if (Object.keys(channelStats).length === 1) {
                    channelStats[channelDateKey].sequenceNumber = "first";
                }

                channelStats[channelDateKey].taskId = subtaskPublic.taskId;
                channelStats[channelDateKey].subtaskTimestamp = subtaskTimestamp;
                channelStats[channelDateKey].pageUrl = subtaskPublic.currentPageUrl + "?p=" + subtaskPublic.currentSearchTask;
                channelStats[channelDateKey].channelId = channelId;

                channelStats[channelDateKey].channelName = channelName;
                channelStats[channelDateKey].channelSize = channelSize;
                channelStats[channelDateKey].dateLegible = channelDateValue;

                channelStats[channelDateKey].dateFromBirthday =  Math.round((botBirthdayMidnight - Date.parse(channelDateValue)) / 24 / 60 / 60 / 1000  * 1000) / 1000;

                if (parseInt(channelStats[channelDateKey].dateFromBirthday) < 7) {
                    channelStats[channelDateKey].postedLastSevenDays =  1;
                } else {
                    channelStats[channelDateKey].postedLastSevenDays =  0;
                }

                channelStats[channelDateKey].amountOfText = 0;
                channelStats[channelDateKey].numberOfPhotos = 0;
                channelStats[channelDateKey].numberOfLinks = 0;
                channelStats[channelDateKey].numberOfFiles = 0;

                channelStats[channelDateKey].numberOfVideos = 0;
                channelStats[channelDateKey].numberOfAudios = 0;

                channelStats[channelDateKey].numberOfSignatures = 0;
                channelStats[channelDateKey].numberOfVoters = 0;


                channelStats[channelDateKey].views = 0;
                channelStats[channelDateKey].posts = 0;
                channelStats[channelDateKey].viewsGrouped = 0;
                channelStats[channelDateKey].postsGrouped = 0;
            }

            var views;
            if ($(this).find("div.im_message_views_wrap span.im_message_views_cnt").length > 0) {
                viewsText = $(this).find("div.im_message_views_wrap span.im_message_views_cnt").text();
                if (viewsText.indexOf("K") >= 0) {
                    if (viewsText.indexOf(".") >= 0) {
                        viewsText = viewsText.replace(".", "");
                        viewsText = viewsText.replace("K", "00");
                    } else {
                        viewsText = viewsText.replace("K", "000");
                    }
                }
                views = (viewsText.length > 0) ? parseInt(viewsText) : 0;
            } else {
                views = 0;
            }

            if ($(this).hasClass("im_grouped") === true || $(this).hasClass("im_grouped_fwd") === true || $(this).hasClass("im_grouped_fwd_start") === true || $(this).hasClass("im_grouped_fwd_end") === true) {
                channelStats[channelDateKey].viewsGrouped = channelStats[channelDateKey].viewsGrouped + views;
                channelStats[channelDateKey].postsGrouped = channelStats[channelDateKey].postsGrouped + 1;
            } else {
                channelStats[channelDateKey].views = channelStats[channelDateKey].views + views;
                channelStats[channelDateKey].posts = channelStats[channelDateKey].posts + 1;
            }

            channelStats[channelDateKey].amountOfText = channelStats[channelDateKey].amountOfText + String($(this).find("div.im_message_text").text()).length;
            channelStats[channelDateKey].numberOfPhotos = channelStats[channelDateKey].numberOfPhotos + $(this).find("div.im_message_media div[ng-switch-when='messageMediaPhoto']").length;
            channelStats[channelDateKey].numberOfLinks = channelStats[channelDateKey].numberOfLinks + $(this).find("div.im_message_media div[ng-switch-when='messageMediaWebPage']").length;
            channelStats[channelDateKey].numberOfFiles = channelStats[channelDateKey].numberOfFiles + $(this).find("div.im_message_media div[ng-switch-when='messageMediaDocument']").length;

            channelStats[channelDateKey].numberOfVideos = channelStats[channelDateKey].numberOfVideos + $(this).find("div.im_message_media div[ng-switch-when='video']").length;
            channelStats[channelDateKey].numberOfAudios = channelStats[channelDateKey].numberOfAudios + $(this).find("div.im_message_media div[ng-switch-when='audio']").length + $(this).find("div.im_message_media div[ng-switch-when='voice']").length;

            channelStats[channelDateKey].numberOfSignatures = channelStats[channelDateKey].numberOfSignatures + ($(this).find("div.im_message_sign").children().length > 0) ? 1 : 0;
            channelStats[channelDateKey].numberOfVoters = channelStats[channelDateKey].numberOfVoters + ($(this).find("div.im_message_keyboard").children().length > 0) ? 1 : 0;
        }

        if (nMessagesLoadedProcessed === nMessagesLoaded) {
            channelStats[channelDateKey].sequenceNumber = "last";
        }
    });

    var channelActivityVault = new Object();
    for (channelDateKey in channelStats) {
        channelEntryId = channelId + "_" + channelDateKey;
        channelActivityVault[channelEntryId] = JSON.stringify(channelStats[channelDateKey]);
    }

    return channelActivityVault;
}

function scrapeTelegramChannels_fullContent() {
    return scrapeTelegramChannels();
}

function scrapeTelegramChannels_channelBirthday() {
    channelInfo = Object();
    //obligatory
    channelInfo.taskId = subtaskPublic.taskId;
    channelInfo.pageUrl = subtaskPublic.currentPageUrl + "?p=" + subtaskPublic.currentSearchTask;;
    //optional
    channelInfo.timestamp = Date.now();

    channelName = $("div.tg_head_peer_title_wrap span.tg_head_peer_title").text();
    channelInfo.channelName = channelName;

    channelSize = $("div.tg_head_peer_title_wrap span.tg_head_peer_status span:first").text().replace("members", "").replace("member", "").trim();
    channelInfo.channelSize = channelSize;

    dateOfBirthday = $("div.im_history_messages_peer:not('.ng-hide')").find("div.im_history_message_wrap").find("div.im_service_message span.im_message_date_split_text").first().text();
    channelInfo.dateOfBirthday = dateOfBirthday;

    lastMessageDate = lastMessageLoadedDate; //$("div.im_history_messages_peer:not('.ng-hide')").find("div.im_history_message_wrap").find("div.im_service_message span.im_message_date_split_text").last().text();
    lastMessageTime = lastMessageLoadedTime; //$("div.im_history_messages_peer:not('.ng-hide')").find("div.im_history_message_wrap").find("span.im_message_date_text").last().attr("data-content");
    channelInfo.dateOfLastMessage = lastMessageDate + " " + lastMessageTime;

    channelInfo.activityDays =  Math.round((Date.parse(lastMessageDate) - Date.parse(dateOfBirthday))/ 24 / 60 / 60 / 1000);

    nMessagesLoaded = nMessagesLoadedCounter;//$("div.im_history_messages_peer:not('.ng-hide')").find("div.im_history_message_wrap").length;
    channelInfo.nMessagesLoaded = nMessagesLoaded;

    filteredDatesTextArray = datesTextArrayLoaded.filter(function(item, pos) {
        return datesTextArrayLoaded.indexOf(item)== pos;
    });

    nServiceMessagesLoaded = filteredDatesTextArray.length;
    channelInfo.nServiceMessagesLoaded = nServiceMessagesLoaded;

    channelActivityVault = new Object();
    channelId = subtaskPublic.currentSearchTask;
    channelActivityVault[channelId] = JSON.stringify(channelInfo);

    return channelActivityVault;
}
