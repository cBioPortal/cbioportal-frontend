import * as React from 'react';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { MolecularProfile } from '../../shared/api/generated/CBioPortalAPI';
import { MakeMobxView } from '../../shared/components/MobxView';
import EnrichmentsDataSetDropdown from '../resultsView/enrichments/EnrichmentsDataSetDropdown';
import ExpressionEnrichmentContainer from '../resultsView/enrichments/ExpressionEnrichmentsContainer';
import Loader from '../../shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from '../../shared/components/ErrorMessage';
import { MakeEnrichmentsTabUI } from './GroupComparisonUtils';
import { remoteData } from 'cbioportal-frontend-commons';
import * as _ from 'lodash';
import ComparisonStore from '../../shared/lib/comparison/ComparisonStore';

export interface IProteinEnrichmentsProps {
    store: ComparisonStore;
    resultsViewMode?: boolean;
}

@observer
export default class ProteinEnrichments extends React.Component<
    IProteinEnrichmentsProps,
    {}
> {
    @autobind
    private onChangeProfile(profileMap: {
        [studyId: string]: MolecularProfile;
    }) {
        this.props.store.setProteinEnrichmentProfileMap(profileMap);
    }

    private readonly proteinEnrichmentAnalysisGroups = remoteData({
        await: () => [this.props.store.enrichmentAnalysisGroups],
        invoke: () => {
            return Promise.resolve(
                _.map(
                    this.props.store.enrichmentAnalysisGroups.result,
                    group => {
                        return {
                            ...group,
                            description: `samples in ${group.name}`,
                        };
                    }
                )
            );
        },
    });

    readonly tabUI = MakeEnrichmentsTabUI(
        () => this.props.store,
        () => this.enrichmentsUI,
        'protein',
        true,
        true,
        false
    );

    readonly enrichmentsUI = MakeMobxView({
        await: () => [
            this.props.store.proteinEnrichmentData,
            this.props.store.selectedProteinEnrichmentProfileMap,
            this.proteinEnrichmentAnalysisGroups,
            this.props.store.studies,
        ],
        render: () => {
            // since protein enrichments tab is enabled only for one study, selectedProteinEnrichmentProfileMap
            // would contain only one key.
            const studyIds = Object.keys(
                this.props.store.selectedProteinEnrichmentProfileMap.result!
            );
            const selectedProfile = this.props.store
                .selectedProteinEnrichmentProfileMap.result![studyIds[0]];
            return (
                <div data-test="GroupComparisonProteinEnrichments">
                    <EnrichmentsDataSetDropdown
                        dataSets={this.props.store.proteinEnrichmentProfiles}
                        onChange={this.onChangeProfile}
                        selectedProfileByStudyId={
                            this.props.store.selectedProteinEnrichmentProfileMap
                                .result!
                        }
                        alwaysShow={true}
                        studies={this.props.store.studies.result!}
                    />
                    <ExpressionEnrichmentContainer
                        data={this.props.store.proteinEnrichmentData.result!}
                        groups={this.proteinEnrichmentAnalysisGroups.result}
                        selectedProfile={selectedProfile}
                        alteredVsUnalteredMode={false}
                        sampleKeyToSample={
                            this.props.store.sampleKeyToSample.result!
                        }
                        isGeneCheckBoxEnabled={this.props.resultsViewMode}
                    />
                </div>
            );
        },
        renderPending: () => (
            <Loader center={true} isLoading={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    render() {
        return this.tabUI.component;
    }
}
