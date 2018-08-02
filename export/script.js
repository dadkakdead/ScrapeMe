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

function selectElementContents(el) {
        var body = document.body, range, sel;
        if (document.createRange && window.getSelection) {
            range = document.createRange();
            sel = window.getSelection();
            sel.removeAllRanges();
            try {
                range.selectNodeContents(el);
                sel.addRange(range);
            } catch (e) {
                range.selectNode(el);
                sel.addRange(range);
            }
        } else if (body.createTextRange) {
            range = body.createTextRange();
            range.moveToElementText(el);
            range.select();
        }
    }

function copyExportScreenContentToClipboard(){
    exportScreen = document.getElementById("exportTable"),
    selectElementContents(exportScreen);
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
                    entryBuffer += "<td>" + strFilter(entry[property]) + "</td>";
                    propertiesInBuffer += 1;
                    break;
                }
                if ((property === "taskId") && (propertiesInBuffer === 1)) {
                    entryBuffer += "<td>" + strFilter(entry[property]) + "</td>";
                    propertiesInBuffer += 1;
                    break;
                }
                if ((property !== "pageUrl") && (property !== "taskId") && (propertiesInBuffer > 1)) {
                    entryBuffer += "<td>" + strFilter(entry[property]) + "</td>";
                    propertiesInBuffer += 1;
                }
            }

        }
    }

    //VAULTS: output only statuses
    if ((dataType === "links") || (dataType === "searchTasks")) {
        for (var property in entry) {
            if (property === "status" || property === "tabId") {
                entryBuffer += "<td>" + strFilter(entry[property]) + "</td>";
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
            //first line in export stands for column titles
            itemProperties = {};
            for (var prop in items[Object.keys(items)[0]]) {
                itemProperties[prop] = prop;
            }
            keysBuffer += "<tr>" + "<td>" + "resultId" + "</td>" + exportEntry(dataType, itemProperties) + "</tr>";

            //then goes export result
            for (var key in items) {
                exportBuffer += "<tr>" + "<td>" + strFilter(key) + "</td>" + exportEntry(dataType, items[key]) + "</tr>";
            }

        document.getElementById("exportScreen").innerHTML = "<div style=\"overflow-x:auto;\"><table id=\"exportTable\">" + keysBuffer + exportBuffer + "</table></div>";
        }
    });
}
