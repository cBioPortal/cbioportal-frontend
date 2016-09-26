import React from 'react';
import sinon from 'sinon';
import { assert } from 'chai';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { default as reducer, actionTypes, actionCreators, __RewireAPI__ as RewireDuckAPI } from './duck';


describe('clinicalInformation duck', () => {

    
    describe('actionCreators',()=>{

        it('dispatches a load action with status equal to fetching',()=>{

            //var prom = new Promise(()=>{});

            RewireDuckAPI.__Rewire__('getClinicalInformationData',()=>{
                return new Promise((resolve)=>{
                   setTimeout(()=>resolve(),1);
                });
            });

            const dispatchStub = sinon.stub();

            actionCreators.loadClinicalInformationTableData()(dispatchStub);
            
            assert.equal(dispatchStub.args[0][0].meta.status,"fetching");
            assert.equal(dispatchStub.args[0][0].type, actionTypes.FETCH);

            RewireDuckAPI.__ResetDependency__('getClinicalInformationData');

        });        
        
    });
    
    describe('reducer',()=>{
        
        it('handles fetching by setting status to fetching', ()=>{
           
            const newState = reducer(Immutable.Map({}), { type:actionTypes.FETCH, meta: { status:'fetching' } })
            
            assert.equal(newState.get('status'),'fetching');

        });

    });
    


});
