import * as React from 'react';
import { observer } from 'mobx-react';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import LoadingIndicator from '../../shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from '../../shared/components/ErrorMessage';
import EnrichmentsDataSetDropdown from '../resultsView/enrichments/EnrichmentsDataSetDropdown';
import AlterationEnrichmentContainer from '../resultsView/enrichments/AlterationEnrichmentsContainer';
import autobind from 'autobind-decorator';
import { MakeMobxView } from '../../shared/components/MobxView';
import { MakeEnrichmentsTabUI } from './GroupComparisonUtils';
import _ from 'lodash';
import { AlterationContainerType } from 'pages/resultsView/enrichments/EnrichmentsUtil';
import ComparisonStore from '../../shared/lib/comparison/ComparisonStore';
import { ResultsViewPageStore } from '../resultsView/ResultsViewPageStore';

export interface IStructuralVariantEnrichmentsProps {
    store: ComparisonStore;
    resultsViewStore?: ResultsViewPageStore;
}

@observer
export default class StructuralVariantEnrichments extends React.Component<
    IStructuralVariantEnrichmentsProps,
    {}
> {
    @autobind
    private onChangeProfile(profileMap: {
        [studyId: string]: MolecularProfile;
    }) {
        this.props.store.setStructuralVariantEnrichmentProfileMap(profileMap);
    }

    readonly tabUI = MakeEnrichmentsTabUI(
        () => this.props.store,
        () => this.enrichmentsUI,
        'structural_variant',
        true,
        true,
        true
    );

    readonly enrichmentsUI = MakeMobxView({
        await: () => [
            this.props.store.structuralVariantEnrichmentData,
            this.props.store.selectedStudyStructuralVariantEnrichmentProfileMap,
            this.props.store.structuralVariantEnrichmentAnalysisGroups,
            this.props.store.studies,
        ],
        render: () => {
            let headerName = 'Structural Variant';
            let studyIds = Object.keys(
                this.props.store
                    .selectedStudyStructuralVariantEnrichmentProfileMap.result!
            );
            if (studyIds.length === 1) {
                headerName = this.props.store
                    .selectedStudyStructuralVariantEnrichmentProfileMap.result![
                    studyIds[0]
                ].name;
            }
            return (
                <div data-test="GroupComparisonStructuralVariantEnrichments">
                    <EnrichmentsDataSetDropdown
                        dataSets={
                            this.props.store.structuralVariantEnrichmentProfiles
                                .result!
                        }
                        onChange={this.onChangeProfile}
                        selectedProfileByStudyId={
                            this.props.store
                                .selectedStudyStructuralVariantEnrichmentProfileMap
                                .result!
                        }
                        studies={this.props.store.studies.result!}
                    />
                    <AlterationEnrichmentContainer
                        data={
                            this.props.store.structuralVariantEnrichmentData
                                .result!
                        }
                        groups={
                            this.props.store
                                .structuralVariantEnrichmentAnalysisGroups
                                .result
                        }
                        alteredVsUnalteredMode={false}
                        headerName={headerName}
                        containerType={
                            AlterationContainerType.STRUCTURAL_VARIANT
                        }
                        patientLevelEnrichments={
                            this.props.store.usePatientLevelEnrichments
                        }
                        onSetPatientLevelEnrichments={
                            this.props.store.setUsePatientLevelEnrichments
                        }
                        store={this.props.resultsViewStore}
                    />
                </div>
            );
        },
        renderPending: () => (
            <LoadingIndicator center={true} isLoading={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    render() {
        return this.tabUI.component;
    }
}
