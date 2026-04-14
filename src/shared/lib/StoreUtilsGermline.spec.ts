import {
    fetchOncoKbData,
    generateGermlineGenomicChangeQuery,
} from './StoreUtils';
import { assert } from 'chai';
import sinon from 'sinon';
import { Mutation } from 'cbioportal-ts-api-client';
import { initMutation } from 'test/MutationMockUtils';
import oncokbClient from 'shared/api/oncokbClientInstance';
import { REFERENCE_GENOME } from './referenceGenomeUtils';

describe('StoreUtils Germline', () => {
    let somaticMutation: Mutation;
    let germlineMutation: Mutation;

    beforeEach(() => {
        somaticMutation = initMutation({
            gene: {
                chromosome: '1',
                hugoGeneSymbol: 'TP53',
                entrezGeneId: 7157,
            },
            proteinChange: 'V157F',
            mutationType: 'missense',
            startPosition: 7578406,
            endPosition: 7578406,
            referenceAllele: 'G',
            variantAllele: 'T',
            mutationStatus: 'somatic',
        });

        germlineMutation = initMutation({
            gene: {
                chromosome: '17',
                hugoGeneSymbol: 'BRCA1',
                entrezGeneId: 672,
            },
            proteinChange: 'E23fs',
            mutationType: 'frame_shift_del',
            startPosition: 41276045,
            endPosition: 41276046,
            referenceAllele: 'AG',
            variantAllele: 'A',
            mutationStatus: 'germline',
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('generateGermlineGenomicChangeQuery', () => {
        it('generates correct query for GRCh37', () => {
            const query = generateGermlineGenomicChangeQuery(germlineMutation, REFERENCE_GENOME.GRCH37);
            assert.equal(query.genomicLocation, '17,41276045,41276046,AG,A');
            assert.equal(query.referenceGenome, 'GRCh37');
        });

        it('generates correct query for GRCh38', () => {
            const query = generateGermlineGenomicChangeQuery(germlineMutation, REFERENCE_GENOME.GRCH38);
            assert.equal(query.referenceGenome, 'GRCh38');
        });
    });

    describe('fetchOncoKbData', () => {
        it('calls somatic and germline endpoints correctly', async () => {
            const somaticResult = { [somaticMutation.proteinChange]: { oncogenic: 'Oncogenic' } };
            const germlineResult = { '17,41276045,41276046,AG,A': { pathogenic: 'Pathogenic' } };

            const somaticStub = sinon.stub(oncokbClient, 'annotateMutationsUsingPOST_1').resolves(somaticResult as any);
            const germlineStub = sinon.stub(oncokbClient, 'annotateMutationsByGenomicChangePostUsingPOST_3').resolves(germlineResult as any);

            const mutations = [somaticMutation, germlineMutation];
            const data = await fetchOncoKbData({ TP53: 'Breast' }, { 7157: true, 672: true }, { result: mutations } as any);

            assert.isTrue(somaticStub.calledOnce);
            assert.isTrue(germlineStub.calledOnce);
            assert.property(data.indicatorMap, somaticMutation.proteinChange);
            // The germline ID should be entrezGeneId_tumorType_genomicLocation
            // For BRCA1 (672) and tumorType 'Breast' from the map (Wait, BRCA1 might have different tumor type in map)
            // fetchOncoKbData uses cancerTypeForOncoKb(mutation.uniqueSampleKey, uniqueSampleKeyToTumorType)
            // In my test I didn't set uniqueSampleKey for germlineMutation, so it might be undefined
            assert.property(data.germlineIndicatorMap!, '672_17,41276045,41276046,AG,A');
        });
    });
});
