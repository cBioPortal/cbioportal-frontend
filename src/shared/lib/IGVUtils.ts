import * as _ from 'lodash';
import { CopyNumberSeg } from 'shared/api/generated/CBioPortalAPI';
import { TrackProps } from 'shared/components/igv/IntegrativeGenomicsViewer';

export const WHOLE_GENOME = 'all';

export type SegmentTrackFeatures = {
    chr: string;
    start: number;
    end: number;
    value: number;
    sample: string;
    patient: string;
    study: string;
    numberOfProbes: number;
    sampleKey: string;
};

export function defaultSegmentTrackProps() {
    return {
        name: 'CNA',
        type: 'seg',
        displayMode: 'FILL',
        features: [],
    };
}

export function keyTracksByName(tracks?: TrackProps) {
    return _.keyBy(tracks || [], 'name');
}

export function getModifiedTrackNames(currentTracks: TrackProps[], nextTracks: TrackProps[]) {
    const currentByName = keyTracksByName(currentTracks);
    const nextByName = keyTracksByName(nextTracks);

    const tracksToUpdate = nextTracks
        .filter(track => !_.isEqual(nextByName[track.name], currentByName[track.name]))
        .map(track => track.name);

    const tracksToRemove = _.difference(
        currentTracks.map(track => track.name),
        nextTracks.map(track => track.name)
    );

    return [...tracksToUpdate, ...tracksToRemove];
}

export function generateSegmentFileContent(segments: CopyNumberSeg[]): string {
    const header = ['ID', 'chrom', 'loc.start', 'loc.end', 'num.mark', 'seg.mean'];

    const rows = segments.map(segment => [
        segment.sampleId,
        segment.chromosome,
        segment.start,
        segment.end,
        segment.numberOfProbes,
        segment.segmentMean,
    ]);

    // combine header and data rows, join row data with tabs, and then join rows with new lines
    return [header, ...rows].map(row => row.join('\t')).join('\n');
}

export function generateSegmentFeatures(segments: CopyNumberSeg[]): SegmentTrackFeatures[] {
    return segments.map(segment => ({
        chr: normalizeChromosome(segment.chromosome),
        start: segment.start,
        end: segment.end,
        value: segment.segmentMean,
        sample: segment.sampleId,
        patient: segment.patientId,
        study: segment.studyId,
        numberOfProbes: segment.numberOfProbes,
        sampleKey: segment.uniqueSampleKey,
    }));
}

export function normalizeChromosome(chromosome: string) {
    switch (chromosome) {
        case '23': {
            return 'X';
        }
        case '24': {
            return 'Y';
        }
        default: {
            return chromosome;
        }
    }
}

export function calcSegmentTrackHeight(
    features: SegmentTrackFeatures[],
    maxHeight: number = 600,
    minHeight: number = 25,
    rowHeight: number = 10
) {
    return Math.max(
        Math.min(maxHeight, _.uniq(features.map(f => f.sampleKey)).length * rowHeight),
        minHeight
    );
}
