import makeSVGElement from './makesvgelement';
import shapeToSVG from './oncoprintshapetosvg';
import extractRGBA from './extractrgba';
import {ComputedShapeParams} from "./oncoprintshape";

function extractColor(str:string) {
    if (str.indexOf("rgb(") > -1 || str.indexOf("url(") > -1) {
        return {
            'rgb': str,
            'opacity': 1
        };
    }
    var rgba_arr = extractRGBA(str);
    return {
        'rgb': 'rgb('+Math.round(rgba_arr[0]*255)+','+Math.round(rgba_arr[1]*255)+','+Math.round(rgba_arr[2]*255)+')',
        'opacity': rgba_arr[3]
    };
}

function makeIdCounter() {
    let id = 0;
    return function () {
        id += 1;
        return id;
    };
}

const gradientId = makeIdCounter();

export default {
    text: function(content:string,x?:number,y?:number,size?:number,family?:string,weight?:string,alignment_baseline?:string,fill?:string) {
        size = size || 12;
        var alignment_baseline_y_offset = size;
        if (alignment_baseline === "middle") {
            alignment_baseline_y_offset = size/2;
        } else if (alignment_baseline === "bottom") {
            alignment_baseline_y_offset = 0;
        }
        var elt = makeSVGElement('text', {
            'x':(x || 0),
            'y':(y || 0) + alignment_baseline_y_offset,
            'font-size':size,
            'font-family':(family || 'serif'),
            'font-weight':(weight || 'normal'),
            'text-anchor':'start',
            'fill':fill
        });
        elt.textContent = content + '';
        return elt as SVGTextElement;
    },
    group: function(x:number|undefined,y:number|undefined) {
        x = x || 0;
        y = y || 0;
        return makeSVGElement('g', {
            'transform':'translate('+x+','+y+')'
        }) as SVGGElement;
    },
    svg: function(width:number|undefined, height:number|undefined) {
        return makeSVGElement('svg', {
            'width':(width || 0),
            'height':(height || 0),
        }) as SVGSVGElement;
    },
    wrapText: function(in_dom_text_svg_elt:SVGTextElement, width:number) {
        const text = in_dom_text_svg_elt.textContent;
        in_dom_text_svg_elt.textContent = "";

        const words = text.split(" ");
        let dy = 0;
        let tspan = makeSVGElement('tspan', {'x':'0', 'dy':dy}) as SVGTSpanElement;
        in_dom_text_svg_elt.appendChild(tspan);

        let curr_tspan_words:string[] = [];
        for (var i=0; i<words.length; i++) {
            curr_tspan_words.push(words[i]);
            tspan.textContent = curr_tspan_words.join(" ");
            if (tspan.getComputedTextLength() > width) {
                tspan.textContent = curr_tspan_words.slice(0, curr_tspan_words.length-1).join(" ");
                dy = in_dom_text_svg_elt.getBBox().height;
                curr_tspan_words = [words[i]];
                tspan = makeSVGElement('tspan', {'x':'0', 'dy':dy}) as SVGTSpanElement;
                in_dom_text_svg_elt.appendChild(tspan);
                tspan.textContent = words[i];
            }
        }
    },
    fromShape: function(oncoprint_shape_computed_params:ComputedShapeParams, offset_x:number, offset_y:number) {
        return shapeToSVG(oncoprint_shape_computed_params, offset_x, offset_y);
    },
    polygon: function(points:[number,number][], fill:string) {
        const parsedColor = extractColor(fill);
        return makeSVGElement('polygon', {'points': points, 'fill':parsedColor.rgb, 'fill-opacity':parsedColor.opacity}) as SVGPolygonElement;
    },
    rect: function(x:number,y:number,width:number,height:number,fill:string) {
        const parsedColor = extractColor(fill);
        return makeSVGElement('rect', {'x':x, 'y':y, 'width':width, 'height':height, 'fill':parsedColor.rgb, 'fill-opacity':parsedColor.opacity}) as SVGRectElement;
    },
    bgrect: function(width:number, height:number, fill:string) {
        const parsedColor = extractColor(fill);
        return makeSVGElement('rect', {'width':width, 'height':height, 'fill':parsedColor.rgb, 'fill-opacity':parsedColor.opacity}) as SVGRectElement;
    },
    path: function(points:[number,number][], stroke:string, fill:string, linearGradient:SVGGradientElement) {
        let pointsStrArray = points.map(function(pt) { return pt.join(","); });
        pointsStrArray[0] = 'M'+points[0];
        for (var i=1; i<points.length; i++) {
            pointsStrArray[i] = 'L'+points[i];
        }
        let parsedStroke, parsedFill;
        if (!linearGradient) {
            parsedStroke = extractColor(stroke);
            parsedFill = extractColor(fill);
        }
        return makeSVGElement('path', {
            'd': pointsStrArray.join(" "),
            'stroke': linearGradient ? 'url(#'+linearGradient.getAttribute('id')+')' : parsedStroke.rgb,
            'stroke-opacity': linearGradient ? 0 : parsedStroke.opacity,
            'fill': linearGradient ? 'url(#'+linearGradient.getAttribute('id')+')' : parsedFill.rgb,
            'fill-opacity': linearGradient ? 1 : parsedFill.opacity
        }) as SVGPathElement;
    },
    stop: function (offset:number, color:string) {
        const extracted = extractColor(color);
        return makeSVGElement('stop', {
            'offset': offset + '%',
            'stop-color': extracted.rgb,
            'stop-opacity': extracted.opacity
        }) as SVGStopElement;
    },
    linearGradient: function () {
        return makeSVGElement('linearGradient', {'id': 'linearGradient'+gradientId()}) as SVGLinearGradientElement;
    },
    defs: function() {
        return makeSVGElement('defs', {}) as SVGDefsElement;
    },
    gradient: function(colorFn:(val:number)=>string) {
        const gradient = makeSVGElement('linearGradient', {
            'id': 'gradient'+gradientId(),
            'x1':0,
            'y1':0,
            'x2':1,
            'y2':0
        });
        for (let i=0; i<=100; i++) {
            gradient.appendChild(
                this.stop(i, colorFn(i/100))
            );
        }
        return gradient as SVGLinearGradientElement
    }
};


