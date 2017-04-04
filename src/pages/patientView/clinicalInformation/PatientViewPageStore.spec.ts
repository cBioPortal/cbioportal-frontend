/**
 * Created by aaronlisman on 3/2/17.
 */

import { handlePathologyReportCheckResponse, PatientViewPageStore } from './PatientViewPageStore';
// import React from 'react';
import { assert } from 'chai';
// import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
// //import AppConfig from 'appConfig';
// import request from 'superagent';

describe('ClinicalInformationSamplesTable', () => {

    let store: PatientViewPageStore;

    before(()=>{
        store = new PatientViewPageStore();
    });

    after(()=>{

    });

    it('if there are pdf items in response, returns collection, otherwise returns empty array', ()=>{
        let result = handlePathologyReportCheckResponse({
            total_count:1,
            items:[ { url:'someUrl', name:'someName' } ]
        });
        assert.deepEqual(result,[{ url: 'someUrl' , name: 'someName'}]);

        result = handlePathologyReportCheckResponse({
            total_count:0,
        });
        assert.deepEqual(result,[]);
    });

    it('won\'t fetch cosmic data if there are no mutations', ()=>{

        const fetchStub = sinon.stub();

        let mockInstance = {
            mutationData: { result:[] },
            internalClient: {
                fetchCosmicCountsUsingPOST: fetchStub
            }
        };

        store.cosmicDataInvoke.apply(mockInstance).then((data: any)=>{
           assert.isUndefined(data);
           assert.isFalse(fetchStub.called);
        });

    });

    it('won\'t fetch onkokb data if there are no mutations', ()=>{

        const fetchStub = sinon.stub();

        let mockInstance = {
            mutationData: { result:[] }
        };

        store.oncoKbDataInvoke.apply(mockInstance).then((data: any)=>{
            assert.deepEqual(data,{sampleToTumorMap: {}, indicatorMap: {}});
        });

    });

});
