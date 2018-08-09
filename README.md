### What is ntScraper? ###

**ntScraper** is a Chrome extension for [web scraping]. With its help, you can automate data extraction from dynamic websites or web applications and export the data to a CSV file.

[web scraping]: <https://en.wikipedia.org/wiki/Web_scraping>

---

### Main features ###
- Import URLs or search queries
- Replay sequences of browsing actions
- Simulate user input (e.g. clicking, scrolling, typing)
- Extract page data with jQuery selectors 
- Export scraping results to CSV files
- Simultaneously execute multiple data extraction jobs

![ntScraper-demo](https://github.com/devrazdev/ntScraper/raw/master/misc/demo.gif)

### Yet another tool? ###
> "Tools and frameworks come and go. Choose the one that fits the job." [ESTP course on automated collection of online prices. "Web scraping tools: An introduction." 2017.]

Scraping tools exist in almost [every programming language], but there is still a demand for tools that require "less coding," (like [import.io](https://www.import.io/)). Here are some of the more popular “no coding” tools among Chrome extensions:

1. [Web Scraper](https://www.webscraper.io/) project on [GitHub](https://github.com/martinsbalodis/web-scraper-chrome-extension/)
2. [David Heaton's "Scraper"](https://chrome.google.com/webstore/detail/scraper/mbigbapnjcgaffohmbkdlecaccepngjd) on [GitHub](https://github.com/mnmldave/scraper)
3. [Helena](http://helena-lang.org/) project by Berkley university on [GitHub](<https://github.com/schasins/helena>)

However, these extensions can perform complex data extractions only if their cores are modified. **ntScraper** was created to minimize the number of parameters required for a scraping task and therefore simplify the process of complex data extractions. 

I have used **ntScraper** for over 100 scraping assignments of all major social networking websites (e.g. Facebook, LinkedIn) and several different web applications (e.g. JIRA, Telegram Web Client.) The assignments were all solved using the same core. It might be the case that **ntScraper** can help you also. However, the learning curve is pretty steep and requires a good understanding of JavaScript.

[ESTP course on automated collection of online prices. "Web scraping tools: An introduction." 2017.]: <https://circabc.europa.eu/sd/a/20d545f1-6c94-4077-9c5b-1b2178be13a1/2_Big%20Data%20Sources%20part3-Day%201-B%20Tools.pptx>
[any programming language]: <https://github.com/BruceDone/awesome-crawler>
[huge number]: <https://github.com/lorien/awesome-web-scraping/blob/master/javascript.md>

### Example of a problem solved with ntScraper (easy) ###
Task: Extract the names of Telegram channels from [tlgrm.ru] catalog. 

Background: The list of channels is partially loaded by default. Fully loading the list requires scrolling all the way down until new channels stop loading, like in Instagram. Once all the channels are loaded, their names can be easily scraped.

Actions (assuming the scraping script is ready): 
- Step 1: Import the list of URLs (may be collected manually)
- Step 2: Start ntScraper and add scraping threads
- Step 3: Export the results

Result: A list of the channel names and their IDs.

[tlgrm.ru]: <https://tlgrm.ru/channels/>



### Example of a problem solved with ntScraper (hard) ###

Task: Extract the creation dates of Telegram channels.

Background: The creation dates can be found in the first messages of the channel threads. There are many ways to access the channel threads, ranging from [command line interface] to [web] interface. In this example, we will use the web interface of the [official Telegram Web Client]. First, we search for the channel. Second, we scroll up to the beginning of the thread. Finally, we extract the creation date.

Actions:	
- Step 1: Import the list of channel IDs (can be taken from the first example)
- Step 2: Start the ntScraper
- Step 3: Export the results

Result: A list of channel names and their creation dates

[command line interface]: <https://github.com/vysheng/tg>
[web interface]: <https://github.com/GetGems/Web-client>
[official Telegram web client]: https://web.telegram.org/#/im


### Short lesson on jQuery selectors ###
iQuery selectors work well as long as the data that will be scraped is on a single page. Tasks of any higher complexity (e.g. pagination, dynamic pages, CAPTCHA, searching with parameters) are more quickly solved with scraping tools.

**Example: Look at the [Craigslist page with used Triumph motorcycles] and determine their average price **

1. Open the page in a browser, right-click any price badge, and select “Inspect.” The HTML for each price badge is displayed in a single row like this:
    ```html
        <span class="result-price">$5000</span>
```

You can select all price badges with jQuery like this:
    ```javascript
        $(“span.result-rom”)
```


2. Mention that "local" results precede the disclaimer
    ```html
    <h4 class="ban nearby">
        <span class="bantext">Few local results found. Here are some from nearby areas. Checking 'include nearby areas' will expand your search.</span>
    </h4>
    ```
3. Now we go to console and do 3 things:
    a. Inject jQuery (for shorter selectors)
    ```javascript
	var jq = document.createElement('script');
	jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js";
	document.getElementsByTagName('head')[0].appendChild(jq);
    ```
    b. Prevent conflicts with other libraries
    ```javascript
    var jq = $.noConflict();
    ```
    c. Calculate the average price
    ```javascript
    var sum = 0
    jq("h4.ban.nearby").prevAll().each(function(){
    	sum += parseInt($(this).find("span.result-price:eq(0)").text().replace("$","")); 
    });
    console.log(Math.round(sum / jq("h4.ban.nearby").prevAll().length));
    ```
4. Ok, so today's average price is **$6167**. 

[craigslist page with used Triumph motorcycles]: <https://sfbay.craigslist.org/search/mca?query=triumph&sort=rel&srchType=T&hasPic=1&condition=30&condition=40>

---

## Developers corner ##

### How to ### 
- [Install ntScraper](https://www.google.com/search?q=chrome+install+unpacked+extension)

### How to add my task to ntScraper? ###
1. Come up with a short task name, like *myTask*.

2. Create a button to run it by pasting a piece of HTML to "/control-panel/index.html"
```html
<div class="group">
	<h3 class="groupTitle">My title</h3>
        <ul class="groupButtons">
                <li><button class="action" taskName="myTask">My task name</button></li>
        </ul>
</div>
```

3. Add the name of your task to *taskNames* in "/tasks/tasks.js"
```javascript
var taskNames = ["...",
                 "...",
                 "myTask"];
```

4. Describe your task in the *taskManager* function in "/tasks/tasks.js". For example, lines below correspond to the simple task of scraping https://mysite.com/page/1 upon it's loading. Copy-paste the snippet to the the switch-case.
```javascript
case "myTask":
	bufferTask = new Task({taskName: taskName, rootPageHost: "mysite.com", rootPageSubref: "/page/1/"});
        	bufferTask.addSubtask({purpose: "scraping", action: "save"});
            	break;
```

5. Create a "myTask.js" file in the "/scripts/" folder. Minimum required content is:
```javascript
function myTask() {
    var myData = new Object();
    
    var myRecord = new Object();
    myRecordId = "myId";
    
    myRecord.taskId = subtaskPublic.taskId;
    myRecord.pageUrl = subtaskPublic.currentPageUrl;
    myRecord.timestamp = String(Date.now());

    myData[myRecordId] = JSON.stringify(myRecord);
    
    return myData;
}
```
*myTask* function will run upon loading of https://mysite.com/page/1. *myData* is usually used to hold the structured content of the scraped page. *taskId*, *pageUrl* and *timestamp* properties are required by controller to manage the export data.

6. Add "myTask.js" to the list of content-scripts in "manifest.json"
```json
"content_scripts": [{
        ...
        "js": [
            ...
            "/scripts/myTask.js",
	    ...
        ],
	...
    }],
``` 
7. Reload the extension and try to run the task. Expected behavior: when you click the "My task name" button, your browser opens new window, goes to https://mysite.com/page/1, *myTask()* function gets executed on the background, then window closes. **ntScraper** writes a data point to it's cache, which you can check by going to Export page and clicking "Show scraping cache".

To debug the scraper, check the logs in the console of the extension's background page and in the scraped page itself.

## Farewell ##
I would be happy to hear any feedback/news about how you use **ntOrgchart** in real life. Feel free to email me at devrazdev@gmail.com. Thank you.

### P.S. ###
Please never try to [automate Internet Explorer by writing VBA macroses in Microsoft Excel].

