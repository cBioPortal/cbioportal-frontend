var path = require('path');
module.exports = function getScreenshotName(basePath) {
    return function(context) {
        var type = context.type;
        var testName = context.test.title;
        var browserVersion = parseInt(context.browser.version, 10);
        var browserName = context.browser.name;
        var browserViewport = context.meta.viewport;
        var browserWidth = browserViewport.width;
        var browserHeight = browserViewport.height;

        return path.join(basePath, `${testName}_${type}_${browserName}_${browserWidth}x${browserHeight}.png`.toLowerCase().replace(/ /g,"_"));
    };
}
