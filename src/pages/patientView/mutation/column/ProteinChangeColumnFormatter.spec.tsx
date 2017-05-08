import ProteinChangeColumnFormatter from './ProteinChangeColumnFormatter';
import styles from './style/proteinChange.module.scss';
import {initMutation} from "test/MutationMockUtils";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import React from 'react';
import { assert } from 'chai';
import {shallow, mount, ReactWrapper} from 'enzyme';
import sinon from 'sinon';

describe('ProteinChangeColumnFormatter (customized for patient view)', () => {
    const germlineMutation:Mutation = initMutation({
        proteinChange: "Q616K",
        mutationStatus: "Germline"
    });

    const somaticMutation:Mutation = initMutation({
        proteinChange: "Q616L",
        mutationStatus: "Somatic"
    });

    const tableData = [[germlineMutation], [somaticMutation]];

    let germlineComponent: ReactWrapper<any, any>;
    let somaticComponent:ReactWrapper<any, any>;

    before(() => {
        let data = [germlineMutation];

        // mount a single cell component (Td) for a germline mutation
        germlineComponent = mount(ProteinChangeColumnFormatter.renderFunction(data));

        data = [somaticMutation];

        // mount a single cell component (Td) for a somatic mutation
        somaticComponent = mount(ProteinChangeColumnFormatter.renderFunction(data));
    });

    it('renders protein change display value', () => {
        assert.isTrue(germlineComponent.find(`.${styles.proteinChange}`).exists(),
            'Germline mutation should have the protein change value');
        assert.isTrue(germlineComponent.find(`.${styles.proteinChange}`).text().indexOf("Q616K") > -1,
            'Protein change value for germline mutation is correct');
        assert.isTrue(somaticComponent.find(`.${styles.proteinChange}`).exists(),
            'Somatic mutation should have the protein change value');
        assert.isTrue(somaticComponent.find(`.${styles.proteinChange}`).text().indexOf("Q616L") > -1,
            'Protein change value for somatic mutation is correct');
    });

    it('renders germline indicator', () => {
        assert.isTrue(germlineComponent.find(`.${styles.germline}`).exists(),
            'Germline mutation should have the additional germline indicator');
        assert.isFalse(somaticComponent.find(`.${styles.germline}`).exists(),
            'Somatic mutation should not have the additional germline indicator');
    });

    after(() => {
        
    });
});
