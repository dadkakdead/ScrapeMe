function scrapeTsearch() {
    channelsVault = new Object();

    $("div.media.heading-divided").each(function(){
        channel = new Object;

        channelId = "@" + $(this).find("div.media-body a:first").attr("href").trim().replace("/channel/", "");

        channel.name = $(this).find("div.media-body a:first").text();
        channel.size = $(this).find("div.media-body > div.media-annotation span").text().trim();
        channel.description = $(this).find("div.media-body > div.text-size-small").text();

        channel.taskId = subtaskPublic.taskId;
        channel.pageUrl = subtaskPublic.currentPageUrl;
        channel.timestamp = String(Date.now());

        channelsVault[channelId] = JSON.stringify(channel);
    });

    return channelsVault;
}

function scrapeTsearchResults() {
    var channelsVault = new Object();

    $("ul.search-results-list li.media").each(function() {
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

    return channelsVault;
}

function scrapeTsearch_getNextPageUrl(){
    if ($("ul.pager > li.next > a").length > 0) {
        return "http://" + subtaskPublic.rootPageHost + $("ul.pager > li.next > a").attr("href");
    }
}
