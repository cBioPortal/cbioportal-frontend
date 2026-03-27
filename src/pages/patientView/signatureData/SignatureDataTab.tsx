import * as React from 'react';
import { observer } from 'mobx-react';
import {
    VictoryBar,
    VictoryChart,
    VictoryAxis,
    VictoryGroup,
    VictoryLegend,
    VictoryTooltip,
    VictoryLabel,
} from 'victory';
import { signatureSampleStore } from './SignatureSampleStore';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const signatureData = require('../../../../signature_data/signature_data.json');

const MFP_CLASS_COLORS: Record<string, string> = {
    D: '#c8b631',
    F: '#c4375b',
    IE: '#3b4fb8',
    'IE/F': '#2a9d8f',
};

const MFP_CLASS_LABELS: Record<string, string> = {
    D: 'Desert (D)',
    F: 'Fibrotic (F)',
    IE: 'Immune Enriched (IE)',
    'IE/F': 'Immune Enriched / Fibrotic (IE/F)',
};

export const SignatureDataTab: React.FC = observer(() => {
    const store = signatureSampleStore;
    const sample = store.sample;
    const signatures = signatureData.metadata.signatures;
    const assignedClass = sample.classification.knn_class;
    const centroid =
        signatureData.centroids[
            assignedClass as keyof typeof signatureData.centroids
        ];

    // Prepare data for the grouped bar chart (patient vs centroid)
    const patientBarData = signatures.map((sig: string, i: number) => ({
        x: i + 1,
        y:
            sample.scaled_ssgsea_scores[
                sig as keyof typeof sample.scaled_ssgsea_scores
            ],
        label: `${sig}\nPatient: ${(sample.scaled_ssgsea_scores[
            sig as keyof typeof sample.scaled_ssgsea_scores
        ] as number).toFixed(2)}`,
    }));

    const centroidBarData = signatures.map((sig: string, i: number) => ({
        x: i + 1,
        y: centroid[sig as keyof typeof centroid],
        label: `${sig}\nCentroid (${assignedClass}): ${(centroid[
            sig as keyof typeof centroid
        ] as number).toFixed(2)}`,
    }));

    // Prepare data for the class probability bar chart
    const mfpClasses = Object.keys(sample.knn_class_scores);
    const mfpColorScale = mfpClasses.map(
        cls => MFP_CLASS_COLORS[cls] || '#999'
    );

    const classScores = mfpClasses.map(cls => ({
        x: MFP_CLASS_LABELS[cls] || cls,
        y: sample.knn_class_scores[cls] as number,
    }));

    return (
        <div style={{ padding: 20 }}>
            <h2>Immune Microenvironment Signature Profile</h2>
            <p style={{ color: '#666', marginBottom: 20 }}>
                Sample: <strong>{store.sampleId}</strong>
            </p>

            {/* Classification Summary */}
            <div
                style={{
                    display: 'flex',
                    gap: 20,
                    marginBottom: 30,
                    flexWrap: 'wrap',
                }}
            >
                <div
                    style={{
                        background: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: 8,
                        padding: 20,
                        flex: '1 1 300px',
                    }}
                >
                    <h4 style={{ marginTop: 0 }}>Classification</h4>
                    <div style={{ fontSize: 16, marginBottom: 8 }}>
                        <span style={{ fontWeight: 'bold' }}>
                            Immune Signature{' '}
                        </span>
                        <span
                            style={{
                                display: 'inline-block',
                                background:
                                    MFP_CLASS_COLORS[assignedClass] || '#999',
                                color: 'white',
                                borderRadius: 4,
                                padding: '2px 10px',
                                fontWeight: 'bold',
                            }}
                        >
                            {MFP_CLASS_LABELS[assignedClass] || assignedClass}
                        </span>
                    </div>
                    <table
                        style={{
                            marginTop: 12,
                            fontSize: 14,
                            lineHeight: '1.8',
                        }}
                    >
                        <tbody>
                            {['D', 'IE', 'IE/F', 'F'].map((cls: string) => (
                                <tr key={cls}>
                                    <td
                                        style={{
                                            paddingRight: 16,
                                            color: '#666',
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                width: 10,
                                                height: 10,
                                                borderRadius: 2,
                                                backgroundColor:
                                                    MFP_CLASS_COLORS[cls],
                                                marginRight: 6,
                                                verticalAlign: 'middle',
                                            }}
                                        />
                                        {MFP_CLASS_LABELS[cls]}
                                    </td>
                                    <td style={{ fontWeight: 'bold' }}>
                                        {(
                                            (sample.knn_class_scores[
                                                cls
                                            ] as number) * 100
                                        ).toFixed(1)}
                                        %
                                    </td>
                                </tr>
                            ))}
                            <tr>
                                <td style={{ paddingRight: 16, color: '#666' }}>
                                    KNN Confidence
                                </td>
                                <td style={{ fontWeight: 'bold' }}>
                                    {sample.classification.knn_confidence}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ paddingRight: 16, color: '#666' }}>
                                    Centroid Correlation
                                </td>
                                <td style={{ fontWeight: 'bold' }}>
                                    {(sample.classification
                                        .centroid_corr as number).toFixed(3)}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ paddingRight: 16, color: '#666' }}>
                                    Methods Agree
                                </td>
                                <td style={{ fontWeight: 'bold' }}>
                                    {sample.classification.methods_agree
                                        ? 'Yes'
                                        : 'No'}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ paddingRight: 16, color: '#666' }}>
                                    Scaling Mode
                                </td>
                                <td
                                    style={{ fontWeight: 'bold', fontSize: 12 }}
                                >
                                    {sample.classification.scaling_mode}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* KNN Class Probabilities */}
                <div
                    style={{
                        background: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: 8,
                        padding: 20,
                        flex: '1 1 300px',
                    }}
                >
                    <h4 style={{ marginTop: 0 }}>KNN Class Probabilities</h4>
                    <VictoryChart
                        height={200}
                        width={400}
                        domainPadding={{ x: 50 }}
                        padding={{
                            top: 10,
                            bottom: 60,
                            left: 50,
                            right: 20,
                        }}
                    >
                        <VictoryAxis
                            tickLabelComponent={
                                <VictoryLabel angle={-30} textAnchor="end" />
                            }
                            style={{
                                tickLabels: { fontSize: 10 },
                            }}
                        />
                        <VictoryAxis
                            dependentAxis
                            tickFormat={(t: number) =>
                                `${(t * 100).toFixed(0)}%`
                            }
                            style={{
                                tickLabels: { fontSize: 10 },
                            }}
                        />
                        <VictoryBar
                            data={classScores}
                            style={{
                                data: {
                                    fill: ({ index }: any) =>
                                        mfpColorScale[index] || '#999',
                                },
                            }}
                        />
                    </VictoryChart>
                </div>
            </div>

            {/* Signature Scores: Patient vs Centroid */}
            <div
                style={{
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: 8,
                    padding: 20,
                    marginBottom: 30,
                }}
            >
                <h4 style={{ marginTop: 0 }}>
                    Scaled ssGSEA Scores — Patient vs {assignedClass} Centroid
                </h4>
                <VictoryChart
                    height={400}
                    width={1000}
                    domainPadding={{ x: 12 }}
                    padding={{
                        top: 40,
                        bottom: 80,
                        left: 50,
                        right: 20,
                    }}
                >
                    <VictoryLegend
                        x={350}
                        y={0}
                        orientation="horizontal"
                        gutter={20}
                        data={[
                            {
                                name: 'Patient',
                                symbol: { fill: '#3498db' },
                            },
                            {
                                name: `${assignedClass} Centroid`,
                                symbol: {
                                    fill:
                                        MFP_CLASS_COLORS[assignedClass] ||
                                        '#999',
                                },
                            },
                        ]}
                    />
                    <VictoryAxis
                        tickValues={signatures.map(
                            (_: string, i: number) => i + 1
                        )}
                        tickFormat={signatures.map((s: string) =>
                            s.replace(/_/g, ' ')
                        )}
                        tickLabelComponent={
                            <VictoryLabel
                                angle={-45}
                                textAnchor="end"
                                dy={-5}
                            />
                        }
                        style={{
                            tickLabels: { fontSize: 7 },
                        }}
                    />
                    <VictoryAxis
                        dependentAxis
                        label="Scaled Score"
                        axisLabelComponent={<VictoryLabel dy={-20} />}
                        style={{
                            tickLabels: { fontSize: 9 },
                            axisLabel: { fontSize: 11 },
                        }}
                    />
                    <VictoryGroup offset={8}>
                        <VictoryBar
                            data={patientBarData}
                            barWidth={7}
                            style={{
                                data: { fill: '#3498db' },
                            }}
                            labelComponent={
                                <VictoryTooltip
                                    flyoutStyle={{
                                        stroke: '#ccc',
                                        fill: 'white',
                                    }}
                                />
                            }
                        />
                        <VictoryBar
                            data={centroidBarData}
                            barWidth={7}
                            style={{
                                data: {
                                    fill:
                                        MFP_CLASS_COLORS[assignedClass] ||
                                        '#999',
                                },
                            }}
                            labelComponent={
                                <VictoryTooltip
                                    flyoutStyle={{
                                        stroke: '#ccc',
                                        fill: 'white',
                                    }}
                                />
                            }
                        />
                    </VictoryGroup>
                </VictoryChart>
            </div>
        </div>
    );
});

export default SignatureDataTab;
