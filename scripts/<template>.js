// template for new crawler
//
// <x> - identificator of data piece
// <x>Vault - an object holding data about x'es in form x's ID -> stringified JSON of x's properties
// selector - jQuery-style selector for many x'es
// <prop1>, <prop2> - names of any properties
//
// ATTENTION!!! after you finish crawling function, don't forget to add it to manifest file!!!
/*
function <crawlingFunction>() {
    var <x>Vault = new Object();

    $("<selector>").each(function(){
        <x> = new Object();

        <x>.taskId = subtaskPublic.taskId;
        <x>.pageUrl = subtaskPublic.currentPageUrl;

        <x>.<prop1> = <prop1Value>;
        <x>.<prop2> = $(this).find("prop2Selector").text();

        <x>.timestamp = String(Date.now());

        <x>Id = String(threadId + "_" + messageCounter);

        <x>Vault[<x>Id] = JSON.stringify(<x>);
    });

    return <x>Vault;
}
*/
