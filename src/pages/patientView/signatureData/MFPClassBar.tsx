import * as React from 'react';

const signatureData = require('../../../../signature_data/signature_data.json');

const SAMPLE_ID = 'P-0752735-T05-TG2';

const MFP_CLASS_COLORS: Record<string, string> = {
    D: '#c8b631',
    F: '#c4375b',
    IE: '#3b4fb8',
    'IE/F': '#2a9d8f',
};

export const MFPClassBar: React.FC = () => {
    const sample = signatureData.samples[SAMPLE_ID];
    const scores = sample.knn_class_scores;
    const classes = Object.keys(scores);

    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 14,
                width: 120,
                borderRadius: 7,
                overflow: 'hidden',
                backgroundColor: '#e0e0e0',
            }}
        >
            {classes.map((cls: string) => {
                const pct = (scores[cls] as number) * 100;
                if (pct === 0) return null;
                return (
                    <div
                        key={cls}
                        title={`${cls}: ${pct.toFixed(1)}%`}
                        style={{
                            width: `${pct}%`,
                            height: '100%',
                            backgroundColor: MFP_CLASS_COLORS[cls] || '#999',
                        }}
                    />
                );
            })}
        </div>
    );
};

export default MFPClassBar;
