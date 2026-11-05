import * as React from 'react';
import {
    ImmuneSignature,
    MFP_CLASSES,
    MFP_CLASS_COLORS,
    MFP_CLASS_LABELS,
} from './ImmuneSignatureUtils';

export const ImmuneSignatureClassBar: React.FC<{
    signature: ImmuneSignature;
}> = ({ signature }) => {
    return (
        <span
            data-test="immune-signature-class-bar"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
            <span
                style={{
                    display: 'inline-flex',
                    height: 14,
                    width: 120,
                    borderRadius: 7,
                    overflow: 'hidden',
                    backgroundColor: '#e0e0e0',
                }}
            >
                {MFP_CLASSES.map(cls => {
                    const pct = signature.classScores[cls] * 100;
                    if (pct === 0) return null;
                    return (
                        <span
                            key={cls}
                            title={`${MFP_CLASS_LABELS[cls]}: ${pct.toFixed(
                                1
                            )}%`}
                            style={{
                                width: `${pct}%`,
                                height: '100%',
                                backgroundColor: MFP_CLASS_COLORS[cls],
                            }}
                        />
                    );
                })}
            </span>
            <span title={MFP_CLASS_LABELS[signature.knnClass]}>
                {signature.knnClass}
            </span>
        </span>
    );
};

export default ImmuneSignatureClassBar;
