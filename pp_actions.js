var updatePeriod = 100; //ms

document.addEventListener('DOMContentLoaded', function() {
	//folding/unfolding actions
	elements = document.getElementsByClassName("groupTitle");
	for (var i = 0; i < elements.length; i++) {
	    elements[i].addEventListener('click', function() {
			this.nextSibling.nextSibling.style.display = (this.nextSibling.nextSibling.style.display === "none" || this.nextSibling.nextSibling.style.display === "") ? "block" : "none";
		}, false);
	}

	elements = document.getElementsByClassName("scraperParameter");
	for (var i = 0; i < elements.length; i++) {
	    elements[i].addEventListener("change", function() {
			setScraperParameter(this.id);
		}, false);
	}

	//assign actions to buttons
	var btns = document.getElementsByClassName("action");
	for (var i = 0; i < btns.length; i++) {
	    btns[i].addEventListener("click", function() {
			if (this.getAttribute("taskName") !== null) {
				sendTaskToBackgroundController({controllerCommand: "initTask", taskName: this.getAttribute("taskName")});
			} else {
				sendTaskToBackgroundController({controllerCommand: this.getAttribute("controllerCommand"), dataType: this.getAttribute("dataType")});
			}
		});
	}

	//messaging FOR TESTING only
	var btns = document.getElementsByClassName("notification");
	for (var i = 0; i < btns.length; i++) {
	    btns[i].addEventListener("click", function() {
			sendTaskToBackgroundController({controllerCommand: "notifyAdministrator", status: this.getAttribute("status")});
		});
	}

	//export utility
	document.getElementById("export").addEventListener('click', exportToWebpage);

	//infinite loop to update storage status
	setInterval(function() {
		updateScraperParameters();
	}, updatePeriod);
});

//---------- MONITORING ---------
function updateScraperParameters(){
	chrome.runtime.sendMessage({controllerCommand: "retrieveScraperParameters"}, function(response) {
		if (response.status === "done") {
			document.getElementById("cacheSize").innerHTML = String(response.exportListLength) + " records";

			document.getElementById("cachePersistence").checked = Boolean(response.cachePersistence === "active");

			document.getElementById("investigationStatus").checked = Boolean(response.investigationStatus === "active");

			document.getElementById("inventSelectorStatus").checked = Boolean(response.inventSelectorStatus === "active");

			document.getElementById("incognitoMode").checked = Boolean(response.incognitoMode === "active");

			linksVaultStats = response.vaultStatistics["linksVault"];
			document.getElementById("linksVaultSize").innerHTML = String(linksVaultStats.listLength) + " records, " + String(linksVaultStats.waitingLength) + " waiting";

			searchTasksVaultStats = response.vaultStatistics["searchTasksVault"]
			document.getElementById("searchTasksVaultSize").innerHTML = String(searchTasksVaultStats.listLength) + " records, " + String(searchTasksVaultStats.waitingLength) + " waiting";
		}
	});
}

//---------- SETTINGS ---------
function setScraperParameter(parameterId) {
	status = (document.getElementById(parameterId).checked == true) ? "active" : "disabled";
	chrome.runtime.sendMessage({controllerCommand: "setScraperParameter", parameter: parameterId, status: status});
}

//---------- SCRAPING ----------
function sendTaskToBackgroundController(task) {
	chrome.runtime.sendMessage(task, function(response) {
		if (task.hasOwnProperty("taskName")) {
			window.close();
		}
	});
}

//---------- EXPORT ---------
function exportToWebpage() {
	chrome.runtime.sendMessage({controllerCommand: "exportScrapingResults"});
}
