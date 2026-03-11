import _ from 'lodash';
import { CopyNumberSeg, Mutation } from 'cbioportal-ts-api-client';
import { normalizeChromosome } from 'cbioportal-utils';
import { TrackProps } from 'shared/components/igv/IntegrativeGenomicsViewer';
import { getColorForProteinImpactType } from 'shared/lib/MutationUtils';
import {
    getASCNCallSegmentColor,
    getASCNCopyNumberCall,
} from 'shared/lib/ASCNUtils';

export const WHOLE_GENOME = 'all';
export const CNA_TRACK_NAME = 'CNA';
export const MUTATION_TRACK_NAME = 'MUT';
export const SEQUENCE_TRACK_NAME = 'Sequence';
export const SEGMENT_TRACK_TYPE = 'seg';
export const MUTATION_TRACK_TYPE = 'mut';
export const RULER_TRACK_FULL_HEIGHT = 40;

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
    // Optional ASCN fields — populated when the study has allele-specific CN data
    wgd?: string;
    totalCopyNumber?: number;
    minorCopyNumber?: number;
    ascnCall?: string;
};

export type MutationTrackFeatures = {
    chr: string;
    start: number;
    end: number;
    sample: string;
    proteinChange: string;
    mutationType: string;
    sampleKey: string;
};

export function defaultGrch37ReferenceProps() {
    return {
        id: 'hg19',
        name: 'Human (CRCh37/hg19)',
        fastaURL:
            'https://s3.amazonaws.com/igv.broadinstitute.org/genomes/seq/hg19/hg19.fasta',
        indexURL:
            'https://s3.amazonaws.com/igv.broadinstitute.org/genomes/seq/hg19/hg19.fasta.fai',
        cytobandURL:
            'https://s3.amazonaws.com/igv.broadinstitute.org/genomes/seq/hg19/cytoBand.txt',
    };
}

export function defaultGrch38ReferenceProps() {
    return {
        id: 'hg38',
        name: 'Human (GRCh38/hg38)',
        fastaURL:
            'https://s3.amazonaws.com/igv.broadinstitute.org/genomes/seq/hg38/hg38.fa',
        indexURL:
            'https://s3.amazonaws.com/igv.broadinstitute.org/genomes/seq/hg38/hg38.fa.fai',
        cytobandURL:
            'https://s3.amazonaws.com/igv.broadinstitute.org/annotations/',
    };
}

export function defaultSegmentTrackProps() {
    return {
        name: CNA_TRACK_NAME,
        type: SEGMENT_TRACK_TYPE,
        displayMode: 'FILL',
        features: [],
    };
}

export function defaultMutationTrackProps() {
    return {
        name: MUTATION_TRACK_NAME,
        type: MUTATION_TRACK_TYPE,
        color: (m: Mutation) => getColorForProteinImpactType([m]),
        features: [],
    };
}

export function keyTracksByName(tracks?: TrackProps) {
    return _.keyBy(tracks || [], 'name');
}

export function getModifiedTrackNames(
    currentTracks: TrackProps[],
    nextTracks: TrackProps[]
) {
    const currentByName = keyTracksByName(currentTracks);
    const nextByName = keyTracksByName(nextTracks);

    const tracksToUpdate = nextTracks
        .filter(
            track =>
                !_.isEqual(
                    trackPropsWithoutFunctions(nextByName[track.name]),
                    trackPropsWithoutFunctions(currentByName[track.name])
                )
        )
        .map(track => track.name);

    const tracksToRemove = _.difference(
        currentTracks.map(track => track.name),
        nextTracks.map(track => track.name)
    );

    return [...tracksToUpdate, ...tracksToRemove];
}

export function trackPropsWithoutFunctions(track: TrackProps) {
    // first get rid of own functions
    const trackWithoutFunctions = _.omit(track, _.functions(track));

    // then get rid of feature functions
    if (trackWithoutFunctions.features) {
        trackWithoutFunctions.features = featuresWithoutFunctions(
            trackWithoutFunctions.features
        );
    }

    return trackWithoutFunctions;
}

export function featuresWithoutFunctions(features: any) {
    return features.map((feature: any) =>
        _.omit(feature, _.functions(feature))
    );
}

