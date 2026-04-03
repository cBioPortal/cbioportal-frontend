import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import SampleManager from '../SampleManager';
import ExpressionTabStore, { AlterationFilterType } from './ExpressionTabStore';
import GeneExpressionTable from './GeneExpressionTable';
import ExpressionWaterfallPlot from './ExpressionWaterfallPlot';
import SelectedGeneDetail from './SelectedGeneDetail';
import styles from './styles.module.scss';

interface IExpressionTabControllerProps {
    store: PatientViewPageStore;
    sampleManager: SampleManager | null;
}

@observer
export default class ExpressionTabController extends React.Component<
    IExpressionTabControllerProps
> {
    private expressionTabStore: ExpressionTabStore;

    constructor(props: IExpressionTabControllerProps) {
        super(props);
        makeObservable(this);
        this.expressionTabStore = new ExpressionTabStore(
            props.store,
            props.sampleManager
        );
    }

    @computed get sampleIds(): string[] {
        return this.props.store.sampleIds;
    }

    render() {
        const { sampleManager } = this.props;
        const store = this.expressionTabStore;

        if (
            store.patientExpressionData.isPending ||
            store.entrezGeneIdToGene.isPending
        ) {
            return (
                <LoadingIndicator isLoading={true} size={'big'} center={true} />
            );
        }

        if (
            store.patientExpressionData.isComplete &&
            store.patientExpressionData.result.length === 0
        ) {
            return (
                <div className="alert alert-info" role="alert">
                    No mRNA expression z-score data available for this patient.
                </div>
            );
        }

        const filterBadges: Array<{
            type: AlterationFilterType;
            label: string;
            badgeClass: string;
        }> = [
            {
                type: 'mutation',
                label: 'Mutation',
                badgeClass: styles.mutationBadge,
            },
            { type: 'cna', label: 'CNA', badgeClass: styles.cnaBadge },
            {
                type: 'fusion',
                label: 'Fusion',
                badgeClass: styles.fusionBadge,
            },
        ];

        return (
            <div className={styles.expressionTab}>
                <div className={styles.header}>
                    <h3 className={styles.headerTitle}>Expression Analysis</h3>
                    <div className={styles.headerControls}>
                        {filterBadges.map(badge => (
                            <button
                                key={badge.type}
                                className={`${styles.filterBadge} ${
                                    badge.badgeClass
                                } ${
                                    store.activeAlterationFilters.has(
                                        badge.type
                                    )
                                        ? styles.filterBadgeActive
                                        : ''
                                }`}
                                onClick={() =>
                                    store.toggleAlterationFilter(badge.type)
                                }
                            >
                                {badge.label}
                            </button>
                        ))}
                        <button
                            className={styles.downloadButton}
                            onClick={() => store.downloadData()}
                        >
                            Download
                        </button>
                    </div>
                </div>

                <div className={styles.splitPanel}>
                    <div className={styles.leftPanel}>
                        <GeneExpressionTable
                            store={store}
                            sampleIds={this.sampleIds}
                        />
                    </div>
                    <div className={styles.rightPanel}>
                        <ExpressionWaterfallPlot
                            store={store}
                            sampleManager={sampleManager}
                            sampleIds={this.sampleIds}
                        />
                        <SelectedGeneDetail
                            store={store}
                            sampleManager={sampleManager}
                            sampleIds={this.sampleIds}
                        />
                    </div>
                </div>
            </div>
        );
    }
}
