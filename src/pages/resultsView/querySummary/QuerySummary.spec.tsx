import * as React from 'react';
import { shallow } from 'enzyme';
import { assert } from 'chai';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import QuerySummary from './QuerySummary';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import ExtendedRouterStore from 'shared/lib/ExtendedRouterStore';
import SettingsMenuButton from 'shared/components/driverAnnotations/SettingsMenuButton';
import { AlterationTypeConstants } from 'shared/constants';

describe('QuerySummary expression driver-filter context', () => {
    for (const fixture of [
        {
            name: 'selected mRNA expression',
            selected: [AlterationTypeConstants.MRNA_EXPRESSION],
            expected: true,
        },
        {
            name: 'selected protein expression alongside mutations',
            selected: [
                AlterationTypeConstants.MUTATION_EXTENDED,
                AlterationTypeConstants.PROTEIN_LEVEL,
            ],
            expected: true,
        },
        {
            name: 'available but unselected expression profiles',
            selected: [AlterationTypeConstants.MUTATION_EXTENDED],
            expected: false,
        },
        { name: 'no selected profiles', selected: [], expected: false },
        {
            name: 'pending selected profiles',
            selected: undefined,
            expected: false,
        },
        {
            name: 'pending selection retaining previous expression data',
            selected: [AlterationTypeConstants.MRNA_EXPRESSION],
            pending: true,
            expected: false,
        },
    ]) {
        it(`uses ${fixture.name}`, () => {
            const pending = { status: 'pending' };
            const store = ({
                selectedMolecularProfiles: {
                    isComplete:
                        fixture.selected !== undefined && !fixture.pending,
                    result: fixture.selected?.map(
                        molecularAlterationType =>
                            ({
                                molecularAlterationType,
                            } as MolecularProfile)
                    ),
                },
                molecularProfilesInStudies: {
                    result: [
                        {
                            molecularAlterationType:
                                AlterationTypeConstants.MRNA_EXPRESSION,
                        },
                        {
                            molecularAlterationType:
                                AlterationTypeConstants.PROTEIN_LEVEL,
                        },
                    ],
                },
                queriedStudies: pending,
                sampleLists: pending,
                filteredSamples: pending,
                filteredPatients: pending,
                filteredAlteredSampleKeys: pending,
                filteredAlteredPatientKeys: pending,
                pageUserSession: { userSettings: {} },
            } as unknown) as ResultsViewPageStore;
            const wrapper = shallow(
                <QuerySummary
                    store={store}
                    routingStore={{} as ExtendedRouterStore}
                    onToggleQueryFormVisibility={() => {}}
                    onToggleOQLEditUIVisibility={() => {}}
                />
            );
            const menuProps = wrapper.find(SettingsMenuButton).props() as {
                hasExpressionProfileSelected?: boolean;
            };
            assert.strictEqual(
                menuProps.hasExpressionProfileSelected,
                fixture.expected
            );
            wrapper.unmount();
        });
    }
});
