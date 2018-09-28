import {assert} from 'chai';
import {shallow, mount} from "enzyme";
import * as React from "react";
import * as _ from 'lodash';
import CancerSummaryContainer from "./CancerSummaryContainer";
import {ICancerSummaryContentProps} from "./CancerSummaryContent";
import {ExtendedSample} from "../ResultsViewPageStore";

describe('CancerSummaryContainer', ()=>{

    let mockInstance:any;

    beforeEach(()=>{

        mockInstance = {
            groupAlterationsBy_userSelection:undefined,

            props:{

                store:{
                    studies: {
                        result: [1,2]

                    },
                    samplesExtendedWithClinicalData:{
                        result:[
                            {cancerType:'colon'},
                            {cancerType:'brain'},
                        ]
                    }
                },


            }
        };

    });

    describe('#groupAlterationsBy',()=>{

        const method: () => any = Object.getOwnPropertyDescriptor(CancerSummaryContainer.prototype, 'groupAlterationsBy')!.get!;

        it('defaults to studyId if there is more than one study', ()=>{
            assert.equal(method.apply(mockInstance), 'studyId','for > 1 study, defaults to studyId');
        });

        it('defaults to cancerTypeDetailed if there is only one study', ()=>{
            //mockInstance.groupAlterationsBy_userSelection = "not undefined";
            mockInstance.props.store.studies.result = [1];
            assert.equal(method.apply(mockInstance), 'cancerType','for more than one cancer type');

            // now test if there's only one uniq cancerType
            mockInstance.props.store.samplesExtendedWithClinicalData.result[1].cancerType = "colon";
            assert.equal(method.apply(mockInstance), 'cancerTypeDetailed','one uniq cancer type');


        });

        it('respects user selected groupBy', ()=>{
            mockInstance.groupAlterationsBy_userSelection = "cancerType";
            assert.equal(method.apply(mockInstance), 'cancerType', 'respects user selection');
        });

    });


});