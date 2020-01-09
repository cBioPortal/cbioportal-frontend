import makeSVGElement from './makesvgelement';
import extractRGBA from './extractrgba';
import {
    ComputedEllipseParams, ComputedLineParams,
    ComputedRectangleParams,
    ComputedShapeParams,
    ComputedTriangleParams
} from "./oncoprintshape";

function extractColor(str:string) {
    if (str.indexOf("rgb(") > -1) {
        return {
            'rgb': str,
            'opacity': 1
        };
    }
    const rgba_arr = extractRGBA(str);
    return {
        'rgb': 'rgb('+rgba_arr[0]*255+','+rgba_arr[1]*255+','+rgba_arr[2]*255+')',
        'opacity': rgba_arr[3]
    };
}

function rectangleToSVG(params:ComputedRectangleParams, offset_x:number, offset_y:number) {
    var stroke_color = extractColor(params.stroke);
    var fill_color = extractColor(params.fill);
    return makeSVGElement('rect', {
        width: params.width,
        height: params.height,
        x: params.x + offset_x,
        y: params.y + offset_y,
        stroke: stroke_color.rgb,
        'stroke-opacity': stroke_color.opacity,
        'stroke-width': params['stroke-width'],
        fill: fill_color.rgb,
        'fill-opacity': fill_color.opacity
    });
}

function triangleToSVG(params:ComputedTriangleParams, offset_x:number, offset_y:number) {
    var stroke_color = extractColor(params.stroke);
    var fill_color = extractColor(params.fill);
    return makeSVGElement('polygon', {
        points: [[params.x1 + offset_x, params.y1 + offset_y], [params.x2 + offset_x, params.y2 + offset_y], [params.x3 + offset_x, params.y3 + offset_y]].map(function (a) {
            return a[0] + ',' + a[1];
        }).join(' '),
        stroke: stroke_color.rgb,
        'stroke-opacity': stroke_color.opacity,
        'stroke-width': params['stroke-width'],
        fill: fill_color.rgb,
        'fill-opacity': fill_color.opacity
    });
}

function ellipseToSVG(params:ComputedEllipseParams, offset_x:number, offset_y:number) {
    var stroke_color = extractColor(params.stroke);
    var fill_color = extractColor(params.fill);
    return makeSVGElement('ellipse', {
        rx: params.width / 2,
        height: params.height / 2,
        cx: params.x + offset_x,
        cy: params.y + offset_y,
        stroke: stroke_color.rgb,
        'stroke-opacity': stroke_color.opacity,
        'stroke-width': params['stroke-width'],
        fill: fill_color.rgb,
        'fill-opacity': fill_color.opacity
    });
}

function lineToSVG(params:ComputedLineParams, offset_x:number, offset_y:number) {
    var stroke_color = extractColor(params.stroke);
    return makeSVGElement('line', {
        x1: params.x1 + offset_x,
        y1: params.y1 + offset_y,
        x2: params.x2 + offset_x,
        y2: params.y2 + offset_y,
        stroke: stroke_color.rgb,
        'stroke-opacity': stroke_color.opacity,
        'stroke-width': params['stroke-width'],
    });
}

export default function(oncoprint_shape_computed_params:ComputedShapeParams, offset_x:number, offset_y:number) {
    var type = oncoprint_shape_computed_params.type;
    if (type === 'rectangle') {
        return rectangleToSVG(oncoprint_shape_computed_params as ComputedRectangleParams, offset_x, offset_y);
    } else if (type === 'triangle') {
        return triangleToSVG(oncoprint_shape_computed_params as ComputedTriangleParams, offset_x, offset_y);
    } else if (type === 'ellipse') {
        return ellipseToSVG(oncoprint_shape_computed_params as ComputedEllipseParams, offset_x, offset_y);
    } else if (type === 'line') {
        return lineToSVG(oncoprint_shape_computed_params as ComputedLineParams, offset_x, offset_y);
    }
}