import makeSVGElement from './makesvgelement';
import extractRGBA from './extractrgba';
import {ComputedShapeParams} from "./oncoprintshape";

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

function rectangleToSVG(params:{
    width:any,
    height:any,
    x:any,
    y:any,
    stroke:string,
    "stroke-width":number,
    fill:string
}, offset_x:number, offset_y:number) {
    var stroke_color = extractColor(params.stroke);
    var fill_color = extractColor(params.fill);
    return makeSVGElement('rect', {
        width: params.width,
        height: params.height,
        x: parseFloat(params.x as any) + offset_x,
        y: parseFloat(params.y as any) + offset_y,
        stroke: stroke_color.rgb,
        'stroke-opacity': stroke_color.opacity,
        'stroke-width': params['stroke-width'],
        fill: fill_color.rgb,
        'fill-opacity': fill_color.opacity
    });
}

function triangleToSVG(params:{
    x1:any,
    y1:any,
    x2:any,
    y2:any,
    x3:any,
    y3:any,
    stroke:string,
    "stroke-width":number,
    fill:string
}, offset_x:number, offset_y:number) {
    var stroke_color = extractColor(params.stroke);
    var fill_color = extractColor(params.fill);
    return makeSVGElement('polygon', {
        points: [[parseFloat(params.x1) + offset_x, parseFloat(params.y1) + offset_y], [parseFloat(params.x2) + offset_x, parseFloat(params.y2) + offset_y], [parseFloat(params.x3) + offset_x, parseFloat(params.y3) + offset_y]].map(function (a) {
            return a[0] + ',' + a[1];
        }).join(' '),
        stroke: stroke_color.rgb,
        'stroke-opacity': stroke_color.opacity,
        'stroke-width': params['stroke-width'],
        fill: fill_color.rgb,
        'fill-opacity': fill_color.opacity
    });
}

function ellipseToSVG(params:{
    width:any,
    height:any,
    x:any,
    y:any,
    stroke:string,
    "stroke-width":number,
    fill:string
}, offset_x:number, offset_y:number) {
    var stroke_color = extractColor(params.stroke);
    var fill_color = extractColor(params.fill);
    return makeSVGElement('ellipse', {
        rx: parseFloat(params.width) / 2,
        height: parseFloat(params.height) / 2,
        cx: parseFloat(params.x) + offset_x,
        cy: parseFloat(params.y) + offset_y,
        stroke: stroke_color.rgb,
        'stroke-opacity': stroke_color.opacity,
        'stroke-width': params['stroke-width'],
        fill: fill_color.rgb,
        'fill-opacity': fill_color.opacity
    });
}

function lineToSVG(params:{
    x1:any,
    y1:any,
    x2:any,
    y2:any,
    stroke:string,
    "stroke-width":number
}, offset_x:number, offset_y:number) {
    var stroke_color = extractColor(params.stroke);
    return makeSVGElement('line', {
        x1: parseFloat(params.x1) + offset_x,
        y1: parseFloat(params.y1) + offset_y,
        x2: parseFloat(params.x2) + offset_x,
        y2: parseFloat(params.y2) + offset_y,
        stroke: stroke_color.rgb,
        'stroke-opacity': stroke_color.opacity,
        'stroke-width': params['stroke-width'],
    });
}

export default function(oncoprint_shape_computed_params:ComputedShapeParams, offset_x:number, offset_y:number) {
    var type = oncoprint_shape_computed_params.type;
    if (type === 'rectangle') {
        return rectangleToSVG(oncoprint_shape_computed_params as any, offset_x, offset_y);
    } else if (type === 'triangle') {
        return triangleToSVG(oncoprint_shape_computed_params as any, offset_x, offset_y);
    } else if (type === 'ellipse') {
        return ellipseToSVG(oncoprint_shape_computed_params as any, offset_x, offset_y);
    } else if (type === 'line') {
        return lineToSVG(oncoprint_shape_computed_params as any, offset_x, offset_y);
    }
}