// gecko and  webkit
// details here https://developer.mozilla.org/en-US/docs/DOM/event.initKeyEvent



/* a better way */

function fireKey(el,key)
{
    if(document.createEventObject)
    {
        var eventObj = document.createEventObject();
        eventObj.keyCode = key;
        el.fireEvent("onkeydown", eventObj);
        eventObj.keyCode = key;
    } else if(document.createEvent)
    {
        var eventObj = document.createEvent("Events");
        eventObj.initEvent("keydown", true, true);
        eventObj.which = key;
        eventObj.keyCode = key;
        el.dispatchEvent(eventObj);
    }
}

//useful keyCodes
// left: 37
// up : 38
// right : 39
// down : 40
// ENTER : 13
