function scrapeTchannels(){
    channelsVault = new Object();

    $("div.botitem").each(function(){
        channel = new Object();

        channelId = "@" + $(this).attr("data-href").trim();

        channelName =  $(this).find("h3").find("a").html();
        channel.name = filterString(channelName);

        channelCategory = $(this).find(".cat").html();
        channel.category =  filterString(channelCategory);

        channelDescription = $(this).find(".description").html();
        channel.description = filterString(channelDescription);

        channelVotes = $(this).find(".rate").text().match(/\([0-9,]{1,}\)/gm)[0];
        channel.votes =  channelVotes.replace(/\(/gm, " ").replace(/\)/gm, " ").replace(/,/gm, "");

        channelRating = $(this).find(".stars").find("span").attr("style");
        channel.rating =  channelRating.replace(/(width:)/gm, " ").replace(/(%)/gm, " ").replace(/(\.)/gm, ",");

        channel.taskId = subtaskPublic.taskId;
        channel.pageUrl = subtaskPublic.currentPageUrl;
        channel.timestamp = String(Date.now());

        channelsVault[channelId] = JSON.stringify(channel);
    });

    return channelsVault;
}
