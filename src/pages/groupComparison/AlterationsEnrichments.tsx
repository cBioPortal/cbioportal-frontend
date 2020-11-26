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
            let headerName = 'Mutations/Fusions/CNAs';
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
                    >
                        {this.props.children}
                    </AlterationEnrichmentContainer>
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
