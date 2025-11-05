import * as React from 'react';
import { QueryStore } from 'shared/components/query/QueryStore';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import styles from './styles/styles.module.scss';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';

export interface IDashboardStatsProps {
    store: QueryStore;
}

@observer
export default class DashboardStats extends React.Component<
    IDashboardStatsProps,
    {}
> {
    constructor(props: IDashboardStatsProps) {
        super(props);
        makeObservable(this);
    }

    @computed get totalStudies(): number {
        if (this.props.store.cancerStudies.isComplete) {
            return this.props.store.cancerStudies.result.length;
        }
        return 0;
    }

    @computed get totalSamples(): number {
        if (this.props.store.cancerStudies.isComplete) {
            return this.props.store.cancerStudies.result.reduce(
                (sum, study) => sum + (study.allSampleCount || 0),
                0
            );
        }
        return 0;
    }

    @computed get totalAssays(): number {
        if (this.props.store.cancerStudies.isComplete) {
            // Count unique data types across all studies
            const dataTypes = new Set<string>();
            this.props.store.cancerStudies.result.forEach(study => {
                if (study.sequencedSampleCount > 0) dataTypes.add('sequenced');
                if (study.cnaSampleCount > 0) dataTypes.add('cna');
                if (study.mrnaRnaSeqSampleCount > 0) dataTypes.add('rna_seq');
                if (study.mrnaRnaSeqV2SampleCount > 0)
                    dataTypes.add('rna_seq_v2');
                if (study.mrnaMicroarraySampleCount > 0)
                    dataTypes.add('microarray');
                if (study.methylationHm27SampleCount > 0)
                    dataTypes.add('methylation');
                if (study.rppaSampleCount > 0) dataTypes.add('rppa');
                if (study.massSpectrometrySampleCount > 0)
                    dataTypes.add('mass_spec');
                if (study.miRnaSampleCount > 0) dataTypes.add('mirna');
            });
            return dataTypes.size;
        }
        return 0;
    }

    @computed get totalConsortia(): number {
        if (this.props.store.cancerStudies.isComplete) {
            const consortia = new Set<string>();
            this.props.store.cancerStudies.result.forEach(study => {
                if (study.groups && study.groups.trim()) {
                    // Split by common delimiters
                    study.groups
                        .split(/[,;]/)
                        .map(g => g.trim())
                        .filter(g => g)
                        .forEach(g => consortia.add(g));
                }
            });
            return consortia.size;
        }
        return 0;
    }

    render() {
        const isLoading =
            this.props.store.cancerStudies.isPending ||
            !this.props.store.cancerStudies.isComplete;

        if (isLoading) {
            return (
                <div className={styles.dashboardStats}>
                    <LoadingIndicator
                        isLoading={true}
                        size={'small'}
                        center={true}
                    />
                </div>
            );
        }

        return (
            <div className={styles.dashboardStats}>
                <div className={styles.statCard}>
                    <div className={styles.statNumber}>{this.totalStudies}</div>
                    <div className={styles.statLabel}>Studies</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statNumber}>
                        {this.totalSamples.toLocaleString()}
                    </div>
                    <div className={styles.statLabel}>Samples</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statNumber}>{this.totalAssays}</div>
                    <div className={styles.statLabel}>Data Types</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statNumber}>
                        {this.totalConsortia}
                    </div>
                    <div className={styles.statLabel}>Consortia</div>
                </div>
            </div>
        );
    }
}
