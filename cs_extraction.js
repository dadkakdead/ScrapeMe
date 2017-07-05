// template for new crawler
//
// <x> - identificator of data piece
// <x>Vault - an object holding data about x'es in form x's ID -> stringified JSON of x's properties
// selector - jQuery-style selector for many x'es
// <prop1>, <prop2> - names of any properties
//
/* function <crawlingFunction>(taskId, pageUrl, scrapingLoopFlag) {
    var <x>Vault = new Object();

    $("<selector>").each(function(){
        <x> = new Object();

        <x>.taskId = taskId;
        <x>.pageUrl = pageUrl;

        <x>.<prop1> = <prop1Value>;
        <x>.<prop2> = $(this).find("prop2Selector").text();

        <x>.timestamp = String(Date.now());

        <x>Id = String(threadId + "_" + messageCounter);

        <x>Vault[<x>Id] = JSON.stringify(<x>);
    });

    return <x>Vault;
}
*/

function scrapingController(scrapingLoopFlag) {
    taskId = subtaskPublic.taskId;
    url = subtaskPublic.currentPageUrl;
    searchTask = subtaskPublic.currentSearchTask;
    partOfPageId = subtaskPublic.description.partOfPageId;

    var dataVault = new Object;

    if (String(url).indexOf("google") >= 0) {
        dataVault = scrapeFirstGoogleSearchResult(taskId, url, scrapingLoopFlag);
    }

    if (String(url).indexOf("tchannels.me") >= 0) {
        dataVault = scrapeTchannels(taskId, url, scrapingLoopFlag);
    }

    if (String(url).indexOf("tlgrm.ru") >= 0) {
        dataVault = scrapeTlgrm(taskId, url, scrapingLoopFlag);
    }

    if (String(url).indexOf("tsear.ch") >= 0) {
        if (String(url).indexOf("list") >= 0) {
            dataVault = scrapeTsearchListResults(taskId, url, scrapingLoopFlag);
        } else {
            dataVault = scrapeTsearchResults(taskId, url, scrapingLoopFlag);
        }
    }

    if (String(url).indexOf("web.telegram.org/#/im") >= 0) {
        scrapingLoopFlag = !(Boolean(String(url).indexOf("web.telegram.org/#/im?p=") >= 0));

        if (partOfPageId === "fullContent") {
            dataVault = collectStatsFromTelegramChannel(taskId, url, scrapingLoopFlag);
        }
        if (partOfPageId === "channelBirthday") {
            dataVault = scrapeTelegramChannelBirthday(taskId, url, scrapingLoopFlag);
        }
    }

    if (scrapingLoopFlag) {
        return dataVault;
    } else {
        chrome.runtime.sendMessage({controllerCommand: "saveDataToStorage", content: JSON.stringify(dataVault)});
    }
}

function scrapeFirstGoogleSearchResult(taskId, url, scrapingLoopFlag){
    var searchResultsVault = new Object;

    var searchResult = new Object;

    searchResultId = String(Date.now());

    searchResult.searchQuery = $("input.gsfi").val();
    searchResult.searchResults = $("#resultStats").text();
    searchResult.link = $("cite._Rm").first().text();

    searchResult.taskId = taskId;
    searchResult.pageUrl = url;

    searchResultsVault[searchResultId] = JSON.stringify(searchResult);

    return searchResultsVault;
}

