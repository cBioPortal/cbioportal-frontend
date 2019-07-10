import _ from "lodash";
import {nelderMead} from 'fmin';
import {getDeterministicRandomNumber} from "../../../shared/components/plots/PlotUtils";

type Region = {size:number, sets:string[], sizeOfIntersectionOfSets:number};
type Set = { size:number, uid:string};
type SetRectangles = {[setUid:string]:Rectangle};
type Rectangle = {x:number, y:number, xLength:number, yLength:number};// bottom-left aligned
const VennJs = require("venn.js");

function getAxisAlignedDistanceToNearestRectangle(x:number, y:number, setRectangles:SetRectangles) {
    let distance = Number.POSITIVE_INFINITY;
    for (const rect of _.values(setRectangles)) {
        // get nearest axis-aligned distance from each side of `rect`
        const distanceFromLeft = Math.abs(x - rect.x);
        const distanceFromRight = Math.abs(x - (rect.x + rect.xLength));
        const distanceFromBottom = Math.abs(y - rect.y);
        const distanceFromTop = Math.abs(y - (rect.y + rect.yLength));

        // keep track of the minimum one, over all rectangles `rect`
        distance = Math.min(distance, distanceFromLeft, distanceFromRight, distanceFromBottom, distanceFromTop);
    }
    return distance;
}

export function getRegionLabelPosition(sets:string[], setRectangles:SetRectangles) {
    // only sample within intersection region
    const sampleRect = rectangleIntersection(...sets.map(s=>setRectangles[s]));
    const xMin = sampleRect.x;
    const xMax = sampleRect.x + sampleRect.xLength;
    const yMin = sampleRect.y;
    const yMax = sampleRect.y + sampleRect.yLength;

    // First, sample to find an initial position thats inside the region
    const excludedSets = _.difference(Object.keys(setRectangles), sets);
    let initialPosition = null;
    let numSamples = 100;
    let bestMargin = 0;
    let randomNumber = getDeterministicRandomNumber(100);
    for (let i=0; i<numSamples; i++) {
        randomNumber = getDeterministicRandomNumber(randomNumber);
        const x = randomNumber*(xMax-xMin) + xMin;
        randomNumber = getDeterministicRandomNumber(randomNumber);
        const y = randomNumber*(yMax-yMin) + yMin;
        // we already know point is inside intersected sets, so lets just make sure its not in excluded sets
        let inside = true;
        for (const set of excludedSets) {
            inside = inside && !isPointInsideRectangle(x, y, setRectangles[set]);
        }
        if (inside) {
            const newMargin = getAxisAlignedDistanceToNearestRectangle(x, y, setRectangles);
            if (newMargin > bestMargin) {
                bestMargin = newMargin;
                initialPosition = {x,y};
            }
        }
    }

    // Stop if we never found an initial point for the algorithm. This means the region is very small.
    //  We just won't show a label for this region.
    if (!initialPosition) {
        console.log("couldnt find a place to put label");
        return null;
    }

    // Starting with the point we found above, run an optimization algorithm to improve on it, finding a point that's
    //  deep inside the region, far from the boundary. This will be a good place to put a label.
    const solution = nelderMead(
        function(values:number[]) {
            if (isPointInsideRegion(values[0], values[1], sets, excludedSets, setRectangles)) {
                return -getAxisAlignedDistanceToNearestRectangle(values[0], values[1], setRectangles);
            } else {
                return Number.POSITIVE_INFINITY;
            }
        },
        [initialPosition.x, initialPosition.y],
        {maxIterations:500}
    ).x;

    return { x: solution[0], y:solution[1] };
}

export function rectangleArea(rectangle:Rectangle) {
    return rectangle.xLength*rectangle.yLength;
}

export function rectangleDistance(rect1:Rectangle, rect2:Rectangle) {
    const x = (rect1.x - rect2.x);
    const y = (rect1.y - rect2.y);
    return Math.sqrt(x*x + y*y);
}

