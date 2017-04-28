import {fetchCosmicData, fetchOncoKbData} from "./StoreUtils";
import { assert } from 'chai';
import sinon from 'sinon';
import {MobxPromise} from "mobxpromise";
import {Mutation} from "../api/generated/CBioPortalAPI";

describe('StoreUtils', () => {

    let mutationData: MobxPromise<Mutation[]>

    before(()=>{
        mutationData =  {
            result: [],
            status: 'complete' as 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };
    });

    after(()=>{

    });

    it('won\'t fetch cosmic data if there are no mutations', () => {
        const fetchStub = sinon.stub();
        let internalClient = {
            fetchCosmicCountsUsingPOST: fetchStub
        };

        fetchCosmicData(mutationData, internalClient as any).then((data: any) => {
            assert.isUndefined(data);
            assert.isFalse(fetchStub.called);
        });
    });

    it('won\'t fetch onkokb data if there are no mutations', () => {
        fetchOncoKbData(mutationData, {}).then((data: any)=>{
            assert.deepEqual(data, {sampleToTumorMap: {}, indicatorMap: {}});
        });
    });

});
