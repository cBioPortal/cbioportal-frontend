import MutationInformationContainer from './MutationInformationContainer';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

describe('MutationInformationContainer', () => {

    let mockInstance: any;

    beforeEach(()=>{
        mockInstance = {
            props: {
                hotspots:{},
                sampleManager: {
                    samples:[1]
                }
            }
        }
    });


    /*it('hides mRnaExp and shows tumors when there are more than one sample, and vice versa when there is only one', ()=>{

        assert.property( MutationInformationContainer.prototype.buildColumns.apply(mockInstance), "mRnaExp" );

        assert.notProperty( MutationInformationContainer.prototype.buildColumns.apply(mockInstance), "tumors" );

        mockInstance.props.sampleManager.samples.push(2);

        assert.property( MutationInformationContainer.prototype.buildColumns.apply(mockInstance), "tumors" );

        assert.notProperty( MutationInformationContainer.prototype.buildColumns.apply(mockInstance), "mRnaExp" );


    });*/

});
