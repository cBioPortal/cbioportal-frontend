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

export interface ICopyNumberEnrichmentsTabProps {
    store: ResultsViewPageStore;
}

@observer
export default class CopyNumberEnrichmentsTab extends React.Component<
    ICopyNumberEnrichmentsTabProps,
    {}
> {
    private uniqueColorGetter = makeUniqueColorGetter();
    private alteredColor = this.uniqueColorGetter();
    private unalteredColor = this.uniqueColorGetter();

    @autobind
    private onProfileChange(profileMap: {
        [studyId: string]: MolecularProfile;
    }) {
        this.props.store.setCopyNumberEnrichmentProfileMap(profileMap);
    }

    readonly tabUI = MakeMobxView({
        await: () => [
            this.props.store.copyNumberHomdelEnrichmentData,
            this.props.store.copyNumberAmpEnrichmentData,
            this.props.store.alteredSampleKeys,
            this.props.store.unalteredSampleKeys,
            this.props.store.alteredPatientKeys,
            this.props.store.unalteredPatientKeys,
            this.props.store.studies,
            this.props.store.selectedCopyNumberEnrichmentProfileMap,
        ],
        render: () => {
            const patientLevel = this.props.store.usePatientLevelEnrichments;
            let profileName: string = '';
            const studies = this.props.store.studies.result!;
            if (studies.length === 1) {
                profileName =
                    ' - ' +
                    this.props.store.selectedMutationEnrichmentProfileMap
                        .result![studies[0].studyId].name;
            }

            return (
                <div data-test="CopyNumberEnrichmentsTab">
                    <EnrichmentsDataSetDropdown
                        dataSets={this.props.store.copyNumberEnrichmentProfiles}
                        onChange={this.onProfileChange}
                        selectedProfileByStudyId={
                            this.props.store
                                .selectedCopyNumberEnrichmentProfileMap.result!
                        }
                        molecularProfileIdToProfiledSampleCount={
                            this.props.store
                                .molecularProfileIdToProfiledSampleCount
                        }
                        studies={this.props.store.studies.result!}
                    />
                    <AlterationEnrichmentContainer
                        data={
                            this.props.store.copyNumberHomdelEnrichmentData
                                .result!
                        }
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
                        headerName={'Deep Deletion' + profileName}
                        store={this.props.store}
                        containerType={AlterationContainerType.COPY_NUMBER}
                        patientLevelEnrichments={
                            this.props.store.usePatientLevelEnrichments
                        }
                        onSetPatientLevelEnrichments={
                            this.props.store.setUsePatientLevelEnrichments
                        }
                    />
                    <hr />
                    <AlterationEnrichmentContainer
                        data={
                            this.props.store.copyNumberAmpEnrichmentData.result!
                        }
                        groups={[
                            {
                                name: 'Altered group',
                                description: `Number (percentage) of ${
                                    patientLevel ? 'patients' : 'samples'
                                } that have alterations in the query gene(s) that also have an amplification in the listed gene.`,
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
                                } that do not have alterations in the query gene(s) that have an amplification in the listed gene.`,
                                nameOfEnrichmentDirection: 'Mutual exclusivity',
                                count: patientLevel
                                    ? this.props.store.unalteredPatientKeys
                                          .result!.length
                                    : this.props.store.unalteredSampleKeys
                                          .result!.length,
                                color: this.unalteredColor,
                            },
                        ]}
                        headerName={'Amplification - ' + profileName}
                        store={this.props.store}
                        containerType={AlterationContainerType.COPY_NUMBER}
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
        renderPending: () => (
            <Loader isLoading={true} center={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    public render() {
        return this.tabUI.component;
    }
}
