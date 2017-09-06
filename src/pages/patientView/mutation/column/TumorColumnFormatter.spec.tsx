import TumorColumnFormatter from './TumorColumnFormatter';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import {MOLECULAR_PROFILE_MUTATIONS_SUFFIX, MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX} from '../../../../shared/constants';

describe('TumorColumnFormatter', () => {
    let testData = [
        {sampleId:'A',
            molecularProfileId:MOLECULAR_PROFILE_MUTATIONS_SUFFIX
        },
        {sampleId:'B',
            molecularProfileId:MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX,
            tumorAltCount: 0,
        },
        {sampleId:'C',
            molecularProfileId:MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX,
            tumorAltCount: 5,
        },
    ];

    before(()=>{

    });

    after(()=>{

    });

    it('test get present samples', ()=>{
        let presentSamples = TumorColumnFormatter.getPresentSamples(testData);
        assert(presentSamples['A'], "sample A is present and is called");
        assert(!('B' in presentSamples), "sample B mutation is not present because it has 0 supporting reads");
        assert(presentSamples['C'] === false, "sample C mutation is present and is uncalled with > 0 supporting reads");
    });

    it('test get sample ids', ()=>{
        assert.deepEqual(TumorColumnFormatter.getSample(testData), ["A", "B", "C"]);
    });

});
