window.ajaxRequests = {};
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
        window.ajaxRequests[id] = { url:this._url, started: Date.now()  };
        /* Wrap onreadystaechange callback */
        var callback = this.onreadystatechange;
        this.onreadystatechange = function () {
            if (this.readyState == 4) {
                delete window.ajaxRequests[id];
            }
            if (callback) callback.apply(this, arguments);
            if (Object.keys(window.ajaxRequests).length === 0) {
                window.ajaxQuiet = true;
            }
        }

        _send.apply(this, arguments);
    }

}
