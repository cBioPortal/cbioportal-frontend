import * as React from 'react';
import { observer } from 'mobx-react';
import { signatureSampleStore } from './SignatureSampleStore';

const MFP_CLASS_COLORS: Record<string, string> = {
    D: '#c8b631',
    F: '#c4375b',
    IE: '#3b4fb8',
    'IE/F': '#2a9d8f',
};

export const MFPClassBar: React.FC = observer(() => {
    const store = signatureSampleStore;
    const sample = store.sample;
    const scores = sample.knn_class_scores;
    const classes = Object.keys(scores);

    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                store.next();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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
                                backgroundColor:
                                    MFP_CLASS_COLORS[cls] || '#999',
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
});

export default MFPClassBar;