export function generateSegmentFileContent(segments: CopyNumberSeg[]): string {
    const header = [
        'ID',
        'chrom',
        'loc.start',
        'loc.end',
        'num.mark',
        'seg.mean',
    ];

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

export function generateSegmentFeatures(
    segments: CopyNumberSeg[],
    wgdBySampleId?: { [sampleId: string]: string }
): SegmentTrackFeatures[] {
    return segments.map(segment => {
        // Attempt to read ASCN integer copy numbers that FACETS studies may
        // include as extra runtime fields even though the TypeScript type
        // doesn't declare them.
        const seg = segment as any;
        const totalCopyNumber: number | undefined = seg.totalCopyNumber;
        const minorCopyNumber: number | undefined = seg.minorCopyNumber;
        const wgd: string | undefined = wgdBySampleId
            ? wgdBySampleId[segment.sampleId]
            : undefined;

        let ascnCall: string | undefined;
        if (
            wgd !== undefined &&
            totalCopyNumber !== undefined &&
            minorCopyNumber !== undefined
        ) {
            ascnCall = getASCNCopyNumberCall(
                wgd,
                String(totalCopyNumber),
                String(minorCopyNumber)
            );
        }

        return {
            chr: normalizeChromosome(segment.chromosome),
            start: segment.start,
            end: segment.end,
            value: segment.segmentMean,
            sample: segment.sampleId,
            patient: segment.patientId,
            study: segment.studyId,
            numberOfProbes: segment.numberOfProbes,
            sampleKey: segment.sampleId,
            wgd,
            totalCopyNumber,
            minorCopyNumber,
            ascnCall,
            popupData: () =>
                segmentPopupData(
                    segment,
                    wgd,
                    totalCopyNumber,
                    minorCopyNumber,
                    ascnCall
                ),
        };
    });
}

export function generateMutationFeatures(
    mutations: Mutation[]
): MutationTrackFeatures[] {
    return mutations.map(mutation => ({
        value: mutation.mutationType,
        sampleKey: mutation.sampleId,
        sample: mutation.sampleId,
        start: mutation.startPosition - 1,
        end: mutation.endPosition,
        chr: normalizeChromosome(mutation.chr),
        proteinChange: mutation.proteinChange,
        mutationType: mutation.mutationType,
        popupData: () => mutationPopupData(mutation),
    }));
}

export function calcIgvTrackHeight(
    features: { sampleKey: string }[],
    maxHeight: number = 600,
    minHeight: number = 25,
    rowHeight: number = 10
) {
    return Math.max(
        Math.min(
            maxHeight,
            _.uniq(features.map(f => f.sampleKey)).length * rowHeight
        ),
        minHeight
    );
}

export function mutationPopupData(mutation: Mutation) {
    return [
        { name: 'Sample', value: mutation.sampleId },
        { name: 'Gene', value: mutation.gene.hugoGeneSymbol },
        { name: 'Protein Change', value: mutation.proteinChange },
        {
            name: 'Location',
            value: getLocation({
                chromosome: mutation.chr,
                start: mutation.startPosition,
                end: mutation.endPosition,
            }),
        },
    ];
}

export function segmentPopupData(
    segment: CopyNumberSeg,
    wgd?: string,
    totalCopyNumber?: number,
    minorCopyNumber?: number,
    ascnCall?: string
) {
    const rows: { name: string; value: string | number }[] = [
        { name: 'Sample', value: segment.sampleId },
        { name: 'Mean CN log2 value', value: segment.segmentMean },
        { name: 'Location', value: getLocation(segment) },
    ];
    if (wgd !== undefined) {
        rows.push({ name: 'WGD', value: wgd });
    }
    if (totalCopyNumber !== undefined) {
        rows.push({ name: 'Total Copy Number', value: totalCopyNumber });
    }
    if (minorCopyNumber !== undefined) {
        rows.push({ name: 'Minor Copy Number', value: minorCopyNumber });
    }
    if (ascnCall !== undefined) {
        rows.push({ name: 'ASCN Call', value: ascnCall });
    }
    return rows;
}

function getLocation(feature: {
    chromosome: string;
    start: number;
    end: number;
}): string {
    return `chr${normalizeChromosome(
        feature.chromosome
    )}:${numberWithSeparators(feature.start)}-${numberWithSeparators(
        feature.end
    )}`;
}

function numberWithSeparators(value: number): string {
    return value.toLocaleString(undefined, {
        useGrouping: true,
    });
}
