var requests = {};
var _send = XMLHttpRequest.prototype.send;
var lastTimeout = null;

export function setNetworkListener(){

    window.ajaxQuiet = true;

    var xhrProto = XMLHttpRequest.prototype,
        origOpen = xhrProto.open;

    xhrProto.open = function (method, url) {
        this._url = url;
        return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function() {
        window.ajaxQuiet = false;
        var id = Math.floor(Math.random() * 1000000000);
        requests[id] = true;
        /* Wrap onreadystaechange callback */
        var callback = this.onreadystatechange;
        this.onreadystatechange = function () {
            if (this.readyState == 4) {
                delete requests[id];
            }
            if (callback) callback.apply(this, arguments);
            if (Object.keys(requests).length === 0) {
                window.ajaxQuiet = true;
            }
        }

        _send.apply(this, arguments);
    }

}