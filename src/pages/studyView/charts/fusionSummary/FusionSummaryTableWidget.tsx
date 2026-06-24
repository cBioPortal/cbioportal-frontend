import * as React from 'react';
import { observer } from 'mobx-react';
import { FusionCohortStore } from 'pages/patientView/fusionViewer/FusionCohortStore';
import { frameStatusStyle } from 'pages/patientView/fusionViewer/components/frameStatusStyle';
import { ComparisonAnchor } from 'pages/patientView/fusionViewer/data/comparisonRows';

export function summaryTitle(hasFusionAnnotation: boolean): string {
    return hasFusionAnnotation ? 'Top recurrent fusions' : 'Top SV gene pairs';
}

export interface FusionSummaryTableWidgetProps {
    store: FusionCohortStore;
    hasFusionAnnotation: boolean;
    onSelectAnchor: (a: ComparisonAnchor) => void;
}

const FusionSummaryTableWidget: React.FC<FusionSummaryTableWidgetProps> = observer(
    ({ store, hasFusionAnnotation, onSelectAnchor }) => {
        const summaries = store.pairSummaries.slice(0, 10);
        return (
            <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {summaryTitle(hasFusionAnnotation)}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Gene pair</th>
                            <th># samples</th>
                            {hasFusionAnnotation && <th>In-frame?</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {summaries.map(s => {
                            const style = frameStatusStyle(
                                s.anyInFrame ? 'inFrame' : 'outOfFrame'
                            );
                            return (
                                <tr
                                    key={s.key}
                                    data-testid="fusion-summary-row"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() =>
                                        onSelectAnchor({
                                            mode: 'pair',
                                            key: s.key,
                                        })
                                    }
                                >
                                    <td>{s.key}</td>
                                    <td>{s.sampleCount}</td>
                                    {hasFusionAnnotation && (
                                        <td style={{ color: style.fill }}>
                                            {style.label}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }
);

export default FusionSummaryTableWidget;
