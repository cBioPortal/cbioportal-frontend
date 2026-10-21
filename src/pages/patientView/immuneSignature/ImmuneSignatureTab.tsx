import * as React from 'react';
import { observer } from 'mobx-react';
import {
    VictoryBar,
    VictoryChart,
    VictoryAxis,
    VictoryContainer,
    VictoryLabel,
} from 'victory';
import { CBIOPORTAL_VICTORY_THEME } from 'cbioportal-frontend-commons';
import SampleManager from 'pages/patientView/SampleManager';
import {
    ImmuneSignature,
    MFP_CLASSES,
    MFP_CLASS_COLORS,
    MFP_CLASS_LABELS,
} from './ImmuneSignatureUtils';

interface IImmuneSignatureTabProps {
    immuneSignatureBySample: Record<string, ImmuneSignature>;
    sampleManager: SampleManager | null;
}

const cardStyle: React.CSSProperties = {
    background: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: 8,
    padding: 20,
    flex: '1 1 300px',
};

const labelCellStyle: React.CSSProperties = {
    paddingRight: 16,
    color: '#666',
};

function formatOptional<T>(
    value: T | undefined,
    format: (v: T) => string
): string {
    return value === undefined ? 'NA' : format(value);
}

const ClassificationCard: React.FC<{ signature: ImmuneSignature }> = ({
    signature,
}) => (
    <div style={cardStyle} data-test="immune-signature-classification">
        <h4 style={{ marginTop: 0 }}>Classification</h4>
        <table style={{ fontSize: 14, lineHeight: '1.8' }}>
            <tbody>
                {MFP_CLASSES.slice()
                    .sort(
                        (a, b) =>
                            signature.classScores[b] - signature.classScores[a]
                    )
                    .map(cls => (
                        <tr key={cls}>
                            <td style={labelCellStyle}>
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: 10,
                                        height: 10,
                                        borderRadius: 2,
                                        backgroundColor: MFP_CLASS_COLORS[cls],
                                        marginRight: 6,
                                        verticalAlign: 'middle',
                                    }}
                                />
                                {MFP_CLASS_LABELS[cls]}
                            </td>
                            <td style={{ fontWeight: 'bold' }}>
                                {(signature.classScores[cls] * 100).toFixed(1)}%
                                {cls === signature.knnClass && (
                                    <i
                                        className="fa fa-check"
                                        data-test="immune-signature-assigned-class"
                                        title="Assigned class"
                                        style={{
                                            color: MFP_CLASS_COLORS[cls],
                                            marginLeft: 6,
                                        }}
                                    />
                                )}
                            </td>
                        </tr>
                    ))}
                <tr>
                    <td style={labelCellStyle}>KNN Confidence</td>
                    <td style={{ fontWeight: 'bold' }}>
                        {signature.knnConfidence || 'NA'}
                    </td>
                </tr>
                <tr>
                    <td style={labelCellStyle}>Centroid Class</td>
                    <td style={{ fontWeight: 'bold' }}>
                        {signature.centroidClass || 'NA'}
                    </td>
                </tr>
                <tr>
                    <td style={labelCellStyle}>Centroid Correlation</td>
                    <td style={{ fontWeight: 'bold' }}>
                        {formatOptional(signature.centroidCorr, v =>
                            v.toFixed(3)
                        )}
                    </td>
                </tr>
                <tr>
                    <td style={labelCellStyle}>Methods Agree</td>
                    <td style={{ fontWeight: 'bold' }}>
                        {formatOptional(signature.methodsAgree, v =>
                            v ? 'Yes' : 'No'
                        )}
                    </td>
                </tr>
                <tr>
                    <td style={labelCellStyle}>Scaling Mode</td>
                    <td style={{ fontWeight: 'bold', fontSize: 12 }}>
                        {signature.scalingMode || 'NA'}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
);

const ClassProbabilitiesCard: React.FC<{ signature: ImmuneSignature }> = ({
    signature,
}) => (
    <div style={cardStyle} data-test="immune-signature-class-probabilities">
        <h4 style={{ marginTop: 0 }}>KNN Class Probabilities</h4>
        <VictoryChart
            theme={CBIOPORTAL_VICTORY_THEME}
            containerComponent={<VictoryContainer responsive={false} />}
            width={320}
            height={330}
            domain={{ y: [0, 1] }}
            domainPadding={{ x: 40 }}
            padding={{ top: 20, bottom: 60, left: 70, right: 20 }}
        >
            <VictoryAxis
                label="MFP Class"
                axisLabelComponent={<VictoryLabel dy={20} />}
            />
            <VictoryAxis
                dependentAxis
                label="Probability"
                axisLabelComponent={<VictoryLabel dy={-30} />}
                tickFormat={(t: number) => `${(t * 100).toFixed(0)}%`}
            />
            {MFP_CLASSES.map(cls => (
                <VictoryBar
                    key={cls}
                    data={[{ x: cls, y: signature.classScores[cls] }]}
                    barWidth={24}
                    style={{ data: { fill: MFP_CLASS_COLORS[cls] } }}
                />
            ))}
        </VictoryChart>
    </div>
);

export const ImmuneSignatureTab: React.FC<IImmuneSignatureTabProps> = observer(
    ({ immuneSignatureBySample, sampleManager }) => {
        const sampleIds = sampleManager
            ? sampleManager.getActiveSampleIdsInOrder()
            : Object.keys(immuneSignatureBySample);
        const [selected, setSelected] = React.useState<string | undefined>();
        const sampleId =
            selected && sampleIds.includes(selected)
                ? selected
                : sampleIds.find(id => id in immuneSignatureBySample) ||
                  sampleIds[0];
        const signature = sampleId
            ? immuneSignatureBySample[sampleId]
            : undefined;

        return (
            <div style={{ padding: 20 }}>
                <h2>Immune Microenvironment Signature Profile</h2>
                <div style={{ color: '#666', marginBottom: 20 }}>
                    {sampleIds.length > 1 ? (
                        <div className="btn-group" role="group">
                            {sampleIds.map(id => (
                                <button
                                    key={id}
                                    type="button"
                                    className={`btn btn-default btn-sm${
                                        id === sampleId ? ' active' : ''
                                    }`}
                                    data-test={`immune-signature-sample-${id}`}
                                    onClick={() => setSelected(id)}
                                >
                                    {sampleManager &&
                                        sampleManager.getComponentForSample(
                                            id,
                                            1,
                                            '',
                                            null,
                                            undefined,
                                            true
                                        )}{' '}
                                    {id}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <span>
                            Sample: <strong>{sampleId}</strong>
                        </span>
                    )}
                </div>
                {signature ? (
                    <div
                        style={{
                            display: 'flex',
                            gap: 20,
                            marginBottom: 30,
                            flexWrap: 'wrap',
                        }}
                    >
                        <ClassificationCard signature={signature} />
                        <ClassProbabilitiesCard signature={signature} />
                    </div>
                ) : (
                    <div
                        className="alert alert-info"
                        data-test="immune-signature-no-data"
                    >
                        No corresponding immune signature data for this sample.
                    </div>
                )}
            </div>
        );
    }
);

export default ImmuneSignatureTab;
