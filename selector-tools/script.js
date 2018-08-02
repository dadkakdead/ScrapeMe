var s1 = document.createElement('script');
s1.src = chrome.extension.getURL('/selector-tools/copy_injected.js');
s1.onload = function() {
    s1.remove();
};
(document.head || document.documentElement).appendChild(s1);

var s2 = document.createElement('script');
s2.src = chrome.extension.getURL('/third-party/jquery-3.1.1.min.js');
s2.onload = function() {
    s2.remove();
};
(document.head || document.documentElement).appendChild(s2);

// appended with delay
document.addEventListener('DOMContentLoaded', function() {
    $("body").append("<div id=\"candidateHTML\"></div>");
    $("body").append("<div id=\"candidateZone\"></div>");
    $("body").append("<div id=\"candidateZoneControl\"></div>");

    $("body").append("<div id=\"selectorHTML\"><input id=\"selectorBox\"><button id=\"selectorButton\" onclick=\"copyContentToClipboard('candidateHTML')\">copy</button></div>");
});

//since the state is very simple we store it as two boolean variables
var investigationStatus = "disabled";
var inventSelectorStatus = "disabled";

var currentCursorPosition = Object()

var topLeftCornerSet = false;
var topLeftCorner = Object();

var bottomRightCornerSet = false;
var bottomRightCorner = Object();

var readyForNewSelectionFlag = false;

//UI parameters
var mediumOpacity = 0.4;
var controlWidth = "15px";
var controlHeight = "15px";

var selectorLoop;

var previousSelector;
var currentSelector;
var contentBuffer;

//track mouse positions
$(document).mousemove(function(event) {
    currentCursorPosition.x = event.pageX;
    currentCursorPosition.y = event.pageY;

    if (topLeftCornerSet === true && bottomRightCornerSet === false) {
        //decide upon width
        zoneWidth = currentCursorPosition.x - topLeftCorner.x;
        leftBorderX = (zoneWidth > 0) ? topLeftCorner.x : currentCursorPosition.x;
        $("#candidateZone").css("left", String(leftBorderX) + "px");
        $("#candidateZone").width(String(Math.abs(zoneWidth)) + "px");

        //decide upon height
        zoneHeight = currentCursorPosition.y - topLeftCorner.y;
        bottomBorderY = (zoneHeight > 0) ? topLeftCorner.y : currentCursorPosition.y;
        $("#candidateZone").css("top", String(bottomBorderY) + "px");
        $("#candidateZone").height(String(Math.abs(zoneHeight)) + "px");
    }
});

//track mouse clicks
$(document).click(function(event) {
    var clickToIgnore = Boolean($(event.target).is("a") || $(event.target).is("button"));

    if (((investigationStatus === "active") && (inventSelectorStatus === "disabled")) && (clickToIgnore === false)) {
        //after first click zone gets initialized
        if (readyForNewSelectionFlag === false){
            readyForNewSelectionFlag = true;
            return;
        }

        //after second click zone starts to stretch following the pointer position
        if (topLeftCornerSet === false && bottomRightCornerSet === false && readyForNewSelectionFlag === true){
            $("#candidateHTML").html("");

            topLeftCorner.x = currentCursorPosition.x;
            topLeftCorner.y = currentCursorPosition.y;
            topLeftCornerSet = true;

            //start stretching again
            $("#candidateZone").width(0);
            $("#candidateZone").height(0);

            //set top left corner position
            $("#candidateZone").css("left", topLeftCorner.x + "px");
            $("#candidateZone").css("top", topLeftCorner.y + "px");

            //show the stretching zone
            $("#candidateZone").css("opacity", mediumOpacity);
            return;
        }

        //after third click zone freezes in size and we look for all elements fully inside it
        if (topLeftCornerSet == true && bottomRightCornerSet == false) {
            bottomRightCorner.x = currentCursorPosition.x;
            bottomRightCorner.y = currentCursorPosition.y;
            bottomRightCornerSet = true;

            //convert coordinates of two corners "top left" "bottom right"
            var topLeftCornerAbs = Object();
            var bottomRightCornerAbs = Object();
            topLeftCornerAbs.x = Math.min(topLeftCorner.x, bottomRightCorner.x);
            topLeftCornerAbs.y = Math.min(topLeftCorner.y, bottomRightCorner.y);
            bottomRightCornerAbs.x = Math.max(topLeftCorner.x, bottomRightCorner.x);
            bottomRightCornerAbs.y = Math.max(topLeftCorner.y, bottomRightCorner.y);

            //position "close" button and make it visible
            $("#candidateZoneControl").css("left", String(bottomRightCornerAbs.x - $("#candidateZoneControl").width()/2) + "px");
            $("#candidateZoneControl").css("top", String(topLeftCornerAbs.y - $("#candidateZoneControl").height()/2) + "px");

            $("#candidateZoneControl").css("opacity", 1.0);

            //find the element with maximum text (assumed to be the parent element) and outbut it's markup
            var maxMarkupVolume = 0
            $("*").each(function(){
                if (($(this).offset().left > topLeftCornerAbs.x) &&
                    ($(this).offset().top > topLeftCornerAbs.y) &&
                    (($(this).offset().left + $(this).width()) < bottomRightCornerAbs.x) &&
                    (($(this).offset().top + $(this).height()) < bottomRightCornerAbs.y)) {

                    givenMarkupVolume = String($(this)[0].outerHTML).length;

                    if (givenMarkupVolume > maxMarkupVolume) {
                        maxMarkupVolume = givenMarkupVolume;
                        $("#candidateHTML").text($(this)[0].outerHTML);
                    }
                }
            });

            //make infowindow intransparent for convenience
            $("#candidateHTML").css("opacity", 1.0);
            return;
        }
    }
});

