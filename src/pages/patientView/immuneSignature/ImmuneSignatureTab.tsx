import * as React from 'react';
import { observer } from 'mobx-react';
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

const labelCellStyle: React.CSSProperties = {
    paddingRight: 16,
    color: '#666',
};

const ProbabilityBar: React.FC<{ cls: string; probability: number }> = ({
    cls,
    probability,
}) => (
    <div
        data-test={`immune-signature-probability-bar-${cls}`}
        style={{
            width: 120,
            height: 10,
            borderRadius: 2,
            backgroundColor: '#e9ecef',
            overflow: 'hidden',
        }}
    >
        <div
            style={{
                width: `${Math.min(Math.max(probability, 0), 1) * 100}%`,
                height: '100%',
                backgroundColor: MFP_CLASS_COLORS[cls],
            }}
        />
    </div>
);

const ClassificationCard: React.FC<{ signature: ImmuneSignature }> = ({
    signature,
}) => (
    <div data-test="immune-signature-classification">
        <table style={{ fontSize: 14, lineHeight: '1.8' }}>
            <tbody>
                {MFP_CLASSES.map(cls => (
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
                        <td style={{ paddingLeft: 16 }}>
                            <ProbabilityBar
                                cls={cls}
                                probability={signature.classScores[cls]}
                            />
                        </td>
                    </tr>
                ))}
                <tr>
                    <td style={labelCellStyle}>Immune Signature Confidence</td>
                    <td style={{ fontWeight: 'bold' }}>
                        {signature.knnConfidence || 'NA'}
                    </td>
                </tr>
            </tbody>
        </table>
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
                <h3>Immune Microenvironment Signature Profile</h3>
                <div style={{ color: '#666', marginBottom: 20 }}>
                    {sampleIds.length > 1 ? (
                        <span>
                            Sample:
                            {sampleIds.map(id => (
                                <a
                                    key={id}
                                    role="button"
                                    data-test={`immune-signature-sample-${id}`}
                                    onClick={() => setSelected(id)}
                                    style={{
                                        marginLeft: 12,
                                        cursor: 'pointer',
                                        textDecoration: 'none',
                                        color:
                                            id === sampleId ? '#333' : '#999',
                                        fontWeight:
                                            id === sampleId ? 'bold' : 'normal',
                                    }}
                                >
                                    {sampleManager &&
                                        sampleManager.getComponentForSample(
                                            id,
                                            id === sampleId ? 1 : 0.5,
                                            '',
                                            null,
                                            undefined,
                                            true
                                        )}{' '}
                                    {id}
                                </a>
                            ))}
                        </span>
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
