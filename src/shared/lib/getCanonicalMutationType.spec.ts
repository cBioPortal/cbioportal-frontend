import { getProteinImpactType } from './getCanonicalMutationType';
import { assert } from 'chai';

describe('getProteinImpactType', ()=>{

    it('maps mutation types to appropriate buckets',()=>{

        assert.equal(getProteinImpactType('5\'Flank'),'other');
        assert.equal(getProteinImpactType('Missense_Mutation'),'missense');
        assert.equal(getProteinImpactType('Nonsense_Mutation'),'truncating');
        assert.equal(getProteinImpactType('Frame_Shift_Del'),'truncating');
        assert.equal(getProteinImpactType('In_Frame_Deletion'),'inframe');



    })


});
