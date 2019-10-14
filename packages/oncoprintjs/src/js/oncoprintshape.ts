import {Datum} from "./oncoprintmodel";

type StringOnlyParameter = "stroke" | "fill" | "type";
type StringOrNumberParameter = "width" | "height" | "x" | "y" | "z" | "x1" | "x2" | "x3" | "y1" | "y2" | "y3" | "stroke-width" | "stroke-opacity";
type Parameter = StringOnlyParameter | StringOrNumberParameter;

const default_parameter_values:{[x in StringOnlyParameter]?:string} & {[x in StringOrNumberParameter]?:string|number} = {
    'width': '100%',
    'height': '100%',
    'x': '0%',
    'y': '0%',
    'z': 0,
    'x1': '0%',
    'x2': '0%',
    'x3': '0%',
    'y1': '0%',
    'y2': '0%',
    'y3': '0%',
    'stroke': 'rgba(0,0,0,0)',
    'fill': 'rgba(23,23,23,1)',
    'stroke-width': '0',
    'stroke-opacity': '0'
};
const parameter_name_to_dimension_index:{[x in Parameter]?:number} = {
    'stroke-width':0,
    'width': 0,
    'x':0,
    'x1':0,
    'x2':0,
    'x3':0,
    'height':1,
    'y':1,
    'y1':1,
    'y2':1,
    'y3':1
};

const hash_parameter_order:Parameter[] = [
    "width", "height", "x", "y", "z", "x1", "x2", "x3", "y1", "y2", "y3", "stroke", "fill", "stroke-width", "stroke-opacity", "type"
];

type ParamFunction = (d:Datum)=>(string|number);
export type ShapeParams = {[x in StringOnlyParameter]?:string|ParamFunction} & {[x in StringOrNumberParameter]?:string|number|ParamFunction};
type ShapeParamsWithType = {[x in Parameter]?:({ type:"function", value:ParamFunction} | {type:"value", value:string|number})};
export type ComputedShapeParams = {[x in StringOnlyParameter]?:string} & {[x in StringOrNumberParameter]?:string|number};

export class Shape {

    private static cache:{[hash:string]:ComputedShapeParams} = {}; // shape cache to reuse objects and thus save memory
    private params_with_type:ShapeParamsWithType = {};

    constructor(private params:ShapeParams) {
        this.completeWithDefaults();
        this.markParameterTypes();
    }

    public static hashComputedShape(computed_params:ComputedShapeParams, z_index?:number|string) {
        return hash_parameter_order.reduce(function (hash:string, param_name:Parameter) {
            return hash + "," + computed_params[param_name];
        }, "") + "," + z_index;
    }

    private static getCachedShape(computed_params:ComputedShapeParams) {
        const hash = Shape.hashComputedShape(computed_params);
        Shape.cache[hash] = Shape.cache[hash] || Object.freeze(computed_params);
        return Shape.cache[hash];
    }

    public getRequiredParameters():Parameter[] {
        throw "Not defined for base class";
    }

    public completeWithDefaults() {
        const required_parameters = this.getRequiredParameters();
        for (let i=0; i<required_parameters.length; i++) {
            const param = required_parameters[i];
            this.params[param] = (typeof this.params[param] === 'undefined' ? default_parameter_values[param] : this.params[param]) as any;
        }
    }
    public markParameterTypes() {
        const parameters = Object.keys(this.params) as Parameter[];
        for (let i=0; i<parameters.length; i++) {
            const param_name = parameters[i];
            const param_val = this.params[param_name];
            if (typeof param_val === 'function') {
                this.params_with_type[param_name] = {'type':'function', 'value':param_val};
            } else {
                this.params_with_type[param_name] = {'type':'value', 'value': param_val};
            }
        }
    }
    public getComputedParams(d:Datum, base_width:number, base_height:number) {
        const computed_params:Partial<ComputedShapeParams> = {};
        const param_names = Object.keys(this.params_with_type) as Parameter[];
        const dimensions:[number, number] = [base_width, base_height];
        for (let i=0; i<param_names.length; i++) {
            const param_name = param_names[i];
            const param_val_map = this.params_with_type[param_name];
            let param_val = param_val_map.value;
            if (param_name !== 'type') {
                if (param_val_map.type === 'function') {
                    param_val = (param_val as ParamFunction)(d);
                }
                if (typeof param_val === "string" && param_val[param_val.length-1] === '%') {
                    // compute value as percentage of width or height

                    // check a couple of commonly-used special cases to avoid slower parseFloat
                    if (param_val === '100%') {
                        param_val = 1;
                    } else {
                        param_val = parseFloat(param_val) / 100;
                    }
                    param_val *= dimensions[parameter_name_to_dimension_index[param_name]];
                }
            }
            computed_params[param_name] = param_val as any;
        }
        return Shape.getCachedShape(computed_params);
    };
}

export class Rectangle extends Shape {
    public getRequiredParameters(): Parameter[] {
        return ['width', 'height', 'x', 'y', 'z', 'stroke', 'fill', 'stroke-width'];
    }
}

export class Triangle extends Shape {
    public getRequiredParameters(): Parameter[] {
        return ['x1', 'x2', 'x3', 'y1', 'y2', 'y3', 'z', 'stroke', 'fill', 'stroke-width'];
    }
}

export class Ellipse extends Shape {
    public getRequiredParameters(): Parameter[] {
        return ['width', 'height', 'x', 'y', 'z', 'stroke', 'fill', 'stroke-width'];
    }
}

export class Line extends Shape {
    public getRequiredParameters(): Parameter[] {
        return ['x1', 'x2', 'y1', 'y2', 'z', 'stroke', 'stroke-width'];
    }
}