function tchannelsFilterText(str){
    //remove emoji
    str = str.replace(/(<span)([a-zA-Z0-9_ \%\>\(\)\=\:\"\-\.\/]{1,})(<\/span>)/gm, "");
    //remove markup shit
    str = str.replace(/(\&nbsp;)/gm, " ");
    str = str.replace(/(<br>)/gm, " ");
    str = str.replace(/(\&amp;)/gm, " ");
    str = str.replace(/(quot;)/gm, " ");
    //remove my delimiter
    str = str.replace(/\|/gm, " ");
    //trim for beauty
    str = str.trim();

    return str;
}

function scrapeTchannels(taskId, url, scrapingLoopFlag){
    //single array for all bots
    channelsVault = new Object;

    $("div.botitem").each(function(){
        channel = new Object;

        channelId = "@" + $(this).attr("data-href").trim();

        channelName =  $(this).find("h3").find("a").html();
        channel.name = tchannelsFilterText(channelName);

        channelCategory = $(this).find(".cat").html();
        channel.category =  tchannelsFilterText(channelCategory);

        channelDescription = $(this).find(".description").html();
        channel.description = tchannelsFilterText(channelDescription);

        channelVotes = $(this).find(".rate").text().match(/\([0-9,]{1,}\)/gm)[0];
        channel.votes =  channelVotes.replace(/\(/gm, " ").replace(/\)/gm, " ").replace(/,/gm, "");

        channelRating = $(this).find(".stars").find("span").attr("style");
        channel.rating =  channelRating.replace(/(width:)/gm, " ").replace(/(%)/gm, " ").replace(/(\.)/gm, ",");

        channel.taskId = taskId;
        channel.pageUrl = url;
        channel.timestamp = String(Date.now());

        channelsVault[channelId] = JSON.stringify(channel);
    });

    return channelsVault;
}

function scrapeTlgrm(taskId, url, scrapingLoopFlag){
    //single array for all bots
    channelsVault = new Object;

    $("div.b-channel").each(function(){
        channel = new Object;

        channelId = String($(this).find("a.js-emojify").attr("href")).replace('https://tlgrm.ru/channels/', '');

        channel.name = $(this).find("a.js-emojify").text().replace(/[\r\n]/g, "").trim();
        channel.uuid =  $(this).find("noscript:first").text().replace("<", "&lt").replace(">","&gt");
        channel.size = tchannelsFilterText($(this).find("div.b-channel__subscribers").text());
        channel.description = tchannelsFilterText($(this).find("div.b-channel__description").text());

        channel.taskId = subtaskPublic.taskId;
        channel.pageUrl = url;
        channel.timestamp = String(Date.now());

        channelsVault[channelId] = JSON.stringify(channel);
    });

    return channelsVault;
}

function scrapeTsearchListResults(taskId, pageUrl, scrapingLoopFlag) {
    channelsVault = new Object();

    $("div.media.heading-divided").each(function(){
        channel = new Object;

        channelId = "@" + $(this).find("div.media-body a:first").attr("href").trim().replace("/channel/", "");

        channel.name = $(this).find("div.media-body a:first").text();
        channel.size = $(this).find("div.media-body > div.media-annotation span").text().trim();
        channel.description = $(this).find("div.media-body > div.text-size-small").text();

        channel.taskId = taskId;
        channel.pageUrl = pageUrl;
        channel.timestamp = Date.now();

        channelsVault[channelId] = JSON.stringify(channel);
    });

    return channelsVault;
}

function scrapeTsearchResults(taskId, pageUrl, scrapingLoopFlag) {
    var channelsVault = new Object();

    $("ul.search-results-list li.media").each(function(){
        channel = new Object();

        channel.taskId = taskId;
        channel.pageUrl = pageUrl;
        channel.timestamp = Date.now();

        channel.id = "@" + $(this).find("div.media-body ul:first").text().trim();
        channel.name = $(this).find("div.media-body h6.media-heading").text();
        channel.description = $(this).find("div.media-body > span").text();
        channel.size = $(this).find("div.media-body ul:last li:last").text().trim();

        channelId = channel.id

        channelsVault[channelId] = JSON.stringify(channel);
    });

    if (scrapingLoopFlag) {
        return channelsVault;
    } else {
        chrome.runtime.sendMessage({controllerCommand: "saveDataToStorage", content: JSON.stringify(channelsVault)});
    }
}

function collectStatsFromTelegramChannel(taskId, url, scrapingLoopFlag){
    var channelStats = new Object();

    var channelDateValue = "";
    var channelDateKey = "";

    var subtaskTimestamp = Date.now();

    if (scrapingLoopFlag) {
        var pageUrl = url + "?p=" + subtaskPublic.currentSearchTask;
        var channelId = subtaskPublic.currentSearchTask;
    } else {
        var pageUrl = url;
        var channelId = url.replace("https://web.telegram.org/#/im?p=", "");
    }

    var channelName = $("div.tg_head_peer_title_wrap span.tg_head_peer_title").text();
    var channelSize = $("div.tg_head_peer_title_wrap span.tg_head_peer_status span:first").text().replace("members", "").replace("member", "").trim();

    nMessagesLoaded = $("div.im_history_messages_peer:not('.ng-hide')").find("div.im_history_message_wrap").length;
    nMessagesLoadedProcessed = 0;

    $("div.im_history_messages_peer:not('.ng-hide')").find("div.im_history_message_wrap").each(function(){
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

                channelStats[channelDateKey].taskId = taskId;
                channelStats[channelDateKey].subtaskTimestamp = subtaskTimestamp;
                channelStats[channelDateKey].pageUrl = pageUrl;
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

    var channelActivityVault = new Object;
    for (channelDateKey in channelStats) {
        channelEntryId = channelId + "_" + channelDateKey;
        channelActivityVault[channelEntryId] = JSON.stringify(channelStats[channelDateKey]);
    }

    if (scrapingLoopFlag) {
        return channelActivityVault;
    } else {
        chrome.runtime.sendMessage({controllerCommand: "saveDataToStorage", content: JSON.stringify(channelActivityVault)});
    }
}

function scrapeTelegramChannelBirthday(taskId, url, scrapingLoopFlag) {
    if (scrapingLoopFlag) {
        pageUrl = url + "?p=" + subtaskPublic.currentSearchTask;
        channelId = subtaskPublic.currentSearchTask;
    } else {
        pageUrl = url;
        channelId = url.replace("https://web.telegram.org/#/im?p=", "");
    }

    channelInfo = Object();
    //obligatory
    channelInfo.taskId = taskId;
    channelInfo.pageUrl = pageUrl;
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

    channelActivityVault = Object();
    channelActivityVault[channelId] = JSON.stringify(channelInfo);

    if (scrapingLoopFlag) {
        return channelActivityVault;
    } else {
        chrome.runtime.sendMessage({controllerCommand: "saveDataToStorage", content: JSON.stringify(channelActivityVault)});
    }
}
