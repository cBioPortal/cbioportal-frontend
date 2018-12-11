start
	= Query
	/ sp { return false; }

NaturalNumber = number:[0-9]+ { return number.join("");}
Number = "-" number: Number { return "-"+number;}
        / whole_part:NaturalNumber "." decimal_part:NaturalNumber { return whole_part + "." + decimal_part;}
        / "." decimal_part:NaturalNumber { return "."+decimal_part;}
        / whole_part:NaturalNumber {return whole_part;}
String = word:[-_.@/a-zA-Z0-9*]+ { return word.join("") }
ProteinChangeCode = word:[-./a-zA-Z0-9*]+ { return word.join("") } // make sure we exclude underscore here, or else mutation modifiers like _GERMLINE will not be recognized for custom protein change codes
AminoAcid = letter:[GPAVLIMCFYWHKRQNEDST] { return letter; }
// any character, except " :
StringExceptQuotes = stringExceptQuotes:[^"]+ { return stringExceptQuotes.join("") }

sp = space:[ \t\r]+
msp = space:[ \t\r]*

zmbs = zero_or_more_breaks_and_spaces:[; \t\r\n]*
ombs = one_or_more_breaks_and_spaces:[; \t\r\n]+

StartMergedGenes
	= "[" zmbs "\"" label:StringExceptQuotes "\"" {return {"label": label, "list":[]};}
	/ "[" zmbs {return {"label": undefined, "list":[]};}

// Case-insensitive keywords
AMP = "AMP"i
HOMDEL = "HOMDEL"i
GAIN = "GAIN"i
HETLOSS = "HETLOSS"i
MUT = "MUT"i
EXP = "EXP"i
PROT = "PROT"i

// IMPORTANT GRAMMAR CONVENTION THAT MAKES THINGS WORK AND EASIER TO REASON ABOUT:
// Every object in a list (e.g. Query, MergedQuery, StandardQuery) only swallow spaces on the *left* (and in the inner part of the line).
// If they swallow spaces to the right *and* left, then we can get bugs, because this grammar engine works
//  by going through each definition top to bottom and choosing the first result it can make work to parse,
//  then proceeding. It doesn't backtrack. So queries that may seem valid will cause parser errors.
//
// FOR EXAMPLE: There was a bug like this:
//              Query = part1:Subquery ombs part2:Query { return part1.concat(part2); }
//                    / end:Subquery zmbs { return [end]; }
//
//              Subquery = zmbs gene:String zmbs { return gene; }
//
//  Where `ombs` means one or more breaks and spaces, `zmbs` means zero or more breaks and spaces
//  This means that "BRCA1 BRCA2" is not parseable. Trying to parse it:
//      (1) we enter into the Query definition
//      (2) we enter into Subquery, and successfully swallow "BRCA1 " and return "BRCA1"
//      (3) Now we have "BRCA2" but expect at least one space, so it fails.
//
//  Changing the `ombs` in the Query definition to `zmbs` doesn't work in general if you want to enforce a space between the objects in the list.
//

Query
	= mqr:MergedQuery ombs sqr:Query {return mqr.concat(sqr);}
	/ qr:StandardQuery ombs sqr:Query {return qr.concat(sqr);}
	/ mqr:MergedQuery zmbs {return mqr;}
	/ qr:StandardQuery zmbs {return qr; }

MergedQuery
	= zmbs mergedGenes:StartMergedGenes qr:StandardQuery zmbs "]" zmbs mqr:MergedQuery { mergedGenes.list = qr; return [mergedGenes].concat(mqr);; }
	/ zmbs mergedGenes:StartMergedGenes qr:StandardQuery zmbs "]" { mergedGenes.list = qr; return [mergedGenes]; }

StandardQuery
	= zmbs first:SingleGeneQuery ombs rest:StandardQuery  { return [first].concat(rest); }
	/ zmbs first:SingleGeneQuery { return [first]; }

SingleGeneQuery 
	= geneName:String msp ":" msp alts:Alterations { return {"gene": geneName, "alterations": alts}; }
	/ geneName:String { return {"gene": geneName, "alterations":false}; }

Alterations
	= a1:Alteration sp a2:Alterations { return [a1].concat(a2);}
	/ a1:Alteration { return [a1]; }

Alteration
	= cmd:CNACommand { return cmd; }
	/ cmd:EXPCommand { return cmd; }
	/ cmd:PROTCommand { return cmd; }
        / cmd:FUSIONCommand { return cmd; }
// MUT has to go at the end because it matches an arbitrary string at the end as a type of mutation
	/ cmd:MUTCommand { return cmd; }

CNAType
        = "AMP"i { return "AMP"; }
        / "HOMDEL"i { return "HOMDEL"; }
        / "GAIN"i { return "GAIN"; }
        / "HETLOSS"i { return "HETLOSS"; }

CNACommand
	= "CNA"i msp op:ComparisonOp msp constrval:CNAType { return {"alteration_type":"cna", "constr_rel":op, "constr_val":constrval}; }
        / constrval:CNAType { return {"alteration_type":"cna", "constr_rel":"=", "constr_val":constrval}; }

MUTCommand
	= "MUT" msp "=" msp mutation:MutationWithModifiers { return {"alteration_type":"mut", "constr_rel": "=", "constr_type":mutation.type, "constr_val":mutation.value, "info":mutation.info, modifiers: mutation.modifiers}; }
	/ "MUT" msp "!=" msp mutation:MutationWithModifiers { return {"alteration_type":"mut", "constr_rel": "!=", "constr_type":mutation.type, "constr_val":mutation.value, "info":mutation.info, modifiers: mutation.modifiers}; }
	/ "MUT" modifiers:MutationModifiers { return {"alteration_type":"mut", "info":{}, "modifiers":modifiers}; }
	/ "MUT" { return {"alteration_type":"mut", "info":{}, "modifiers":[]}; }
	/ mutation:MutationWithModifiers {
	        if (mutation.type) {
	            return {"alteration_type":"mut", "constr_rel": "=", "constr_type":mutation.type, "constr_val":mutation.value, "info":mutation.info, modifiers: mutation.modifiers};
            } else {
                return {"alteration_type":"mut", "info":{}, "modifiers": mutation.modifiers};
            }
        }

EXPCommand
	= "EXP" msp op:ComparisonOp msp constrval:Number { return {"alteration_type":"exp", "constr_rel":op, "constr_val":parseFloat(constrval)}; }

FUSIONCommand
        = "FUSION" { return {"alteration_type":"fusion"}; }

PROTCommand
	= "PROT" msp op:ComparisonOp msp constrval:Number { return {"alteration_type":"prot", "constr_rel":op, "constr_val":parseFloat(constrval)}; }

ComparisonOp
	= ">=" { return ">="; }
	/ "<=" { return "<="; }
	/ ">" { return ">"; }
	/ "<" { return "<"; }

MutationWithModifiers
    = modifiersThenMaybeMutation:ModifiersThenMaybeMutation { return modifiersThenMaybeMutation; } // this has to come first because mutation matches every string as protein change code
    / mutation:Mutation "_" modifiers:MutationModifiers { mutation.modifiers = modifiers; return mutation; }
    / mutation:Mutation { mutation.modifiers = []; return mutation; }

ModifiersThenMaybeMutation
    // the order here is important: first we check for modifier + lookahead to ensure theres another modifier, next for modifier + mutation (mutation swallows all strings, so this has to come after), finally a modifier alone
    = modifier:MutationModifier "_" &MutationModifier modifiersThenMaybeMutation:ModifiersThenMaybeMutation { modifiersThenMaybeMutation.modifiers.unshift(modifier); return modifiersThenMaybeMutation; }
    / modifier:MutationModifier "_" mutation:Mutation { mutation.modifiers = [modifier]; return mutation; }
    / modifier:MutationModifier { return { modifiers: [modifier] }; }

MutationModifiers
    = modifier:MutationModifier "_" more:MutationModifiers { return [modifier].concat(more); }
    / modifier:MutationModifier { return [modifier]; }

Mutation
	= "MISSENSE"i { return {"type":"class", "value":"MISSENSE", "info":{}}; }
	/ "NONSENSE"i { return {"type":"class", "value":"NONSENSE", "info":{}}; }
	/ "NONSTART"i { return {"type":"class", "value":"NONSTART", "info":{}}; }
	/ "NONSTOP"i { return {"type":"class", "value":"NONSTOP", "info":{}}; }
	/ "FRAMESHIFT"i { return {"type":"class", "value":"FRAMESHIFT", "info":{}}; }
	/ "INFRAME"i { return {"type":"class", "value":"INFRAME", "info":{}}; }
	/ "SPLICE"i { return {"type":"class", "value":"SPLICE", "info":{}}; }
	/ "TRUNC"i { return {"type":"class", "value":"TRUNC", "info":{}}; }
    / "PROMOTER"i { return {"type":"class", "value":"PROMOTER", "info":{}}; }
    / letter:AminoAcid position:NaturalNumber string:String { return {"type":"name" , "value":(letter+position+string), "info":{}};}
    / letter:AminoAcid position:NaturalNumber { return {"type":"position", "value":parseInt(position), "info":{"amino_acid":letter.toUpperCase()}}; }
	/ mutation_name:ProteinChangeCode { return {"type":"name", "value":mutation_name, "info":{"unrecognized":true}}; }

MutationModifier
    = "GERMLINE"i { return "GERMLINE";}
    / "SOMATIC"i { return "SOMATIC";}
