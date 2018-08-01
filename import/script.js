//console.log("ntScraper: " + "cs_uploading is in!");

function uploadData(dataType){
    var pairsVault = new Object;
    var pairId = String("");
    var pairIdPrev = pairId;
    //split the string by newline character
    var pairs = $("body > pre").text().split("\n");
    //pai counter to identify first and last elements
    var pairCounter = 0;
    //iterate through lines
    for (pair of pairs) {
        //split the string by delimiter
        var pairSplit = pair.split("|");
        //if there is any text there
        if (pairSplit[0] !== ""){
            //refresh the buffer variables
            var pairInfo = new Object;

            pairIdPrev = pairId;
            pairId = String("");

            var parameterCounter = 0;
            //iterate through properties
            for (parameter of pairSplit){
                parameterTrimmed = String(parameter).trim();

                if (pairId.length === 0) {
                    if ((dataType === "searchTasks") || ((dataType === "links"))){ // && (String(parameter).indexOf("http") >= 0))){
                        pairId = parameterTrimmed
                        pairInfo["elem"] = parameterTrimmed;
                    }
                } else {
                    pairInfo["p" + String(parameterCounter)] = parameterTrimmed;
                    parameterCounter += 1;
                }
            }
            pairInfo["status"] = "waiting";
            pairInfo["tabId"] = "";

            //add references to neighbour element
            if (pairIdPrev.length > 0) {
                pairInfo["elemPrev"] = pairIdPrev;
                pairsVault[pairIdPrev]["elemNext"] = pairId;
            }
            //correct the references for corner elements
            if (pairIdPrev.length === 0) {
                pairInfo["elemPrev"] = "";
            }
            if (pairCounter === pairs.length - 1 - 1) {
                pairInfo["elemNext"] = "";
            }
            //add element to vault
            pairsVault[pairId] = pairInfo;
            pairCounter += 1;
        }
    }

    return pairsVault;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.controllerCommand === "uploadFromWebpage") {
        dataSet = uploadData(request.dataType);
        sendResponse({data: JSON.stringify(dataSet)});
    }
    return true;
 });
