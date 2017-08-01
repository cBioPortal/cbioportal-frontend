import {assert} from "chai";
import ProteinChangeColumnFormatter from "./ProteinChangeColumnFormatter";
import DefaultTooltip from "shared/components/DefaultTooltip";
import styles from './proteinChange.module.scss';
import {initMutation} from "test/MutationMockUtils";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {mount, ReactWrapper} from 'enzyme';

/**
 * @author Selcuk Onur Sumer
 */
describe('ProteinChangeColumnFormatter', () => {
    const germlineMutation:Mutation = initMutation({
        proteinChange: "Q616K",
        mutationStatus: "Germline"
    });

    const somaticMutation:Mutation = initMutation({
        proteinChange: "Q616L",
        mutationStatus: "Somatic"
    });

    const mutationWithLongProteinChangeValue:Mutation = initMutation({
        proteinChange: "this_is_a_protein_change_with_more_than_20_chars",
        mutationStatus: "Somatic"
    });

    let germlineComponent: ReactWrapper<any, any>;
    let somaticComponent:ReactWrapper<any, any>;
    let longProteinChangeComponent:ReactWrapper<any, any>;

    before(() => {
        let data = [germlineMutation];

        // mount a single cell component (Td) for a germline mutation
        germlineComponent = mount(ProteinChangeColumnFormatter.renderWithMutationStatus(data));

        data = [somaticMutation];

        // mount a single cell component (Td) for a somatic mutation
        somaticComponent = mount(ProteinChangeColumnFormatter.renderWithMutationStatus(data));

        data = [mutationWithLongProteinChangeValue];
        longProteinChangeComponent = mount(ProteinChangeColumnFormatter.renderWithMutationStatus(data));
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
        assert.isTrue(longProteinChangeComponent.find(`.${styles.proteinChange}`).text().indexOf("this_is_a_protein_change_with_more_than_20_chars") === -1,
            'Long protein change values should be truncated');
    });

    it('adds tooltip for long protein change values', () => {
        assert.isFalse(germlineComponent.find(DefaultTooltip).exists(),
            'Tooltip should not exists for short values (Q616K)');
        assert.isFalse(somaticComponent.find(DefaultTooltip).exists(),
            'Tooltip should not exists for short values (Q616L)');
        assert.isTrue(longProteinChangeComponent.find(DefaultTooltip).exists(),
            'Tooltip should exist for long values');
    });

    it('renders germline indicator', () => {
        assert.isTrue(germlineComponent.find(`.${styles.germline}`).exists(),
            'Germline mutation should have the additional germline indicator');
        assert.isFalse(somaticComponent.find(`.${styles.germline}`).exists(),
            'Somatic mutation should not have the additional germline indicator');
    });

    const a = "E746_A750del";
    const b = "E747_T749del";
    const c = "K754E";
    const d = "K754I";

    it('properly extracts sort value from a protein change string value', () => {
        let valA:number|null = ProteinChangeColumnFormatter.extractSortValue(a);
        let valB:number|null = ProteinChangeColumnFormatter.extractSortValue(b);
        let valC:number|null = ProteinChangeColumnFormatter.extractSortValue(c);
        let valD:number|null = ProteinChangeColumnFormatter.extractSortValue(d);

        assert.isNotNull(valA);
        assert.isNotNull(valB);
        assert.isNotNull(valC);
        assert.isNotNull(valD);

        assert.isAbove(valB as number,
                       valA as number);

        assert.isAbove(valD as number,
                       valC as number);

        assert.isAbove(valC as number,
                       valB as number);
    });
});
