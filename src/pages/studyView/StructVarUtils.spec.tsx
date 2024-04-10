import { assert } from 'chai';
import * as React from 'react';
import {
    STRUCTVARAnyGeneStr,
    STRUCTVARNullGeneStr,
    STUCTVARDownstreamFusionStr,
    STUCTVARUpstreamFusionStr,
} from 'shared/lib/oql/oqlfilter';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import {
    oqlQueryToStructVarGenePair,
    StructVarGenePair,
} from 'pages/studyView/StructVarUtils';

describe('StructVarUtils', () => {
    describe('oqlQueryToStructVarGenePair', () => {
        it.each([
            [{ gene: 'A', alterations: [] }, []],
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            gene: undefined,
                            alteration_type: STUCTVARDownstreamFusionStr,
                            modifiers: [],
                        },
                    ],
                },
                [],
            ],
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            gene: 'B',
                            alteration_type: STUCTVARDownstreamFusionStr,
                            modifiers: [],
                        },
                    ],
                },
                [{ gene1HugoSymbolOrOql: 'A', gene2HugoSymbolOrOql: 'B' }],
            ],
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            gene: STRUCTVARAnyGeneStr,
                            alteration_type: STUCTVARDownstreamFusionStr,
                            modifiers: [],
                        },
                    ],
                },
                [
                    {
                        gene1HugoSymbolOrOql: 'A',
                        gene2HugoSymbolOrOql: STRUCTVARAnyGeneStr,
                    },
                ],
            ],
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            gene: STRUCTVARNullGeneStr,
                            alteration_type: STUCTVARDownstreamFusionStr,
                            modifiers: [],
                        },
                    ],
                },
                [
                    {
                        gene1HugoSymbolOrOql: 'A',
                        gene2HugoSymbolOrOql: STRUCTVARNullGeneStr,
                    },
                ],
            ],
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            gene: 'B',
                            alteration_type: STUCTVARUpstreamFusionStr,
                            modifiers: [],
                        },
                    ],
                },
                [{ gene1HugoSymbolOrOql: 'B', gene2HugoSymbolOrOql: 'A' }],
            ],
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            gene: STRUCTVARAnyGeneStr,
                            alteration_type: STUCTVARUpstreamFusionStr,
                            modifiers: [],
                        },
                    ],
                },
                [
                    {
                        gene1HugoSymbolOrOql: STRUCTVARAnyGeneStr,
                        gene2HugoSymbolOrOql: 'A',
                    },
                ],
            ],
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            gene: STRUCTVARNullGeneStr,
                            alteration_type: STUCTVARUpstreamFusionStr,
                            modifiers: [],
                        },
                    ],
                },
                [
                    {
                        gene1HugoSymbolOrOql: STRUCTVARNullGeneStr,
                        gene2HugoSymbolOrOql: 'A',
                    },
                ],
            ],
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            gene: 'B',
                            alteration_type: STUCTVARDownstreamFusionStr,
                            modifiers: [],
                        },
                        {
                            gene: 'C',
                            alteration_type: STUCTVARDownstreamFusionStr,
                            modifiers: [],
                        },
                    ],
                },
                [
                    { gene1HugoSymbolOrOql: 'A', gene2HugoSymbolOrOql: 'B' },
                    { gene1HugoSymbolOrOql: 'A', gene2HugoSymbolOrOql: 'C' },
                ],
            ],
        ])(
            'converts %p into %p',
            (singleGeneQuery, expected: StructVarGenePair[]) => {
                assert.deepEqual(
                    oqlQueryToStructVarGenePair(
                        singleGeneQuery as SingleGeneQuery
                    ),
                    expected
                );
            }
        );
    });
});
