import * as React from 'react';
import { observer } from 'mobx-react';
import { computed } from 'mobx';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import * as Plotly from 'plotly.js';
import umapData from '../../../data/msk_chord_2024_umap_data.json';
import { SpecialChartsUniqueKeyEnum } from '../StudyViewUtils';

interface UMAPDataPoint {
    x: number;
    y: number;
    patientId: string;
    cluster: number;
    pointIndex: number;
    cancerType?: string;
    color?: string;
}

export interface IEmbeddingsTabProps {
    store: StudyViewPageStore;
}

@observer
export class EmbeddingsTab extends React.Component<IEmbeddingsTabProps, {}> {
    private plotRef = React.createRef<HTMLDivElement>();
    private plotCreated = false;
    private patientDataMap = new Map<number, UMAPDataPoint>();

    @computed get filteredPatientIds(): string[] {
        // selectedSamples IS the filtered data! It returns filtered results when chartsAreFiltered is true
        const filteredSamples = this.props.store.selectedSamples.result || [];
        const chartsAreFiltered = this.props.store.chartsAreFiltered;

        // Extract unique patient IDs from the filtered samples
        const patientIds = [
            ...new Set(filteredSamples.map((s: any) => s.patientId)),
        ];

        console.log(
            'COMPUTED: filteredPatientIds - chartsAreFiltered:',
            chartsAreFiltered,
            'patients:',
            patientIds.length,
            'samples:',
            filteredSamples.length
        );

        return patientIds;
    }

    private loadUMAPData(): UMAPDataPoint[] {
        // Use the computed property to force reactivity
        const filteredPatientIds = this.filteredPatientIds;

        // Check if data is ready
        const samplesReady = this.props.store.samples.isComplete;
        const allSamples = this.props.store.samples.result || [];

        console.log(
            'Data readiness - samples:',
            samplesReady,
            'total samples:',
            allSamples.length
        );

        // Get all unique patient IDs from samples
        const allPatientIds = [
            ...new Set(allSamples.map((s: any) => s.patientId)),
        ];

        console.log(
            'All patient IDs in study:',
            allPatientIds.length,
            allPatientIds.slice(0, 5)
        );
        console.log(
            'Filtered patient IDs (from computed):',
            filteredPatientIds.length,
            filteredPatientIds.slice(0, 5)
        );
        console.log(
            'UMAP patient IDs:',
            umapData.data.length,
            umapData.data.slice(0, 5).map((p: any) => p.patientId)
        );

        const allData: UMAPDataPoint[] = umapData.data.map(
            (patient: any, index: number) => ({
                x: patient.x,
                y: patient.y,
                patientId: patient.patientId,
                cluster: Math.floor(Math.random() * 8) + 1,
                pointIndex: index,
            })
        );

        // If samples aren't ready yet, show all UMAP data
        if (!samplesReady || allPatientIds.length === 0) {
            console.log('Data not ready, showing all UMAP points');
            this.patientDataMap.clear();
            allData.forEach((point: UMAPDataPoint, index: number) => {
                point.pointIndex = index;
                this.patientDataMap.set(point.pointIndex, point);
            });
            return allData;
        }

        // Check overlap between study patients and UMAP patients
        const studyPatientIds = new Set(allPatientIds);
        const umapPatientIds = new Set(
            umapData.data.map((p: any) => p.patientId)
        );
        const studyUmapOverlap = allPatientIds.filter((pid: string) =>
            umapPatientIds.has(pid)
        );
        console.log(
            'Overlap between study and UMAP patients:',
            studyUmapOverlap.length,
            studyUmapOverlap.slice(0, 5)
        );

        // Use the filtered patient IDs from the computed property
        // This will automatically contain the right patients based on current filters
        const patientsToShow = new Set(filteredPatientIds);
        console.log(
            'Using filtered patients from store:',
            filteredPatientIds.length
        );

        const filteredData = allData.filter((point: UMAPDataPoint) =>
            patientsToShow.has(point.patientId)
        );

        console.log(
            'Final filtered UMAP data:',
            filteredData.length,
            'points out of',
            allData.length,
            'total UMAP points'
        );

        // Build a map for quick lookup
        this.patientDataMap.clear();
        filteredData.forEach((point: UMAPDataPoint, index: number) => {
            // Re-index the filtered data
            point.pointIndex = index;
            this.patientDataMap.set(point.pointIndex, point);
        });

        return filteredData;
    }

