import * as React from 'react';
import { observer } from 'mobx-react';
import {
    VictoryChart,
    VictoryAxis,
    VictoryLine,
    VictoryScatter,
    VictoryLegend,
    VictoryLabel,
    VictoryTooltip,
} from 'victory';
import { CBIOPORTAL_VICTORY_THEME } from 'cbioportal-frontend-commons';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ExpressionTabStore, { WaterfallDatum } from './ExpressionTabStore';
import SampleManager from '../SampleManager';
import styles from './styles.module.scss';
import { formatZScore } from './ExpressionTabUtils';

interface IExpressionWaterfallPlotProps {
    store: ExpressionTabStore;
    sampleManager: SampleManager | null;
    sampleIds: string[];
}

function getSampleTypeLabel(
    sampleManager: SampleManager | null,
    sampleId: string
): string {
    if (!sampleManager) return '';
    const clinData = sampleManager.clinicalDataLegacyCleanAndDerived[sampleId];
    if (!clinData || !clinData.DERIVED_NORMALIZED_CASE_TYPE) return 'Tumor';
    const caseType = clinData.DERIVED_NORMALIZED_CASE_TYPE;
    switch (caseType) {
        case 'Primary':
            return 'Primary Solid Tumor';
        case 'Metastasis':
            return 'Metastasis';
        case 'Recurrence':
            return 'Recurrent Tumor';
        case 'cfDNA':
            return 'cfDNA';
        case 'Xenograft':
            return 'Xenograft';
        case 'Organoid':
            return 'Organoid';
        default:
            return caseType;
    }
}

