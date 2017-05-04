import {fetchCosmicData, fetchOncoKbData} from "./StoreUtils";
import { assert } from 'chai';
import sinon from 'sinon';
import {MobxPromise} from "mobxpromise";
import {Mutation} from "../api/generated/CBioPortalAPI";

describe('StoreUtils', () => {

    let emptyMutationData: MobxPromise<Mutation[]>;
    let emptyUncalledMutationData: MobxPromise<Mutation[]>;
    let mutationDataWithNoKeyword: MobxPromise<Mutation[]>;
    let mutationDataWithKeywords: MobxPromise<Mutation[]>;

    before(() => {
        emptyMutationData =  {
            result: [],
            status: 'complete' as 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };

        mutationDataWithNoKeyword =  {
            result: [{}, {}] as Mutation[],
            status: 'complete' as 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };

        mutationDataWithKeywords =  {
            result: [{keyword:"one"}] as Mutation[],
            status: 'complete' as 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };

        emptyUncalledMutationData =  {
            result: [],
            status: 'complete' as 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };
    });

    after(() => {

    });

    describe('fetchCosmicCount', () => {

        it("won't fetch cosmic data if there are no mutations", (done) => {
            const fetchStub = sinon.stub();
            const internalClient = {
                fetchCosmicCountsUsingPOST: fetchStub
            };

            fetchCosmicData(emptyMutationData, emptyUncalledMutationData, internalClient as any).then((data: any) => {
                assert.isUndefined(data);
                assert.isFalse(fetchStub.called);
                done();
            });
        });

        it("won't fetch cosmic data if there ARE mutations, but none with keywords", (done) => {
            const fetchStub = sinon.stub();
            const internalClient = {
                fetchCosmicCountsUsingPOST: fetchStub
            };

            fetchCosmicData(mutationDataWithNoKeyword, emptyUncalledMutationData, internalClient as any).then((data: any) => {
                assert.isUndefined(data);
                assert.isFalse(fetchStub.called);
                done();
            });
        });

        it('will fetch cosmic data if there are mutations with keywords', (done) => {
            const fetchStub = sinon.stub();
            fetchStub.returns(Promise.resolve([]));

            const internalClient = {
                fetchCosmicCountsUsingPOST: fetchStub
            };

            fetchCosmicData(mutationDataWithKeywords, emptyUncalledMutationData, internalClient as any).then((data: any) => {
                //assert.isUndefined(data);
                assert.isTrue(fetchStub.called);
                done();
            });
        });
    });

    it("won't fetch onkokb data if there are no mutations", (done) => {
        fetchOncoKbData({}, emptyMutationData).then((data: any) => {
            assert.deepEqual(data, {sampleToTumorMap: {}, indicatorMap: {}});
            done();
        });
    });
});
