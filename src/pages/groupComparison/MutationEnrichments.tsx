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

export interface IMutationEnrichmentsProps {
    store: ComparisonStore;
    resultsViewStore?: ResultsViewPageStore;
}

@observer
export default class MutationEnrichments extends React.Component<
    IMutationEnrichmentsProps,
    {}
> {
    @autobind
    private onChangeProfile(profileMap: {
        [studyId: string]: MolecularProfile;
    }) {
        this.props.store.setMutationEnrichmentProfileMap(profileMap);
    }

    readonly tabUI = MakeEnrichmentsTabUI(
        () => this.props.store,
        () => this.enrichmentsUI,
        'mutation',
        true,
        true,
        true
    );

    readonly enrichmentsUI = MakeMobxView({
        await: () => [
            this.props.store.mutationEnrichmentData,
            this.props.store.selectedStudyMutationEnrichmentProfileMap,
            this.props.store.mutationEnrichmentAnalysisGroups,
            this.props.store.studies,
        ],
        render: () => {
            let headerName = 'Mutation';
            let studyIds = Object.keys(
                this.props.store.selectedStudyMutationEnrichmentProfileMap
                    .result!
            );
            if (studyIds.length === 1) {
                headerName = this.props.store
                    .selectedStudyMutationEnrichmentProfileMap.result![
                    studyIds[0]
                ].name;
            }
            return (
                <div data-test="GroupComparisonMutationEnrichments">
                    <EnrichmentsDataSetDropdown
                        dataSets={this.props.store.mutationEnrichmentProfiles}
                        onChange={this.onChangeProfile}
                        selectedProfileByStudyId={
                            this.props.store
                                .selectedStudyMutationEnrichmentProfileMap
                                .result!
                        }
                        studies={this.props.store.studies.result!}
                    />
                    <AlterationEnrichmentContainer
                        data={this.props.store.mutationEnrichmentData.result!}
                        groups={
                            this.props.store.mutationEnrichmentAnalysisGroups
                                .result
                        }
                        alteredVsUnalteredMode={false}
                        headerName={headerName}
                        containerType={AlterationContainerType.MUTATION}
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
