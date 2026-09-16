import makeSVGElement from './makesvgelement';
import extractRGBA from './extractrgba';
import {
    ComputedEllipseParams,
    ComputedLineParams,
    ComputedRectangleParams,
    ComputedShapeParams,
    ComputedTriangleParams,
} from './oncoprintshape';
import { RGBAColor } from './oncoprintruleset';
import { rgbString } from './utils';

function extractColor(str: string) {
    if (str.indexOf('rgb(') > -1) {
        return {
            rgb: str,
            opacity: 1,
        };
    }
    const rgba_arr = extractRGBA(str);
    return {
        rgb:
            'rgb(' +
            rgba_arr[0] * 255 +
            ',' +
            rgba_arr[1] * 255 +
            ',' +
            rgba_arr[2] * 255 +
            ')',
        opacity: rgba_arr[3],
    };
}

// Coordinates come out of the shape system as running floating point sums, so
// they carry the full 17 significant digits of a double. That precision is far
// below what the geometry can express, and on a large oncoprint the extra
// digits dominate the size of the exported document.
function round(n: number) {
    if (!isFinite(n)) {
        return n;
    }
    // A cell can be a small fraction of a pixel wide when zoomed out, and a
    // shape's width is derived from the difference of two rounded edges (see
    // roundSpan), so the grid has to stay fine enough that quantising the edges
    // doesn't visibly change the width of a sub-pixel cell.
    const factor = Math.abs(n) < 1 ? 1e6 : 1e4;
    return Math.round(n * factor) / factor;
}

// Rounding a position and a length independently opens sub-pixel seams between
// neighbours, because one shape's right edge and the next one's left edge stop
// agreeing. Round both edges onto the same grid and derive the length from
// them, so touching shapes keep touching.
function roundSpan(start: number, length: number) {
    const from = round(start);
    // the subtraction of two rounded values reintroduces float noise, so round
    // the result as well
    let size = round(round(start + length) - from);
    if (size === 0 && length > 0) {
        // don't let a very thin shape disappear entirely
        size = round(length) || length;
    }
    return { from, size };
}

// A stroke with zero width or zero opacity paints nothing, and fill-opacity
// defaults to 1, so writing them is pure overhead.
function strokeAttrs(params: {
    stroke: RGBAColor;
    'stroke-width': number;
}): { [attr: string]: string | number } {
    if (!params['stroke-width'] || !params.stroke[3]) {
        return {};
    }
    return {
        stroke: rgbString(params.stroke),
        'stroke-opacity': params.stroke[3],
        'stroke-width': params['stroke-width'],
    };
}

function fillAttrs(fill: RGBAColor) {
    return {
        fill: rgbString(fill),
        'fill-opacity': fill[3] === 1 ? undefined : fill[3],
    };
}

function rectangleToSVG(
    params: ComputedRectangleParams,
    offset_x: number,
    offset_y: number
) {
    const horz = roundSpan(params.x + offset_x, params.width);
    const vert = roundSpan(params.y + offset_y, params.height);
    return makeSVGElement('rect', {
        width: horz.size,
        height: vert.size,
        x: horz.from,
        y: vert.from,
        ...strokeAttrs(params),
        ...fillAttrs(params.fill),
    });
}

function triangleToSVG(
    params: ComputedTriangleParams,
    offset_x: number,
    offset_y: number
) {
    return makeSVGElement('polygon', {
        points: [
            [params.x1 + offset_x, params.y1 + offset_y],
            [params.x2 + offset_x, params.y2 + offset_y],
            [params.x3 + offset_x, params.y3 + offset_y],
        ]
            .map(function(a) {
                return round(a[0]) + ',' + round(a[1]);
            })
            .join(' '),
        ...strokeAttrs(params),
        ...fillAttrs(params.fill),
    });
}

function ellipseToSVG(
    params: ComputedEllipseParams,
    offset_x: number,
    offset_y: number
) {
    return makeSVGElement('ellipse', {
        rx: round(params.width / 2),
        // was `height`, which SVG ignores on an ellipse - every exported ellipse
        // fell back to an auto ry and rendered as a circle
        ry: round(params.height / 2),
        cx: round(params.x + offset_x),
        cy: round(params.y + offset_y),
        ...strokeAttrs(params),
        ...fillAttrs(params.fill),
    });
}

function lineToSVG(
    params: ComputedLineParams,
    offset_x: number,
    offset_y: number
) {
    return makeSVGElement('line', {
        x1: round(params.x1 + offset_x),
        y1: round(params.y1 + offset_y),
        x2: round(params.x2 + offset_x),
        y2: round(params.y2 + offset_y),
        // a line is nothing but its stroke, so always write it
        stroke: rgbString(params.stroke),
        'stroke-opacity': params.stroke[3],
        'stroke-width': params['stroke-width'],
    });
}

export default function shapeToSVG(
    oncoprint_shape_computed_params: ComputedShapeParams,
    offset_x: number,
    offset_y: number
) {
    var type = oncoprint_shape_computed_params.type;
    if (type === 'rectangle') {
        return rectangleToSVG(
            oncoprint_shape_computed_params as ComputedRectangleParams,
            offset_x,
            offset_y
        );
    } else if (type === 'triangle') {
        return triangleToSVG(
            oncoprint_shape_computed_params as ComputedTriangleParams,
            offset_x,
            offset_y
        );
    } else if (type === 'ellipse') {
        return ellipseToSVG(
            oncoprint_shape_computed_params as ComputedEllipseParams,
            offset_x,
            offset_y
        );
    } else if (type === 'line') {
        return lineToSVG(
            oncoprint_shape_computed_params as ComputedLineParams,
            offset_x,
            offset_y
        );
    }
    return undefined;
}
