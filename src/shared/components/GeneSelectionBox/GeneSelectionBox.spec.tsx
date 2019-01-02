import { assert } from 'chai';
import { mount } from "enzyme";
import * as React from "react";
import GeneSelectionBox, { IGeneSelectionBoxProps, GeneBoxType } from './GeneSelectionBox';
import client from "shared/api/cbioportalClientInstance";
import sinon from 'sinon';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import { Gene } from 'shared/api/generated/CBioPortalAPI';
import { GeneReplacement } from 'shared/components/query/QueryStore';
import * as _ from 'lodash';

describe('GeneSelectionBox', () => {

    beforeEach(() => {
        sinon.stub(client, 'getAllGenesUsingGET');
        sinon.stub(client, 'fetchGenesUsingPOST');
    });
    afterEach(() => {
        (client.getAllGenesUsingGET as sinon.SinonStub).restore();
        (client.fetchGenesUsingPOST as sinon.SinonStub).restore();
    });
    it('valid hugo gene symbol', (done) => {
        (client.fetchGenesUsingPOST as sinon.SinonStub)
            .returns(Promise.resolve([
                {
                    "entrezGeneId": 7157,
                    "hugoGeneSymbol": "TP53",
                    "type": "protein-coding",
                    "cytoband": "17p13.1",
                    "length": 19149,
                    "chromosome": "17"
                }
            ]));

        const props = {
            inputGeneQuery: 'TP53',
            callback: (oql: {
                query: SingleGeneQuery[],
                error?: { start: number, end: number, message: string }
            }, genes: {
                found: Gene[];
                suggestions: GeneReplacement[];
            },
                queryStr: string,
                status: "pending" | "error" | "complete") => {
                if (status === 'complete') {
                    assert.isTrue(_.isUndefined(oql.error));
                    assert.isTrue(_.isEqual(genes.found, [
                        {
                            "entrezGeneId": 7157,
                            "hugoGeneSymbol": "TP53",
                            "type": "protein-coding",
                            "cytoband": "17p13.1",
                            "length": 19149,
                            "chromosome": "17"
                        }
                    ]));
                    assert.isTrue(genes.suggestions.length === 0);
                    done()
                }

            }
        } as IGeneSelectionBoxProps;

        mount(<GeneSelectionBox {...props} />);
    });

    it('invalid hugo gene symbol', (done) => {
        (client.fetchGenesUsingPOST as sinon.SinonStub)
            .returns(Promise.resolve([]));

        const props = {
            inputGeneQuery: 'ALK',
            callback: (oql: {
                query: SingleGeneQuery[],
                error?: { start: number, end: number, message: string }
            }, genes: {
                found: Gene[];
                suggestions: GeneReplacement[];
            },
                queryStr: string,
                status: "pending" | "error" | "complete") => {
                if (status === 'complete') {
                    assert.isTrue(_.isUndefined(oql.error));
                    assert.isTrue(genes.found.length === 0);
                    done()
                }

            }
        } as IGeneSelectionBoxProps;

        mount(<GeneSelectionBox {...props} />);
    });

    it('invalid oql', () => {
        (client.fetchGenesUsingPOST as sinon.SinonStub)
            .returns(Promise.resolve([]));

        const props = {
            inputGeneQuery: 'TP53 : CNA>AM'
        } as IGeneSelectionBoxProps;

        const wrapper = mount(<GeneSelectionBox {...props} />);

        assert.equal(
            wrapper.find('#geneBoxValidationStatus').text(),
            "Cannot validate gene symbols because of invalid OQL. ");
    });

    it('textarea value - default view', () => {
        const props = {
            inputGeneQuery: 'CDKN2A CDKN2A-AS1 CDKN2B'
        } as IGeneSelectionBoxProps;

        let wrapper = mount(<GeneSelectionBox {...props} />);
        assert.equal(wrapper.find({ 'data-test': 'geneSet' }).text(), 'CDKN2A CDKN2A-AS1 CDKN2B');

    });

    it('textarea value - study view', () => {
        const props = {
            inputGeneQuery: 'CDKN2A CDKN2A-AS1 CDKN2B',
            location: GeneBoxType.STUDY_VIEW_PAGE
        } as IGeneSelectionBoxProps;

        let wrapper = mount(<GeneSelectionBox {...props} />);
        assert.equal(wrapper.find({ 'data-test': 'geneSet' }).text(), 'CDKN2A and 2 more');
    });
});
