import { assert } from 'chai';
import sinon from 'sinon';
import SampleManager from './SampleManager';
import TumorColumnFormatter from './mutation/column/TumorColumnFormatter';
import { checkNonProfiledGenesExist } from './PatientViewPageUtils';
import { PatientViewPageStore } from './clinicalInformation/PatientViewPageStore';

describe('PatientViewPageUtils', () => {
    describe('checkNonProfiledGenesExist()', () => {
        const sampleIds = ['sampleA', 'sampleB'];
        const entrezGeneIds = [1, 2, 3];

        const stub = sinon.stub(
            TumorColumnFormatter,
            'getProfiledSamplesForGene'
        );

        after(() => {
            stub.restore();
        });

        it('returns false when all samples have been profiled', () => {
            const allSamplesProfiled = {
                sampleA: true,
                sampleB: true,
            };

            stub.returns(allSamplesProfiled);
            assert.isFalse(
                checkNonProfiledGenesExist(
                    sampleIds,
                    entrezGeneIds,
                    {} as any,
                    {} as any
                )
            );
        });

        it('returns true when a sample has not been not profiled', () => {
            const oneSampleNotProfiled = {
                sampleA: true,
                sampleB: false,
            };

            stub.returns(oneSampleNotProfiled);
            assert.isTrue(
                checkNonProfiledGenesExist(
                    sampleIds,
                    entrezGeneIds,
                    {} as any,
                    {} as any
                )
            );
        });
    });
});