function getStudyDisplayName(studyId: string): string {
    return studyId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

@observer
export default class ExpressionWaterfallPlot extends React.Component<
    IExpressionWaterfallPlotProps
> {
    render() {
        const { store, sampleManager, sampleIds } = this.props;

        if (store.selectedGeneEntrezId === undefined) {
            return (
                <div className={styles.plotContainer}>
                    <div className={styles.plotPlaceholder}>
                        Select a gene from the table to view its expression
                        distribution across the study cohort.
                    </div>
                </div>
            );
        }

        const geneSymbol = store.selectedGeneSymbol || '';

        return (
            <div className={styles.plotContainer}>
                <h4 className={styles.plotTitle}>
                    mRNA Expression Z-Scores - {geneSymbol}
                </h4>
                <div className={styles.plotToggle}>
                    <button
                        className={`${styles.toggleButton} ${styles.toggleButtonDisabled}`}
                        disabled
                        title="Pan-cancer view coming soon"
                    >
                        Pancancer
                    </button>
                    <button
                        className={`${styles.toggleButton} ${styles.toggleButtonActive}`}
                    >
                        {getStudyDisplayName(store.studyId)}
                    </button>
                </div>

                {store.cohortExpressionData.isPending && (
                    <LoadingIndicator
                        isLoading={true}
                        center={true}
                        size={'big'}
                    />
                )}

                {store.cohortExpressionData.isComplete &&
                    this.renderChart(
                        store.waterfallPlotData,
                        sampleIds,
                        sampleManager
                    )}
            </div>
        );
    }

    private renderChart(
        data: WaterfallDatum[],
        sampleIds: string[],
        sampleManager: SampleManager | null
    ) {
        if (data.length === 0) {
            return (
                <div className={styles.plotPlaceholder}>
                    No cohort expression data available for this gene.
                </div>
            );
        }

        const cohortData = data.filter(d => !d.isPatientSample);
        const patientData = data.filter(d => d.isPatientSample);

        // Build line data from all points
        const lineData = data.map(d => ({ x: d.x, y: d.y }));

        // Legend data - use sample type labels with colors
        const legendData: Array<{
            name: string;
            symbol: { fill: string; type: string };
        }> = [];
        legendData.push({
            name: 'Cohort',
            symbol: { fill: '#cccccc', type: 'circle' },
        });
        if (sampleManager) {
            for (const sampleId of sampleIds) {
                const color = sampleManager.sampleColors[sampleId] || '#333';
                const typeLabel = getSampleTypeLabel(sampleManager, sampleId);
                legendData.push({
                    name: typeLabel,
                    symbol: { fill: color, type: 'circle' },
                });
            }
        }

        const chartWidth = 550;
        const chartHeight = 350;
        const lastX = data.length - 1;

        return (
            <>
                <VictoryChart
                    theme={CBIOPORTAL_VICTORY_THEME}
                    width={chartWidth}
                    height={chartHeight}
                    padding={{ top: 20, bottom: 60, left: 60, right: 30 }}
                >
                    <VictoryAxis
                        label="Cohort Samples (Sorted)"
                        style={{
                            axisLabel: { fontSize: 12, padding: 35 },
                            tickLabels: { fontSize: 9 },
                        }}
                    />

                    <VictoryAxis
                        dependentAxis
                        label="Z-Score"
                        style={{
                            axisLabel: { fontSize: 12, padding: 40 },
                            tickLabels: { fontSize: 9 },
                        }}
                    />

                    {/* +2 SD reference line */}
                    <VictoryLine
                        data={[
                            { x: 0, y: 2 },
                            { x: lastX, y: 2 },
                        ]}
                        style={{
                            data: {
                                stroke: '#e74c3c',
                                strokeWidth: 1,
                                strokeDasharray: '4,4',
                            },
                        }}
                        labels={['', '+2 SD']}
                        labelComponent={
                            <VictoryLabel
                                dx={5}
                                style={{ fontSize: 8, fill: '#e74c3c' }}
                            />
                        }
                    />

                    {/* -2 SD reference line */}
                    <VictoryLine
                        data={[
                            { x: 0, y: -2 },
                            { x: lastX, y: -2 },
                        ]}
                        style={{
                            data: {
                                stroke: '#3498db',
                                strokeWidth: 1,
                                strokeDasharray: '4,4',
                            },
                        }}
                        labels={['', '-2 SD']}
                        labelComponent={
                            <VictoryLabel
                                dx={5}
                                style={{ fontSize: 8, fill: '#3498db' }}
                            />
                        }
                    />

                    {/* Cohort curve */}
                    <VictoryLine
                        data={lineData}
                        style={{
                            data: {
                                stroke: '#cccccc',
                                strokeWidth: 1.5,
                            },
                        }}
                    />

                    {/* Cohort samples (small gray dots) */}
                    <VictoryScatter
                        data={cohortData}
                        size={1.5}
                        style={{
                            data: {
                                fill: '#cccccc',
                                opacity: 0.4,
                            },
                        }}
                    />

                    {/* Patient samples (large colored dots with tooltip) */}
                    <VictoryScatter
                        data={patientData}
                        size={6}
                        style={{
                            data: {
                                fill: (d: any) => d.color,
                                stroke: '#333',
                                strokeWidth: 1,
                            },
                        }}
                        labels={(d: any) =>
                            `${d.sampleId}\n${
                                d.studyId
                            }\nExpression (Z-Score): ${formatZScore(d.y)}`
                        }
                        labelComponent={
                            <VictoryTooltip
                                cornerRadius={4}
                                pointerLength={8}
                                flyoutStyle={{
                                    stroke: '#ccc',
                                    strokeWidth: 1,
                                    fill: 'white',
                                }}
                                style={[
                                    {
                                        fontSize: 10,
                                        fontWeight: 'bold',
                                        fill: '#333',
                                    },
                                    {
                                        fontSize: 9,
                                        fontStyle: 'italic',
                                        fill: '#888',
                                    },
                                    { fontSize: 9, fill: '#333' },
                                ]}
                                flyoutPadding={{
                                    top: 8,
                                    bottom: 8,
                                    left: 12,
                                    right: 12,
                                }}
                            />
                        }
                    />
                </VictoryChart>

                {/* Legend below chart */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: -10,
                    }}
                >
                    <svg width={chartWidth} height={30}>
                        <VictoryLegend
                            standalone={false}
                            x={chartWidth / 2 - (legendData.length * 80) / 2}
                            y={0}
                            orientation="horizontal"
                            data={legendData}
                            style={{
                                labels: { fontSize: 10 },
                            }}
                            symbolSpacer={5}
                            gutter={15}
                        />
                    </svg>
                </div>
            </>
        );
    }
}
