function cloneShallow(obj) {
    var ret = {};
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            ret[key] = obj[key];
        }
    }
    return ret;
}

module.exports = {
    cloneShallow: cloneShallow
};
