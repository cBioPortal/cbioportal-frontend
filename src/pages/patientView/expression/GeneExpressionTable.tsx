import * as React from 'react';
import { observer } from 'mobx-react';
import ExpressionTabStore, { GeneRow } from './ExpressionTabStore';
import { formatZScore, cnaToLabel, cnaToColor } from './ExpressionTabUtils';
import styles from './styles.module.scss';

interface IGeneExpressionTableProps {
    store: ExpressionTabStore;
    sampleIds: string[];
}

function getZScoreColorClass(zScore: number): string {
    if (zScore > 0.5) return styles.zScorePositive;
    if (zScore < -0.5) return styles.zScoreNegative;
    return styles.zScoreNeutral;
}

@observer
export default class GeneExpressionTable extends React.Component<
    IGeneExpressionTableProps
> {
    render() {
        const { store, sampleIds } = this.props;
        const rows = store.filteredGeneRows;

        return (
            <div className={styles.tableContainer}>
                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Search genes..."
                    value={store.geneFilter}
                    onChange={e => store.setGeneFilter(e.target.value)}
                />
                <div className={styles.tableScroll}>
                    <table className={styles.geneTable}>
                        <thead>
                            <tr>
                                <th
                                    onClick={() =>
                                        store.setSort('hugoGeneSymbol')
                                    }
                                >
                                    Gene
                                    {store.sortColumn === 'hugoGeneSymbol' && (
                                        <span className={styles.sortArrow}>
                                            {store.sortDirection === 'asc'
                                                ? ' \u25B2'
                                                : ' \u25BC'}
                                        </span>
                                    )}
                                </th>
                                {sampleIds.map(sampleId => (
                                    <th
                                        key={sampleId}
                                        className={styles.sampleColHeader}
                                    >
                                        {sampleId}
                                        <span
                                            className={styles.sampleColSubtitle}
                                        >
                                            Z-Score
                                        </span>
                                    </th>
                                ))}
                                <th
                                    className={styles.sampleColHeader}
                                    onClick={() =>
                                        store.setSort('maxAbsZScore')
                                    }
                                >
                                    |Z|<sub>max</sub>
                                    {store.sortColumn === 'maxAbsZScore' && (
                                        <span className={styles.sortArrow}>
                                            {store.sortDirection === 'asc'
                                                ? ' \u25B2'
                                                : ' \u25BC'}
                                        </span>
                                    )}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(row => (
                                <tr
                                    key={row.entrezGeneId}
                                    className={
                                        store.selectedGeneEntrezId ===
                                        row.entrezGeneId
                                            ? styles.selectedRow
                                            : undefined
                                    }
                                    onClick={() =>
                                        store.setSelectedGene(row.entrezGeneId)
                                    }
                                >
                                    <td>
                                        <span className={styles.geneSymbol}>
                                            {row.hugoGeneSymbol}
                                        </span>
                                        {renderBadges(row, sampleIds)}
                                    </td>
                                    {sampleIds.map(sampleId => (
                                        <td
                                            key={sampleId}
                                            className={styles.zScoreCell}
                                        >
                                            {row.zScoresBySample[sampleId] !==
                                            undefined ? (
                                                <span
                                                    className={`${
                                                        styles.zScoreValue
                                                    } ${getZScoreColorClass(
                                                        row.zScoresBySample[
                                                            sampleId
                                                        ]
                                                    )}`}
                                                >
                                                    {formatZScore(
                                                        row.zScoresBySample[
                                                            sampleId
                                                        ]
                                                    )}
                                                </span>
                                            ) : (
                                                <span
                                                    className={
                                                        styles.zScoreNeutral
                                                    }
                                                >
                                                    NA
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                    <td className={styles.zScoreCell}>
                                        <span className={styles.absZScore}>
                                            {row.maxAbsZScore.toFixed(2)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className={styles.tableFooter}>
                    {rows.length} gene{rows.length !== 1 ? 's' : ''} listed
                </div>
            </div>
        );
    }
}

function renderBadges(row: GeneRow, sampleIds: string[]) {
    const badges: JSX.Element[] = [];
    const seenMutations = new Set<string>();
    const seenCna = new Set<number>();
    let hasFusion = false;

    for (const sampleId of sampleIds) {
        // Mutation badges - show unique protein changes
        const muts = row.mutations[sampleId];
        if (muts && muts.length > 0) {
            for (const mut of muts) {
                const key = mut.proteinChange || mut.mutationType || 'unknown';
                if (!seenMutations.has(key)) {
                    seenMutations.add(key);
                    badges.push(
                        <span
                            key={`mut-${key}`}
                            className={`${styles.alterationBadge} ${styles.mutationColor}`}
                            title={`${mut.mutationType}: ${mut.proteinChange ||
                                ''}`}
                        >
                            {mut.proteinChange || mut.mutationType}
                        </span>
                    );
                }
            }
        }

        // CNA badges - show unique alteration types
        const cnas = row.cnaAlterations[sampleId];
        if (cnas && cnas.length > 0) {
            for (const cna of cnas) {
                if (cna.alteration !== 0 && !seenCna.has(cna.alteration)) {
                    seenCna.add(cna.alteration);
                    badges.push(
                        <span
                            key={`cna-${cna.alteration}`}
                            className={styles.alterationBadge}
                            style={{
                                backgroundColor: cnaToColor(cna.alteration),
                            }}
                        >
                            {cnaToLabel(cna.alteration)}
                        </span>
                    );
                }
            }
        }

        // Fusion badge - show once
        const fusions = row.fusions[sampleId];
        if (fusions && fusions.length > 0 && !hasFusion) {
            hasFusion = true;
            badges.push(
                <span
                    key="fusion"
                    className={`${styles.alterationBadge} ${styles.fusionColor}`}
                >
                    Fusion
                </span>
            );
        }
    }

    if (badges.length === 0) return null;

    return <span className={styles.badgeContainer}>{badges}</span>;
}
