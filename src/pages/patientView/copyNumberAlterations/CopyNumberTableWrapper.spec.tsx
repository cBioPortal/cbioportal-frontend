import CopyNumberTableWrapper from './CopyNumberTableWrapper';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import {PatientViewPageStore} from "../clinicalInformation/PatientViewPageStore";

describe('CopyNumberTableWrapper', () => {


    before(()=>{
    });

    after(()=>{

    });

    // it.only('alert message renders only if we have profileId', ()=>{
    //
    //     const store = ({
    //         discreteCNAData: { isComplete:true, result:undefined },
    //         geneticProfileIdDiscrete: {isComplete: true, result: undefined}
    //     } as PatientViewPageStore);
    //
    //     let instance = shallow(<CopyNumberTableWrapper store={ store } />);
    //
    //     assert.equal( instance.find('.alert').length, 1 );
    //
    // });

    // it('alert message renders only if ', ()=>{
    //
    //     const store:PatientViewPageStore = ({
    //         discreteCNAData: { isComplete:true, result:undefined },
    //         geneticProfileIdDiscrete: { isComplete:true, result:'123' }
    //     }  as PatientViewPageStore);
    //
    //     let instance = shallow(<CopyNumberTableWrapper store={ store } />);
    //
    //     assert.equal( instance.find('.alert').length, 0 );
    //
    // });

});
