//status notifications via Telegram Bot API (create group, create bot, add bot as administrator, get chat id - go)
function notifyAdministrator(tabId, status){
    message = "";
    task = getWkr(tabId);

    if (task !== null) {
        time = dateFormat(Date.now(), "HH:MM:ss");

        cId = "";

        switch (status) {
            case "started":
                message = "Task <" + task.taskName + "> started at " + time;
                break;

            case "finishedOk":
                message = "Task <" + task.taskName + "> finished at " + time;
                break;

            case "finishedError":
                message = "Task <" + task.taskName + "> finished with error at " + time;
                break;

            case "restarted":
                message = "Task <" + task.taskName + "> restarted at " + time;
                break;
        }

        /*
        //<data> is missing on the next line
        url = "https://api.telegram.org/bot<data>:<data>/sendMessage?chat_id=<data>&text=" + String(cId + " " + message);

        xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                console.log("Notification sending is complete");
            }
        }

        xhr.send();
        */
    }
}
