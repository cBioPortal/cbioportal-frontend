import * as React from 'react';
import { observer } from 'mobx-react';
import AlterationEnrichmentContainer from '../resultsView/enrichments/AlterationEnrichmentsContainer';
import { MakeMobxView } from '../../shared/components/MobxView';
import LoadingIndicator from '../../shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from '../../shared/components/ErrorMessage';
import { MakeEnrichmentsTabUI } from './GroupComparisonUtils';
import { AlterationContainerType } from 'pages/resultsView/enrichments/EnrichmentsUtil';
import ComparisonStore from '../../shared/lib/comparison/ComparisonStore';
import { ResultsViewPageStore } from '../resultsView/ResultsViewPageStore';

export interface IAlterationsEnrichmentsProps {
    store: ComparisonStore;
    resultsViewStore?: ResultsViewPageStore;
}

export type CopyNumberEnrichmentTypeSelectorSettings = {
    HOMDEL: boolean;
    AMP: boolean;
};

export type MutationEnrichmentTypeSelectorSettings = {
    missense_mutation: boolean;
    missense: boolean;
    missense_variant: boolean;
    frame_shift_ins: boolean;
    frame_shift_del: boolean;
    frameshift: boolean;
    frameshift_deletion: boolean;
    frameshift_insertion: boolean;
    de_novo_start_outofframe: boolean;
    frameshift_variant: boolean;
    nonsense_mutation: boolean;
    nonsense: boolean;
    stopgain_snv: boolean;
    stop_gained: boolean;
    splice_site: boolean;
    splice: boolean;
    splicing: boolean;
    splice_site_snp: boolean;
    splice_site_del: boolean;
    splice_site_indel: boolean;
    splice_region_variant: boolean;
    splice_region: boolean;
    translation_start_site: boolean;
    initiator_codon_variant: boolean;
    start_codon_snp: boolean;
    start_codon_del: boolean;
    nonstop_mutation: boolean;
    stop_lost: boolean;
    inframe_del: boolean;
    inframe_deletion: boolean;
    in_frame_del: boolean;
    in_frame_deletion: boolean;
    inframe_ins: boolean;
    inframe_insertion: boolean;
    in_frame_ins: boolean;
    in_frame_insertion: boolean;
    indel: boolean;
    nonframeshift_deletion: boolean;
    nonframeshift: boolean;
    nonframeshift_insertion: boolean;
    targeted_region: boolean;
    inframe: boolean;
    truncating: boolean;
    feature_truncation: boolean;
    fusion: boolean;
    silent: boolean;
    synonymous_variant: boolean;
    any: boolean;
    other: boolean;
};

@observer
export default class AlterationsEnrichments extends React.Component<
    IAlterationsEnrichmentsProps,
    {}
> {
    constructor(props: IAlterationsEnrichmentsProps) {
        super(props);
    }

    readonly tabUI = MakeEnrichmentsTabUI(
        () => this.props.store,
        () => this.enrichmentsUI,
        'alterations',
        true,
        true,
        true
    );

    readonly enrichmentsUI = MakeMobxView({
        await: () => [
            this.props.store.alterationsEnrichmentData,
            this.props.store.alterationsEnrichmentAnalysisGroups,
            this.props.store.selectedStudyMutationEnrichmentProfileMap,
            this.props.store.selectedStudyCopyNumberEnrichmentProfileMap,
            this.props.store.studies,
        ],
        render: () => {
            let headerName = 'Alterations';
            return (
                <div data-test="GroupComparisonAlterationEnrichments">
                    <AlterationEnrichmentContainer
                        data={
                            this.props.store.alterationsEnrichmentData.result!
                        }
                        groups={
                            this.props.store.alterationsEnrichmentAnalysisGroups
                                .result
                        }
                        alteredVsUnalteredMode={false}
                        headerName={headerName}
                        containerType={AlterationContainerType.ALTERATIONS}
                        patientLevelEnrichments={
                            this.props.store.usePatientLevelEnrichments
                        }
                        onSetPatientLevelEnrichments={
                            this.props.store.setUsePatientLevelEnrichments
                        }
                        store={this.props.resultsViewStore}
                        comparisonStore={this.props.store}
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
