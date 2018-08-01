var bufferTask = new Task();

var taskNames = ["scrapeGoogleSearchResults",
                 "scrapeTsearch",
                 "scrapeTchannels",
                 "scrapeTlgrm",
                 "scrapeTelegramChannels",
                 "clearCache"];

function tasksManager(taskName) {
    bufferTask = new Task();

    switch(taskName) {
        case "scrapeGoogleSearchResults":
            bufferTask = new Task({taskName: taskName, rootPageHost: "google.com", rootPageSubref: "/search?newwindow=1&dcr=0&source=hp&q=start&gws_rd=ssl", targetPages: "rootPageOnly"});
            bufferTask.addSubtask({purpose: "navigation", action: "wait", description: {duration: 1000}});
            bufferTask.addSubtask({purpose: "navigation", action: "setInputValue", description: {selector: "input.gsfi", source: "searchTasks", textPrefix: "", textSuffix: " official website"}});
            bufferTask.addSubtask({purpose: "navigation", action: "click", causesReload: true, stepMinimumLength: 200, description: {selector: "button.sbico-c"}});
            bufferTask.addSubtask({purpose: "navigation", action: "wait", description: {duration: 5000}});
            bufferTask.addSubtask({purpose: "scraping", action: "save"});
            break;

        case "scrapeTsearch":
            bufferTask = new Task({taskName: taskName, rootPageHost: "tsear.ch", rootPageSubref: "/list/ru/", pageUrlPrefix: "http://", freezeLimit: 300000}); //max: 5 minutes freeze
            bufferTask.addSubtask({purpose: "scraping", action: "save", paginationRegime: "multiplePages"});
            break;

        case "scrapeTchannels":
            bufferTask = new Task({taskName: taskName, rootPageHost: "tchannels.me", targetPages: "vaultPages", pageUrlPrefix: "", freezeLimit: 300000}); //max: 5 minutes freeze
            bufferTask.addSubtask({purpose: "scraping", action: "scroll"});
            break;

        case "scrapeTlgrm":
            bufferTask = new Task({taskName: taskName, rootPageHost: "tlgrm.ru", targetPages: "vaultPages", pageUrlPrefix: "", freezeLimit: 300000}); //max: 5 minutes freeze
            bufferTask.addSubtask({purpose: "navigation", action: "scroll", description: {regime: "toTheEnd", duration: 100, period: 50, step: 100}});
            bufferTask.addSubtask({purpose: "scraping", action: "save"});
            break;

        case "scrapeTelegramChannels":
            bufferTask = new Task({taskName: taskName, rootPageHost: "web.telegram.org", rootPageSubref: "/#/im"});
            //1. type the channel id
            bufferTask.addSubtask({purpose: "navigation", action: "check", description: {duration: 10000, property: "presence", selector: "input.im_dialogs_search_field"}});
            bufferTask.addSubtask({purpose: "navigation", action: "setInputValue", description: {selector: "input.im_dialogs_search_field", inputApproach: "injectedScript"}});
            //2. check there is no errore
            //bufferTask.addSubtask({purpose: "navigation", action: "check", errorHandling: "superhard", description: {duration: 3000, property: "presence", selector: "div.error_modal_wrap", happenMode: "bad"}});
            //3. check the channel is found, if yes - select it
            bufferTask.addSubtask({purpose: "navigation", action: "check", description: {duration: 10000, property: "presence", selector: "div.im_dialogs_contacts_wrap:not('.ng-hide') ul > li:first span.im_dialog_message_text"}});
            bufferTask.addSubtask({purpose: "navigation", action: "check", description: {duration: 10000, property: "content", selector: "div.im_dialogs_contacts_wrap:not('.ng-hide') ul > li:first span.im_dialog_message_text", containsSource: "searchTasks"}});
            bufferTask.addSubtask({purpose: "navigation", action: "click", description: {selector: "div.im_dialogs_contacts_wrap:not('.ng-hide') ul > li:first > a.im_dialog", jQueryStyle: false, mouseEvent: "mousedown"}});
            //4. wait until client switches to that channel
            bufferTask.addSubtask({purpose: "navigation", action: "wait", description: {duration: 250}});
            //5. check it is channel, channel has members there
            bufferTask.addSubtask({purpose: "navigation", action: "check", description: {duration: 10000, property: "content", selector: "div.tg_head_peer_title_wrap span.tg_head_peer_status span:first", containsText: "subscriber"}});
            bufferTask.addSubtask({purpose: "navigation", action: "check", description: {duration: 10000, property: "presence", selector: "div.im_history_messages_peer:not('.ng-hide') div.im_history_message_wrap, div.im_history_messages_peer:not('.ng-hide') div.im_service_message"}});
            //6. scroll to bottom (you might find yourself in the middle of chat)
            bufferTask.addSubtask({purpose: "navigation", action: "scroll", description: {regime: "toTheEnd", approach: "modern", approachSelector: "div.im_history_scrollable_wrap.nano-content", step: 100, period: 40, selector: "", checkLimit: 50}});
            //7. start scrolling the history up to load more and more messages
            bufferTask.addSubtask({purpose: "navigation", action: "scroll", description: {regime: "toTheEnd", approach: "modern", approachSelector: "div.im_history_scrollable_wrap.nano-content", step: -200, period: 20, selector: "", checkLimit: 50, showStopper: "fullChannel"}}); // showStopper can also be "fullChannel"
            //8. save comprehensive statistics about messages history
            bufferTask.addSubtask({purpose: "scraping", action: "save"});
            break;

        case "clearCache":
            //do nothing
            break;
    }

    return bufferTask;
}
