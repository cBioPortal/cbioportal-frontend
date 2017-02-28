import CosmicColumnFormatter from './CosmicColumnFormatter';
import {keywordToCosmic} from 'shared/lib/AnnotationUtils';
import {initMutation} from "test/MutationMockUtils";
import React from 'react';
import { assert } from 'chai';
import {shallow, mount, ReactWrapper} from 'enzyme';
import sinon from 'sinon';

describe('CosmicColumnFormatter', () => {

    const cosmicMutations = [
        {
            cosmicMutationId: "",
            count: 2,
            keyword: "TP53 R273 missense",
            proteinChange: "R273H"
        },
        {
            cosmicMutationId: "",
            count: 3,
            keyword: "TP53 R273 missense",
            proteinChange: "R273C"
        },
        {
            cosmicMutationId: "",
            count: 5,
            keyword: "TP53 R273 missense",
            proteinChange: "R273L"
        },
        {
            cosmicMutationId: "",
            count: 7,
            keyword: "PIK3CA R38 missense",
            proteinChange: "R38H"
        },
        {
            cosmicMutationId: "",
            count: 11,
            keyword: "PIK3CA R38 missense",
            proteinChange: "R38C"
        },
        {
            cosmicMutationId: "",
            count: 13,
            keyword: "PIK3CA R38 missense",
            proteinChange: "R38S"
        }
    ];

    const mutation273 = initMutation({
        gene: {
            hugoGeneSymbol: "TP53"
        },
        proteinChange: "R273S",
        keyword: "TP53 R273 missense"
    });

    const mutation38 = initMutation({
        gene: {
            hugoGeneSymbol: "PIK3CA"
        },
        proteinChange: "R38S",
        keyword: "PIK3CA R38 missense"
    });

    const mutation666 = initMutation({
        gene: {
            hugoGeneSymbol: "DIABLO"
        },
        proteinChange: "V666E",
        keyword: "DIABLO"
    });

    const tableData = [[mutation273], [mutation38], [mutation666]];

    let component273: ReactWrapper<any, any>;
    let component38: ReactWrapper<any, any>;
    let component666: ReactWrapper<any, any>;

    before(() => {
        const columnProps = {
            cosmicData: keywordToCosmic(cosmicMutations)
        };

        let data = {
            name: "Cosmic",
            tableData,
            rowData: [mutation273]
        };

        // mount a single cell component (Td)
        component273 = mount(CosmicColumnFormatter.renderFunction(data, columnProps));

        data = {
            name: "Cosmic",
            tableData,
            rowData: [mutation38]
        };

        // mount a single cell component (Td)
        component38 = mount(CosmicColumnFormatter.renderFunction(data, columnProps));

        data = {
            name: "Cosmic",
            tableData,
            rowData: [mutation666]
        };

        // mount a single cell component (Td)
        component666 = mount(CosmicColumnFormatter.renderFunction(data, columnProps));
    });

    it('generates component tooltip', () => {
        assert.isTrue(component273.find('DefaultTooltip').exists(),
            'Tooltip should exists for TP53 R273 missense mutation');
        assert.isTrue(component38.find('DefaultTooltip').exists(),
            'Tooltip should exists for PIK3CA R38 missense mutation');
        assert.isFalse(component666.find('DefaultTooltip').exists(),
            'Tooltip should not exist for DIABLO mutation');
    });

    it('renders display value', () => {
        assert.isTrue(component273.find(`span`).text().indexOf((2 + 3 + 5).toString()) > -1,
            'Cosmic count total for TP53 R273 missense mutation is correct');
        assert.isTrue(component38.find(`span`).text().indexOf((7 + 11 + 13).toString()) > -1,
            'Cosmic count total for PIK3CA R38 missense mutation is correct');
    });

    it('sets component cell value property', () => {
        assert.equal(component273.prop("value"), (2 + 3 + 5),
            'Cell (Td) value property for TP53 R273 missense mutation is correct');
        assert.equal(component38.prop("value"), (7 + 11 + 13),
            'Cell (Td) value property for PIK3CA R38 missense mutation is correct');
        assert.isAtMost(component666.prop("value"), 0,
            'Cell (Td) value property for DIABLO mutation should not be greater than zero');
    });

    after(() => {

    });
});
