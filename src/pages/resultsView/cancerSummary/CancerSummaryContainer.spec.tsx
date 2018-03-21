import {assert} from 'chai';
import {shallow, mount} from "enzyme";
import * as React from "react";
import * as _ from 'lodash';
import CancerSummaryContainer from "./CancerSummaryContainer";
import {ICancerSummaryContentProps} from "./CancerSummaryContent";

describe('CancerSummaryContainer', ()=>{

    let mockInstance:any;

    beforeEach(()=>{

        mockInstance = {
            groupAlterationsBy_userSelection:undefined,

            props:{

                studies:[1,2],

                samplesExtendedWithClinicalData:[
                        {cancerType:'colon'},
                        {cancerType:'colon'},
                    ]
            }
        };

    });

    describe('#groupAlterationsBy',()=>{

        const method: () => any = Object.getOwnPropertyDescriptor(CancerSummaryContainer.prototype, 'groupAlterationsBy')!.get!;

        it('defaults to studyId if there is only one study', ()=>{
            assert.equal(method.apply(mockInstance), 'studyId','for > 1 study, defaults to studyId');
        });

        it('respects user selected groupBy', ()=>{
            mockInstance.groupAlterationsBy_userSelection = "cancerType";
            assert.equal(method.apply(mockInstance), 'cancerType', 'respects user selection');
        });

        it('when single study and single cancer type, defaults to cancerTypeDetailed', ()=>{
            mockInstance.props.studies = [1];
            assert.equal(method.apply(mockInstance), 'cancerTypeDetailed');
        });

        it('when single study and multipe cancer type, defaults to cancerType', ()=>{
            mockInstance.props.studies = [1];
            mockInstance.props.samplesExtendedWithClinicalData.push({ cancerType:'lung' });
            assert.equal(method.apply(mockInstance), 'cancerType');
        });

    });







});