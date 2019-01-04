import { assert, expect } from 'chai';
import { mount } from "enzyme";
import * as React from "react";
import GeneSymbolValidator, { IGeneSymbolValidatorProps } from './GeneSymbolValidator';
import { DisplayStatus } from './GeneSelectionBox';

describe('GeneSymbolValidator', () => {

    let props: IGeneSymbolValidatorProps;

    beforeEach(() => {
        props = {
            oql: {
                query: []
            },
            genes: {
                result: { found: [], suggestions: [] },
                status: 'complete' as 'complete',
                peekStatus: 'complete',
                isPending: false,
                isError: false,
                isComplete: true,
                error: undefined
            },
            geneQueryErrorDisplayStatus: DisplayStatus.UNFOCUSED,
            geneQuery: '',
            updateGeneQuery: () => null,
        } as IGeneSymbolValidatorProps;
    });
    afterEach(() => {
    });

    it('valid oql', () => {

        props.oql.query = [{ gene: 'TP53', alterations: false }];
        const wrapper = mount(<GeneSymbolValidator {...props} />);

        assert.equal(
            wrapper.find('#geneBoxValidationStatus').text(),
            "All gene symbols are valid.");

        wrapper.setProps({ hideSuccessMessage: true });

        expect(wrapper.find('#geneBoxValidationStatus')).to.be.empty;

    });

    it('invalid oql', () => {

        const wrapper = mount(<GeneSymbolValidator {...props} />);

        expect(wrapper.find('#geneBoxValidationStatus')).to.be.empty;

        wrapper.setProps({ oql: { error: { start: 0, end: 0, message: '' } } })

        assert.equal(
            wrapper.find('#geneBoxValidationStatus').text(),
            "Cannot validate gene symbols because of invalid OQL. ");

        wrapper.setProps({ geneQueryErrorDisplayStatus: undefined });
        assert.equal(
            wrapper.find('#geneBoxValidationStatus').text(),
            "Cannot validate gene symbols because of invalid OQL. ");

    });

    it('api error', () => {

        props.oql.query = [{ gene: 'TP53', alterations: false }];
        props.genes = {
            result: { found: [], suggestions: [] },
            status: 'error' as 'error',
            peekStatus: 'error',
            isPending: false,
            isError: true,
            isComplete: false,
            error: undefined
        }
        const wrapper = mount(<GeneSymbolValidator {...props} />);

        assert.equal(
            wrapper.find('#geneBoxValidationStatus').text(),
            "Unable to validate gene symbols.");

    });

    it('api pending', () => {

        props.oql.query = [{ gene: 'TP53', alterations: false }];
        props.genes = {
            result: { found: [], suggestions: [] },
            status: 'pending' as 'pending',
            peekStatus: 'pending',
            isPending: true,
            isError: false,
            isComplete: false,
            error: undefined
        }
        const wrapper = mount(<GeneSymbolValidator {...props} />);

        assert.equal(
            wrapper.find('#geneBoxValidationStatus').text(),
            "Validating gene symbols...");

    });

    it('invalid genes with no suggestions', () => {

        props.genes = {
            result: { found: [], suggestions: [{ alias: 'TP5', genes: [] }] },
            status: 'pending' as 'pending',
            peekStatus: 'pending',
            isPending: true,
            isError: false,
            isComplete: false,
            error: undefined
        }
        props.oql.query = [{ gene: 'TP53', alterations: false }];
        const wrapper = mount(<GeneSymbolValidator {...props} />);

        assert.equal(
            wrapper.find('#geneBoxValidationStatus').text(),
            "Invalid gene symbols.TP5");

    });

    it('invalid genes with suggestions', () => {

        props.genes = {
            result: {
                found: [],
                suggestions: [
                    {
                        alias: 'AAA',
                        genes: [
                            {
                                "entrezGeneId": 351,
                                "hugoGeneSymbol": "APP",
                                "type": "protein-coding",
                                "cytoband": "21q21.3",
                                "length": 6349,
                                "chromosome": "21"
                            }
                        ]
                    }
                ]
            },
            status: 'pending' as 'pending',
            peekStatus: 'pending',
            isPending: true,
            isError: false,
            isComplete: false,
            error: undefined
        }
        props.oql.query = [{ gene: 'AAA', alterations: false }];
        const wrapper = mount(<GeneSymbolValidator {...props} />);

        assert.equal(
            wrapper.find('#geneBoxValidationStatus').text(),
            "Invalid gene symbols.AAA: APP");

    });

});
