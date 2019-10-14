import {ComputedShapeParams} from "./oncoprintshape";

const halfsqrt2 = Math.sqrt(2) / 2;

function extractRGBA(str:string):[number,number,number,number] {
    let ret:[number,number,number,number] = [0, 0, 0, 1];
    if (str[0] === "#") {
        // hex, convert to rgba
        const r = parseInt(str[1] + str[2], 16);
        const g = parseInt(str[3] + str[4], 16);
        const b = parseInt(str[5] + str[6], 16);
        str = 'rgba('+r+','+g+','+b+',1)';
    }
    const match = str.match(/^[\s]*rgba\([\s]*([0-9]+)[\s]*,[\s]*([0-9]+)[\s]*,[\s]*([0-9]+)[\s]*,[\s]*([0-9.]+)[\s]*\)[\s]*$/);
    if (match && match.length === 5) {
        ret = [parseFloat(match[1]) / 255,
            parseFloat(match[2]) / 255,
            parseFloat(match[3]) / 255,
            parseFloat(match[4])];
    }
    return ret;
}

type AddVertexCallback = (vertex:[number,number,number], color:[number,number,number,number])=>void;

function rectangleToVertexes(params:ComputedShapeParams, z_index:number, addVertex:AddVertexCallback) {
    const x = parseFloat(params.x as any), y = parseFloat(params.y as any), height = parseFloat(params.height as any), width = parseFloat(params.width as any);

    // Fill
    const fill_rgba = extractRGBA(params.fill);
    addVertex([x,y,z_index], fill_rgba);
    addVertex([x+width, y, z_index], fill_rgba);
    addVertex([x+width, y+height, z_index], fill_rgba);

    addVertex([x,y,z_index], fill_rgba);
    addVertex([x+width, y+height, z_index], fill_rgba);
    addVertex([x,y+height,z_index],fill_rgba);

    // Stroke
    const stroke_width = parseFloat(params['stroke-width'] as any);
    if (stroke_width > 0) {
        // left side
        const stroke_rgba = extractRGBA(params.stroke);
        addVertex([x, y, z_index], stroke_rgba);
        addVertex([x + stroke_width, y, z_index], stroke_rgba);
        addVertex([x + stroke_width, y + height, z_index], stroke_rgba);

        addVertex([x, y, z_index], stroke_rgba);
        addVertex([x + stroke_width, y + height, z_index], stroke_rgba);
        addVertex([x, y + height, z_index], stroke_rgba);

        // right side
        addVertex([x + width, y, z_index], stroke_rgba);
        addVertex([x + width - stroke_width, y, z_index], stroke_rgba);
        addVertex([x + width - stroke_width, y + height, z_index], stroke_rgba);

        addVertex([x + width, y, z_index], stroke_rgba);
        addVertex([x + width - stroke_width, y + height, z_index], stroke_rgba);
        addVertex([x + width, y + height, z_index], stroke_rgba);

        // top side
        addVertex([x, y, z_index], stroke_rgba);
        addVertex([x + width, y, z_index], stroke_rgba);
        addVertex([x + width, y + stroke_width, z_index], stroke_rgba);

        addVertex([x, y, z_index], stroke_rgba);
        addVertex([x + width, y + stroke_width, z_index], stroke_rgba);
        addVertex([x, y + stroke_width, z_index], stroke_rgba);

        // bottom side
        addVertex([x, y + height, z_index], stroke_rgba);
        addVertex([x + width, y + height, z_index], stroke_rgba);
        addVertex([x + width, y + height - stroke_width, z_index], stroke_rgba);

        addVertex([x, y + height, z_index], stroke_rgba);
        addVertex([x + width, y + height - stroke_width, z_index], stroke_rgba);
        addVertex([x, y + height - stroke_width, z_index], stroke_rgba);
    }
}

function triangleToVertexes(params:ComputedShapeParams, z_index:number, addVertex:AddVertexCallback) {
    const fill_rgba = extractRGBA(params.fill);
    addVertex([parseFloat(params.x1 as any), parseFloat(params.y1 as any), z_index], fill_rgba);
    addVertex([parseFloat(params.x2 as any), parseFloat(params.y2 as any), z_index], fill_rgba);
    addVertex([parseFloat(params.x3 as any), parseFloat(params.y3 as any), z_index], fill_rgba);
}

