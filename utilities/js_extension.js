String.prototype.replaceAt = function(index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}

function addRandomChar(str, pos) {
    var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_@-";
    var rdmCharPosition = Math.random() * str.length;

    alphabet.replace(str.charAt(rdmCharPosition), "");

    return str.replaceAt(rdmCharPosition, alphabet.charAt(Math.floor(Math.random() * alphabet.length)));
}
