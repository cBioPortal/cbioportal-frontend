import oql_parser, {OQLQuery} from './oql-parser';
import {assert} from "chai";

function doTest(query:string, expectedParsedResult:OQLQuery) {
    it(query, ()=>{
        assert.deepEqual(expectedParsedResult, oql_parser.parse(query));
    });
}

describe("OQL parser", ()=>{
    doTest("     TP53", [{gene:"TP53", alterations:false}]);
    doTest("                      [TP53 BRCA1] NRAS",
        [
            {
                "label": undefined,
                "list": [
                    {
                        "gene": "TP53",
                        "alterations": false
                    },
                    {
                        "gene": "BRCA1",
                        "alterations": false
                    }
                ]
            },
            {
                "gene": "NRAS",
                "alterations": false
            }
        ]);
    doTest("TP53", [{gene:"TP53", alterations:false}]);
    doTest("TP53;", [{gene:"TP53", alterations:false}]);
    doTest("TP53\n", [{gene:"TP53", alterations:false}]);
    doTest("TP53 BRCA1 KRAS NRAS", [{gene:"TP53", alterations:false}, {gene:"BRCA1", alterations:false}, {gene:"KRAS", alterations:false}, {gene:"NRAS", alterations:false}]);
    doTest("TP53: MUT BRCA1", [{gene:"TP53", alterations:[{alteration_type:"mut", info:{}, modifiers:[]}, {alteration_type:"mut", constr_rel:"=", constr_type:"name", constr_val:"BRCA1", info:{unrecognized:true}, modifiers:[]}]}]);
    doTest("TP53:MUT", [{gene:"TP53", alterations:[{alteration_type: "mut", info:{}, modifiers:[]}]}])
    doTest("TP53: GERMLINE", [{gene:"TP53", alterations:[{alteration_type:"mut", info:{}, modifiers:["GERMLINE"]}]}]);
    doTest("TP53: GERMLINE_SOMATIC", [{gene:"TP53", alterations:[{alteration_type:"mut", info:{}, modifiers:["GERMLINE", "SOMATIC"]}]}]);
    doTest("TP53: proteinchangecode", [{gene:"TP53", alterations:[{alteration_type:"mut", constr_type:"name", constr_rel:"=", constr_val:"proteinchangecode", info:{unrecognized:true}, modifiers:[]}]}]);
    doTest("TP53: proteinchangecode_GERMLINE", [{gene:"TP53", alterations:[{alteration_type:"mut", constr_type:"name", constr_rel:"=", constr_val:"proteinchangecode", info:{unrecognized:true}, modifiers:["GERMLINE"]}]}]);
    doTest("TP53:MISSENSE_GERMLINE", [{gene:"TP53", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "MISSENSE", info: {}, modifiers:["GERMLINE"]}]}])
    doTest("TP53:MISSENSE_GERMLINE_SOMATIC", [{gene:"TP53", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "MISSENSE", info: {}, modifiers:["GERMLINE", "SOMATIC"]}]}])
    doTest("TP53:GERMLINE_MISSENSE", [{gene:"TP53", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "MISSENSE", info: {}, modifiers:["GERMLINE"]}]}])
    doTest("TP53:GERMLINE_SOMATIC_MISSENSE", [{gene:"TP53", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "MISSENSE", info: {}, modifiers:["GERMLINE", "SOMATIC"]}]}])
    doTest("TP53:MISSENSE_GERMLINE PROMOTER", [{gene:"TP53", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "MISSENSE", info: {}, modifiers:["GERMLINE"]},{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "PROMOTER", info: {}, modifiers:[]}]}])
    doTest("TP53:MISSENSE_GERMLINE PROMOTER_SOMATIC", [{gene:"TP53", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "MISSENSE", info: {}, modifiers:["GERMLINE"]},{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "PROMOTER", info: {}, modifiers:["SOMATIC"]}]}])
    doTest("TP53:MISSENSE PROMOTER_GERMLINE", [{gene:"TP53", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "MISSENSE", info: {}, modifiers:[]},{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "PROMOTER", info: {}, modifiers:["GERMLINE"]}]}])
    doTest("TP53:MISSENSE GERMLINE_PROMOTER", [{gene:"TP53", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "MISSENSE", info: {}, modifiers:[]},{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "PROMOTER", info: {}, modifiers:["GERMLINE"]}]}])
    doTest("TP53:SOMATIC GERMLINE_PROMOTER", [{gene:"TP53", alterations:[{alteration_type: "mut", info: {}, modifiers:["SOMATIC"]},{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "PROMOTER", info: {}, modifiers:["GERMLINE"]}]}])
    doTest("TP53:MISSENSE PROMOTER", [{gene:"TP53", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "MISSENSE", info: {}, modifiers:[]},{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "PROMOTER", info: {}, modifiers:[]}]}])
    doTest("TP53:MUT;", [{gene:"TP53", alterations:[{alteration_type: "mut", info:{}, modifiers:[]}]}])
    doTest("TP53:MUT\n", [{gene:"TP53", alterations:[{alteration_type: "mut", info:{}, modifiers:[]}]}])
    doTest("TP53:MUT; BRCA1: gAiN hetloss EXP>=3 PROT<1", [{gene:"TP53", alterations:[{alteration_type: "mut", info:{}, modifiers:[]}]},
        {gene:"BRCA1", alterations:[{alteration_type: "cna", constr_rel: "=", constr_val: "GAIN"},
            {alteration_type: "cna", constr_rel: "=", constr_val: "HETLOSS"},
            {alteration_type: "exp", constr_rel: ">=", constr_val: 3},
            {alteration_type: "prot", constr_rel: "<", constr_val: 1}]}])
    doTest("TP53:MUT;;;\n BRCA1: AMP HOMDEL EXP>=3 PROT<1", [{gene:"TP53", alterations:[{alteration_type: "mut", info:{}, modifiers:[]}]},
        {gene:"BRCA1", alterations:[{alteration_type: "cna", constr_rel: "=", constr_val: "AMP"},
            {alteration_type: "cna", constr_rel: "=", constr_val: "HOMDEL"},
            {alteration_type: "exp", constr_rel: ">=", constr_val: 3},
            {alteration_type: "prot", constr_rel: "<", constr_val: 1}]}])
    doTest("TP53:MUT;\n BRCA1: amp GAIN EXP>=3 PROT<1", [{gene:"TP53", alterations:[{alteration_type: "mut", info:{}, modifiers:[]}]},
        {gene:"BRCA1", alterations:[{alteration_type: "cna", constr_rel: "=", constr_val: "AMP"},
            {alteration_type: "cna", constr_rel: "=", constr_val: "GAIN"},
            {alteration_type: "exp", constr_rel: ">=", constr_val: 3},
            {alteration_type: "prot", constr_rel: "<", constr_val: 1}]}])
    doTest("TP53:MUT\n BRCA1: AMP HOMDEL EXP>=3 PROT<1;", [{gene:"TP53", alterations:[{alteration_type: "mut", info:{}, modifiers:[]}]},
        {gene:"BRCA1", alterations:[{alteration_type: "cna", constr_rel: "=", constr_val: "AMP"},
            {alteration_type: "cna", constr_rel: "=", constr_val: "HOMDEL"},
            {alteration_type: "exp", constr_rel: ">=", constr_val: 3},
            {alteration_type: "prot", constr_rel: "<", constr_val: 1}]}])

    doTest("TP53:PROT<=-2\n", [{gene:"TP53", alterations:[{alteration_type: "prot", constr_rel: "<=", constr_val:-2}]}])

    doTest("BRAF:MUT=V600E", [{gene:"BRAF", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type:"name", constr_val:"V600E", info:{}, modifiers:[]}]}])
    doTest("BRAF:MUT=V600", [{gene:"BRAF", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type:"position", constr_val:600, info:{amino_acid:"V"}, modifiers:[]}]}])
    doTest("BRAF:FUSION MUT=V600", [{gene:"BRAF", alterations:[{alteration_type:'fusion'}, {alteration_type: "mut", constr_rel: "=", constr_type:"position", constr_val:600, info:{"amino_acid":"V"}, modifiers:[]}]}])
    doTest("BRAF:FUSION", [{gene:"BRAF", alterations:[{alteration_type:'fusion'}]}])
    doTest("MIR-493*:MUT=V600", [{gene:"MIR-493*", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type:"position", constr_val:600, info:{amino_acid:"V"}, modifiers:[]}]}])

    doTest("BRAF:CNA >= gain", [{gene:"BRAF", alterations:[{alteration_type:"cna", constr_rel:">=", constr_val:"GAIN"}]}])
    doTest("BRAF:CNA < homdel", [{gene:"BRAF", alterations:[{alteration_type:"cna", constr_rel:"<", constr_val:"HOMDEL"}]}])

    doTest("[TP53 BRCA1] NRAS",
        [
            {
                "label": undefined,
                "list": [
                    {
                        "gene": "TP53",
                        "alterations": false
                    },
                    {
                        "gene": "BRCA1",
                        "alterations": false
                    }
                ]
            },
            {
                "gene": "NRAS",
                "alterations": false
            }
        ]);

    doTest("NRAS [TP53 BRCA1]",
        [
            {
                "gene": "NRAS",
                "alterations": false
            },
            {
                "label": undefined,
                "list": [
                    {
                        "gene": "TP53",
                        "alterations": false
                    },
                    {
                        "gene": "BRCA1",
                        "alterations": false
                    }
                ]
            }
        ]);

    doTest("NRAS [TP53 BRCA1] BRCA2",
        [
            {
                "gene": "NRAS",
                "alterations": false
            },
            {
                "label": undefined,
                "list": [
                    {
                        "gene": "TP53",
                        "alterations": false
                    },
                    {
                        "gene": "BRCA1",
                        "alterations": false
                    }
                ]
            },
            {
                "gene": "BRCA2",
                "alterations": false
            }
        ]);

    doTest("[TP53;BRAF:MUT=V600E;KRAS] NRAS",
        [
            {
                "label": undefined,
                "list": [
                    {
                        "gene": "TP53",
                        "alterations": false
                    },
                    {
                        "gene": "BRAF",
                        "alterations": [
                            {
                                "alteration_type": "mut",
                                "constr_rel": "=",
                                "constr_type": "name",
                                "constr_val": "V600E",
                                "info": {},
                                modifiers:[]
                            }
                        ]
                    },
                    {
                        "gene": "KRAS",
                        "alterations": false
                    }
                ]
            },
            {
                "gene": "NRAS",
                "alterations": false
            }
        ]);

    doTest("[TP53 BRCA1] [KRAS NRAS]",
        [
            {
                "label": undefined,
                "list": [
                    {
                        "gene": "TP53",
                        "alterations": false
                    },
                    {
                        "gene": "BRCA1",
                        "alterations": false
                    }
                ]
            },
            {
                "label": undefined,
                "list": [
                    {
                        "gene": "KRAS",
                        "alterations": false
                    },
                    {
                        "gene": "NRAS",
                        "alterations": false
                    }
                ]
            }
        ]);

    doTest('["Test_gene_set #1" TP53 BRCA1] NRAS',
        [
            {
                "label": "Test_gene_set #1",
                "list": [
                    {
                        "gene": "TP53",
                        "alterations": false
                    },
                    {
                        "gene": "BRCA1",
                        "alterations": false
                    }
                ]
            },
            {
                "gene": "NRAS",
                "alterations": false
            }
        ]);
});