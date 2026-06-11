import * as React from 'react';
import { observer } from 'mobx-react';
import { FusionCohortStore, MATRIX_MAX_PAIRS } from './FusionCohortStore';
import { frameStatusStyle } from './components/frameStatusStyle';
import { sampleFusionViewerHref } from './data/cohortLinks';
import { DEMO_COHORT_STUDY_ID } from './data/demoCohortSample';

interface IFusionCohortMatrixProps {
    store: FusionCohortStore;
    studyId?: string;
}

const CELL = 18;
const GAP = 2;
const ROW_LABEL_W = 130;
const COL_LABEL_H = 90;

@observer
export class FusionCohortMatrix extends React.Component<
    IFusionCohortMatrixProps
> {
    render() {
        const { store } = this.props;
        const studyId = this.props.studyId || DEMO_COHORT_STUDY_ID;
        const pairs = store.matrixPairs;
        const samples = store.sampleRows;

        if (pairs.length === 0 || samples.length === 0) {
            return (
                <div style={{ color: '#999', fontSize: 13, padding: 8 }}>
                    No fusions match the current filters.
                </div>
            );
        }

        const width = ROW_LABEL_W + samples.length * (CELL + GAP) + 8;
        const height = COL_LABEL_H + pairs.length * (CELL + GAP) + 8;

        return (
            <div>
                {store.matrixIsCapped && (
                    <div
                        style={{ fontSize: 12, color: '#666', marginBottom: 4 }}
                    >
                        Matrix showing top {MATRIX_MAX_PAIRS} of{' '}
                        {store.pairSummaries.length} pairs.
                    </div>
                )}
                <svg width={width} height={height}>
                    {samples.map((s, ci) => {
                        const x = ROW_LABEL_W + ci * (CELL + GAP) + CELL / 2;
                        return (
                            <a
                                key={s.sampleId}
                                href={sampleFusionViewerHref(
                                    studyId,
                                    s.sampleId
                                )}
                                data-test={`sample-link-${s.sampleId}`}
                            >
                                <text
                                    x={x}
                                    y={COL_LABEL_H - 6}
                                    fontSize={10}
                                    fill="#1971c2"
                                    transform={`rotate(-60 ${x} ${COL_LABEL_H -
                                        6})`}
                                    textAnchor="start"
                                >
                                    {s.sampleId}
                                </text>
                            </a>
                        );
                    })}

                    {pairs.map((p, ri) => {
                        const y = COL_LABEL_H + ri * (CELL + GAP);
                        return (
                            <g key={p.key}>
                                <text
                                    x={ROW_LABEL_W - 6}
                                    y={y + CELL - 4}
                                    fontSize={11}
                                    textAnchor="end"
                                    fill="#333"
                                >
                                    {p.key}
                                </text>
                                {samples.map((s, ci) => {
                                    const x = ROW_LABEL_W + ci * (CELL + GAP);
                                    const status = s.pairFrameStatus[p.key];
                                    const present = status !== undefined;
                                    const style = present
                                        ? frameStatusStyle(status)
                                        : null;
                                    const fill =
                                        present && style && !style.hollow
                                            ? style.fill
                                            : present
                                            ? '#fff'
                                            : '#f1f3f5';
                                    return (
                                        <rect
                                            key={s.sampleId}
                                            data-test={`cell-${p.key}-${s.sampleId}`}
                                            data-present={String(present)}
                                            x={x}
                                            y={y}
                                            width={CELL}
                                            height={CELL}
                                            rx={2}
                                            fill={fill}
                                            stroke={
                                                present ? '#868e96' : '#dee2e6'
                                            }
                                            strokeWidth={1}
                                        >
                                            <title>
                                                {`${s.sampleId} · ${p.key}${
                                                    present
                                                        ? ` · ${
                                                              frameStatusStyle(
                                                                  status
                                                              ).label
                                                          }`
                                                        : ' · absent'
                                                }`}
                                            </title>
                                        </rect>
                                    );
                                })}
                            </g>
                        );
                    })}
                </svg>
            </div>
        );
    }
}

export default FusionCohortMatrix;
