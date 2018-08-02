### What is ChromeBot? ###

**ChromeBot** is a Chrome extension for [web scraping]. With it's help you can automate data extraction from dynamic websites or web applications and export data to CSV file.

[web scraping]: <https://en.wikipedia.org/wiki/Web_scraping>

---

### Yet another tool? ###
> "Tools and frameworks come and go, choose the one that fits the job." [ESTP course on Automated collection of online prices, "Web scraping tools, an introduction", 2017]

Scraping tools exist in almost [any programming language] with [huge number] of particular libraries for JavaScript, but there is still a demand for "less coding" ones (like [import.io](https://www.import.io/)). It is natural to search for such "no coding" tools among Chrome Extensions, so here are some of the most noticeble:

1. [Web Scraper](https://www.webscraper.io/) project on [GitHub](https://github.com/martinsbalodis/web-scraper-chrome-extension/)
2. [David Heaton's "Scraper"](https://chrome.google.com/webstore/detail/scraper/mbigbapnjcgaffohmbkdlecaccepngjd) on [GitHub](https://github.com/mnmldave/scraper)
3. [Helena](http://helena-lang.org/) project by Berkley university on [GitHub](<https://github.com/schasins/helena>)

However, solving complex data extraction problems with them still requires modifying their core logic. **ChromeBot** was created in the attempt to research the minimum acceptable complexity for such an extension(=minimum number of parameters for a scraping task).

My experience with **ChromeBot** includes 100+ scraping assignments for all major social networking web sites (Facebook, LinkedIn, etc.) and many different web applications (JIRA, Telegram web client, etc.), all solved with the same core. It's then very likely that it presents a good infrastructure layer for your client-side scraping assignments too.

[ESTP course on Automated collection of online prices, "Web scraping tools, an introduction", 2017]: <https://circabc.europa.eu/sd/a/20d545f1-6c94-4077-9c5b-1b2178be13a1/2_Big%20Data%20Sources%20part3-Day%201-B%20Tools.pptx>
[any programming language]: <https://github.com/BruceDone/awesome-crawler>
[huge number]: <https://github.com/lorien/awesome-web-scraping/blob/master/javascript.md>

### Main features ###
- Import of URLs or search queries
- Replay of a sequence of browsing actions
- Simulation of user input (clicking, scrolling, typing)
- Extraction of page data with jQuery selectors 
- Export scraping results to CSV
- Simultaneous execution of multiple data extraction jobs

### Example problem solved with ChromeBot (easy) ###
Task: Extract names of Telegram channels from [tlgrm.ru] catalog. 

Backgound: The list of channels is partly loaded by default, and loading it full requires scrolling down to the moment new channels stop getting loaded (like in Instagram). Once all the channels are loaded at the page, their names can be easily scraped.

Actions (assuming scraping script is ready): 
- Step 1: Import list of URLs (may be collected manually)
- Step 2: Start the ChromeBot, add scraping threads
- Step 3: Export results

Result: See the list of channels' names and IDs.

[tlgrm.ru]: <https://tlgrm.ru/channels/>

![ChromeBot-demo](https://github.com/devrazdev/ntScraper/raw/master/misc/demo_easy.gif)

### Example problem solved with ChromeBot (hard) ###

Task: extract the date when Telegram channels were created.

Backgound: Date of creation can be found in the first messages of channel threads. There are many ways to access channel threads, ranging from [command line interface] to [web] interface. Here we are going to use the web interface of [official Telegram web client]. First we search the channel, second we scroll it's thread up to the beginning and then we extract the date.

Actions:	
- Step 1: Import list of channel IDs (can be takes from Example problem 1)
- Step 2: Start the ChromeBot
- Step 3: Export results

Result: see the list of channels' names and their "dates of birth".

[command line interface]: <https://github.com/vysheng/tg>
[web interface]: <https://github.com/GetGems/Web-client>
[official Telegram web client]: https://web.telegram.org/#/im

![ChromeBot-demo](https://github.com/devrazdev/ntScraper/raw/master/misc/demo_hard.gif)

### Short lesson on jQuery selectors ###
Until the data you need to scrape is located on a single page, you are ok. Tasks of any higher complexity (pagination / dynamic pages / capthca / searching with parameters / etc.) will be  solved with tools faster.

**Example: look at the [craigslist page with used Triumph motorcycles] and figure out their average price **

1. Open page in browser, move the cursor to the price badge, click the right button and "Inspect" the element. You will see something like:
    ```html
    <li class="result-row" data-pid="..." data-repost-of="...">
        ...
        <span class="result-price">$5000</span>
        ...
    </li>
    ```
    Each search result takes one row, every row has a price. Prices are styled by adding class **result-price**

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

### How to add a task? ###
<TO DO>

### Repository structure ###
<TO DO>

## Farewell ##
I would be happy to hear any feedback/news about how you use **ntOrgchart** in real life. Feel free to write me at devrazdev@gmail.com. Thank you.

Well, there are still good and bad tools (like [Internet Exporer automation with VBA]).

[Internet Exporer automation with VBA]: <Automating the Internet Explorer Web Browser (Entering Text and Clicking Button)>
