import * as React from 'react';
import { computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import SampleManager from 'pages/patientView/SampleManager';
import { Sample, SampleIdentifier } from 'cbioportal-ts-api-client';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import {
    EmbeddingData,
    EmbeddingDataOption,
    EmbeddingPoint,
    SampleEmbeddingData,
} from 'shared/components/embeddings/EmbeddingTypes';
import { calculateDataBounds } from 'shared/components/embeddings/utils/dataUtils';
import {
    getLoadedEmbeddingOptions,
    isAnyEmbeddingPending,
} from 'shared/components/embeddings/embeddingSources';
import { MapColoringContext } from './MapColoringContext';
import { EmbeddingsTab } from 'pages/studyView/tabs/EmbeddingsTab';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import {
    getEmbeddingOptionsForSamples,
    getStudyViewMapHandoff,
    openStudyViewMapWithSelection,
    SampleEmbeddingOption,
    SampleEmbeddingPoint,
} from './PatientSimilarityMapUtils';

// SampleLabelHTML draws a 12px icon; enlarged so it stands out on a dense map.
const SAMPLE_ICON_SIZE = 12;
const SAMPLE_ICON_SCALE = 1.5;
const SAMPLE_ICON_MAX_SCALE = 6;

export interface IPatientSimilarityMapProps {
    studyId: string;
    patientViewPageStore: PatientViewPageStore;
    sampleManager: SampleManager;
    hasEmbeddingsFeatureFlag: boolean;
}

/**
 * This patient's place in a similarity map.
 *
 * The map, its colouring, its legend and its selections are the study view's
 * Similarity Maps tab, rendered here over the studies the map covers. What
 * this page adds is its own: marks on the patient's samples, and a link that
 * opens a selection in the study view.
 */
@observer
export default class PatientSimilarityMap extends React.Component<
    IPatientSimilarityMapProps,
    {}
> {
    constructor(props: IPatientSimilarityMapProps) {
        super(props);
        makeObservable(this);
    }

    @computed get sampleIds(): string[] {
        return this.props.sampleManager.getSampleIdsInOrder();
    }

    @computed get embeddingScope() {
        return {
            studyIds: [this.props.studyId],
            hasFeatureFlag: this.props.hasEmbeddingsFeatureFlag,
        };
    }

    @computed get options(): SampleEmbeddingOption[] {
        return getEmbeddingOptionsForSamples(
            getLoadedEmbeddingOptions(this.embeddingScope),
            this.props.studyId,
            this.sampleIds
        );
    }

    @computed get selectedOption(): SampleEmbeddingOption | undefined {
        return this.options[0];
    }

    // Sample-level only: a point is a sample, and a patient attribute would
    // colour every sample of a patient alike without saying so.
    private readonly coloring = new MapColoringContext(
        this.props.patientViewPageStore,
        () => this.selectedOption?.data.studyIds ?? []
    );

    @computed get mapStudyIds(): string[] {
        return this.selectedOption?.data.studyIds ?? [this.props.studyId];
    }

    @computed get unplacedSampleIds(): string[] {
        const option = this.selectedOption;
        if (!option) {
            return this.sampleIds;
        }
        const inMap = new Set(option.data.data.map(p => p.sampleId));
        return this.sampleIds.filter(id => !inMap.has(id));
    }

    /**
     * The tab's own selection, opened in the study view.
     *
     * The study view is where filtering, colouring and comparison live; this
     * page hands off rather than reimplementing them. Without a selection the
     * link carries this patient's samples, so the map opens on them.
     */
    private renderStudyViewLink = (
        selectedSamples: Sample[],
        embedding: EmbeddingDataOption | null
    ) => {
        const studyIds = embedding?.data.studyIds ?? this.mapStudyIds;
        const identifiers: SampleIdentifier[] =
            selectedSamples.length > 0
                ? selectedSamples.map(
                      s =>
                          ({
                              sampleId: s.sampleId,
                              studyId: s.studyId,
                          } as SampleIdentifier)
                  )
                : this.sampleIds.map(
                      sampleId =>
                          ({
                              sampleId,
                              studyId: this.props.studyId,
                          } as SampleIdentifier)
                  );
        const { href, needsHandoff } = getStudyViewMapHandoff(
            studyIds,
            identifiers,
            embedding?.value
        );
        return (
            <a
                data-test="patient-similarity-map-study-view-link"
                href={href}
                // A selection past what a URL holds travels on the window the
                // click opens, so the link stays copyable for smaller ones.
                onClick={
                    needsHandoff
                        ? e => {
                              e.preventDefault();
                              openStudyViewMapWithSelection(href, identifiers);
                          }
                        : undefined
                }
                style={{ whiteSpace: 'nowrap' }}
            >
                {selectedSamples.length > 0
                    ? `Open ${selectedSamples.length.toLocaleString()} selected in study view`
                    : 'Open in study view'}
            </a>
        );
    };

    private patientMapPoints(embedding?: EmbeddingData): SampleEmbeddingPoint[] {
        return (
            (embedding && embedding.embedding_type === 'samples'
                ? (embedding as SampleEmbeddingData).data
                : this.selectedOption?.data.data) ?? []
        );
    }

    private patientPointsIn(embedding?: EmbeddingData): SampleEmbeddingPoint[] {
        const wanted = new Set(this.sampleIds);
        return this.patientMapPoints(embedding).filter(p =>
            wanted.has(p.sampleId)
        );
    }

    /**
     * How large to draw this patient's marks.
     *
     * The plot sizes its points in data units, so they grow as the map is
     * zoomed into and a fixed mark shrinks against them. Projecting a unit
     * step gives the pixels per data unit without the panel having to report
     * its zoom; comparing that against the zoom which frames the whole map
     * says how far in the viewer is.
     */
    private sampleIconScale(
        project: (x: number, y: number) => { x: number; y: number },
        embedding?: EmbeddingData
    ): number {
        const points = this.patientMapPoints(embedding);
        if (points.length === 0) {
            return SAMPLE_ICON_SCALE;
        }
        const pixelsPerUnit =
            project(1, 0).x - project(0, 0).x ||
            Math.pow(2, calculateDataBounds(points as EmbeddingPoint[]).zoom);
        const fitted = Math.pow(
            2,
            calculateDataBounds(points as EmbeddingPoint[]).zoom
        );
        return Math.min(
            SAMPLE_ICON_MAX_SCALE,
            Math.max(
                SAMPLE_ICON_SCALE,
                (SAMPLE_ICON_SCALE * Math.abs(pixelsPerUnit)) / fitted
            )
        );
    }

    private renderSampleIcons = (
        project: (x: number, y: number) => { x: number; y: number },
        embedding?: EmbeddingData
    ) => {
        const { sampleManager } = this.props;
        // Each panel can show a different map, and this patient's samples sit
        // somewhere different in each, so the marks follow the panel's own.
        const points = this.patientPointsIn(embedding);
        if (points.length === 0) {
            return null;
        }
        const scale = this.sampleIconScale(project, embedding);
        return points.map(point => {
            const { x: left, y: top } = project(point.x, point.y);
            return (
                <div
                    key={point.sampleId}
                    data-test="patient-similarity-map-sample"
                    style={{
                        position: 'absolute',
                        left: left - SAMPLE_ICON_SIZE / 2,
                        top: top - SAMPLE_ICON_SIZE / 2,
                        lineHeight: 0,
                        transform: `scale(${scale})`,
                        filter:
                            'drop-shadow(0 0 1px white) drop-shadow(0 0 1px white)',
                    }}
                >
                    {sampleManager.getComponentForSample(point.sampleId)}
                </div>
            );
        });
    };

    render() {
        if (!this.selectedOption) {
            return isAnyEmbeddingPending(this.embeddingScope) ? (
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
                <EmbeddingsTab
                    store={this.coloring}
                    renderOverlay={this.renderSampleIcons}
                    renderSelectionActions={this.renderStudyViewLink}
                />
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
