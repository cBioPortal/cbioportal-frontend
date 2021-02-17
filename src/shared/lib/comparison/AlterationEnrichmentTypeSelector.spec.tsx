import React from 'react';
import AlterationEnrichmentTypeSelector, {
    IAlterationEnrichmentTypeSelectorHandlers,
} from 'shared/lib/comparison/AlterationEnrichmentTypeSelector';
import ComparisonStore from 'shared/lib/comparison/ComparisonStore';
import { mountWithCustomWrappers } from 'enzyme-custom-wrappers';
import { assert } from 'chai';
import _ from 'lodash';
import sinon from 'sinon';
import {
    cnaEventTypeSelectInit,
    mutationEventTypeSelectInit,
} from 'shared/lib/comparison/ComparisonStoreUtils';

describe('AlterationEnrichmentTypeSelector', () => {
    let menu: any;
    const handlers: IAlterationEnrichmentTypeSelectorHandlers = {
        updateSelectedCopyNumber: sinon.spy(),
        updateSelectedMutations: sinon.spy(),
    };

    const inframeCheckboxRefs = [
        'InFrame',
        'InframeDeletion',
        'InframeInsertion',
    ];

    const frameshiftCheckboxRefs = [
        'Frameshift',
        'FrameshiftDeletion',
        'FrameshiftInsertion',
    ];

    const truncatingCheckboxRefs = [
        'Truncating',
        ...frameshiftCheckboxRefs,
        'Nonsense',
        'Splice',
        'Nonstart',
        'Nonstop',
    ];

    const structvarCheckboxRefs = ['Fusion'];

    const cnaCheckboxRefs = [
        'CheckCopynumberAlterations',
        'DeepDeletion',
        'Amplification',
    ];

    const mutationTypeCheckboxRefs = [
        'Missense',
        ...inframeCheckboxRefs,
        ...truncatingCheckboxRefs,
        'Other',
    ];

    const wrapperForMenu = (component: any) => {
        function allSelected(refs: string[]) {
            return _.every(
                refs,
                checkbox => component.findByDataTest(checkbox).props().checked
            );
        }

        function allDeselected(refs: string[]) {
            return _.every(
                refs,
                checkbox => !component.findByDataTest(checkbox).props().checked
            );
        }

        function checkboxIsSelected(ref: string) {
            return component.findByDataTest(ref).props().checked;
        }

        function toggleCheckbox(ref: string) {
            component.findByDataTest(ref).click();
        }

        return {
            cnaSection: {
                pressMasterButton: () =>
                    toggleCheckbox('CheckCopynumberAlterations'),
                pressChildButton: () => toggleCheckbox('DeepDeletion'),
                masterCheckBoxIsSelected: () =>
                    checkboxIsSelected('CheckCopynumberAlterations'),
                allCheckBoxesSelected: () => allSelected(cnaCheckboxRefs),
                allCheckBoxesDeselected: () => allDeselected(cnaCheckboxRefs),
            },
            frameshiftSection: {
                pressMasterButton: () => toggleCheckbox('Frameshift'),
                pressChildButton: () => toggleCheckbox('FrameshiftDeletion'),
                masterCheckBoxIsSelected: () =>
                    checkboxIsSelected('Frameshift'),
                allCheckBoxesSelected: () =>
                    allSelected(frameshiftCheckboxRefs),
                allCheckBoxesDeselected: () =>
                    allDeselected(frameshiftCheckboxRefs),
            },
            inframeSection: {
                pressMasterButton: () => toggleCheckbox('InFrame'),
                pressChildButton: () => toggleCheckbox('InframeDeletion'),
                masterCheckBoxIsSelected: () => checkboxIsSelected('InFrame'),
                allCheckBoxesSelected: () => allSelected(inframeCheckboxRefs),
                allCheckBoxesDeselected: () =>
                    allDeselected(inframeCheckboxRefs),
            },
            truncatingSection: {
                pressMasterButton: () => toggleCheckbox('Truncating'),
                pressChildButton: () => toggleCheckbox('Nonsense'),
                masterCheckBoxIsSelected: () =>
                    checkboxIsSelected('Truncating'),
                allCheckBoxesSelected: () =>
                    allSelected(truncatingCheckboxRefs),
                allCheckBoxesDeselected: () =>
                    allDeselected(truncatingCheckboxRefs),
            },
            mutationSection: {
                pressMasterButton: () => toggleCheckbox('Mutations'),
                pressChildButton: () => toggleCheckbox('Missense'),
                masterCheckBoxIsSelected: () => checkboxIsSelected('Mutations'),
                allCheckBoxesSelected: () =>
                    allSelected(mutationTypeCheckboxRefs),
                allCheckBoxesDeselected: () =>
                    allDeselected(mutationTypeCheckboxRefs),
            },
            fusionSection: {
                pressMasterButton: () => toggleCheckbox('Fusion'),
            },
            pressSubmitButton: () =>
                component.findByDataTest('buttonSelectAlterations').click(),
        };
    };

    function createStore() {
        return {
            selectedCopyNumberEnrichmentEventTypes: cnaEventTypeSelectInit,
            selectedMutationEnrichmentEventTypes: mutationEventTypeSelectInit(),
        } as ComparisonStore;
    }

    describe('checkbox logic', () => {
        beforeEach(() => {
            menu = mountWithCustomWrappers(
                <AlterationEnrichmentTypeSelector
                    handlers={handlers}
                    store={createStore()}
                    showMutations={true}
                    showFusions={true}
                    showCnas={true}
                />,
                wrapperForMenu
            );
        });

        // -+=+ MUTATION +=+-
        it('unchecks all mutation types using the mutation master checkbox', function() {
            menu.mutationSection.pressMasterButton();
            assert.isTrue(
                menu.mutationSection.allCheckBoxesDeselected(),
                'unchecks all mutation checkboxes'
            );
        });
        it('checks all mutation types using the master mutation checkbox', function() {
            menu.mutationSection.pressMasterButton();
            menu.mutationSection.pressMasterButton();
            assert.isTrue(
                menu.mutationSection.allCheckBoxesSelected(),
                'checks all mutation checkboxes'
            );
        });
        it('checks the master mutation checkbox when any mutation type is checked', function() {
            menu.mutationSection.pressMasterButton();
            menu.mutationSection.pressChildButton();
            assert.isTrue(menu.mutationSection.masterCheckBoxIsSelected());
        });

        // -+=+ FRAMESHIFT MUTATION +=+-
        it('unchecks all frameshift mutation types using the frameshift mutation master checkbox', function() {
            menu.frameshiftSection.pressMasterButton();
            assert.isTrue(
                menu.frameshiftSection.allCheckBoxesDeselected(),
                'unchecks all frameshift mutation checkboxes'
            );
        });
        it('checks all frameshift mutation types using the master frameshift mutation checkbox', function() {
            menu.frameshiftSection.pressMasterButton();
            menu.frameshiftSection.pressMasterButton();
            assert.isTrue(
                menu.frameshiftSection.allCheckBoxesSelected(),
                'checks all frameshift mutation checkboxes'
            );
        });
        it('checks the master frameshift mutation checkbox when any frameshift mutation type is checked', function() {
            menu.frameshiftSection.pressMasterButton();
            menu.frameshiftSection.pressChildButton();
            assert.isTrue(menu.frameshiftSection.masterCheckBoxIsSelected());
        });

        // -+=+ INFRAME MUTATION +=+-
        it('unchecks all inframe mutation types using the inframe mutation master checkbox', function() {
            menu.inframeSection.pressMasterButton();
            assert.isTrue(
                menu.inframeSection.allCheckBoxesDeselected(),
                'unchecks all inframe mutation checkboxes'
            );
        });
        it('checks all inframe mutation types using the master inframe mutation checkbox', function() {
            menu.inframeSection.pressMasterButton();
            menu.inframeSection.pressMasterButton();
            assert.isTrue(
                menu.inframeSection.allCheckBoxesSelected(),
                'checks all inframe mutation checkboxes'
            );
        });
        it('checks the master inframe mutation checkbox when any inframe mutation type is checked', function() {
            menu.inframeSection.pressMasterButton();
            menu.inframeSection.pressChildButton();
            assert.isTrue(menu.inframeSection.masterCheckBoxIsSelected());
        });

        // -+=+ TRUNCATING MUTATION +=+-
        it('unchecks all truncating mutation types using the truncating mutation master checkbox', function() {
            menu.truncatingSection.pressMasterButton();
            assert.isTrue(
                menu.truncatingSection.allCheckBoxesDeselected(),
                'unchecks all truncating mutation checkboxes'
            );
        });
        it('checks all truncating mutation types using the master truncating mutation checkbox', function() {
            menu.truncatingSection.pressMasterButton();
            menu.truncatingSection.pressMasterButton();
            assert.isTrue(
                menu.truncatingSection.allCheckBoxesSelected(),
                'checks all truncating mutation checkboxes'
            );
        });
        it('checks the master truncating mutation checkbox when any truncating mutation type is checked', function() {
            menu.truncatingSection.pressMasterButton();
            menu.truncatingSection.pressChildButton();
            assert.isTrue(menu.truncatingSection.masterCheckBoxIsSelected());
        });

        // -+=+ CNA +=+-
        it('unchecks all cna types using the cna master checkbox', function() {
            menu.cnaSection.pressMasterButton();
            assert.isTrue(
                menu.cnaSection.allCheckBoxesDeselected(),
                'unchecks all cna checkboxes'
            );
        });
        it('checks all cna types using the master cna checkbox', function() {
            menu.cnaSection.pressMasterButton();
            menu.cnaSection.pressMasterButton();
            assert.isTrue(
                menu.cnaSection.allCheckBoxesSelected(),
                'checks all cna checkboxes'
            );
        });
        it('checks the master cna checkbox when any cna type is checked', function() {
            menu.cnaSection.pressMasterButton();
            menu.cnaSection.pressChildButton();
            assert.isTrue(menu.cnaSection.masterCheckBoxIsSelected());
        });
    });

    describe('conditional sections', () => {
        it('shows all sections when asked', function() {
            menu = mountWithCustomWrappers(
                <AlterationEnrichmentTypeSelector
                    handlers={handlers}
                    store={createStore()}
                    showMutations={true}
                    showFusions={true}
                    showCnas={true}
                />,
                wrapperForMenu
            );
            assert.isTrue(menu.exists('input[data-test="Mutations"]'));
            assert.isTrue(menu.exists('input[data-test="Fusion"]'));
            assert.isTrue(
                menu.exists('input[data-test="CheckCopynumberAlterations"]')
            );
        });

        it('shows no sections when asked', function() {
            menu = mountWithCustomWrappers(
                <AlterationEnrichmentTypeSelector
                    handlers={handlers}
                    store={createStore()}
                    showMutations={false}
                    showFusions={false}
                    showCnas={false}
                />,
                wrapperForMenu
            );
            assert.isFalse(menu.exists('input[data-test="Mutations"]'));
            assert.isFalse(menu.exists('input[data-test="Fusion"]'));
            assert.isFalse(
                menu.exists('input[data-test="CheckCopynumberAlterations"]')
            );
        });

        it('shows mutation section when asked', function() {
            menu = mountWithCustomWrappers(
                <AlterationEnrichmentTypeSelector
                    handlers={handlers}
                    store={createStore()}
                    showMutations={true}
                    showFusions={false}
                    showCnas={false}
                />,
                wrapperForMenu
            );
            assert.isTrue(menu.exists('input[data-test="Mutations"]'));
            assert.isFalse(menu.exists('input[data-test="Fusion"]'));
            assert.isFalse(
                menu.exists('input[data-test="CheckCopynumberAlterations"]')
            );
        });

        it('shows fusions section when asked', function() {
            menu = mountWithCustomWrappers(
                <AlterationEnrichmentTypeSelector
                    handlers={handlers}
                    store={createStore()}
                    showMutations={false}
                    showFusions={true}
                    showCnas={false}
                />,
                wrapperForMenu
            );
            assert.isFalse(menu.exists('input[data-test="Mutations"]'));
            assert.isTrue(menu.exists('input[data-test="Fusion"]'));
            assert.isFalse(
                menu.exists('input[data-test="CheckCopynumberAlterations"]')
            );
        });

        it('shows cna section when asked', function() {
            menu = mountWithCustomWrappers(
                <AlterationEnrichmentTypeSelector
                    handlers={handlers}
                    store={createStore()}
                    showMutations={false}
                    showFusions={false}
                    showCnas={true}
                />,
                wrapperForMenu
            );
            assert.isFalse(menu.exists('input[data-test="Mutations"]'));
            assert.isFalse(menu.exists('input[data-test="Fusion"]'));
            assert.isTrue(
                menu.exists('input[data-test="CheckCopynumberAlterations"]')
            );
        });
    });

    describe('submit button', () => {
        beforeEach(() => {
            menu = mountWithCustomWrappers(
                <AlterationEnrichmentTypeSelector
                    handlers={handlers}
                    store={createStore()}
                    showMutations={true}
                    showFusions={true}
                    showCnas={true}
                />,
                wrapperForMenu
            );
            (handlers.updateSelectedMutations as sinon.SinonSpy).resetHistory();
            (handlers.updateSelectedCopyNumber as sinon.SinonSpy).resetHistory();
        });

        it('invokes callback when pressed', function() {
            menu.pressSubmitButton();
            assert.isTrue(
                (handlers.updateSelectedMutations as sinon.SinonSpy).calledOnce
            );
            assert.isTrue(
                (handlers.updateSelectedCopyNumber as sinon.SinonSpy).calledOnce
            );
        });

        it('returns mutation types to callback', function() {
            menu.mutationSection.pressMasterButton();
            menu.cnaSection.pressMasterButton();
            menu.fusionSection.pressMasterButton();

            menu.mutationSection.pressChildButton();
            menu.pressSubmitButton();

            (handlers.updateSelectedMutations as sinon.SinonSpy).args[0][0].should.have.members(
                ['missense', 'missense_mutation', 'missense_variant']
            );
        });

        it('returns cna types to callback', function() {
            menu.mutationSection.pressMasterButton();
            menu.cnaSection.pressMasterButton();
            menu.fusionSection.pressMasterButton();

            menu.cnaSection.pressChildButton();
            menu.pressSubmitButton();

            (handlers.updateSelectedCopyNumber as sinon.SinonSpy).args[0][0].should.have.members(
                ['HOMDEL']
            );
        });
    });
});
