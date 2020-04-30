import * as React from 'react';
import { observer } from 'mobx-react';
import EnrichmentsDataSetDropdown from '../resultsView/enrichments/EnrichmentsDataSetDropdown';
import AlterationEnrichmentContainer from '../resultsView/enrichments/AlterationEnrichmentsContainer';
import autobind from 'autobind-decorator';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import { MakeMobxView } from '../../shared/components/MobxView';
import LoadingIndicator from '../../shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from '../../shared/components/ErrorMessage';
import { MakeEnrichmentsTabUI } from './GroupComparisonUtils';
import _ from 'lodash';
import { AlterationContainerType } from 'pages/resultsView/enrichments/EnrichmentsUtil';
import ComparisonStore from '../../shared/lib/comparison/ComparisonStore';
import { ResultsViewPageStore } from '../resultsView/ResultsViewPageStore';

export interface ICopyNumberEnrichmentsProps {
    store: ComparisonStore;
    resultsViewStore?: ResultsViewPageStore;
}

@observer
export default class CopyNumberEnrichments extends React.Component<
    ICopyNumberEnrichmentsProps,
    {}
> {
    @autobind
    private onChangeProfile(profileMap: {
        [studyId: string]: MolecularProfile;
    }) {
        this.props.store.setCopyNumberEnrichmentProfileMap(profileMap);
    }

    readonly tabUI = MakeEnrichmentsTabUI(
        () => this.props.store,
        () => this.enrichmentsUI,
        'copy-number',
        true,
        true,
        true
    );

    readonly enrichmentsUI = MakeMobxView({
        await: () => [
            this.props.store.copyNumberEnrichmentData,
            this.props.store.copyNumberEnrichmentAnalysisGroups,
            this.props.store.selectedStudyCopyNumberEnrichmentProfileMap,
            this.props.store.studies,
        ],
        render: () => {
            let headerName = 'Copy number';
            let studyIds = Object.keys(
                this.props.store.selectedStudyCopyNumberEnrichmentProfileMap
                    .result!
            );
            if (studyIds.length === 1) {
                headerName = this.props.store
                    .selectedStudyCopyNumberEnrichmentProfileMap.result![
                    studyIds[0]
                ].name;
            }
            return (
                <div data-test="GroupComparisonCopyNumberEnrichments">
                    <EnrichmentsDataSetDropdown
                        dataSets={this.props.store.copyNumberEnrichmentProfiles}
                        onChange={this.onChangeProfile}
                        selectedProfileByStudyId={
                            this.props.store
                                .selectedStudyCopyNumberEnrichmentProfileMap
                                .result!
                        }
                        studies={this.props.store.studies.result!}
                    />

                    <AlterationEnrichmentContainer
                        data={this.props.store.copyNumberEnrichmentData.result!}
                        groups={
                            this.props.store.copyNumberEnrichmentAnalysisGroups
                                .result
                        }
                        alteredVsUnalteredMode={false}
                        headerName={headerName}
                        showCNAInTable={true}
                        containerType={AlterationContainerType.COPY_NUMBER}
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