function showInvestigationScreen(){
    $("#candidateHTML, #candidateZone, #candidateZoneControl").show();

    $("#candidateZoneControl").width(controlWidth);
    $("#candidateZoneControl").height(controlHeight);

    $("#candidateZoneControl").click(function() {
        //hide all shapes related to candidate zone and empty their content
        $("#candidateZone").css("opacity", 0);
        $("#candidateZone").text("");

        $("#candidateZoneControl").css("opacity", 0);

        $("#candidateHTML").text("");

        //get ready for new selection
        topLeftCornerSet = false;
        bottomRightCornerSet = false;
        readyForNewSelectionFlag = false;
    });

    //set initial selection parameters
    topLeftCornerSet = false;
    bottomRightCornerSet = false;
    readyForNewSelectionFlag = true;

    //add "link visualization" behavior for every link on page
    $("a, button").on("click.myDisabled", function() {
        //save links address to infowindow
        if ($("#candidateHTML").html().length > 0) {
            $("#candidateHTML").html($("#candidateHTML").html() + "<br>");
        }
        $("#candidateHTML").html($("#candidateHTML").html() + $(this).attr("href"));
    });
}

function hideInvestigationScreen(){
    //remove UI
    $("#candidateHTML, #candidateZone, #candidateZoneControl").hide();

    //revert to natural links behavior
    $("a, button").off("click.myDisabled");

    hideInventSelectorScreen();
}

previousCountValue = 0;
currentCountValue = 0;

function showInventSelectorScreen(selectorPreset){
    $("#candidateHTML").addClass("inventSelectorOn");
    $("#selectorHTML").show();

    $("#candidateZone, #candidateZoneControl").hide();

    previousSelector = "";
    currentSelector = "";
    contentBuffer = "";

     $("#selectorBox").val(selectorPreset);

    selectorLoop = window.setInterval(function() {
        previousSelector = currentSelector;
        currentSelector = $("#selectorBox").val();

        if (currentSelector !== previousSelector) {
            previousCountValue = 0;
            $(".selectorMatchedElement").removeClass("selectorMatchedElement");

            contentBuffer = "";
            $(currentSelector).each(function() {
                $(this).addClass("selectorMatchedElement");
                contentBuffer = contentBuffer + $(this).text() + "<br>";
            });
        }

        currentTime = dateFormat(Date.now(), "dddd, mmmm dS, yyyy, h:MM:ss TT");

        /*currentCountValue = $("div.im_history_messages_peer:not('.ng-hide')").find("div.im_history_message_wrap").length;;
        if (currentCountValue > previousCountValue) {
            console.log("ntScraper Log: " + currentSelector + "|" + currentCountValue + "|" + Date.now())
            previousCountValue = currentCountValue;
        }*/
        $("#candidateHTML").html(currentTime + "<br>" + "selector: " + currentSelector + "<br>" +  "n elements: " + $(currentSelector).length + "<br>" + contentBuffer);
    }, 300);
}

function hideInventSelectorScreen(){
    $("#candidateHTML").removeClass("inventSelectorOn");
    $("#selectorHTML").hide();

    $("#candidateZone, #candidateZoneControl").show();

    previousSelector = "";
    currentSelector = "";
    contentBuffer = "";

    window.clearInterval(selectorLoop);

    $(".selectorMatchedElement").removeClass("selectorMatchedElement");

    $("#candidateHTML").html("");
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.controllerCommand === "switchInvestigation") {
        //stage 1: switch investigation area or not
        investigationStatus = request.state.investigationStatus;

        switch (investigationStatus) {
            case "active":
                showInvestigationScreen();
                break;

            case "disabled":
                hideInvestigationScreen();
                break;
        }

        //stage 2: switch input are for selectors or not
        if (investigationStatus === "active") {
            inventSelectorStatus = request.state.inventSelectorStatus;

            switch (inventSelectorStatus) {
                case "active":
                    showInventSelectorScreen(request.state.inventSelectorValue);
                    break;

                case "disabled":
                    hideInventSelectorScreen();
                break;
            }
        }
    }
    return true;
});