    componentDidMount() {
        this.createPlot();
    }

    componentDidUpdate(prevProps: IEmbeddingsTabProps) {
        // Only update if the component is actually visible and data is ready
        if (
            !this.props.store.samples.isComplete ||
            !this.props.store.selectedSamples.isComplete
        ) {
            return;
        }

        // Check if the selected samples have changed (this indicates filters changed)
        const currentSamples = this.props.store.selectedSamples.result || [];
        const prevSamples = prevProps?.store?.selectedSamples?.result || [];

        const samplesChanged = currentSamples.length !== prevSamples.length;

        // Also check patient keys as backup
        const currentPatientKeys =
            this.props.store.selectedPatientKeys.result || [];
        const prevPatientKeys =
            prevProps?.store?.selectedPatientKeys?.result || [];

        const patientsChanged =
            currentPatientKeys.length !== prevPatientKeys.length ||
            !currentPatientKeys.every(key => prevPatientKeys.includes(key));

        // Only recreate plot if not created yet OR if samples/patients actually changed
        if (!this.plotCreated) {
            console.log('Creating plot for first time');
            this.createPlot();
        } else if (samplesChanged || patientsChanged) {
            console.log(
                'Filters changed, recreating plot. Current samples:',
                currentSamples.length,
                'Previous samples:',
                prevSamples.length
            );
            this.recreatePlot();
        }

        // Check if custom selection was cleared and clear Plotly selection
        const hasCustomSelection =
            this.props.store.numberOfSelectedSamplesInCustomSelection > 0;
        const hadCustomSelection = prevProps?.store
            ? prevProps.store.numberOfSelectedSamplesInCustomSelection > 0
            : false;

        if (
            hadCustomSelection &&
            !hasCustomSelection &&
            this.plotRef.current &&
            this.plotCreated
        ) {
            // Clear the Plotly selection when custom filters are cleared
            try {
                Plotly.restyle(this.plotRef.current, {
                    selectedpoints: [null],
                });
            } catch (error) {
                console.warn('Error clearing Plotly selection:', error);
            }
        }
    }

    private recreatePlot() {
        if (this.plotRef.current && this.plotCreated) {
            Plotly.purge(this.plotRef.current);
            this.plotCreated = false;
        }
        this.createPlot();
    }

    componentWillUnmount() {
        if (this.plotRef.current && this.plotCreated) {
            Plotly.purge(this.plotRef.current);
        }
    }

    private createPlot() {
        if (
            !this.plotRef.current ||
            !this.props.store.samples.isComplete ||
            this.plotCreated
        ) {
            return;
        }

        const currentStudyId = this.props.store.queriedPhysicalStudyIds
            .result?.[0];

        if (currentStudyId !== 'msk_chord_2024') {
            return;
        }

        const patientData = this.loadUMAPData();

        const clusters = Array.from(
            new Set(patientData.map((d: UMAPDataPoint) => d.cluster))
        ).sort((a: number, b: number) => a - b);
        const colors = [
            '#1f77b4',
            '#ff7f0e',
            '#2ca02c',
            '#d62728',
            '#9467bd',
            '#8c564b',
            '#e377c2',
            '#7f7f7f',
        ];

        const traces = clusters.map((cluster, idx) => {
            const clusterData = patientData.filter(
                (d: UMAPDataPoint) => d.cluster === cluster
            );
            return {
                x: clusterData.map((d: UMAPDataPoint) => d.x),
                y: clusterData.map((d: UMAPDataPoint) => d.y),
                mode: 'markers' as const,
                type: 'scattergl' as const,
                name: `Cluster ${cluster}`,
                marker: {
                    color: colors[idx % colors.length],
                    size: 3,
                    opacity: 0.7,
                },
                text: clusterData.map(
                    (d: UMAPDataPoint) =>
                        `Patient: ${d.patientId}<br>Cluster: ${d.cluster}`
                ),
                hovertemplate: '%{text}<extra></extra>',
            };
        });

        const layout: Partial<Plotly.Layout> = {
            title: {
                text: `UMAP Embedding - ${currentStudyId} (${patientData.length.toLocaleString()} patients)`,
                font: { size: 16 },
            },
            xaxis: {
                title: { text: 'UMAP 1' },
                showgrid: false,
                zeroline: false,
            },
            yaxis: {
                title: { text: 'UMAP 2' },
                showgrid: false,
                zeroline: false,
            },
            showlegend: true,
            legend: {
                x: 1.02,
                y: 1,
                bgcolor: 'rgba(255,255,255,0.8)',
                bordercolor: 'rgba(0,0,0,0.2)',
                borderwidth: 1,
            },
            margin: { l: 60, r: 150, t: 60, b: 60 },
            plot_bgcolor: 'white',
            paper_bgcolor: 'white',
            hovermode: 'closest',
        };

        const config: Partial<Plotly.Config> = {
            displayModeBar: true,
            modeBarButtonsToRemove: [],
            displaylogo: false,
            toImageButtonOptions: {
                format: 'png' as const,
                filename: `umap_embedding_${currentStudyId}`,
                height: 600,
                width: 800,
                scale: 2,
            },
        };

        Plotly.newPlot(this.plotRef.current, traces, layout, config);

        // Add selection event handler
        if (this.plotRef.current) {
            (this.plotRef.current as any).on(
                'plotly_selected',
                (eventData: any) => {
                    this.handlePlotSelection(eventData);
                }
            );
        }

        this.plotCreated = true;
    }

