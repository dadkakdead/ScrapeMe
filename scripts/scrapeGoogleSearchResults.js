function scrapeGoogleSearchResults(){
    var resultVault = new Object();

    resultId = String(Date.now());

    var resultInfo = new Object();

    resultInfo.searchQuery = ($("input.gsfi").length > 0) ? $("input.gsfi").first().val() : "";
    resultInfo.searchResults = ($("#resultStats").length > 0) ? $("#resultStats").text() : "";
    resultInfo.link = ($("cite.iUh30").length > 0) ? $("cite.iUh30").first().text() : "";

    if ($("#cnt").length > 0) {
        if ($("#cnt").text().indexOf("did not match any documents.") >= 0 || $("#cnt").text().indexOf("No results found for ") >= 0) {
            //Your search - "code review" site:<site> - did not match any documents.
            //No results found for "code review" site:<site>.
            resultInfo.anyResults = 0;
        } else {
            resultInfo.anyResults = 1;
        }
    } else {
        resultInfo.anyResults = 0;
    }

    resultInfo.taskId = subtaskPublic.taskId;
    resultInfo.pageUrl = subtaskPublic.currentPageUrl;

    resultVault[resultId] = JSON.stringify(resultInfo);

    return resultVault;
}

function scrapeGoogleSearchResults_getNextPageUrl(){
    return "https://" + subtaskPublic.rootPageHost + $("#pnnext").attr("href");
}
