import * as React from 'react';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import { MakeMobxView } from '../../shared/components/MobxView';
import Loader from '../../shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from '../../shared/components/ErrorMessage';
import { MakeEnrichmentsTabUI } from './GroupComparisonUtils';
import * as _ from 'lodash';
import ComparisonStore from '../../shared/lib/comparison/ComparisonStore';
import GenericAssayEnrichmentsContainer from 'pages/resultsView/enrichments/GenericAssayEnrichmentsContainer';
import EnrichmentsDataSetDropdown from 'pages/resultsView/enrichments/EnrichmentsDataSetDropdown';

export interface IGenericAssayEnrichmentsProps {
    store: ComparisonStore;
    genericAssayType: string;
    resultsViewMode?: boolean;
}

@observer
export default class GenericAssayEnrichments extends React.Component<
    IGenericAssayEnrichmentsProps,
    {}
> {
    @autobind
    private onChangeProfile(profileMap: {
        [studyId: string]: MolecularProfile;
    }) {
        this.props.store.setGenericAssayEnrichmentProfileMap(
            profileMap,
            this.props.genericAssayType
        );
    }

    readonly tabUI = MakeEnrichmentsTabUI(
        () => this.props.store,
        () => this.enrichmentsUI,
        this.props.genericAssayType,
        true,
        true,
        false
    );

    readonly enrichmentsUI = MakeMobxView({
        await: () => {
            const ret: any[] = [
                this.props.store.gaEnrichmentDataByAssayType,
                this.props.store
                    .selectedGenericAssayEnrichmentProfileMapGroupByGenericAssayType,
                this.props.store.gaEnrichmentGroupsByAssayType,
                this.props.store.studies,
            ];
            if (
                this.props.store.gaEnrichmentDataByAssayType.isComplete &&
                this.props.store.gaEnrichmentDataByAssayType.result![
                    this.props.genericAssayType
                ]
            ) {
                ret.push(
                    this.props.store.gaEnrichmentDataByAssayType.result![
                        this.props.genericAssayType
                    ]
                );
            }
            return ret;
        },
        render: () => {
            // since generic assay enrichments tab is enabled only for one study, selectedGenericAssayEnrichmentProfileMap
            // would contain only one key.
            const studyId = Object.keys(
                this.props.store
                    .selectedGenericAssayEnrichmentProfileMapGroupByGenericAssayType
                    .result![this.props.genericAssayType]
            )[0];
            // select the first found profile in the study as the default selection for selected genericAssayType
            const selectedProfile = this.props.store
                .selectedGenericAssayEnrichmentProfileMapGroupByGenericAssayType
                .result![this.props.genericAssayType][studyId];
            return (
                <div data-test="GroupComparisonGenericAssayEnrichments">
                    <EnrichmentsDataSetDropdown
                        dataSets={
                            this.props.store
                                .genericAssayEnrichmentProfilesGroupByGenericAssayType
                                .result![this.props.genericAssayType]
                        }
                        onChange={this.onChangeProfile}
                        selectedProfileByStudyId={
                            this.props.store
                                .selectedGenericAssayEnrichmentProfileMapGroupByGenericAssayType
                                .result![this.props.genericAssayType]
                        }
                        alwaysShow={true}
                        studies={this.props.store.studies.result!}
                    />
                    <GenericAssayEnrichmentsContainer
                        data={
                            this.props.store.gaEnrichmentDataByAssayType
                                .result![this.props.genericAssayType].result
                        }
                        groups={
                            this.props.store.gaEnrichmentGroupsByAssayType
                                .result![this.props.genericAssayType]
                        }
                        selectedProfile={selectedProfile}
                        alteredVsUnalteredMode={false}
                        sampleKeyToSample={
                            this.props.store.sampleKeyToSample.result!
                        }
                        genericAssayType={this.props.genericAssayType}
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
