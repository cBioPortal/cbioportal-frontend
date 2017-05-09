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

describe('PatientViewPageStore', () => {

    let store: PatientViewPageStore;

    before(()=>{
        store = new PatientViewPageStore();
    });

    after(()=>{

    });

    // it('if there are pdf items in response, returns collection, otherwise returns empty array', ()=>{
    //     let result = handlePathologyReportCheckResponse({
    //         total_count:1,
    //         items:[ { url:'someUrl', name:'someName' } ]
    //     });
    //     assert.deepEqual(result,[{ url: 'someUrl' , name: 'someName'}]);
    //
    //     result = handlePathologyReportCheckResponse({
    //         total_count:0,
    //     });
    //     assert.deepEqual(result,[]);
    // });
    //
    //
    //
    // it('won\'t fetch onkokb data if there are no mutations', ()=>{
    //
    //     const fetchStub = sinon.stub();
    //
    //     let mockInstance = {
    //         mutationData: { result:[] },
    //         internalClient: {
    //             fetchCosmicCountsUsingPOST: fetchStub
    //         }
    //     };
    //
    //     store.oncoKbDataInvoke.apply(mockInstance).then((data: any)=>{
    //         assert.deepEqual(data,{sampleToTumorMap: {}, indicatorMap: {}});
    //     });
    //
    // });


    describe('cosmicCountInvoke', ()=>{

        it('won\'t fetch cosmic data if there are no mutations', (done)=>{

            const fetchStub = sinon.stub();

            let mockInstance = {
                mutationData: { result:[] },
                uncalledMutationData: { result:[] },
                internalClient: {
                    fetchCosmicCountsUsingPOST: fetchStub
                }
            };

            store.cosmicDataInvoke.apply(mockInstance).then(function(data: any){
                assert.isUndefined(data);
                assert.isFalse(fetchStub.called);
                done();
            });

        });

        it('won\'t fetch cosmic data if there ARE mutations, but none with keywords', (done)=>{

            const fetchStub = sinon.stub();

            let mockInstance = {
                mutationData: { result:[{},{}] },
                uncalledMutationData: { result:[] },
                internalClient: {
                    fetchCosmicCountsUsingPOST: fetchStub
                }
            };

            store.cosmicDataInvoke.apply(mockInstance).then(function(data: any){
                assert.isUndefined(data);
                assert.isFalse(fetchStub.called);
                done();
            });

        });

        it('will fetch cosmic data if there mutations with keywords', (done)=>{

            const fetchStub = sinon.stub();
            fetchStub.returns(Promise.resolve([]));

            let mockInstance = {
                mutationData: { result:[{keyword:"one"}] },
                uncalledMutationData: { result:[] },
                internalClient: {
                    fetchCosmicCountsUsingPOST: fetchStub
                }
            };

            store.cosmicDataInvoke.apply(mockInstance).then(function(data: any){
                //assert.isUndefined(data);
                assert.isTrue(fetchStub.called);
                done();
            });

        });


    })




});
