### What is ntScraper? ###

**ntScraper** is a [web scraping] framework in form of Chrome Extension, which can asynchronously run any number of scraping tasks in separate windows. It's good for medium scale (~1,000 to ~100,000 records) data extraction.

[web scraping]: <https://en.wikipedia.org/wiki/Web_scraping>

---

### How does it work? ###
Example: scraping names of Telegram channels from [tlgrm.ru] catalog. There is a queue of 17 dynamic web pages to scrape, workers get added by clicking the task button. Each of them opens the web page, scrolls it down until all the content is loaded and then scrapes it. 

[tlgrm.ru]: <https://tlgrm.ru/>

![ntScraper-demo](https://github.com/devrazdev/ntScraper/raw/master/misc/demo.gif)

Get to know many other ntScraper's capabilities by watching [Youtube trailer].

[Youtube trailer]: <https://www.youtube.com/watch?v=z6Zkbmm88Hg>

### ntScraper features ###
TO DO

### Should i use it? ###
> "Tools and frameworks come and go, choose the one that fits the job."
[ESTP course on Automated collection of online prices, "Web scraping tools, an introduction", 2017]

Scraping tools exist for users of [any programming background]. 
 


[any programming background]: <https://github.com/BruceDone/awesome-crawler>
[ESTP course on Automated collection of online prices, "Web scraping tools, an introduction", 2017]: <https://circabc.europa.eu/sd/a/20d545f1-6c94-4077-9c5b-1b2178be13a1/2_Big%20Data%20Sources%20part3-Day%201-B%20Tools.pptx>

### Can I live without any tools? ###
Until the data you need to scrape is located on a single page, you are ok. Tasks of any higher complexity (pagination / dynamic pages / capthca / searching with parameters / etc.) will be  solved with tools faster.

**Example: look at the [craigslist page with used Triumph motorcycles]. What is the fastest way to quickly get the average price?**

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
