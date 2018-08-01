String.prototype.replaceAt = function(index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}

function filterString(str){
    //remove emoji
    str = str.replace(/(<span)([a-zA-Z0-9_ \%\>\(\)\=\:\"\-\.\/]{1,})(<\/span>)/gm, "");
    //remove markup shit
    str = str.replace(/(\&nbsp;)/gm, " ");
    str = str.replace(/(<br>)/gm, " ");
    str = str.replace(/(\&amp;)/gm, " ");
    str = str.replace(/(quot;)/gm, " ");
    //remove my delimiter
    str = str.replace(/\|/gm, " ");
    //trim for beauty
    str = str.trim();

    return str;
}

function addRandomChar(str, pos) {
    var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_@-";
    var rdmCharPosition = Math.random() * str.length;

    alphabet.replace(str.charAt(rdmCharPosition), "");

    return str.replaceAt(rdmCharPosition, alphabet.charAt(Math.floor(Math.random() * alphabet.length)));
}
