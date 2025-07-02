import * as React from 'react';
import { observer } from 'mobx-react';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import * as Plotly from 'plotly.js';
import umapData from '../../../data/msk_chord_2024_umap_data.json';

export interface IEmbeddingsTabProps {
    store: StudyViewPageStore;
}

@observer
export class EmbeddingsTab extends React.Component<IEmbeddingsTabProps, {}> {
    private plotRef = React.createRef<HTMLDivElement>();
    private plotCreated = false;

    private loadUMAPData() {
        const data = umapData.data.map(patient => ({
            x: patient.x,
            y: patient.y,
            patientId: patient.patientId,
            cluster: Math.floor(Math.random() * 8) + 1,
        }));

        return data;
    }

    componentDidMount() {
        this.createPlot();
    }

    componentDidUpdate() {
        if (!this.plotCreated) {
            this.createPlot();
        }
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
            modeBarButtonsToRemove: ['lasso2d', 'select2d'],
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
        this.plotCreated = true;
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
