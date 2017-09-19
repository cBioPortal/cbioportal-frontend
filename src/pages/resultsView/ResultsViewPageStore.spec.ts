import { assert } from 'chai';
import { buildDefaultOQLProfile } from './ResultsViewPageStore';

describe('buildDefaultOQLProfile', ()=>{

    it('produces correct default queryies based on alteration profiles and zscore/rppa',()=>{
        assert.equal(buildDefaultOQLProfile(['COPY_NUMBER_ALTERATION'],2,2),'AMP HOMDEL');
        assert.equal(buildDefaultOQLProfile(['MUTATION_EXTENDED'],2,2),'MUT FUSION');
        assert.equal(buildDefaultOQLProfile(['MUTATION_EXTENDED','COPY_NUMBER_ALTERATION'],2,2),'MUT FUSION AMP HOMDEL');
        assert.equal(buildDefaultOQLProfile(['MUTATION_EXTENDED','MRNA_EXPRESSION'],2,2),'MUT FUSION EXP>=2 EXP<=-2');
        assert.equal(buildDefaultOQLProfile(['MUTATION_EXTENDED','PROTEIN_LEVEL'],2,2),'MUT FUSION PROT>=2 PROT<=-2');
    });

});