export function rectangleIntersection(
    ...rectangles:Rectangle[]
):Rectangle {
    if (rectangles.length === 1) {
        return rectangles[0];
    } else if (rectangles.length === 2) {
        const rectA = rectangles[0];
        const rectB = rectangles[1];
        // x direction
        const xMin = Math.max(rectA.x, rectB.x);
        const xMax = Math.min(rectA.x + rectA.xLength, rectB.x + rectB.xLength);
        // y direction
        const yMin = Math.max(rectA.y, rectB.y);
        const yMax = Math.min(rectA.y + rectA.yLength, rectB.y + rectB.yLength);

        if (xMin >= xMax || yMin >= yMax) {
            // no intersection
            return {
                x: 0,
                y: 0,
                xLength: 0,
                yLength: 0
            };
        } else {
            return {
                x: xMin,
                y: yMin,
                xLength: xMax - xMin,
                yLength: yMax - yMin
            };
        }
    } else {
        return rectangleIntersection(
            rectangleIntersection(
                ...rectangles.slice(1)
            ),
            rectangles[0]
        );
    }
}

export function getRegionArea(
    sets:string[],
    setRectangles:SetRectangles
) {
    // start with the intersection size
    let size = rectangleArea(rectangleIntersection(...sets.map(s=>setRectangles[s])));

    // if there are other sets not included in the region, subtract them from the set
    const numSets = Object.keys(setRectangles).length;
    if (sets.length !== numSets) {
        // since max 3 sets total, we know (sets, numSets) is either (1,3), (2,3) or (1,2)
        if (sets.length === 2) {
            // numSets is 3
            // so just subtract the intersection of all 3
            size -= rectangleArea(rectangleIntersection(..._.values(setRectangles)));
        } else {
            // sets.length is 1
            if (numSets === 2) {
                // just subtract the intersection
                size -= rectangleArea(rectangleIntersection(..._.values(setRectangles)));
            } else {
                // numSets is 3
                // so we need to subtract inclusion/exclusion style
                // WLOG lets call our set A, and theres B and C
                // then area(A) = size(A) - size(A and B) - size(A and C) + size(A and B and C)
                const others = Object.keys(setRectangles).filter(s=> sets[0] !== s);
                const rectA = setRectangles[sets[0]];
                const rectB = setRectangles[others[0]];
                const rectC = setRectangles[others[1]];
                size -= rectangleArea(rectangleIntersection(rectA, rectB));
                size -= rectangleArea(rectangleIntersection(rectA, rectC));
                size += rectangleArea(rectangleIntersection(..._.values(setRectangles)));
            }
        }
    }

    return size;
}

function isPointInsideRectangle(x:number, y:number, rectangle:Rectangle) {
    return ((x > rectangle.x) &&
        (x < rectangle.x + rectangle.xLength) &&
        (y > rectangle.y) &&
        (y < rectangle.y + rectangle.yLength));
}

function isPointInsideRegion(x:number, y:number, sets:string[], excludedSets:string[], setRectangles:SetRectangles) {
    let inside = true;
    for (const set of sets) {
        inside = inside && isPointInsideRectangle(x, y, setRectangles[set]);
    }
    for (const set of excludedSets) {
        inside = inside && !isPointInsideRectangle(x, y, setRectangles[set]);
    }
    return inside;
}

export function getApproximateRegionArea(
    sets:string[],
    setRectangles:SetRectangles
) {
    // for testing
    const xMin = Math.min(...sets.map(setId=>setRectangles[setId].x));
    const xMax = Math.max(...sets.map(setId=>setRectangles[setId].x+setRectangles[setId].xLength));
    const yMin = Math.min(...sets.map(setId=>setRectangles[setId].y));
    const yMax = Math.max(...sets.map(setId=>setRectangles[setId].y+setRectangles[setId].yLength));

    const numSamples = 2000000;
    let numInside = 0;
    const excludedSets = _.difference(Object.keys(setRectangles), sets);
    for (let i=0; i<numSamples; i++) {
        const sampleX = Math.random()*(xMax-xMin) + xMin;
        const sampleY = Math.random()*(yMax-yMin) + yMin;
        numInside += +isPointInsideRegion(sampleX, sampleY, sets, excludedSets, setRectangles);
    }

    return (numInside / numSamples) * (xMax - xMin) * (yMax - yMin);
}

