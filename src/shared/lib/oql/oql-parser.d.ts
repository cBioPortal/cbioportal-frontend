export declare class SyntaxError
{
	constructor(message:string, expected:string, found:string, offset:number, line:number, column:number);

	message: string;
	expected: string;
	found: string;
	offset: number;
	line: number;
	column: number;
	name: "SyntaxError";
}

export declare function parse(str:string):{gene: string}[] | undefined;
