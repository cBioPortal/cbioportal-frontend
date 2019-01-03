import oql_parser, {Alteration, OQLQuery} from './oql-parser';
import {assert} from "chai";

function testCallback(query:string, expectedParsedResult:OQLQuery) {
    try {
        assert.deepEqual(oql_parser.parse(query), expectedParsedResult);
    } catch (e) {
        if (e.name === "SyntaxError") {
            throw new Error(`SyntaxError at character ${e.location.start.offset}: ${e.message}`);
        } else {
            throw e;
        }
    }
}

type DoTest = {
    (query:string, expectedParsedResult:OQLQuery):void;
    only: (query:string, expectedParsedResult:OQLQuery)=>void;
};

const doTest:DoTest = function(query:string, expectedParsedResult:OQLQuery) {
    it(query, ()=>testCallback(query, expectedParsedResult));
} as DoTest;

doTest.only = function(query:string, expectedParsedResult:OQLQuery) {
    it.only(query, ()=>testCallback(query, expectedParsedResult));
};

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
    doTest("TP53: protein_change_code", [{gene:"TP53", alterations:[{alteration_type:"mut", constr_type:"name", constr_rel:"=", constr_val:"protein_change_code", info:{unrecognized:true}, modifiers:[]}]}]);
    doTest("STK11:  MUT=X125_SPLICE", [{gene:"STK11", alterations:[{alteration_type:"mut", constr_type:"name", constr_rel:"=", constr_val:"X125_SPLICE", info:{unrecognized:true}, modifiers:[]}]}]);
    doTest("STK11:  MUT=DRIVER_X125_SPLICE", [{gene:"STK11", alterations:[{alteration_type:"mut", constr_type:"name", constr_rel:"=", constr_val:"X125_SPLICE", info:{unrecognized:true}, modifiers:["DRIVER"]}]}]);
    doTest("STK11:  MUT=DRIVER_X125_SPLICE_GERMLINE", [{gene:"STK11", alterations:[{alteration_type:"mut", constr_type:"name", constr_rel:"=", constr_val:"X125_SPLICE", info:{unrecognized:true}, modifiers:["DRIVER","GERMLINE"]}]}]);
    doTest("TP53: protein_change_code_GERMLINE", [{gene:"TP53", alterations:[{alteration_type:"mut", constr_type:"name", constr_rel:"=", constr_val:"protein_change_code", info:{unrecognized:true}, modifiers:["GERMLINE"]}]}]);
    doTest("TP53: DRIVER_protein_change_code", [{gene:"TP53", alterations:[{alteration_type:"mut", constr_type:"name", constr_rel:"=", constr_val:"protein_change_code", info:{unrecognized:true}, modifiers:["DRIVER"]}]}]);
    doTest("TP53: protein_change_code_DRIVER", [{gene:"TP53", alterations:[{alteration_type:"mut", constr_type:"name", constr_rel:"=", constr_val:"protein_change_code", info:{unrecognized:true}, modifiers:["DRIVER"]}]}]);
    doTest("KRAS: G12D_DRIVER", [{gene:"KRAS", alterations:[{alteration_type:"mut", constr_type:"name", constr_rel:"=", constr_val:"G12D", info:{}, modifiers:["DRIVER"]}]}]);
    doTest("KRAS: G12_DRIVER", [{gene:"KRAS", alterations:[{alteration_type:"mut", constr_type:"position", constr_rel:"=", constr_val:12, info:{amino_acid:"G"}, modifiers:["DRIVER"]}]}]);
    doTest("KRAS: DRIVER_G12D", [{gene:"KRAS", alterations:[{alteration_type:"mut", constr_type:"name", constr_rel:"=", constr_val:"G12D", info:{}, modifiers:["DRIVER"]}]}]);
    doTest("KRAS: DRIVER_G12", [{gene:"KRAS", alterations:[{alteration_type:"mut", constr_type:"position", constr_rel:"=", constr_val:12, info:{amino_acid:"G"}, modifiers:["DRIVER"]}]}]);
    doTest("KRAS: MUT=G12D_DRIVER", [{gene:"KRAS", alterations:[{alteration_type:"mut", constr_type:"name", constr_rel:"=", constr_val:"G12D", info:{}, modifiers:["DRIVER"]}]}]);
    doTest("KRAS: MUT=G12_DRIVER", [{gene:"KRAS", alterations:[{alteration_type:"mut", constr_type:"position", constr_rel:"=", constr_val:12, info:{amino_acid:"G"}, modifiers:["DRIVER"]}]}]);
    doTest("KRAS: MUT=DRIVER_G12D", [{gene:"KRAS", alterations:[{alteration_type:"mut", constr_type:"name", constr_rel:"=", constr_val:"G12D", info:{}, modifiers:["DRIVER"]}]}]);
    doTest("KRAS: MUT=DRIVER_G12", [{gene:"KRAS", alterations:[{alteration_type:"mut", constr_type:"position", constr_rel:"=", constr_val:12, info:{amino_acid:"G"}, modifiers:["DRIVER"]}]}]);
    doTest("TP53:MISSENSE_GERMLINE", [{gene:"TP53", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "MISSENSE", info: {}, modifiers:["GERMLINE"]}]}])
    doTest("TP53:MISSENSE_GERMLINE_SOMATIC GERMLINE_INFRAME_SOMATIC_DRIVER GERMLINE_DRIVER_INFRAME_SOMATIC DRIVER_SOMATIC_GERMLINE_NONSENSE DRIVER_MUT_GERMLINE", [{gene:"TP53", alterations:[
        {alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "MISSENSE", info: {}, modifiers:["GERMLINE", "SOMATIC"]},
        {alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "INFRAME", info: {}, modifiers:["GERMLINE", "SOMATIC", "DRIVER"]},
        {alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "INFRAME", info: {}, modifiers:["GERMLINE", "DRIVER", "SOMATIC"]},
        {alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "NONSENSE", info: {}, modifiers:["DRIVER", "SOMATIC", "GERMLINE"]},
        {alteration_type: "mut", info: {}, modifiers:["DRIVER", "GERMLINE"]}
    ]}]);
    doTest("TP53:GERMLINE_MISSENSE", [{gene:"TP53", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "MISSENSE", info: {}, modifiers:["GERMLINE"]}]}])
    doTest("TP53:GERMLINE_SOMATIC_MISSENSE", [{gene:"TP53", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "MISSENSE", info: {}, modifiers:["GERMLINE", "SOMATIC"]}]}])
    doTest("TP53:MISSENSE_GERMLINE PROMOTER", [{gene:"TP53", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "MISSENSE", info: {}, modifiers:["GERMLINE"]},{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "PROMOTER", info: {}, modifiers:[]}]}])
    doTest("TP53:MISSENSE_GERMLINE PROMOTER_SOMATIC", [{gene:"TP53", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "MISSENSE", info: {}, modifiers:["GERMLINE"]},{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "PROMOTER", info: {}, modifiers:["SOMATIC"]}]}])
    doTest("TP53:MISSENSE PROMOTER_GERMLINE", [{gene:"TP53", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "MISSENSE", info: {}, modifiers:[]},{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "PROMOTER", info: {}, modifiers:["GERMLINE"]}]}])
    doTest("TP53:MISSENSE GERMLINE_PROMOTER", [{gene:"TP53", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "MISSENSE", info: {}, modifiers:[]},{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "PROMOTER", info: {}, modifiers:["GERMLINE"]}]}])
    doTest("TP53:SOMATIC GERMLINE_PROMOTER", [{gene:"TP53", alterations:[{alteration_type: "mut", info: {}, modifiers:["SOMATIC"]},{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "PROMOTER", info: {}, modifiers:["GERMLINE"]}]}])
    doTest("TP53:DRIVER GERMLINE_DRIVER DRIVER_GERMLINE TRUNC_DRIVER DRIVER_MISSENSE INFRAME_DRIVER_GERMLINE DRIVER_GERMLINE_INFRAME", [{gene:"TP53", alterations:[
        {alteration_type: "any", modifiers:["DRIVER"]},
        {alteration_type: "mut", info: {}, modifiers:["GERMLINE", "DRIVER"]},
        {alteration_type: "mut", info: {}, modifiers:["DRIVER", "GERMLINE"]},
        {alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "TRUNC", info: {}, modifiers:["DRIVER"]},
        {alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "MISSENSE", info: {}, modifiers:["DRIVER"]},
        {alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "INFRAME", info: {}, modifiers:["DRIVER", "GERMLINE"]},
        {alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "INFRAME", info: {}, modifiers:["DRIVER", "GERMLINE"]}
    ] as Alteration[]}])
    doTest("TP53:MUT_DRIVER DRIVER_MUT CNA_DRIVER DRIVER_CNA", [{gene:"TP53", alterations:[
            {alteration_type: "mut", info: {}, modifiers:["DRIVER"]},
            {alteration_type: "mut", info: {}, modifiers:["DRIVER"]},
            {alteration_type: "cna", modifiers:["DRIVER"]},
            {alteration_type: "cna", modifiers:["DRIVER"]}
        ] as Alteration[]}])
    doTest("TP53:AMP_DRIVER DRIVER_AMP FUSION_DRIVER DRIVER_FUSION DRIVER_HOMDEL HETLOSS DRIVER", [{gene:"TP53", alterations:[
            {alteration_type: "cna", constr_rel:"=", constr_val:"AMP", modifiers:["DRIVER"]},
            {alteration_type: "cna", constr_rel:"=", constr_val:"AMP", modifiers:["DRIVER"]},
            {alteration_type: "fusion", modifiers:["DRIVER"]},
            {alteration_type: "fusion", modifiers:["DRIVER"]},
            {alteration_type: "cna", constr_rel:"=", constr_val:"HOMDEL", modifiers:["DRIVER"]},
            {alteration_type: "cna", constr_rel:"=", constr_val:"HETLOSS", modifiers:[]},
            {alteration_type: "any", modifiers:["DRIVER"]}
        ] as Alteration[]}])
    doTest("TP53:MISSENSE PROMOTER", [{gene:"TP53", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "MISSENSE", info: {}, modifiers:[]},{alteration_type: "mut", constr_rel: "=", constr_type: "class", constr_val: "PROMOTER", info: {}, modifiers:[]}]}])
    doTest("TP53:MUT;", [{gene:"TP53", alterations:[{alteration_type: "mut", info:{}, modifiers:[]}]}])
    doTest("TP53:MUT\n", [{gene:"TP53", alterations:[{alteration_type: "mut", info:{}, modifiers:[]}]}])
    doTest("TP53:MUT; BRCA1: gAiN hetloss EXP>=3 PROT<1", [{gene:"TP53", alterations:[{alteration_type: "mut", info:{}, modifiers:[]}]},
        {gene:"BRCA1", alterations:[{alteration_type: "cna", constr_rel: "=", constr_val: "GAIN", modifiers:[]},
            {alteration_type: "cna", constr_rel: "=", constr_val: "HETLOSS", modifiers:[]},
            {alteration_type: "exp", constr_rel: ">=", constr_val: 3},
            {alteration_type: "prot", constr_rel: "<", constr_val: 1}] as Alteration[]}])
    doTest("TP53:MUT;;;\n BRCA1: AMP HOMDEL EXP>=3 PROT<1", [{gene:"TP53", alterations:[{alteration_type: "mut", info:{}, modifiers:[]}]},
        {gene:"BRCA1", alterations:[{alteration_type: "cna", constr_rel: "=", constr_val: "AMP", modifiers:[]},
            {alteration_type: "cna", constr_rel: "=", constr_val: "HOMDEL", modifiers:[]},
            {alteration_type: "exp", constr_rel: ">=", constr_val: 3},
            {alteration_type: "prot", constr_rel: "<", constr_val: 1}] as Alteration[]}])
    doTest("TP53:MUT;\n BRCA1: amp GAIN EXP>=3 PROT<1", [{gene:"TP53", alterations:[{alteration_type: "mut", info:{}, modifiers:[]}]},
        {gene:"BRCA1", alterations:[{alteration_type: "cna", constr_rel: "=", constr_val: "AMP", modifiers:[]},
            {alteration_type: "cna", constr_rel: "=", constr_val: "GAIN", modifiers:[]},
            {alteration_type: "exp", constr_rel: ">=", constr_val: 3},
            {alteration_type: "prot", constr_rel: "<", constr_val: 1}] as Alteration[]}])
    doTest("TP53:MUT\n BRCA1: AMP HOMDEL EXP>=3 PROT<1;", [{gene:"TP53", alterations:[{alteration_type: "mut", info:{}, modifiers:[]}]},
        {gene:"BRCA1", alterations:[{alteration_type: "cna", constr_rel: "=", constr_val: "AMP", modifiers:[]},
            {alteration_type: "cna", constr_rel: "=", constr_val: "HOMDEL", modifiers:[]},
            {alteration_type: "exp", constr_rel: ">=", constr_val: 3},
            {alteration_type: "prot", constr_rel: "<", constr_val: 1}] as Alteration[]}])

    doTest("TP53:PROT<=-2\n", [{gene:"TP53", alterations:[{alteration_type: "prot", constr_rel: "<=", constr_val:-2}]}])

    doTest("BRAF:MUT=V600E", [{gene:"BRAF", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type:"name", constr_val:"V600E", info:{}, modifiers:[]}]}])
    doTest("BRAF:MUT=V600", [{gene:"BRAF", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type:"position", constr_val:600, info:{amino_acid:"V"}, modifiers:[]}]}])
    doTest("BRAF:FUSION MUT=V600", [{gene:"BRAF", alterations:[{alteration_type:'fusion', modifiers:[]}, {alteration_type: "mut", constr_rel: "=", constr_type:"position", constr_val:600, info:{"amino_acid":"V"}, modifiers:[]}] as Alteration[]}])
    doTest("BRAF:FUSION", [{gene:"BRAF", alterations:[{alteration_type:'fusion', modifiers:[]}] as Alteration[]}])
    doTest("MIR-493*:MUT=V600", [{gene:"MIR-493*", alterations:[{alteration_type: "mut", constr_rel: "=", constr_type:"position", constr_val:600, info:{amino_acid:"V"}, modifiers:[]}]}])

    doTest("BRAF:CNA >= gain", [{gene:"BRAF", alterations:[{alteration_type:"cna", constr_rel:">=", constr_val:"GAIN", modifiers:[]}] as Alteration[]}])
    doTest("BRAF:CNA < homdel", [{gene:"BRAF", alterations:[{alteration_type:"cna", constr_rel:"<", constr_val:"HOMDEL", modifiers:[]}] as Alteration[]}])

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