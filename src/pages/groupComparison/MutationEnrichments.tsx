import * as React from 'react';
import { observer } from 'mobx-react';
import { MolecularProfile } from '../../shared/api/generated/CBioPortalAPI';
import LoadingIndicator from '../../shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from '../../shared/components/ErrorMessage';
import EnrichmentsDataSetDropdown from '../resultsView/enrichments/EnrichmentsDataSetDropdown';
import AlterationEnrichmentContainer from '../resultsView/enrichments/AlterationEnrichmentsContainer';
import autobind from 'autobind-decorator';
import { MakeMobxView } from '../../shared/components/MobxView';
import { MakeEnrichmentsTabUI } from './GroupComparisonUtils';
import { remoteData } from 'cbioportal-frontend-commons';
import _ from 'lodash';
import { AlterationContainerType } from 'pages/resultsView/enrichments/EnrichmentsUtil';
import ComparisonStore from '../../shared/lib/comparison/ComparisonStore';
import { ResultsViewPageStore } from '../resultsView/ResultsViewPageStore';

export interface IMutationEnrichmentsProps {
    store: ComparisonStore;
    resultsViewStore?: ResultsViewPageStore;
}

@observer
export default class MutationEnrichments extends React.Component<IMutationEnrichmentsProps, {}> {
    @autobind
    private onChangeProfile(profileMap: { [studyId: string]: MolecularProfile }) {
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

    private readonly mutationEnrichmentAnalysisGroups = remoteData({
        await: () => [this.props.store.enrichmentAnalysisGroups],
        invoke: () => {
            return Promise.resolve(
                _.map(this.props.store.enrichmentAnalysisGroups.result, group => {
                    return {
                        ...group,
                        description: `Number (percentage) of ${
                            this.props.store.usePatientLevelEnrichments ? 'patients' : 'samples'
                        } in ${group.name} that have a mutation in the listed gene.`,
                    };
                })
            );
        },
    });

    readonly enrichmentsUI = MakeMobxView({
        await: () => [
            this.props.store.mutationEnrichmentData,
            this.props.store.selectedStudyMutationEnrichmentProfileMap,
            this.mutationEnrichmentAnalysisGroups,
            this.props.store.studies,
        ],
        render: () => {
            let headerName = 'Mutation';
            let studyIds = Object.keys(
                this.props.store.selectedStudyMutationEnrichmentProfileMap.result!
            );
            if (studyIds.length === 1) {
                headerName = this.props.store.selectedStudyMutationEnrichmentProfileMap.result![
                    studyIds[0]
                ].name;
            }
            return (
                <div data-test="GroupComparisonMutationEnrichments">
                    <EnrichmentsDataSetDropdown
                        dataSets={this.props.store.mutationEnrichmentProfiles}
                        onChange={this.onChangeProfile}
                        selectedProfileByStudyId={
                            this.props.store.selectedStudyMutationEnrichmentProfileMap.result!
                        }
                        studies={this.props.store.studies.result!}
                    />
                    <AlterationEnrichmentContainer
                        data={this.props.store.mutationEnrichmentData.result!}
                        groups={this.mutationEnrichmentAnalysisGroups.result}
                        alteredVsUnalteredMode={false}
                        headerName={headerName}
                        containerType={AlterationContainerType.MUTATION}
                        patientLevelEnrichments={this.props.store.usePatientLevelEnrichments}
                        onSetPatientLevelEnrichments={
                            this.props.store.setUsePatientLevelEnrichments
                        }
                        store={this.props.resultsViewStore}
                    />
                </div>
            );
        },
        renderPending: () => <LoadingIndicator center={true} isLoading={true} size={'big'} />,
        renderError: () => <ErrorMessage />,
    });

    render() {
        return this.tabUI.component;
    }
}
