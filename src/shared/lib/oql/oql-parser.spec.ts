import oql_parser, { Alteration, OQLQuery } from './oql-parser';
import { assert } from 'chai';

function testCallback(query: string, expectedParsedResult: OQLQuery) {
    try {
        assert.deepEqual(oql_parser.parse(query), expectedParsedResult);
    } catch (e) {
        if (e.name === 'SyntaxError') {
            throw new Error(
                `SyntaxError at character ${e.location.start.offset}: ${e.message}`
            );
        } else {
            throw e;
        }
    }
}

type DoTest = {
    (query: string, expectedParsedResult: OQLQuery): void;
    only: (query: string, expectedParsedResult: OQLQuery) => void;
};

const doTest: DoTest = function(query: string, expectedParsedResult: OQLQuery) {
    it(query, () => testCallback(query, expectedParsedResult));
} as DoTest;

doTest.only = function(query: string, expectedParsedResult: OQLQuery) {
    it.only(query, () => testCallback(query, expectedParsedResult));
};

describe('OQL parser', () => {
    doTest('     TP53', [{ gene: 'TP53', alterations: false }]);
    doTest('                      [TP53 BRCA1] NRAS', [
        {
            label: undefined,
            list: [
                {
                    gene: 'TP53',
                    alterations: false,
                },
                {
                    gene: 'BRCA1',
                    alterations: false,
                },
            ],
        },
        {
            gene: 'NRAS',
            alterations: false,
        },
    ]);
    doTest('TP53', [{ gene: 'TP53', alterations: false }]);
    doTest('TP53;', [{ gene: 'TP53', alterations: false }]);
    doTest('TP53\n', [{ gene: 'TP53', alterations: false }]);
    doTest('TP53 BRCA1 KRAS NRAS', [
        { gene: 'TP53', alterations: false },
        { gene: 'BRCA1', alterations: false },
        { gene: 'KRAS', alterations: false },
        { gene: 'NRAS', alterations: false },
    ]);
    doTest('TP53,BRCA1,KRAS, NRAS', [
        { gene: 'TP53', alterations: false },
        { gene: 'BRCA1', alterations: false },
        { gene: 'KRAS', alterations: false },
        { gene: 'NRAS', alterations: false },
    ]);
    doTest('TP53: MUT BRCA1', [
        {
            gene: 'TP53',
            alterations: [
                { alteration_type: 'mut', info: {}, modifiers: [] },
                {
                    alteration_type: 'mut',
                    constr_rel: '=',
                    constr_type: 'name',
                    constr_val: 'BRCA1',
                    info: { unrecognized: true },
                    modifiers: [],
                },
            ],
        },
    ]);
    doTest('TP53:MUT', [
        {
            gene: 'TP53',
            alterations: [{ alteration_type: 'mut', info: {}, modifiers: [] }],
        },
    ]);
    doTest('TP53: GERMLINE', [
        {
            gene: 'TP53',
            alterations: [
                {
                    alteration_type: 'mut',
                    info: {},
                    modifiers: [{ type: 'GERMLINE' }],
                },
            ],
        },
    ]);
    doTest('TP53: GERMLINE_SOMATIC', [
        {
            gene: 'TP53',
            alterations: [
                {
                    alteration_type: 'mut',
                    info: {},
                    modifiers: [{ type: 'GERMLINE' }, { type: 'SOMATIC' }],
                },
            ],
        },
    ]);
    doTest('TP53: protein_change_code', [
        {
            gene: 'TP53',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_type: 'name',
                    constr_rel: '=',
                    constr_val: 'protein_change_code',
                    info: { unrecognized: true },
                    modifiers: [],
                },
            ],
        },
    ]);
    doTest('STK11:  MUT=X125_SPLICE', [
        {
            gene: 'STK11',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_type: 'name',
                    constr_rel: '=',
                    constr_val: 'X125_SPLICE',
                    info: { unrecognized: true },
                    modifiers: [],
                },
            ],
        },
    ]);
    doTest('STK11:  MUT=DRIVER_X125_SPLICE', [
        {
            gene: 'STK11',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_type: 'name',
                    constr_rel: '=',
                    constr_val: 'X125_SPLICE',
                    info: { unrecognized: true },
                    modifiers: [{ type: 'DRIVER' }],
                },
            ],
        },
    ]);
    doTest('STK11:  MUT=DRIVER_X125_SPLICE_GERMLINE', [
        {
            gene: 'STK11',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_type: 'name',
                    constr_rel: '=',
                    constr_val: 'X125_SPLICE',
                    info: { unrecognized: true },
                    modifiers: [{ type: 'DRIVER' }, { type: 'GERMLINE' }],
                },
            ],
        },
    ]);
    doTest('TP53: protein_change_code_GERMLINE', [
        {
            gene: 'TP53',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_type: 'name',
                    constr_rel: '=',
                    constr_val: 'protein_change_code',
                    info: { unrecognized: true },
                    modifiers: [{ type: 'GERMLINE' }],
                },
            ],
        },
    ]);
    doTest('TP53: DRIVER_protein_change_code', [
        {
            gene: 'TP53',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_type: 'name',
                    constr_rel: '=',
                    constr_val: 'protein_change_code',
                    info: { unrecognized: true },
                    modifiers: [{ type: 'DRIVER' }],
                },
            ],
        },
    ]);
    doTest('TP53: protein_change_code_DRIVER', [
        {
            gene: 'TP53',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_type: 'name',
                    constr_rel: '=',
                    constr_val: 'protein_change_code',
                    info: { unrecognized: true },
                    modifiers: [{ type: 'DRIVER' }],
                },
            ],
        },
    ]);
    doTest('KRAS: G12D_DRIVER', [
        {
            gene: 'KRAS',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_type: 'name',
                    constr_rel: '=',
                    constr_val: 'G12D',
                    info: {},
                    modifiers: [{ type: 'DRIVER' }],
                },
            ],
        },
    ]);
    doTest('KRAS: G12_DRIVER', [
        {
            gene: 'KRAS',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_type: 'position',
                    constr_rel: '=',
                    constr_val: 12,
                    info: { amino_acid: 'G' },
                    modifiers: [{ type: 'DRIVER' }],
                },
            ],
        },
    ]);
    doTest('KRAS: DRIVER_G12D', [
        {
            gene: 'KRAS',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_type: 'name',
                    constr_rel: '=',
                    constr_val: 'G12D',
                    info: {},
                    modifiers: [{ type: 'DRIVER' }],
                },
            ],
        },
    ]);
    doTest('KRAS: DRIVER_G12', [
        {
            gene: 'KRAS',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_type: 'position',
                    constr_rel: '=',
                    constr_val: 12,
                    info: { amino_acid: 'G' },
                    modifiers: [{ type: 'DRIVER' }],
                },
            ],
        },
    ]);
    doTest('KRAS: MUT=G12D_DRIVER', [
        {
            gene: 'KRAS',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_type: 'name',
                    constr_rel: '=',
                    constr_val: 'G12D',
                    info: {},
                    modifiers: [{ type: 'DRIVER' }],
                },
            ],
        },
    ]);
    doTest('KRAS: MUT=G12_DRIVER', [
        {
            gene: 'KRAS',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_type: 'position',
                    constr_rel: '=',
                    constr_val: 12,
                    info: { amino_acid: 'G' },
                    modifiers: [{ type: 'DRIVER' }],
                },
            ],
        },
    ]);
    doTest('KRAS: MUT=DRIVER_G12D', [
        {
            gene: 'KRAS',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_type: 'name',
                    constr_rel: '=',
                    constr_val: 'G12D',
                    info: {},
                    modifiers: [{ type: 'DRIVER' }],
                },
            ],
        },
    ]);
    doTest('KRAS: MUT=DRIVER_G12', [
        {
            gene: 'KRAS',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_type: 'position',
                    constr_rel: '=',
                    constr_val: 12,
                    info: { amino_acid: 'G' },
                    modifiers: [{ type: 'DRIVER' }],
                },
            ],
        },
    ]);
    doTest('TP53:MISSENSE_GERMLINE', [
        {
            gene: 'TP53',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_rel: '=',
                    constr_type: 'class',
                    constr_val: 'MISSENSE',
                    info: {},
                    modifiers: [{ type: 'GERMLINE' }],
                },
            ],
        },
    ]);
    doTest(
        'TP53:MISSENSE_GERMLINE_SOMATIC GERMLINE_INFRAME_SOMATIC_DRIVER GERMLINE_DRIVER_INFRAME_SOMATIC DRIVER_SOMATIC_GERMLINE_NONSENSE DRIVER_MUT_GERMLINE',
        [
            {
                gene: 'TP53',
                alterations: [
                    {
                        alteration_type: 'mut',
                        constr_rel: '=',
                        constr_type: 'class',
                        constr_val: 'MISSENSE',
                        info: {},
                        modifiers: [{ type: 'GERMLINE' }, { type: 'SOMATIC' }],
                    },
                    {
                        alteration_type: 'mut',
                        constr_rel: '=',
                        constr_type: 'class',
                        constr_val: 'INFRAME',
                        info: {},
                        modifiers: [
                            { type: 'GERMLINE' },
                            { type: 'SOMATIC' },
                            { type: 'DRIVER' },
                        ],
                    },
                    {
                        alteration_type: 'mut',
                        constr_rel: '=',
                        constr_type: 'class',
                        constr_val: 'INFRAME',
                        info: {},
                        modifiers: [
                            { type: 'GERMLINE' },
                            { type: 'DRIVER' },
                            { type: 'SOMATIC' },
                        ],
                    },
                    {
                        alteration_type: 'mut',
                        constr_rel: '=',
                        constr_type: 'class',
                        constr_val: 'NONSENSE',
                        info: {},
                        modifiers: [
                            { type: 'DRIVER' },
                            { type: 'SOMATIC' },
                            { type: 'GERMLINE' },
                        ],
                    },
                    {
                        alteration_type: 'mut',
                        info: {},
                        modifiers: [{ type: 'DRIVER' }, { type: 'GERMLINE' }],
                    },
                ],
            },
        ]
    );
    doTest('TP53:GERMLINE_MISSENSE', [
        {
            gene: 'TP53',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_rel: '=',
                    constr_type: 'class',
                    constr_val: 'MISSENSE',
                    info: {},
                    modifiers: [{ type: 'GERMLINE' }],
                },
            ],
        },
    ]);
    doTest('TP53:GERMLINE_SOMATIC_MISSENSE', [
        {
            gene: 'TP53',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_rel: '=',
                    constr_type: 'class',
                    constr_val: 'MISSENSE',
                    info: {},
                    modifiers: [{ type: 'GERMLINE' }, { type: 'SOMATIC' }],
                },
            ],
        },
    ]);
    doTest('TP53:MISSENSE_GERMLINE PROMOTER', [
        {
            gene: 'TP53',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_rel: '=',
                    constr_type: 'class',
                    constr_val: 'MISSENSE',
                    info: {},
                    modifiers: [{ type: 'GERMLINE' }],
                },
                {
                    alteration_type: 'mut',
                    constr_rel: '=',
                    constr_type: 'class',
                    constr_val: 'PROMOTER',
                    info: {},
                    modifiers: [],
                },
            ],
        },
    ]);
    doTest('TP53:MISSENSE_GERMLINE PROMOTER_SOMATIC', [
        {
            gene: 'TP53',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_rel: '=',
                    constr_type: 'class',
                    constr_val: 'MISSENSE',
                    info: {},
                    modifiers: [{ type: 'GERMLINE' }],
                },
                {
                    alteration_type: 'mut',
                    constr_rel: '=',
                    constr_type: 'class',
                    constr_val: 'PROMOTER',
                    info: {},
                    modifiers: [{ type: 'SOMATIC' }],
                },
            ],
        },
    ]);
    doTest('TP53:MISSENSE PROMOTER_GERMLINE', [
        {
            gene: 'TP53',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_rel: '=',
                    constr_type: 'class',
                    constr_val: 'MISSENSE',
                    info: {},
                    modifiers: [],
                },
                {
                    alteration_type: 'mut',
                    constr_rel: '=',
                    constr_type: 'class',
                    constr_val: 'PROMOTER',
                    info: {},
                    modifiers: [{ type: 'GERMLINE' }],
                },
            ],
        },
    ]);
    doTest('TP53:MISSENSE GERMLINE_PROMOTER', [
        {
            gene: 'TP53',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_rel: '=',
                    constr_type: 'class',
                    constr_val: 'MISSENSE',
                    info: {},
                    modifiers: [],
                },
                {
                    alteration_type: 'mut',
                    constr_rel: '=',
                    constr_type: 'class',
                    constr_val: 'PROMOTER',
                    info: {},
                    modifiers: [{ type: 'GERMLINE' }],
                },
            ],
        },
    ]);
    doTest('TP53:SOMATIC GERMLINE_PROMOTER', [
        {
            gene: 'TP53',
            alterations: [
                {
                    alteration_type: 'mut',
                    info: {},
                    modifiers: [{ type: 'SOMATIC' }],
                },
                {
                    alteration_type: 'mut',
                    constr_rel: '=',
                    constr_type: 'class',
                    constr_val: 'PROMOTER',
                    info: {},
                    modifiers: [{ type: 'GERMLINE' }],
                },
            ],
        },
    ]);
    doTest(
        'TP53:DRIVER GERMLINE_DRIVER DRIVER_GERMLINE TRUNC_DRIVER DRIVER_MISSENSE INFRAME_DRIVER_GERMLINE DRIVER_GERMLINE_INFRAME DRIVER_GERMLINE_INFRAME_(1-100!) MUT_(-500) GERMLINE_(51-)_DRIVER',
        [
            {
                gene: 'TP53',
                alterations: [
                    { alteration_type: 'any', modifiers: [{ type: 'DRIVER' }] },
                    {
                        alteration_type: 'mut',
                        info: {},
                        modifiers: [{ type: 'GERMLINE' }, { type: 'DRIVER' }],
                    },
                    {
                        alteration_type: 'mut',
                        info: {},
                        modifiers: [{ type: 'DRIVER' }, { type: 'GERMLINE' }],
                    },
                    {
                        alteration_type: 'mut',
                        constr_rel: '=',
                        constr_type: 'class',
                        constr_val: 'TRUNC',
                        info: {},
                        modifiers: [{ type: 'DRIVER' }],
                    },
                    {
                        alteration_type: 'mut',
                        constr_rel: '=',
                        constr_type: 'class',
                        constr_val: 'MISSENSE',
                        info: {},
                        modifiers: [{ type: 'DRIVER' }],
                    },
                    {
                        alteration_type: 'mut',
                        constr_rel: '=',
                        constr_type: 'class',
                        constr_val: 'INFRAME',
                        info: {},
                        modifiers: [{ type: 'DRIVER' }, { type: 'GERMLINE' }],
                    },
                    {
                        alteration_type: 'mut',
                        constr_rel: '=',
                        constr_type: 'class',
                        constr_val: 'INFRAME',
                        info: {},
                        modifiers: [{ type: 'DRIVER' }, { type: 'GERMLINE' }],
                    },
                    {
                        alteration_type: 'mut',
                        constr_rel: '=',
                        constr_type: 'class',
                        constr_val: 'INFRAME',
                        info: {},
                        modifiers: [
                            { type: 'DRIVER' },
                            { type: 'GERMLINE' },
                            {
                                type: 'RANGE',
                                start: 1,
                                end: 100,
                                completeOverlapOnly: true,
                            },
                        ],
                    },
                    {
                        alteration_type: 'mut',
                        info: {},
                        modifiers: [
                            {
                                type: 'RANGE',
                                end: 500,
                                completeOverlapOnly: false,
                            },
                        ],
                    },
                    {
                        alteration_type: 'mut',
                        info: {},
                        modifiers: [
                            { type: 'GERMLINE' },
                            {
                                type: 'RANGE',
                                start: 51,
                                completeOverlapOnly: false,
                            },
                            { type: 'DRIVER' },
                        ],
                    },
                ] as Alteration[],
            },
        ]
    );
    doTest('TP53:MUT=DRIVER MUT_DRIVER DRIVER_MUT CNA_DRIVER DRIVER_CNA', [
        {
            gene: 'TP53',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_rel: '=',
                    constr_type: undefined,
                    constr_val: undefined,
                    info: {},
                    modifiers: [{ type: 'DRIVER' }],
                },
                {
                    alteration_type: 'mut',
                    info: {},
                    modifiers: [{ type: 'DRIVER' }],
                },
                {
                    alteration_type: 'mut',
                    info: {},
                    modifiers: [{ type: 'DRIVER' }],
                },
                { alteration_type: 'cna', modifiers: [{ type: 'DRIVER' }] },
                { alteration_type: 'cna', modifiers: [{ type: 'DRIVER' }] },
            ] as Alteration[],
        },
    ]);
    doTest(
        'TP53:AMP_DRIVER DRIVER_AMP FUSION_DRIVER DRIVER_FUSION DRIVER_HOMDEL HETLOSS DRIVER',
        [
            {
                gene: 'TP53',
                alterations: [
                    {
                        alteration_type: 'cna',
                        constr_rel: '=',
                        constr_val: 'AMP',
                        modifiers: [{ type: 'DRIVER' }],
                    },
                    {
                        alteration_type: 'cna',
                        constr_rel: '=',
                        constr_val: 'AMP',
                        modifiers: [{ type: 'DRIVER' }],
                    },
                    {
                        alteration_type: 'fusion',
                        modifiers: [{ type: 'DRIVER' }],
                    },
                    {
                        alteration_type: 'fusion',
                        modifiers: [{ type: 'DRIVER' }],
                    },
                    {
                        alteration_type: 'cna',
                        constr_rel: '=',
                        constr_val: 'HOMDEL',
                        modifiers: [{ type: 'DRIVER' }],
                    },
                    {
                        alteration_type: 'cna',
                        constr_rel: '=',
                        constr_val: 'HETLOSS',
                        modifiers: [],
                    },
                    { alteration_type: 'any', modifiers: [{ type: 'DRIVER' }] },
                ] as Alteration[],
            },
        ]
    );
    doTest('TP53:MISSENSE PROMOTER', [
        {
            gene: 'TP53',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_rel: '=',
                    constr_type: 'class',
                    constr_val: 'MISSENSE',
                    info: {},
                    modifiers: [],
                },
                {
                    alteration_type: 'mut',
                    constr_rel: '=',
                    constr_type: 'class',
                    constr_val: 'PROMOTER',
                    info: {},
                    modifiers: [],
                },
            ],
        },
    ]);
    doTest('TP53:MUT;', [
        {
            gene: 'TP53',
            alterations: [{ alteration_type: 'mut', info: {}, modifiers: [] }],
        },
    ]);
    doTest('TP53:MUT\n', [
        {
            gene: 'TP53',
            alterations: [{ alteration_type: 'mut', info: {}, modifiers: [] }],
        },
    ]);
    doTest('TP53:MUT; BRCA1: gAiN hetloss EXP>=3 PROT<1', [
        {
            gene: 'TP53',
            alterations: [{ alteration_type: 'mut', info: {}, modifiers: [] }],
        },
        {
            gene: 'BRCA1',
            alterations: [
                {
                    alteration_type: 'cna',
                    constr_rel: '=',
                    constr_val: 'GAIN',
                    modifiers: [],
                },
                {
                    alteration_type: 'cna',
                    constr_rel: '=',
                    constr_val: 'HETLOSS',
                    modifiers: [],
                },
                { alteration_type: 'exp', constr_rel: '>=', constr_val: 3 },
                { alteration_type: 'prot', constr_rel: '<', constr_val: 1 },
            ] as Alteration[],
        },
    ]);
    doTest('TP53:MUT;;;\n BRCA1: AMP HOMDEL EXP>=3 PROT<1', [
        {
            gene: 'TP53',
            alterations: [{ alteration_type: 'mut', info: {}, modifiers: [] }],
        },
        {
            gene: 'BRCA1',
            alterations: [
                {
                    alteration_type: 'cna',
                    constr_rel: '=',
                    constr_val: 'AMP',
                    modifiers: [],
                },
                {
                    alteration_type: 'cna',
                    constr_rel: '=',
                    constr_val: 'HOMDEL',
                    modifiers: [],
                },
                { alteration_type: 'exp', constr_rel: '>=', constr_val: 3 },
                { alteration_type: 'prot', constr_rel: '<', constr_val: 1 },
            ] as Alteration[],
        },
    ]);
    doTest('TP53:MUT;\n BRCA1: amp GAIN EXP>=3 PROT<1', [
        {
            gene: 'TP53',
            alterations: [{ alteration_type: 'mut', info: {}, modifiers: [] }],
        },
        {
            gene: 'BRCA1',
            alterations: [
                {
                    alteration_type: 'cna',
                    constr_rel: '=',
                    constr_val: 'AMP',
                    modifiers: [],
                },
                {
                    alteration_type: 'cna',
                    constr_rel: '=',
                    constr_val: 'GAIN',
                    modifiers: [],
                },
                { alteration_type: 'exp', constr_rel: '>=', constr_val: 3 },
                { alteration_type: 'prot', constr_rel: '<', constr_val: 1 },
            ] as Alteration[],
        },
    ]);
    doTest('TP53:MUT\n BRCA1: AMP HOMDEL EXP>=3 PROT<1;', [
        {
            gene: 'TP53',
            alterations: [{ alteration_type: 'mut', info: {}, modifiers: [] }],
        },
        {
            gene: 'BRCA1',
            alterations: [
                {
                    alteration_type: 'cna',
                    constr_rel: '=',
                    constr_val: 'AMP',
                    modifiers: [],
                },
                {
                    alteration_type: 'cna',
                    constr_rel: '=',
                    constr_val: 'HOMDEL',
                    modifiers: [],
                },
                { alteration_type: 'exp', constr_rel: '>=', constr_val: 3 },
                { alteration_type: 'prot', constr_rel: '<', constr_val: 1 },
            ] as Alteration[],
        },
    ]);
    doTest('TP53:MUT, BRCA1: AMP HOMDEL EXP>=3 PROT<1;', [
        {
            gene: 'TP53',
            alterations: [{ alteration_type: 'mut', info: {}, modifiers: [] }],
        },
        {
            gene: 'BRCA1',
            alterations: [
                {
                    alteration_type: 'cna',
                    constr_rel: '=',
                    constr_val: 'AMP',
                    modifiers: [],
                },
                {
                    alteration_type: 'cna',
                    constr_rel: '=',
                    constr_val: 'HOMDEL',
                    modifiers: [],
                },
                { alteration_type: 'exp', constr_rel: '>=', constr_val: 3 },
                { alteration_type: 'prot', constr_rel: '<', constr_val: 1 },
            ] as Alteration[],
        },
    ]);

    doTest('TP53:PROT<=-2\n', [
        {
            gene: 'TP53',
            alterations: [
                { alteration_type: 'prot', constr_rel: '<=', constr_val: -2 },
            ],
        },
    ]);

    doTest('BRAF:MUT=V600E', [
        {
            gene: 'BRAF',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_rel: '=',
                    constr_type: 'name',
                    constr_val: 'V600E',
                    info: {},
                    modifiers: [],
                },
            ],
        },
    ]);
    doTest('BRAF:MUT=V600', [
        {
            gene: 'BRAF',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_rel: '=',
                    constr_type: 'position',
                    constr_val: 600,
                    info: { amino_acid: 'V' },
                    modifiers: [],
                },
            ],
        },
    ]);
    doTest('BRAF:FUSION MUT=V600', [
        {
            gene: 'BRAF',
            alterations: [
                { alteration_type: 'fusion', modifiers: [] },
                {
                    alteration_type: 'mut',
                    constr_rel: '=',
                    constr_type: 'position',
                    constr_val: 600,
                    info: { amino_acid: 'V' },
                    modifiers: [],
                },
            ] as Alteration[],
        },
    ]);
    doTest('BRAF:FUSION', [
        {
            gene: 'BRAF',
            alterations: [
                { alteration_type: 'fusion', modifiers: [] },
            ] as Alteration[],
        },
    ]);
    doTest('MIR-493*:MUT=V600', [
        {
            gene: 'MIR-493*',
            alterations: [
                {
                    alteration_type: 'mut',
                    constr_rel: '=',
                    constr_type: 'position',
                    constr_val: 600,
                    info: { amino_acid: 'V' },
                    modifiers: [],
                },
            ],
        },
    ]);

    doTest('BRAF:CNA >= gain', [
        {
            gene: 'BRAF',
            alterations: [
                {
                    alteration_type: 'cna',
                    constr_rel: '>=',
                    constr_val: 'GAIN',
                    modifiers: [],
                },
            ] as Alteration[],
        },
    ]);
    doTest('BRAF:CNA < homdel', [
        {
            gene: 'BRAF',
            alterations: [
                {
                    alteration_type: 'cna',
                    constr_rel: '<',
                    constr_val: 'HOMDEL',
                    modifiers: [],
                },
            ] as Alteration[],
        },
    ]);

    doTest('[TP53 BRCA1] NRAS', [
        {
            label: undefined,
            list: [
                {
                    gene: 'TP53',
                    alterations: false,
                },
                {
                    gene: 'BRCA1',
                    alterations: false,
                },
            ],
        },
        {
            gene: 'NRAS',
            alterations: false,
        },
    ]);

    doTest('NRAS [TP53 BRCA1]', [
        {
            gene: 'NRAS',
            alterations: false,
        },
        {
            label: undefined,
            list: [
                {
                    gene: 'TP53',
                    alterations: false,
                },
                {
                    gene: 'BRCA1',
                    alterations: false,
                },
            ],
        },
    ]);

    doTest('NRAS [TP53 BRCA1] BRCA2', [
        {
            gene: 'NRAS',
            alterations: false,
        },
        {
            label: undefined,
            list: [
                {
                    gene: 'TP53',
                    alterations: false,
                },
                {
                    gene: 'BRCA1',
                    alterations: false,
                },
            ],
        },
        {
            gene: 'BRCA2',
            alterations: false,
        },
    ]);

    doTest('[TP53;BRAF:MUT=V600E;KRAS] NRAS', [
        {
            label: undefined,
            list: [
                {
                    gene: 'TP53',
                    alterations: false,
                },
                {
                    gene: 'BRAF',
                    alterations: [
                        {
                            alteration_type: 'mut',
                            constr_rel: '=',
                            constr_type: 'name',
                            constr_val: 'V600E',
                            info: {},
                            modifiers: [],
                        },
                    ],
                },
                {
                    gene: 'KRAS',
                    alterations: false,
                },
            ],
        },
        {
            gene: 'NRAS',
            alterations: false,
        },
    ]);

    doTest('[TP53 BRCA1] [KRAS NRAS]', [
        {
            label: undefined,
            list: [
                {
                    gene: 'TP53',
                    alterations: false,
                },
                {
                    gene: 'BRCA1',
                    alterations: false,
                },
            ],
        },
        {
            label: undefined,
            list: [
                {
                    gene: 'KRAS',
                    alterations: false,
                },
                {
                    gene: 'NRAS',
                    alterations: false,
                },
            ],
        },
    ]);

    doTest('["Test_gene_set #1" TP53 BRCA1] NRAS', [
        {
            label: 'Test_gene_set #1',
            list: [
                {
                    gene: 'TP53',
                    alterations: false,
                },
                {
                    gene: 'BRCA1',
                    alterations: false,
                },
            ],
        },
        {
            gene: 'NRAS',
            alterations: false,
        },
    ]);
});
