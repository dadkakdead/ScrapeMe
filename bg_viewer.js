var delimiter = "|";

document.addEventListener('DOMContentLoaded', function () {
    var btns = document.getElementsByClassName("visualizeStorage");

	for (var i = 0; i < btns.length; i++) {
        btns[i].addEventListener('click', function(){
			exportStorage(this.getAttribute("dataType"));
		});
	}

    document.getElementById("copyVisibleToClipboard").addEventListener('click', copyExportScreenContentToClipboard);
});

function copyExportScreenContentToClipboard(){
    range = document.createRange();

    exportScreen = document.getElementById("exportScreen"),
    range.selectNode(exportScreen);

    window.getSelection().addRange(range);

    document.execCommand('copy');
}

function strFilter(str){
    if (str !== undefined) {
        str = String(str).replace(/\|/gm, "");
        str = String(str).trim();
    } else {
        str = "unknown";
    }
    return str;
}

function exportEntry(dataType, entry) {
    var entryBuffer = String();

    //SCRAPING RESULTS: start from pageUrl & taskId to simplify filtering in excel
    if (dataType === "scrapingResults") {
        var propertiesAll = Object.keys(entry).length;
        var propertiesInBuffer = 0;

        while (propertiesInBuffer < propertiesAll) {
            for (var property in entry) {
                if ((property === "pageUrl") && (propertiesInBuffer === 0)) {
                    entryBuffer += strFilter(entry[property]) + delimiter;
                    propertiesInBuffer += 1;
                    break;
                }
                if ((property === "taskId") && (propertiesInBuffer === 1)) {
                    entryBuffer += strFilter(entry[property]) + delimiter;
                    propertiesInBuffer += 1;
                    break;
                }
                if ((property !== "pageUrl") && (property !== "taskId") && (propertiesInBuffer > 1)) {
                    entryBuffer += strFilter(entry[property]) + delimiter;
                    propertiesInBuffer += 1;
                }
            }

        }
    }

    //VAULTS: output only statuses
    if ((dataType === "links") || (dataType === "searchTasks")) {
        for (var property in entry) {
            if (property === "status" || property === "tabId") {
                entryBuffer += strFilter(entry[property]) + delimiter;
            }
        }
    }

    return entryBuffer;
}

var exportBuffer = String();
var keysBuffer = String();

var dataVaultId = String();
var storageQuery;

var items = new Object();
var itemProperties = new Object();

function exportStorage(dataType) {
    exportBuffer = "";
    keysBuffer = "";
    dataVaultId = "";
    storageQuery = null;

    //calm the user; it can take much time concatenating all the results
    document.getElementById("exportScreen").innerHTML = "Loading... This may take a while.";
    //choose the query parameters
    switch (dataType) {
        case "scrapingResults":
            storageQuery = null;
            break;
        default:
            dataVaultId = dataType + "Vault";
            storageQuery = [dataVaultId];
            break;
    }

    //query the storage data
    chrome.storage.local.get(storageQuery, function(storageResponse) {
        items = {};

        //parse the storage entries
        switch (dataType) {
            case "scrapingResults":
                for (var key in storageResponse) {
                    if ((key !== "undefined") && (key !== "scraperParameters") && (key !== "linksVault") && (key !== "searchTasksVault") && (key !== "workersVault")) {
                    items[key] = JSON.parse(storageResponse[key]);
                }
                }
                break;
            default:
                dataVaultId = dataType + "Vault";
                items = JSON.parse(storageResponse[dataVaultId]);
                break;
        }

        if (Object.keys(items).length > 0) {
            itemProperties = {};
            for (var prop in items[Object.keys(items)[0]]) {
                itemProperties[prop] = prop;
            }
            keysBuffer += "resultId" + delimiter + exportEntry(dataType, itemProperties) + "<br>";

        for (var key in items) {
                exportBuffer += strFilter(key) + delimiter + exportEntry(dataType, items[key]) + "<br>";
            }

        document.getElementById("exportScreen").innerHTML = keysBuffer + exportBuffer;
        }
    });
}