export function rectangleVennLossFunction(
    setRectangles:SetRectangles,
    regions:Region[],
    sets:Set[]
) {
    let areaError = 0;
    let intersectionDistancePenalty = 0;

    for (const region of regions) {
        // Make regions proportional to their size
        const regionArea = getRegionArea(region.sets, setRectangles);
        const error = (regionArea - region.size);
        areaError += error*error;

        if (region.sets.length === 2 && regionArea === 0 && region.size > 0) {
            // try to bring each pair of rectangles together if they should intersect and currently dont. Otherwise,
            //  the loss function only detects errors in intersection regions, so won't know how to move them to get better.
            intersectionDistancePenalty += rectangleDistance(
                setRectangles[region.sets[0]], setRectangles[region.sets[1]]
            );
        }
    }

    for (const set of sets) {
        // Make each rectangle proportional to its size
        const rectSize = rectangleArea(setRectangles[set.uid]);
        const rectSizeError = (rectSize - set.size);
        areaError += rectSizeError*rectSizeError;
    }

    return areaError + intersectionDistancePenalty;
}

export function adjustSizesForMinimumSizeRegions(
    regions:Region[],
    sets:Set[]
) {
    // Adjust sizes in order to not have regions that are too tiny to interact with/see.
    // The minimum region size is a fraction of the biggest set size.
    const biggestSetSize = Math.max(...sets.map(s=>s.size));
    const minRegionSize = biggestSetSize / 30;

    sets = _.cloneDeep(sets);
    regions = _.cloneDeep(regions);

    const setsMap = _.keyBy(sets, s=>s.uid);
    for (const region of regions) {
        // Adjust sizes of nonempty regions in a consistent way:
        //  When adding to a region in order to bring it to the minimum, it also implies
        //  adding to the size of the intersection of sets, and adding to the size of all
        //  the sets of the region.
        // This keeps the consistency of the sizes to represent mathematically valid set relationships.
        if (region.size > 0 && region.size < minRegionSize) {
            const addition = minRegionSize - region.size;
            region.size += addition;
            region.sizeOfIntersectionOfSets += addition;
            for (const setId of region.sets) {
                setsMap[setId].size += addition;
            }
        }
    }

    return { regions, sets };
}

