function scrapeTlgrm(){
    channelsVault = new Object();

    $("div.channel-card").each(function(){
        channel = new Object();

        channelId = $(this).find(".channel-card__username").text().replace(/[\r\n]/g, "").trim();

        channel.name = $(this).find(".channel-card__title").text().replace(/[\r\n]/g, "").trim();
        channel.size = $(this).find(".channel-card__subscribers").text().replace(/[\r\n]/g, "").trim();
        channel.description = filterString($(this).find("div.channel-card__description").text());


        channel.taskId = subtaskPublic.taskId;
        channel.pageUrl = subtaskPublic.currentPageUrl;
        channel.timestamp = String(Date.now());

        channelsVault[channelId] = JSON.stringify(channel);
    });
    console.log(channelsVault);
    return channelsVault;
}
