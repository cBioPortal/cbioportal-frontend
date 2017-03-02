import ProteinChangeColumnFormatter from './ProteinChangeColumnFormatter';
import styles from './style/proteinChange.module.scss';
import {IColumnFormatterData} from "shared/components/enhancedReactTable/IColumnFormatter";
import {MutationTableRowData} from "shared/components/mutationTable/IMutationTableProps";
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
        let data:IColumnFormatterData<MutationTableRowData> = {
            name:"Protein Change",
            tableData,
            rowData: [germlineMutation],
            columnData: null
        };

        // mount a single cell component (Td) for a germline mutation
        germlineComponent = mount(ProteinChangeColumnFormatter.renderFunction(data));

        data = {
            name:"Protein Change",
            tableData,
            rowData: [somaticMutation]
        };

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

    it('sets component cell value property', () => {
        assert.equal(germlineComponent.prop("value"), "Q616K",
            'Cell (Td) value property for germline mutation is correct');
        assert.equal(somaticComponent.prop("value"), "Q616L",
            'Cell (Td) value property for somatic mutation is correct');
    });

    after(() => {
        
    });
});
