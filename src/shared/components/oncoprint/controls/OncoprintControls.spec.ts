import {assert} from "chai";
import OncoprintControls from 'shared/components/oncoprint/controls/OncoprintControls';
import { Treatment } from "shared/api/generated/CBioPortalAPIInternal";

describe('treatmentSelectOptions', () => {

    it('Includes entity_stable_id and description when present and unique', () => {
        
        const treatments = [
            {
                treatmentId: 'id_1',
                name: 'name_1',
                description: 'desc_1'
            },
            {
                treatmentId: 'id_2',
                name: 'name_2',
                description: 'desc_2'
            }
        ] as Treatment[];
        
        const props = { state: { treatmentsPromise: { result: treatments} } };
        const controls = new OncoprintControls(props as any);

        const expect = [
            {id: 'id_1', value: 'name_1 (id_1): desc_1', label: 'name_1 (id_1): desc_1'},
            {id: 'id_2', value: 'name_2 (id_2): desc_2', label: 'name_2 (id_2): desc_2'}
        ];
        assert.deepEqual(controls.treatmentSelectOptions, expect);
    });
    
    it('Hides description when same as entity_stable_id', () => {
        
        const treatments = [
            {
                treatmentId: 'id_1',
                name: 'name_1',
                description: 'id_1'
            },
            {
                treatmentId: 'id_2',
                name: 'name_2',
                description: 'id_2'
            }
        ] as Treatment[];
        
        const props = { state: { treatmentsPromise: { result: treatments} } };
        const controls = new OncoprintControls(props as any);

        const expect = [
            {id: 'id_1', value: 'name_1 (id_1)', label: 'name_1 (id_1)'},
            {id: 'id_2', value: 'name_2 (id_2)', label: 'name_2 (id_2)'}
        ];
        assert.deepEqual(controls.treatmentSelectOptions, expect);
    });

    it('Hides entity_stable_id when same as name', () => {
        
        const treatments = [
            {
                treatmentId: 'id_1',
                name: 'name_1',
                description: 'id_1'
            },
            {
                treatmentId: 'id_2',
                name: 'name_2',
                description: 'id_2'
            }
        ] as Treatment[];
        
        const props = { state: { treatmentsPromise: { result: treatments} } };
        const controls = new OncoprintControls(props as any);

        const expect = [
            {id: 'id_1', value: 'name_1 (id_1)', label: 'name_1 (id_1)'},
            {id: 'id_2', value: 'name_2 (id_2)', label: 'name_2 (id_2)'}
        ];
        assert.deepEqual(controls.treatmentSelectOptions, expect);
    });
    
    it('Hides name and description when same as entity_stable_id', () => {
        
        const treatments = [
            {
                treatmentId: 'id_1',
                name: 'id_1',
                description: 'id_1'
            },
            {
                treatmentId: 'id_2',
                name: 'id_2',
                description: 'id_2'
            }
        ] as Treatment[];
        
        const props = { state: { treatmentsPromise: { result: treatments} } };
        const controls = new OncoprintControls(props as any);

        const expect = [
            {id: 'id_1', value: 'id_1', label: 'id_1'},
            {id: 'id_2', value: 'id_2', label: 'id_2'}
        ];
        assert.deepEqual(controls.treatmentSelectOptions, expect);
    });

});