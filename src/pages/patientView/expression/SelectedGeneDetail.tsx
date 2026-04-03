import * as React from 'react';
import { observer } from 'mobx-react';
import ExpressionTabStore, { GeneRow } from './ExpressionTabStore';
import SampleManager from '../SampleManager';
import { formatZScore, cnaToLabel, cnaToColor } from './ExpressionTabUtils';
import styles from './styles.module.scss';

interface ISelectedGeneDetailProps {
    store: ExpressionTabStore;
    sampleManager: SampleManager | null;
    sampleIds: string[];
}

@observer
export default class SelectedGeneDetail extends React.Component<
    ISelectedGeneDetailProps
> {
    render() {
        const { store, sampleManager, sampleIds } = this.props;
        const geneRow = store.selectedGeneRow;

        if (!geneRow) {
            return null;
        }

        return (
            <div className={styles.geneDetail}>
                <div className={styles.geneDetailHeader}>
                    Selected Gene: {geneRow.hugoGeneSymbol}
                </div>
                <div className={styles.sampleCards}>
                    {sampleIds.map(sampleId => {
                        const zScore = geneRow.zScoresBySample[sampleId];
                        const color =
                            sampleManager?.sampleColors[sampleId] || '#333';

                        return (
                            <div
                                key={sampleId}
                                className={styles.sampleCard}
                                style={{ borderLeftColor: color }}
                            >
                                <div className={styles.sampleCardId}>
                                    {sampleId}
                                </div>
                                <div className={styles.sampleCardType}>
                                    Sample{' '}
                                    {sampleManager?.sampleLabels[sampleId] ||
                                        ''}
                                </div>
                                <div className={styles.sampleCardZScore}>
                                    {zScore !== undefined ? (
                                        <span
                                            style={{
                                                color:
                                                    zScore > 0
                                                        ? '#c0392b'
                                                        : zScore < 0
                                                        ? '#2980b9'
                                                        : '#333',
                                            }}
                                        >
                                            Z-Score: {formatZScore(zScore)}
                                        </span>
                                    ) : (
                                        'Z-Score: NA'
                                    )}
                                </div>
                                <div className={styles.badgeContainer}>
                                    {renderSampleBadges(geneRow, sampleId)}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {store.gtexLink && (
                    <a
                        className={styles.gtexLink}
                        href={store.gtexLink}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View {geneRow.hugoGeneSymbol} on GTEx Portal &rarr;
                    </a>
                )}
            </div>
        );
    }
}

function renderSampleBadges(geneRow: GeneRow, sampleId: string): JSX.Element[] {
    const badges: JSX.Element[] = [];

    const muts = geneRow.mutations[sampleId];
    if (muts && muts.length > 0) {
        for (const mut of muts) {
            badges.push(
                <span
                    key={`mut-${mut.startPosition}`}
                    className={`${styles.alterationBadge} ${styles.mutationColor}`}
                >
                    {mut.proteinChange || mut.mutationType}
                </span>
            );
        }
    }

    const cnas = geneRow.cnaAlterations[sampleId];
    if (cnas && cnas.length > 0) {
        for (const cna of cnas) {
            if (cna.alteration !== 0) {
                badges.push(
                    <span
                        key={`cna-${cna.alteration}`}
                        className={styles.alterationBadge}
                        style={{ backgroundColor: cnaToColor(cna.alteration) }}
                    >
                        {cnaToLabel(cna.alteration)}
                    </span>
                );
            }
        }
    }

    const fusions = geneRow.fusions[sampleId];
    if (fusions && fusions.length > 0) {
        for (const sv of fusions) {
            badges.push(
                <span
                    key={`sv-${sv.site1HugoSymbol}-${sv.site2HugoSymbol}`}
                    className={`${styles.alterationBadge} ${styles.fusionColor}`}
                >
                    Fusion
                </span>
            );
        }
    }

    return badges;
}
