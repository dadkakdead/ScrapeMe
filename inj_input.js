window.addEventListener("setInputValueCsInj", setInputValueCsInj, false);
window.addEventListener("setInputValueInjInj", setInputValueCsInj, false);

function copyContentToClipboard(elementId) {
    range = document.createRange();

    exportScreen = document.getElementById(elementId);
    range.selectNode(exportScreen);

    window.getSelection().addRange(range);

    document.execCommand('copy');
}

function setInputValueCsInj(evtIn) {
    var selector = evtIn.detail.selector;
    var typingDirection = evtIn.detail.typingDirection;
    var textToType = evtIn.detail.textToType;
    var textToTypeClean = evtIn.detail.textToTypeClean;

    //type one more symbol
    var e = document.querySelector(selector);
    if (typingDirection === "forward") {
        e.value = textToType.substring(0, Math.min($(selector).val().length + 1, textToType.length));
    }
    if (typingDirection === "backward") {
        e.value = textToType.substring(0, Math.max($(selector).val().length - 1, 0));
    }
    var $e = angular.element(e);
    $e.triggerHandler('input');

    //check the status
    if (String($(selector).val()) === String(textToTypeClean.substring(0, $(selector).val().length))) {
        if ($(selector).val().length === textToTypeClean.length) {
            evtName = "setInputValueInjCs";
            setInputValueStatus =  "finished";
            delay = 50;
        } else {
            evtName = "setInputValueInjInj";
            setInputValueStatus =  "in progress";
            typingDirection = "forward";

            if (Math.random() <= 0.8) {
                delay = Math.max(Math.random() * 400, 100)
            } else {
                delay = Math.max(Math.random() * 1200, 400)
            }
        }
    } else {
        evtName = "setInputValueInjInj";
        setInputValueStatus =  "in progress";
        typingDirection = "backward";
        textToType = evtIn.detail.textToTypeClean;

        if (Math.random() <= 0.85) {
            delay = Math.max(Math.random() * 700, 200)
        } else {
            delay = Math.max(Math.random() * 1200, 700)
        }
    }

    //go to next step
    setTimeout(function() {
        var evtOut = new CustomEvent(
            evtName, {
                detail: {
                    communicationRegime: evtIn.detail.communicationRegime,
                    status: setInputValueStatus,
                    selector: selector,
                    typingDirection: typingDirection,
                    textTyped: $(selector).val(),
                    textToType: textToType,
                    textToTypeClean: evtIn.detail.textToTypeClean,
                    bubbles: true,
                    cancelable: true
                }
            }
        );
        window.dispatchEvent(evtOut);
    }, delay);
}

window.addEventListener("reachReact", reactTesting, false);

function reactTesting(){
    fastloop = window.setInterval(function() {
        //$("div._24tx").trigger("mousewheel", {intDelta:0, deltaX:0, deltaY:0});

        var e = jQuery.Event( "DOMMouseScroll",{delta: 50} );
        jQuery("div._24tx").trigger( e );
    }, 100);
}
