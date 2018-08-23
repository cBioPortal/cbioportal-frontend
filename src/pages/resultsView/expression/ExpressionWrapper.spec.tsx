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

    // this is failing. we need new data to debug
    /*it.skip('studies are sorted properly depending on sortBy setting',()=>{

        instance.sortBy = "alphabetic";
        assert.equal(instance.sortedData[2][0].studyId,  'chol_tcga', 'sorting is alphabetical');

        instance.sortBy = "median";
        assert.equal(instance.sortedData[2][0].studyId,  'laml_tcga', 'sort according to median values');

    });*/

});