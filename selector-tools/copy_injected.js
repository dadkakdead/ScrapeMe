function copyContentToClipboard(elementId) {
    range = document.createRange();

    exportScreen = document.getElementById(elementId);
    range.selectNode(exportScreen);

    window.getSelection().addRange(range);

    document.execCommand('copy');
}
