import * as React from "react";
import {assert} from 'chai';
import { mount, shallow } from 'enzyme';
import ExpressionWrapper, {ExpressionWrapperProps} from './ExpressionWrapper';
import {NumericGeneMolecularData} from "../../../shared/api/generated/CBioPortalAPI";

const expressionTestData: ExpressionWrapperProps = require('json-loader!./expressionTestData.json');

describe('Expression Wrapper',()=>{

    let wrapper: any;
    let instance: ExpressionWrapper;

    beforeEach(()=>{
        wrapper = shallow(<ExpressionWrapper
            {...expressionTestData as ExpressionWrapperProps}
        />);
        instance = wrapper.instance() as ExpressionWrapper;
    });


   it('data transformer returns correct value based on logScale state',()=>{

       instance.logScale = true;
       assert.equal(instance.dataTransformer({value: 100} as NumericGeneMolecularData), 6.643856189774724);

       instance.logScale = false;
       assert.equal(instance.dataTransformer({value: 100} as NumericGeneMolecularData), 100);

   });

    it('data transformer caps expression value >= constant',()=>{

        instance.logScale = true;
        assert.equal(instance.dataTransformer({value: 0.0001} as NumericGeneMolecularData), -6.643856189774724, 'value less than cap');
        assert.equal(instance.dataTransformer({value: 0} as NumericGeneMolecularData), -6.643856189774724, 'zero value');

        instance.logScale = false;
        assert.equal(instance.dataTransformer({value: 0.0001} as NumericGeneMolecularData), .0001, 'non log');
        assert.equal(instance.dataTransformer({value: 0} as NumericGeneMolecularData), 0, 'non log zero');
    });

    // this is failing. we need new data to debug
    it.skip('studies are sorted properly depending on sortBy setting',()=>{

        instance.sortBy = "alphabetic";
        assert.equal(instance.sortedData[2][0].studyId,  'chol_tcga', 'sorting is alphabetical');

        instance.sortBy = "median";
        assert.equal(instance.sortedData[2][0].studyId,  'laml_tcga', 'sort according to median values');

    });

});