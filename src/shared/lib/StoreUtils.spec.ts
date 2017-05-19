import {fetchCosmicData, fetchOncoKbData, makeStudyToCancerTypeMap} from "./StoreUtils";
import { assert } from 'chai';
import sinon from 'sinon';
import {MobxPromise} from "mobxpromise";
import {CancerStudy, Mutation} from "../api/generated/CBioPortalAPI";

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

    describe('makeStudyToCancerTypeMap', ()=>{
        let studies:CancerStudy[];
        before(()=>{
            studies = [];
            studies.push({
                studyId: "0",
                cancerType: {
                    name: "ZERO"
                }
            } as CancerStudy);
            studies.push({
                studyId: "1",
                cancerType: {
                    name: "ONE"
                }
            } as CancerStudy);
            studies.push({
                studyId: "2",
                cancerType: {
                    name: "TWO"
                }
            } as CancerStudy);
            studies.push({
                studyId: "3",
                cancerType: {
                    name: "three"
                }
            } as CancerStudy);
        });

        it('gives empty map if no studies', ()=>{
            assert.deepEqual(makeStudyToCancerTypeMap([]), {});
        });
        it('handles one study properly', ()=>{
            assert.deepEqual(makeStudyToCancerTypeMap([studies[0]]), { 0: "ZERO" });
        });
        it('handles more than one study properly', ()=>{
            assert.deepEqual(makeStudyToCancerTypeMap([studies[1], studies[2]]), { 1: "ONE", 2:"TWO" });
            assert.deepEqual(makeStudyToCancerTypeMap([studies[2], studies[1], studies[3]]), { 1:"ONE", 2:"TWO", 3:"three" });
            assert.deepEqual(makeStudyToCancerTypeMap(studies), { 0: "ZERO", 1:"ONE", 2:"TWO", 3:"three" });
        });
    });

    it("won't fetch onkokb data if there are no mutations", (done) => {
        fetchOncoKbData({}, emptyMutationData).then((data: any) => {
            assert.deepEqual(data, {sampleToTumorMap: {}, indicatorMap: {}});
            done();
        });
    });
});
