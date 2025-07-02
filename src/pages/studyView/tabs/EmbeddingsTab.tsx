import * as React from 'react';
import { observer } from 'mobx-react';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import * as Plotly from 'plotly.js';
import umapData from '../../../data/msk_chord_2024_umap_data.json';
import { SpecialChartsUniqueKeyEnum } from '../StudyViewUtils';

export interface IEmbeddingsTabProps {
    store: StudyViewPageStore;
}

@observer
export class EmbeddingsTab extends React.Component<IEmbeddingsTabProps, {}> {
    private plotRef = React.createRef<HTMLDivElement>();
    private plotCreated = false;
    private patientDataMap = new Map<string, any>();

    private loadUMAPData() {
        // Get currently selected patient keys to filter the UMAP data
        const selectedPatientKeys =
            this.props.store.selectedPatientKeys.result || [];
        const selectedPatientIds = new Set(selectedPatientKeys);

        // Get actual patients from the store to map to real patient IDs
        const actualPatients = this.props.store.selectedPatients.result || [];
        const actualPatientIds = actualPatients.map(p => p.patientId);

        console.log('Selected patient keys:', selectedPatientKeys);
        console.log('Actual patient IDs:', actualPatientIds.slice(0, 10)); // Log first 10 for debugging
        console.log(
            'UMAP patient IDs:',
            umapData.data.slice(0, 10).map(p => p.patientId)
        ); // Log first 10 UMAP IDs

        const allData = umapData.data.map((patient, index) => ({
            x: patient.x,
            y: patient.y,
            patientId: patient.patientId,
            cluster: Math.floor(Math.random() * 8) + 1,
            pointIndex: index,
        }));

        // Filter data to only include currently selected patients
        // If no patients are specifically selected (i.e., no filters applied), show all
        const filteredData =
            selectedPatientIds.size > 0
                ? allData.filter(point =>
                      selectedPatientIds.has(point.patientId)
                  )
                : allData;

        // Build a map for quick lookup
        this.patientDataMap.clear();
        filteredData.forEach((point, index) => {
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
        // Recreate plot when filters change or when initially not created
        if (
            !this.plotCreated ||
            this.props.store.selectedPatientKeys.isComplete
        ) {
            this.recreatePlot();
        }

        // Check if custom selection was cleared and clear Plotly selection
        const hasCustomSelection =
            this.props.store.numberOfSelectedSamplesInCustomSelection > 0;
        const hadCustomSelection = prevProps
            ? prevProps.store.numberOfSelectedSamplesInCustomSelection > 0
            : false;

        if (
            hadCustomSelection &&
            !hasCustomSelection &&
            this.plotRef.current &&
            this.plotCreated
        ) {
            // Clear the Plotly selection when custom filters are cleared
            Plotly.restyle(this.plotRef.current, { selectedpoints: [null] });
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
            new Set(patientData.map(d => d.cluster))
        ).sort((a, b) => a - b);
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
            const clusterData = patientData.filter(d => d.cluster === cluster);
            return {
                x: clusterData.map(d => d.x),
                y: clusterData.map(d => d.y),
                mode: 'markers',
                type: 'scattergl',
                name: `Cluster ${cluster}`,
                marker: {
                    color: colors[idx % colors.length],
                    size: 3,
                    opacity: 0.7,
                },
                text: clusterData.map(
                    d => `Patient: ${d.patientId}<br>Cluster: ${d.cluster}`
                ),
                hovertemplate: '%{text}<extra></extra>',
            };
        });

        const layout = {
            title: {
                text: `UMAP Embedding - ${currentStudyId} (${patientData.length.toLocaleString()} patients)`,
                font: { size: 16 },
            },
            xaxis: {
                title: 'UMAP 1',
                showgrid: false,
                zeroline: false,
            },
            yaxis: {
                title: 'UMAP 2',
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

        const config = {
            displayModeBar: true,
            modeBarButtonsToRemove: [],
            displaylogo: false,
            toImageButtonOptions: {
                format: 'png',
                filename: `umap_embedding_${currentStudyId}`,
                height: 600,
                width: 800,
                scale: 2,
            },
        };

        Plotly.newPlot(this.plotRef.current, traces, layout, config);

        // Add selection event handler
        this.plotRef.current.on('plotly_selected', eventData => {
            this.handlePlotSelection(eventData);
        });

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
        if (!this.props.store.samples.isComplete) {
            return <LoadingIndicator isLoading={true} />;
        }

        const currentStudyId = this.props.store.queriedPhysicalStudyIds
            .result?.[0];

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
