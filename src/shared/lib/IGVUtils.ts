import {CopyNumberSeg} from "shared/api/generated/CBioPortalAPI";
import * as _ from "lodash";

export const WHOLE_GENOME = "all";

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

export function defaultSegmentTrackProps()
{
    return {
        name: "CNA",
        type: "seg",
        displayMode: "FILL",
        features: []
    };
}

export function generateSegmentFileContent(segments: CopyNumberSeg[]): string
{
    const header = ["ID", "chrom", "loc.start", "loc.end", "num.mark", "seg.mean"];

    const rows = segments.map(segment =>
        [segment.sampleId, segment.chromosome, segment.start, segment.end, segment.numberOfProbes, segment.segmentMean]);

    // combine header and data rows, join row data with tabs, and then join rows with new lines
    return [header, ...rows].map(row => row.join("\t")).join("\n");
}

export function generateSegmentFeatures(segments: CopyNumberSeg[]): SegmentTrackFeatures[] {
    return (segments).map(segment => ({
        chr: normalizeChromosome(segment.chromosome),
        start: segment.start,
        end: segment.end,
        value: segment.segmentMean,
        sample: segment.sampleId,
        patient: segment.patientId,
        study: segment.studyId,
        numberOfProbes: segment.numberOfProbes,
        sampleKey: segment.uniqueSampleKey
    }));
}

export function normalizeChromosome(chromosome: string)
{
    switch (chromosome)
    {
        case "23": {
            return "X";
        }
        case "24": {
            return "Y";
        }
        default: {
            return chromosome;
        }
    }
}

export function calcSegmentTrackHeight(features: SegmentTrackFeatures[],
                                       maxHeight: number = 600,
                                       minHeight: number = 25,
                                       rowHeight: number = 10)
{
    return Math.max(Math.min(maxHeight, _.uniq(features.map(f => f.sampleKey)).length * rowHeight), minHeight);
}
