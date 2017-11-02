import GenomeDrivenDiagnosis, {GDDOutput} from './GenomeDrivenDiagnosis';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
const mockData = require("json-loader!./mock/gdd/P-0001055-T01-IM3");

describe('GenomeDrivenDiagnosis', () => {
    it('does not show predicted cancer type when the sampleCancerType differs, but the CancerType is not one of the 22 cancer types', ()=>{
        let genomeDrivenDiagnosis = shallow(<GenomeDrivenDiagnosis
            prediction={mockData as GDDOutput}
        />);
        assert.equal(genomeDrivenDiagnosis.find("[data-test='gdd-prediction']").exists(), false, 'gdd-prediction is not displayed');
    });

    it('shows predicted cancer type when the sampleCancerType differs, the CancerType is one of the 22 cancer types', ()=>{
        mockData["Diagnosed_Cancer_Type"] = "Bladder Cancer";
        let genomeDrivenDiagnosis = shallow(<GenomeDrivenDiagnosis
            prediction={mockData as GDDOutput}
        />);
        assert(genomeDrivenDiagnosis.find("[data-test='gdd-prediction']").exists());
		});

    it('does not show predicted cancer type when the sampleCancerType is the same', ()=>{
        mockData["Diagnosed_Cancer_Type"] = "Breast Cancer";
        let genomeDrivenDiagnosis = shallow(<GenomeDrivenDiagnosis
            prediction={mockData as GDDOutput}
				/>);
        assert.equal(genomeDrivenDiagnosis.find("[data-test='gdd-prediction']").exists(), false, 'gdd-prediction is not displayed');
    });
});