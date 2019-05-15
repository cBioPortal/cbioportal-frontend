import _ from "lodash";
const VennJs = require("venn.js");

export function computeVennJsSizes<R extends {
    combination:number[],
    intersectionSize:number,
    numCases:number
}>(
    regions:R[]
): (R & {vennJsSize:number})[]{

    if (regions.length === 0) {
        return [];
    }
    // We need to find a configuration of sizes so that no nonzero region has less than minSizeMultiplier * (the size of the biggest region)
    //  This prevents regions from being too small to see/click
    // But the region numbers need to make up a valid set configuration, and reflect the true size relationships.

    // The approach is to add the same number of "imaginary samples" to every venn diagram region, in order to bump up the minimum.
    //  This approach has two desirable properties:
    //  (1) It keeps the set configuration feasible
    //  (2) It tends to equalize the regions (ratio of a+n / b+n -> 1 as n->infinity), while keeping
    //      the relative size hierarchy the same.

    // In order to keep the configuration feasible, we have to follow the following rule: if we ever add to a region R,
    //  then we have to also add the same number to every region whose constituent sets are all also in R. This keeps the
    //  intersection numbers consistent.

    // So if I is the number of imaginary samples we're going to add, then for each region R we have
    //       newSize(R) = R.size + (# of nonzero intersections containing the same sets as R (including R itself)) * I

    // And we choose I so that newSize(minimum size region) >= minSizeMultiplier * newSize(maximum size region)

    const regionsToConsider = regions.filter(x=>x.numCases > 0); // Only expand nonzero regions
    let maxRegion = { combination:[-1], numCases: 0 };
    let minRegion = { combination:[-1], numCases: Number.POSITIVE_INFINITY };

    for (const region of regionsToConsider) {
        if (region.numCases > maxRegion.numCases) {
            maxRegion = region;
        }
        if (region.numCases < minRegion.numCases) {
            minRegion = region;
        }
    }

    const minSizeMultiplier = 0.02;
    let imaginarySamples = 0;
    if (minRegion.numCases < minSizeMultiplier * maxRegion.numCases) {
        // solving for I in newSize(minimum size region) = minSizeMultiplier * newSize(maximum size region)
        const containingSameAsMin = _.sumBy(regionsToConsider, r=>+(_.difference(minRegion.combination, r.combination).length === 0));
        const containingSameAsMax = _.sumBy(regionsToConsider, r=>+(_.difference(maxRegion.combination, r.combination).length === 0));
        imaginarySamples = Math.ceil((minRegion.numCases - minSizeMultiplier*maxRegion.numCases) /
                            ( minSizeMultiplier*containingSameAsMax - containingSameAsMin));
    }

    const newSize = (region:R)=>{
        const containingSameSets = _.sumBy(regionsToConsider, r=>+(_.difference(region.combination, r.combination).length === 0));
        return region.intersectionSize + imaginarySamples*containingSameSets;
    };

    for (const region of regions) {
        (region as R & {vennJsSize:number}).vennJsSize = region.numCases > 0 ? newSize(region) : region.intersectionSize;
    }
    return regions as (R & {vennJsSize:number})[];
}

export function lossFunction(
    sets:any, overlaps:any
) {
    // almost identical to https://github.com/benfred/venn.js/blob/master/src/layout.js#L395
    let output = 0;

    function getCircles(indices:number[]) {
        return indices.map(function(i) { return sets[i]; });
    }

    for (let i = 0; i < overlaps.length; ++i) {
        const area = overlaps[i];
        let overlap:any;
        if (area.sets.length == 1) {
            continue;
        } else if (area.sets.length == 2) {
            var left = sets[area.sets[0]],
                right = sets[area.sets[1]];
            overlap = VennJs.circleOverlap(left.radius, right.radius,
                VennJs.distance(left, right));
        } else {
            overlap = VennJs.intersectionArea(getCircles(area.sets));
        }

        let weight = area.hasOwnProperty('weight') ? area.weight : 1.0;

        // the following two lines differ from the vennjs-provided loss
        // Instead of using square difference as in the original vennjs-provided loss function:
        //              (overlap - area.size)^2
        // we use square of log ratio (plus 1 to avoid division by zero). The advantage of this is now
        //  instead of working with differences, we're working with ratios, so all sets deviations
        //  are weighted more equally, since when dealing with differences the smaller sets will
        //  contribute smaller loss terms even when the percent difference (ratio) is significant.
        //  Using log means that 1/2 size ratio is as bad as double size ratio.
        //
        // This fixes errors where zero-size sets were showing nonzero overlap, because their
        //  contributions to the loss were automatically small.
        const differenceFromIdeal = Math.log((overlap + 1)/ (area.size + 1));

        // We square differenceFromIdeal to differentiably use positive values - contributions to
        // the loss function should be positive no matter which direction the differenceFromIdeal is.
        output += weight * differenceFromIdeal * differenceFromIdeal;
    }

    return output;
}