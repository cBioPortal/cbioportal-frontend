import * as React from 'react';
import { observer } from 'mobx-react';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import AlterationEnrichmentContainer from 'pages/resultsView/enrichments/AlterationEnrichmentsContainer';
import Loader from 'shared/components/loadingIndicator/LoadingIndicator';
import EnrichmentsDataSetDropdown from 'pages/resultsView/enrichments/EnrichmentsDataSetDropdown';
import { MolecularProfile } from 'shared/api/generated/CBioPortalAPI';
import autobind from 'autobind-decorator';
import ErrorMessage from '../../../shared/components/ErrorMessage';
import { AlterationContainerType } from './EnrichmentsUtil';
import { makeUniqueColorGetter } from 'shared/components/plots/PlotUtils';
import { MakeMobxView } from '../../../shared/components/MobxView';
import _ from 'lodash';

export interface IMutationEnrichmentsTabProps {
    store: ResultsViewPageStore;
}

@observer
export default class MutationEnrichmentsTab extends React.Component<
    IMutationEnrichmentsTabProps,
    {}
> {
    private uniqueColorGetter = makeUniqueColorGetter();
    private alteredColor = this.uniqueColorGetter();
    private unalteredColor = this.uniqueColorGetter();

    @autobind
    private onProfileChange(profileMap: {
        [studyId: string]: MolecularProfile;
    }) {
        this.props.store.setMutationEnrichmentProfileMap(profileMap);
    }

    readonly tabUI = MakeMobxView({
        await: () => [
            this.props.store.mutationEnrichmentData,
            this.props.store.alteredSampleKeys,
            this.props.store.unalteredSampleKeys,
            this.props.store.alteredPatientKeys,
            this.props.store.unalteredPatientKeys,
            this.props.store.studies,
            this.props.store.selectedMutationEnrichmentProfileMap,
        ],
        renderPending: () => (
            <Loader isLoading={true} center={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
        render: () => {
            const patientLevel = this.props.store.usePatientLevelEnrichments;
            let headerName = 'Mutations';
            const studies = this.props.store.studies.result!;
            if (studies.length === 1) {
                headerName = this.props.store
                    .selectedMutationEnrichmentProfileMap.result![
                    studies[0].studyId
                ].name;
            }

            return (
                <div data-test="MutationEnrichmentsTab">
                    <EnrichmentsDataSetDropdown
                        dataSets={this.props.store.mutationEnrichmentProfiles}
                        onChange={this.onProfileChange}
                        selectedProfileByStudyId={
                            this.props.store
                                .selectedMutationEnrichmentProfileMap.result!
                        }
                        molecularProfileIdToProfiledSampleCount={
                            this.props.store
                                .molecularProfileIdToProfiledSampleCount
                        }
                        studies={this.props.store.studies.result!}
                    />
                    <AlterationEnrichmentContainer
                        data={this.props.store.mutationEnrichmentData.result!}
                        headerName={headerName}
                        store={this.props.store}
                        groups={[
                            {
                                name: 'Altered group',
                                description: `Number (percentage) of ${
                                    patientLevel ? 'patients' : 'samples'
                                } that have alterations in the query gene(s) that also have a deep deletion in the listed gene.`,
                                nameOfEnrichmentDirection: 'Co-occurrence',
                                count: patientLevel
                                    ? this.props.store.alteredPatientKeys
                                          .result!.length
                                    : this.props.store.alteredSampleKeys.result!
                                          .length,
                                color: this.alteredColor,
                            },
                            {
                                name: 'Unaltered group',
                                description: `Number (percentage) of ${
                                    patientLevel ? 'patients' : 'samples'
                                } that do not have alterations in the query gene(s) that have a deep deletion in the listed gene.`,
                                nameOfEnrichmentDirection: 'Mutual exclusivity',
                                count: patientLevel
                                    ? this.props.store.unalteredPatientKeys
                                          .result!.length
                                    : this.props.store.unalteredSampleKeys
                                          .result!.length,
                                color: this.unalteredColor,
                            },
                        ]}
                        containerType={AlterationContainerType.MUTATION}
                        patientLevelEnrichments={
                            this.props.store.usePatientLevelEnrichments
                        }
                        onSetPatientLevelEnrichments={
                            this.props.store.setUsePatientLevelEnrichments
                        }
                    />
                </div>
            );
        },
    });

    public render() {
        return this.tabUI.component;
    }
}