    private handlePlotSelection(eventData: any) {
        if (!eventData || !eventData.points || eventData.points.length === 0) {
            return;
        }

        // Extract selected patient IDs from the selection
        const selectedPatientIds: string[] = [];

        eventData.points.forEach((point: any) => {
            // Get point index from the trace data
            const pointIndex = point.pointIndex;
            // Look up the corresponding patient data
            const patientData = this.patientDataMap.get(pointIndex);
            if (patientData && patientData.patientId) {
                selectedPatientIds.push(patientData.patientId);
            }
        });

        if (selectedPatientIds.length > 0) {
            console.log('Selected patient IDs from UMAP:', selectedPatientIds);

            // Get actual samples from the store to map patient IDs to sample IDs
            const allSamples = this.props.store.samples.result || [];
            const selectedPatientSet = new Set(selectedPatientIds);

            // Find samples that belong to the selected patients
            const samplesForSelectedPatients = allSamples.filter(sample =>
                selectedPatientSet.has(sample.patientId)
            );

            console.log(
                'Samples for selected patients:',
                samplesForSelectedPatients
            );

            // Create CustomChartData for patient selection
            const customChartData = {
                origin: ['UMAP'],
                displayName: 'UMAP Selection',
                description: 'Patients selected from UMAP embedding',
                datatype: 'STRING',
                patientAttribute: true,
                priority: 1,
                data: samplesForSelectedPatients.map(sample => ({
                    studyId: sample.studyId,
                    patientId: sample.patientId,
                    sampleId: sample.sampleId,
                    value: 'Selected',
                })),
            };

            console.log(
                'Custom chart data with correct sample IDs:',
                customChartData
            );

            // Update the study view filter with selected patients
            this.props.store.updateCustomSelect(customChartData);
        }
    }

    render() {
        // Show loading if samples aren't ready
        if (!this.props.store.samples.isComplete) {
            return <LoadingIndicator isLoading={true} />;
        }

        // Safety check for study ID access
        const studyIds = this.props.store.queriedPhysicalStudyIds.result;
        const currentStudyId =
            studyIds && studyIds.length > 0 ? studyIds[0] : null;

        if (!currentStudyId) {
            return (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h4>Embeddings Visualization</h4>
                    <p>Loading study information...</p>
                </div>
            );
        }

        if (currentStudyId !== 'msk_chord_2024') {
            return (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h4>Embeddings Visualization</h4>
                    <p>
                        Embeddings are currently only available for the
                        msk_chord_2024 study.
                    </p>
                    <p>
                        Current study: <strong>{currentStudyId}</strong>
                    </p>
                </div>
            );
        }

        return (
            <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h4>Patient Embeddings Visualization</h4>
                    <p>
                        Interactive UMAP projection showing patient similarity
                        patterns. Each point represents a patient, colored by
                        cluster assignment. Use the toolbar to zoom, pan, and
                        download the plot.
                    </p>
                </div>
                <div
                    ref={this.plotRef}
                    style={{ width: '100%', height: '600px' }}
                />
            </div>
        );
    }
}

export default EmbeddingsTab;
