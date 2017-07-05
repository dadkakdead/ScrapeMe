//http://stackoverflow.com/questions/5706837/get-unique-selector-of-element-in-jquery
jQuery.fn.extend({
    getPath: function () {
        var path, node = this;
        while (node.length) {
            var realNode = node[0], name = realNode.localName;
            if (!name) break;
            name = name.toLowerCase();

            var parent = node.parent();

            var sameTagSiblings = parent.children(name);
            if (sameTagSiblings.length > 1) {
                allSiblings = parent.children();
                var index = allSiblings.index(realNode) + 1;
                if (index > 1) {
                    name += ':nth-child(' + index + ')';
                }
            }

            path = name + (path ? '>' + path : '');
            node = parent;
        }

        return path;
    }
});

jQuery.fn.removeWithoutLeaking = function() {
    this.each(function(i,e){
        if( e.parentNode )
            e.parentNode.removeChild(e);
    });
};