function ellipseToVertexes(params:ComputedShapeParams, z_index:number, addVertex:AddVertexCallback) {
    const center = {x: parseFloat(params.x as any) + parseFloat(params.width as any) / 2, y: parseFloat(params.y as any) + parseFloat(params.height as any) / 2};
    const horzrad = parseFloat(params.width as any) / 2;
    const vertrad = parseFloat(params.height as any) / 2;

    const fill_rgba = extractRGBA(params.fill);
    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex([center.x + horzrad, center.y, z_index], fill_rgba);
    addVertex([center.x + halfsqrt2 * horzrad, center.y + halfsqrt2 * vertrad, z_index], fill_rgba);

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex([center.x + halfsqrt2 * horzrad, center.y + halfsqrt2 * vertrad, z_index], fill_rgba);
    addVertex([center.x, center.y + vertrad, z_index], fill_rgba);

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex([center.x, center.y + vertrad, z_index], fill_rgba);
    addVertex([center.x - halfsqrt2 * horzrad, center.y + halfsqrt2 * vertrad, z_index], fill_rgba);

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex([center.x - halfsqrt2 * horzrad, center.y + halfsqrt2 * vertrad, z_index], fill_rgba);
    addVertex([center.x - horzrad, center.y, z_index], fill_rgba);

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex([center.x - horzrad, center.y, z_index], fill_rgba);
    addVertex([center.x - halfsqrt2 * horzrad, center.y - halfsqrt2 * vertrad, z_index], fill_rgba);

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex([center.x - halfsqrt2 * horzrad, center.y - halfsqrt2 * vertrad, z_index], fill_rgba);
    addVertex([center.x, center.y - vertrad, z_index], fill_rgba);

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex([center.x, center.y - vertrad, z_index], fill_rgba);
    addVertex([center.x + halfsqrt2 * horzrad, center.y - halfsqrt2 * vertrad, z_index], fill_rgba);

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex([center.x + halfsqrt2 * horzrad, center.y - halfsqrt2 * vertrad, z_index], fill_rgba);
    addVertex([center.x + horzrad, center.y, z_index], fill_rgba);
}

function lineToVertexes(params:ComputedShapeParams, z_index:number, addVertex:AddVertexCallback) {
    // For simplicity of dealing with webGL we'll implement lines as thin triangle pairs
    let x1 = parseFloat(params.x1 as any);
    let x2 = parseFloat(params.x2 as any);
    let y1 = parseFloat(params.y1 as any);
    let y2 = parseFloat(params.y2 as any);

    if (x1 !== x2) {
        // WLOG make x1,y1 the one on the left
        if (Math.min(x1, x2) === x2) {
            const tmpx1 = x1;
            const tmpy1 = y1;
            x1 = x2;
            y1 = y2;
            x2 = tmpx1;
            y2 = tmpy1;
        }
    }

    const perpendicular_vector = [y2 - y1, x1 - x2];
    const perpendicular_vector_length = Math.sqrt(perpendicular_vector[0] * perpendicular_vector[0] + perpendicular_vector[1] * perpendicular_vector[1]);
    const unit_perp_vector = [perpendicular_vector[0] / perpendicular_vector_length, perpendicular_vector[1] / perpendicular_vector_length];

    const half_stroke_width = parseFloat(params['stroke-width'] as any) / 2;
    const direction1 = [unit_perp_vector[0] * half_stroke_width, unit_perp_vector[1] * half_stroke_width];
    const direction2 = [direction1[0] * -1, direction1[1] * -1];
    const A = [x1 + direction1[0], y1 + direction1[1]];
    const B = [x1 + direction2[0], y1 + direction2[1]];
    const C = [x2 + direction1[0], y2 + direction1[1]];
    const D = [x2 + direction2[0], y2 + direction2[1]];

    const stroke_rgba = extractRGBA(params.stroke);
    addVertex([A[0], A[1], z_index], stroke_rgba);
    addVertex([B[0], B[1], z_index], stroke_rgba);
    addVertex([C[0], C[1], z_index], stroke_rgba);

    addVertex([C[0], C[1], z_index], stroke_rgba);
    addVertex([D[0], D[1], z_index], stroke_rgba);
    addVertex([B[0], B[1], z_index], stroke_rgba);
}

export default function(oncoprint_shape_computed_params:ComputedShapeParams, z_index:number, addVertex:AddVertexCallback) {
    // target_position_array is an array with 3-d float vertexes
    // target_color_array is an array with rgba values in [0,1]
    // We pass them in to save on concatenation costs

    const type = oncoprint_shape_computed_params.type;
    if (type === "rectangle") {
        return rectangleToVertexes(oncoprint_shape_computed_params, z_index, addVertex);
    } else if (type === "triangle") {
        return triangleToVertexes(oncoprint_shape_computed_params, z_index, addVertex);
    } else if (type === "ellipse") {
        return ellipseToVertexes(oncoprint_shape_computed_params, z_index, addVertex);
    } else if (type === "line") {
        return lineToVertexes(oncoprint_shape_computed_params, z_index, addVertex);
    }
}