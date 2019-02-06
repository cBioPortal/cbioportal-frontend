function cloneShallow(obj) {
    var ret = {};
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            ret[key] = obj[key];
        }
    }
    return ret;
}

function doesCellIntersectPixel(cellHitzone, pixelX) {
    // cellHitzone: [lower, upper]
    // checks intersection with the half-open interval [pixelX, pixelX+1)

    var lower = cellHitzone[0], upper = cellHitzone[1];
    if (upper < pixelX) {
        return false;
    } else if (lower < pixelX + 1) {
        return true;
    } else {
        return false;
    }
}

module.exports = {
    cloneShallow: cloneShallow,
    doesCellIntersectPixel: doesCellIntersectPixel
};
