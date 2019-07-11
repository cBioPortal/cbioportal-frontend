import _ from "lodash";
import {nelderMead} from 'fmin';
import {layoutConnectedComponents} from "./normalizeLayout";
import {getRegionArea, getRegionShape, rectangleArea, rectangleDistance} from "./geometry";

export type Region = {size:number, sets:string[], sizeOfIntersectionOfSets:number};
export type Set = { size:number, uid:string};
export type SetRectangles = {[setUid:string]:Rectangle};
export type Rectangle = {x:number, y:number, xLength:number, yLength:number};// bottom-left aligned
export type RegionShape = Rectangle[];
const VennJs = require("venn.js");

export function getRegionLabelPosition(sets:string[], setRectangles:SetRectangles) {
    const regionShape = getRegionShape(sets, setRectangles);

    // Put label in center of biggest area rectangle in the region shape
    const sortedRegionRectangles = _.sortBy(regionShape, rectangle=>-rectangleArea(rectangle));
    const biggestAreaRectangle = sortedRegionRectangles[0];
    return {
        x: biggestAreaRectangle.x + biggestAreaRectangle.xLength/2,
        y: biggestAreaRectangle.y + biggestAreaRectangle.yLength/2
    };
}

function rectangleVennLossFunction(
    setRectangles:SetRectangles,
    regions:Region[],
    sets:Set[]
) {
    let areaError = 0;
    let intersectionDistancePenalty = 0;

    for (const region of regions) {
        // Make regions proportional to their size
        const regionArea = getRegionArea(getRegionShape(region.sets, setRectangles));
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

    return {
        areaError,
        otherPenalties: intersectionDistancePenalty
    };
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

    // transform rectangles to a vector to pass to the optimization algorithm
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
            const error = rectangleVennLossFunction(current, regions, sets);
            return error.areaError + error.otherPenalties;
        },
        initial,
        parameters);

    // transform solution vector back to rectangles
    const rectangles:SetRectangles = {};
    const values = solution.x;
    for (let i=0; i<setIds.length; i++) {
        const setId = setIds[i];
        rectangles[setId] = vectorToRectangle(i, values);
    }

    layoutConnectedComponents(rectangles);

    return {
        rectangles,
        finalErrorValue: rectangleVennLossFunction(rectangles, regions, sets).areaError
    };
}