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

export declare function parse(str:string):OQLQuery | undefined;

// start
// 	= Query
// 	/ sp { return false; }
//
// br	= [\n] b:br
//         / ";" b:br
//         / [\n]
// 	/ ";"
//
// NaturalNumber = number:[0-9]+ { return number.join("");}
// Number = "-" number: Number { return "-"+number;}
//         / whole_part:NaturalNumber "." decimal_part:NaturalNumber { return whole_part + "." + decimal_part;}
//         / "." decimal_part:NaturalNumber { return "."+decimal_part;}
//         / whole_part:NaturalNumber {return whole_part;}
// String = word:[-_.@/a-zA-Z0-9*]+ { return word.join("") }
// AminoAcid = letter:[GPAVLIMCFYWHKRQNEDST] { return letter; }
export declare type AminoAcid = 'G'|'P'|'A'|'V'|'L'|'I'|'M'|'C'|'F'|'Y'|'W'|'H'|'K'|'R'|'Q'|'N'|'E'|'D'|'S'|'T';
//
// sp = space:[ \t\r]+
// msp = space:[ \t\r]*
//
//
// // Case-insensitive keywords
// AMP = "AMP"i
// HOMDEL = "HOMDEL"i
// GAIN = "GAIN"i
// HETLOSS = "HETLOSS"i
// MUT = "MUT"i
// EXP = "EXP"i
// PROT = "PROT"i
//
// Query
// 	= listofgenes:ListOfGenes msp br rest:Query { return listofgenes.map(function(gene) { return {"gene":gene, "alterations":false}; }).concat(rest); }
//         / listofgenes:ListOfGenes msp br { return listofgenes.map(function(gene) { return {"gene":gene, "alterations":false}; }); }
//         / listofgenes:ListOfGenes msp { return listofgenes.map(function(gene) { return {"gene":gene, "alterations":false}; }); }
// 	/ msp first:SingleGeneQuery msp br rest:Query  { return [first].concat(rest); }
// 	/ msp first:SingleGeneQuery msp br { return [first]; }
// 	/ msp first:SingleGeneQuery msp { return [first]; }
export declare type OQLQuery = SingleGeneQuery[];
//
// ListOfGenes
// 	= msp geneName:String msp rest:ListOfGenes { return [geneName].concat(rest);}
// 	/ msp geneName1:String msp geneName2:String msp{ return [geneName1, geneName2]; }
//
// SingleGeneQuery
// 	= geneName:String msp ":" msp alts:Alterations { return {"gene": geneName, "alterations": alts}; }
// 	/ geneName:String { return {"gene": geneName, "alterations":false}; }
export declare type SingleGeneQuery = {gene:string, alterations:false|Alteration[]};
//
// Alterations
// 	= a1:Alteration sp a2:Alterations { return [a1].concat(a2);}
// 	/ a1:Alteration { return [a1]; }
//
// Alteration
// 	= cmd:CNACommand { return cmd; }
// 	/ cmd:EXPCommand { return cmd; }
// 	/ cmd:PROTCommand { return cmd; }
//         / cmd:FUSIONCommand { return cmd; }
// // MUT has to go at the end because it matches an arbitrary string at the end as a type of mutation
// 	/ cmd:MUTCommand { return cmd; }
export declare type Alteration = CNACommand | EXPCommand | PROTCommand | FUSIONCommand | MUTCommand<Mutation>;
//
// CNAType
//         = "AMP"i { return "AMP"; }
//         / "HOMDEL"i { return "HOMDEL"; }
//         / "GAIN"i { return "GAIN"; }
//         / "HETLOSS"i { return "HETLOSS"; }
export declare type CNAType = 'AMP' | 'HOMDEL' | 'GAIN' | 'HETLOSS';
//
// CNACommand
// 	= "CNA"i msp op:ComparisonOp msp constrval:CNAType { return {"alteration_type":"cna", "constr_rel":op, "constr_val":constrval}; }
//         / constrval:CNAType { return {"alteration_type":"cna", "constr_rel":"=", "constr_val":constrval}; }
export declare type CNACommand = {alteration_type:'cna', constr_rel:ComparisonOp, constr_val:CNAType};
//
// MUTCommand
// 	= "MUT" msp "=" msp mutation:Mutation { return {"alteration_type":"mut", "constr_rel": "=", "constr_type":mutation.type, "constr_val":mutation.value, "info":mutation.info}; }
// 	/ "MUT" msp "!=" msp mutation:Mutation { return {"alteration_type":"mut", "constr_rel": "!=", "constr_type":mutation.type, "constr_val":mutation.value, "info":mutation.info}; }
// 	/ "MUT" { return {"alteration_type":"mut"}; }
// 	/ mutation:Mutation { return {"alteration_type":"mut", "constr_rel": "=", "constr_type":mutation.type, "constr_val":mutation.value, "info":mutation.info}; }
export declare type MUTCommand<M extends Mutation> = (
	{alteration_type:'mut'} |
	{alteration_type:'mut', constr_rel:'='|'!=', constr_type:M['type'], constr_val:M['value'], info:M['info']}
);
//
// EXPCommand
// 	= "EXP" msp op:ComparisonOp msp constrval:Number { return {"alteration_type":"exp", "constr_rel":op, "constr_val":parseFloat(constrval)}; }
export declare type EXPCommand = {alteration_type:'exp', constr_rel:ComparisonOp, constr_val:number};
//
// FUSIONCommand
//         = "FUSION" { return {"alteration_type":"fusion"}; }
export declare type FUSIONCommand = {alteration_type:'fusion'};
//
// PROTCommand
// 	= "PROT" msp op:ComparisonOp msp constrval:Number { return {"alteration_type":"prot", "constr_rel":op, "constr_val":parseFloat(constrval)}; }
export declare type PROTCommand = {alteration_type:'prot', constr_rel:ComparisonOp, constr_val:number};
//
// ComparisonOp
// 	= ">=" { return ">="; }
// 	/ "<=" { return "<="; }
// 	/ ">" { return ">"; }
// 	/ "<" { return "<"; }
export declare type ComparisonOp = '>=' | '<=' | '>' | '<';
//
// Mutation
// 	= "MISSENSE"i { return {"type":"class", "value":"MISSENSE", "info":{}}; }
// 	/ "NONSENSE"i { return {"type":"class", "value":"NONSENSE", "info":{}}; }
// 	/ "NONSTART"i { return {"type":"class", "value":"NONSTART", "info":{}}; }
// 	/ "NONSTOP"i { return {"type":"class", "value":"NONSTOP", "info":{}}; }
// 	/ "FRAMESHIFT"i { return {"type":"class", "value":"FRAMESHIFT", "info":{}}; }
// 	/ "INFRAME"i { return {"type":"class", "value":"INFRAME", "info":{}}; }
// 	/ "SPLICE"i { return {"type":"class", "value":"SPLICE", "info":{}}; }
// 	/ "TRUNC"i { return {"type":"class", "value":"TRUNC", "info":{}}; }
//         / "PROMOTER"i { return {"type":"class", "value":"PROMOTER", "info":{}}; }
//         / letter:AminoAcid position:NaturalNumber string:String { return {"type":"name" , "value":(letter+position+string), "info":{}};}
//         / letter:AminoAcid position:NaturalNumber { return {"type":"position", "value":parseInt(position), "info":{"amino_acid":letter.toUpperCase()}}; }
// 	/ mutation_name:String { return {"type":"name", "value":mutation_name, "info":{}}; }
export declare type MutationType = 'MISSENSE'|'NONSENSE'|'NONSTART'|'NONSTOP'|'FRAMESHIFT'|'INFRAME'|'SPLICE'|'TRUNC'|'PROMOTER';
export declare type Mutation = (
	{type:'class', value:MutationType, info:object} |
	{type:'name', value:string, info:object} |
	{type:'position', value:number, info:{amino_acid:AminoAcid}}
);
