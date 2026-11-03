import * as React from 'react';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import SampleManager from 'pages/patientView/SampleManager';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import {
    getLoadedEmbeddingOptions,
    isAnyEmbeddingPending,
} from 'shared/components/embeddings/embeddingSources';
import {
    fitProjection,
    getEmbeddingOptionsForSamples,
    getReferenceCategoryColors,
    SampleEmbeddingOption,
} from './PatientSimilarityMapUtils';

const MAP_WIDTH = 800;
const MAP_HEIGHT = 560;
const MAP_PADDING = 16;
const POINT_RADIUS = 2.5;
const UNCOLORED_POINT_COLOR = '#bbbbbb';
const POINT_ALPHA = 0.55;
// The study view colours by this attribute by default; a map that carries it
// for its own samples can show the same picture here.
const REFERENCE_COLOR_ATTRIBUTE_ID = 'CANCER_TYPE';
// SampleLabelHTML draws a 12px icon; enlarged so it stands out on a dense map.
const SAMPLE_ICON_SIZE = 12;
const SAMPLE_ICON_SCALE = 1.5;

export interface IPatientSimilarityMapProps {
    studyId: string;
    sampleManager: SampleManager;
}

@observer
export default class PatientSimilarityMap extends React.Component<
    IPatientSimilarityMapProps,
    {}
> {
    @observable private selectedValue: string | undefined;

    constructor(props: IPatientSimilarityMapProps) {
        super(props);
        makeObservable(this);
    }

    @computed get sampleIds(): string[] {
        return this.props.sampleManager.getSampleIdsInOrder();
    }

    @computed get options(): SampleEmbeddingOption[] {
        return getEmbeddingOptionsForSamples(
            getLoadedEmbeddingOptions(),
            this.props.studyId,
            this.sampleIds
        );
    }

    @computed get selectedOption(): SampleEmbeddingOption | undefined {
        return (
            this.options.find(o => o.value === this.selectedValue) ??
            this.options[0]
        );
    }

    @computed get projection() {
        return fitProjection(
            this.selectedOption?.data.data ?? [],
            MAP_WIDTH,
            MAP_HEIGHT,
            MAP_PADDING
        );
    }

    @computed get categoryColors() {
        return getReferenceCategoryColors(
            this.selectedOption?.data.data ?? [],
            REFERENCE_COLOR_ATTRIBUTE_ID
        );
    }

    @computed get placedSamples(): {
        sampleId: string;
        left: number;
        top: number;
    }[] {
        const option = this.selectedOption;
        if (!option) {
            return [];
        }
        const byId = new Map(option.data.data.map(p => [p.sampleId, p]));
        return this.sampleIds
            .filter(id => byId.has(id))
            .map(sampleId => {
                const p = byId.get(sampleId)!;
                const [left, top] = this.projection.toScreen(p.x, p.y);
                return { sampleId, left, top };
            });
    }

    @computed get unplacedSampleIds(): string[] {
        const placed = new Set(this.placedSamples.map(s => s.sampleId));
        return this.sampleIds.filter(id => !placed.has(id));
    }

    @action.bound
    private onSelectMap(event: React.ChangeEvent<HTMLSelectElement>) {
        this.selectedValue = event.target.value;
    }

    private drawPoints = (canvas: HTMLCanvasElement | null) => {
        const option = this.selectedOption;
        if (!canvas || !option) {
            return;
        }
        const ratio = window.devicePixelRatio || 1;
        canvas.width = MAP_WIDTH * ratio;
        canvas.height = MAP_HEIGHT * ratio;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }
        ctx.scale(ratio, ratio);
        ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
        ctx.globalAlpha = POINT_ALPHA;
        const colorByCategory = new Map(
            this.categoryColors.map(c => [c.category, c.color])
        );
        for (const p of option.data.data) {
            const category = p.referenceData?.[REFERENCE_COLOR_ATTRIBUTE_ID];
            ctx.fillStyle =
                (category !== undefined &&
                    colorByCategory.get(String(category))) ||
                UNCOLORED_POINT_COLOR;
            const [x, y] = this.projection.toScreen(p.x, p.y);
            ctx.beginPath();
            ctx.arc(x, y, POINT_RADIUS, 0, 2 * Math.PI);
            ctx.fill();
        }
    };

    private renderLegend() {
        if (this.categoryColors.length === 0) {
            return null;
        }
        return (
            <div
                data-test="patient-similarity-map-legend"
                style={{ fontSize: 12, maxHeight: MAP_HEIGHT, overflowY: 'auto' }}
            >
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                    Cancer Type (reference map)
                </div>
                {this.categoryColors.map(({ category, color, count }) => (
                    <div
                        key={category}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <span
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: color,
                                opacity: POINT_ALPHA,
                                flexShrink: 0,
                            }}
                        />
                        <span>{category}</span>
                        <span style={{ color: '#999' }}>{count}</span>
                    </div>
                ))}
            </div>
        );
    }

    render() {
        const option = this.selectedOption;
        if (!option) {
            return isAnyEmbeddingPending() ? (
                <LoadingIndicator isLoading={true} size={'big'} center={true} />
            ) : (
                <div data-test="patient-similarity-map-empty">
                    None of this patient's samples are in a similarity map.
                </div>
            );
        }
        const { sampleManager } = this.props;
        return (
            <div data-test="patient-similarity-map">
                <div style={{ marginBottom: 10 }}>
                    {this.options.length > 1 ? (
                        <select
                            className="form-control input-sm"
                            style={{ width: 'auto', display: 'inline-block' }}
                            value={option.value}
                            onChange={this.onSelectMap}
                        >
                            {this.options.map(o => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <strong>{option.label}</strong>
                    )}
                    <div style={{ color: '#666', marginTop: 4 }}>
                        {option.data.description.replace(/\.?\s*$/, '.')}{' '}
                        Icons mark this patient's samples.
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                    <div
                        style={{
                            position: 'relative',
                            width: MAP_WIDTH,
                            height: MAP_HEIGHT,
                            flexShrink: 0,
                            border: '1px solid #eee',
                        }}
                    >
                        <canvas
                            key={option.value}
                            ref={this.drawPoints}
                            style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}
                        />
                        {this.placedSamples.map(({ sampleId, left, top }) => (
                            <div
                                key={sampleId}
                                data-test="patient-similarity-map-sample"
                                style={{
                                    position: 'absolute',
                                    left: left - SAMPLE_ICON_SIZE / 2,
                                    top: top - SAMPLE_ICON_SIZE / 2,
                                    lineHeight: 0,
                                    transform: `scale(${SAMPLE_ICON_SCALE})`,
                                    filter:
                                        'drop-shadow(0 0 1px white) drop-shadow(0 0 1px white)',
                                }}
                            >
                                {sampleManager.getComponentForSample(sampleId)}
                            </div>
                        ))}
                    </div>
                    {this.renderLegend()}
                </div>
                {this.unplacedSampleIds.length > 0 && (
                    <div style={{ marginTop: 8, color: '#666' }}>
                        Not in this map:{' '}
                        {this.unplacedSampleIds.map(sampleId => (
                            <span key={sampleId} style={{ marginRight: 6 }}>
                                {sampleManager.getComponentForSample(sampleId)}{' '}
                                {sampleId}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    }
}