export function computeRectangleVennLayout(regions:Region[], sets:Set[], parameters:any) {
    // based on https://github.com/benfred/venn.js/blob/master/src/layout.js#L7
    parameters = parameters || {};

    // Base our initial layout on the VennJs library's initial layout for circles.
    const initialLayout = VennJs.bestInitialLayout(regions.map(region=>({ sets: region.sets, size: region.sizeOfIntersectionOfSets })), parameters);
    const initialRectangles:SetRectangles = _.mapValues(initialLayout, circle=>({
        x: circle.x - circle.radius,
        y: circle.y - circle.radius,
        xLength: 2*circle.radius,
        yLength: 2*circle.radius
    }));

    const rectangleToVector = (rect:Rectangle)=>{
        return [rect.x + rect.xLength / 2, rect.y + rect.yLength / 2,
                rect.xLength/2, rect.xLength/2, rect.yLength/2, rect.yLength/2];

        // This parametrization is useful because it allows free exploration of the parameter space in
        //  a way that is relevant to the problem.
        // To be more precise, with this parametrization each side can be moved independently
        //  by a change in a single dimension, and the x and y each can be moved independently
        //  by a change in a single dimension.
        //
        // Its advantage over Parametrization A = [x, y, width, height] is that it can freely move each of the sides
        //  of the rectangle, whereas Param. A would need to alter both width and x synchronously in order
        //  to move the rectangles left side while maintaining the rest of the rectangle sides in place.
        //
        // Its advantage over Parametrization B = [x1, y1, x2, y2] is that it can move the entire rectangle easily,
        //  whereas to change x in Param. B you'd need to alter both x1 and x2 synchronously.
    };

    const vectorToRectangle = (i:number, vector:number[])=>{
        // This is completely tied to `rectangleToVector` - if one is rewritten then so must the other be so that they are inverses.
        const centerX = vector[6*i];
        const centerY = vector[6*i + 1];
        const leftXLength = Math.abs(vector[6*i + 2]);
        const xLength = leftXLength + Math.abs(vector[6*i+3]);
        const bottomYLength = Math.abs(vector[6*i+4]);
        const yLength = bottomYLength + Math.abs(vector[6*i + 5]);
        const x = centerX - leftXLength;
        const y = centerY - bottomYLength;
        return {x,y,xLength,yLength};
    };

    // transform x/y coordinates to a vector to pass to the optimization algorithm
    const initial:number[] = [];
    const setIds:string[] = [];
    for (const setId of Object.keys(initialRectangles)) {
        if (initialRectangles.hasOwnProperty(setId)) {
            initial.push(...rectangleToVector(initialRectangles[setId]));
            setIds.push(setId);
        }
    }

    // optimize initial layout from our loss function
    const solution = nelderMead(
        function(values:number[]) {
            const current:SetRectangles = {};
            for (let i=0; i<setIds.length; i++) {
                const setId = setIds[i];
                current[setId] = vectorToRectangle(i, values);
            }
            return rectangleVennLossFunction(current, regions, sets);
        },
        initial,
        parameters);

    // transform solution vector back to x/y points
    const rectangles:SetRectangles = {};
    const values = solution.x;
    for (let i=0; i<setIds.length; i++) {
        const setId = setIds[i];
        rectangles[setId] = vectorToRectangle(i, values);
    }

    return {
        rectangles,
        finalErrorValue: rectangleVennLossFunction(rectangles, regions, sets)
    };
}

export function scaleAndCenterLayout(layout:SetRectangles, width:number, height:number, padding:number) {
    // Based on https://github.com/benfred/venn.js/blob/d5a47bd12140f95a17402c6356af4631f53a0723/src/layout.js#L635

    function getBoundingBox(rectangles:Rectangle[]) {
        return {
            xRange:{
                min: Math.min(...rectangles.map(r=>r.x)),
                max: Math.max(...rectangles.map(r=>r.x + r.xLength))
            },
            yRange:{
                min: Math.min(...rectangles.map(r=>r.y)),
                max: Math.max(...rectangles.map(r=>r.y + r.yLength))
            }
        };
    }

    const rectangles = _.values(layout);
    const setIds = Object.keys(layout);

    width -= 2*padding;
    height -= 2*padding;

    const bounds = getBoundingBox(rectangles);
    const xRange = bounds.xRange;
    const yRange = bounds.yRange;

    if ((xRange.max == xRange.min) ||
        (yRange.max == yRange.min)) {
        console.log("not scaling layout: zero size detected");
        return layout;
    }

    const xScaling = width  / (xRange.max - xRange.min);
    const yScaling = height / (yRange.max - yRange.min);
    const scaling = Math.min(yScaling, xScaling);

    // while we're at it, center the diagram too
    const xOffset = (width -  (xRange.max - xRange.min) * scaling) / 2;
    const yOffset = (height - (yRange.max - yRange.min) * scaling) / 2;

    const scaled:SetRectangles = {};
    for (let i = 0; i < rectangles.length; ++i) {
        const rect = rectangles[i];
        scaled[setIds[i]] = {
            xLength: scaling * rect.xLength,
            yLength: scaling * rect.yLength,
            x: padding + xOffset + (rect.x - xRange.min) * scaling,
            y: padding + yOffset + (rect.y - yRange.min) * scaling,
        };
    }

    return scaled;
}