import { renderAlterationTypes, AlterationTypes } from './CopyNumberTableWrapper';
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

    it('CNA column renderer shows correct text based on alteration value', ()=>{

        let output = mount(renderAlterationTypes(-2));

        assert.equal(output.text(), 'DeepDel');

        output = mount(renderAlterationTypes(2));

        assert.equal(output.text(), 'AMP');

    });

});
