import _ from 'lodash';
import {
    ClinicalTrackDatum,
    ClinicalTrackSpec,
    IBaseHeatmapTrackDatum,
    IBaseHeatmapTrackSpec,
    IHeatmapTrackSpec,
} from '../../../../shared/components/oncoprint/Oncoprint';
import { makeUniqueColorGetter } from '../../../../shared/components/plots/PlotUtils';
import { MUTATION_SPECTRUM_FILLS } from '../../../../shared/cache/ClinicalDataCache';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import { AlterationTypeConstants } from '../../../resultsView/ResultsViewPageStore';

export const ONCOPRINTER_VAL_NA = 'N/A';

export type OncoprinterClinicalAndHeatmapInputLine = {
    sampleId: string;
    orderedValues: string[];
};

type TrackSpec = {
    trackName: string;
    datatype: ClinicalTrackDataType | HeatmapTrackDataType;
    countsCategories?: string[];
};

type OncoprinterClinicalTrackDatum = Pick<
    ClinicalTrackDatum,
    'attr_id' | 'uid' | 'attr_val_counts' | 'na' | 'attr_val'
> & { sample: string };

type OncoprinterHeatmapTrackDatum = Pick<
    IBaseHeatmapTrackDatum,
    'profile_data' | 'uid' | 'na'
> & { sample: string };

const ATTRIBUTE_REGEX = /^((?:[^\(\)])+)(?:\(([^\(\)]+)\))?$/;
const COUNTS_MAP_ATTRIBUTE_TYPE_REGEX = /^(?:[^\/]+\/)+[^\/]+$/;

export enum ClinicalTrackDataType {
    NUMBER = 'number',
    LOG_NUMBER = 'lognumber',
    STRING = 'string',
    COUNTS = 'counts',
}

export enum HeatmapTrackDataType {
    HEATMAP_01 = 'heatmap01',
    HEATMAP_ZSCORE = 'heatmapZscores',
    HEATMAP = 'heatmap',
}

const CLINICAL_TRACK_TYPES: { [type in ClinicalTrackDataType]: boolean } = {
    [ClinicalTrackDataType.NUMBER]: true,
    [ClinicalTrackDataType.LOG_NUMBER]: true,
    [ClinicalTrackDataType.STRING]: true,
    [ClinicalTrackDataType.COUNTS]: true,
};

const HEATMAP_TRACK_TYPES: { [type in HeatmapTrackDataType]: boolean } = {
    [HeatmapTrackDataType.HEATMAP_01]: true,
    [HeatmapTrackDataType.HEATMAP_ZSCORE]: true,
    [HeatmapTrackDataType.HEATMAP]: true,
};

function isClinicalTrackType(
    type: ClinicalTrackDataType | HeatmapTrackDataType
): type is ClinicalTrackDataType {
    return type in CLINICAL_TRACK_TYPES;
}
function isHeatmapTrackType(
    type: ClinicalTrackDataType | HeatmapTrackDataType
): type is HeatmapTrackDataType {
    return type in HEATMAP_TRACK_TYPES;
}

function getHeatmapMolecularAlterationType(datatype: HeatmapTrackDataType) {
    switch (datatype) {
        case HeatmapTrackDataType.HEATMAP_01:
            return AlterationTypeConstants.METHYLATION;
        case HeatmapTrackDataType.HEATMAP_ZSCORE:
            return AlterationTypeConstants.MRNA_EXPRESSION;
        case HeatmapTrackDataType.HEATMAP:
            return AlterationTypeConstants.GENERIC_ASSAY;
    }
}

export function parseClinicalAndHeatmapDataHeader(headerLine: string[]) {
    // we dont care about the first column, it's just "sample" or something
    headerLine.shift();

    const errorPrefix = 'Clinical data input error in line 1 (header): ';
    const ret: TrackSpec[] = [];
    const trackNamesMap: { [usedTrackName: string]: boolean } = {};
    for (const attribute of headerLine) {
        const match = attribute.match(ATTRIBUTE_REGEX);
        if (!match) {
            throw new Error(
                `${errorPrefix}misformatted attribute name ${attribute}`
            );
        }
        let datatype = match[2] || ClinicalTrackDataType.STRING;
        let countsCategories: string[] | undefined = undefined;

        // validate and normalize track data type and options
        switch (datatype) {
            case ClinicalTrackDataType.NUMBER:
            case ClinicalTrackDataType.LOG_NUMBER:
            case ClinicalTrackDataType.STRING:
            case HeatmapTrackDataType.HEATMAP_01:
            case HeatmapTrackDataType.HEATMAP_ZSCORE:
            case HeatmapTrackDataType.HEATMAP:
                break;
            default:
                if (COUNTS_MAP_ATTRIBUTE_TYPE_REGEX.test(datatype)) {
                    countsCategories = datatype.split('/');
                    datatype = ClinicalTrackDataType.COUNTS;
                } else {
                    throw new Error(
                        `${errorPrefix}invalid track data type ${datatype}`
                    );
                }
                break;
        }
        const trackName = match[1];
        if (trackName in trackNamesMap) {
            throw new Error(`${errorPrefix}duplicate track name ${trackName}`);
        }
        ret.push({
            trackName,
            datatype: datatype as ClinicalTrackDataType,
            countsCategories,
        });
        trackNamesMap[trackName] = true;
    }

    return ret;
}

export function parseClinicalAndHeatmapInput(
    input: string
):
    | {
          status: 'complete';
          result: {
              headers: TrackSpec[];
              data: OncoprinterClinicalAndHeatmapInputLine[];
          };
          error: undefined;
      }
    | { status: 'error'; result: undefined; error: string } {
    // Output mimics mobxpromise form but thats just because its a nice way to package status and result.
    // This isn't meant to be plugged into mobxpromise machinery i.e. with `await`

    const lines = input
        .trim()
        .split('\n')
        .map(line => line.trim().split(/\s+/));

    if (lines.length === 0) {
        return {
            status: 'complete',
            result: { headers: [], data: [] },
            error: undefined,
        };
    }

    try {
        // Get attribute names from first line
        const attributes = parseClinicalAndHeatmapDataHeader(lines.shift()!);

        const result = lines.map((line, lineIndex) => {
            //                                                  add 2 to line index: 1 because we removed header, 1 because changing from 0- to 1-indexing
            const errorPrefix = `Clinical data input error on line ${lineIndex +
                2}: \n${line.join('\t')}\n\n`;
            if (line.length === attributes.length + 1) {
                const ret: OncoprinterClinicalAndHeatmapInputLine = {
                    sampleId: line[0],
                    orderedValues: line.slice(1),
                };
                return ret;
            } else {
                throw new Error(
                    `${errorPrefix}data lines must have ${attributes.length +
                        1} columns, the same number as in the header.`
                );
            }
        });
        return {
            status: 'complete',
            result: {
                headers: attributes,
                data: result.filter(
                    x => !!x
                ) as OncoprinterClinicalAndHeatmapInputLine[],
            },
            error: undefined,
        };
    } catch (e) {
        return {
            status: 'error',
            result: undefined,
            error: e.message,
        };
    }
}

export function getClinicalAndHeatmapOncoprintData(
    attributes: TrackSpec[],
    parsedLines: OncoprinterClinicalAndHeatmapInputLine[]
) {
    const clinicalTracks: {
        [trackName: string]: OncoprinterClinicalTrackDatum[];
    } = {};
    const heatmapTracks: {
        [trackName: string]: OncoprinterHeatmapTrackDatum[];
    } = {};

    for (const attr of attributes) {
        if (isClinicalTrackType(attr.datatype)) {
            clinicalTracks[attr.trackName] = [];
        } else if (isHeatmapTrackType(attr.datatype)) {
            heatmapTracks[attr.trackName] = [];
        }
    }

    parsedLines.forEach((line, lineIndex) => {
        for (let i = 0; i < attributes.length; i++) {
            const rawValue = line.orderedValues[i];
            if (isHeatmapTrackType(attributes[i].datatype)) {
                heatmapTracks[attributes[i].trackName].push(
                    makeHeatmapTrackDatum(
                        rawValue,
                        line,
                        attributes[i],
                        lineIndex
                    )
                );
            } else if (isClinicalTrackType(attributes[i].datatype)) {
                clinicalTracks[attributes[i].trackName].push(
                    makeClinicalTrackDatum(
                        rawValue,
                        line,
                        attributes[i],
                        lineIndex
                    )
                );
            }
        }
    });
    return {
        clinicalTracks,
        heatmapTracks,
    };
}

function makeHeatmapTrackDatum(
    rawValue: string,
    line: OncoprinterClinicalAndHeatmapInputLine,
    attribute: TrackSpec,
    lineIndex: number
) {
    // add 2 to line index: 1 because we removed header, 1 because changing from 0- to 1-indexing
    const errorPrefix = `Heatmap data input error on line ${lineIndex +
        2}: \n\n`;

    let profile_data: any = null;
    if (rawValue !== ONCOPRINTER_VAL_NA) {
        profile_data = parseFloat(rawValue);
    }
    if (profile_data !== null && isNaN(profile_data)) {
        throw new Error(
            `${errorPrefix} input ${rawValue} is not valid for heatmap track ${attribute.trackName}`
        );
    }
    return {
        sample: line.sampleId,
        profile_data,
        uid: line.sampleId,
        na: profile_data === null,
    };
}

function makeClinicalTrackDatum(
    rawValue: string,
    line: OncoprinterClinicalAndHeatmapInputLine,
    attribute: TrackSpec,
    lineIndex: number
): OncoprinterClinicalTrackDatum {
    // add 2 to line index: 1 because we removed header, 1 because changing from 0- to 1-indexing
    const errorPrefix = `Clinical data input error on line ${lineIndex +
        2}: \n\n`;

    if (rawValue === ONCOPRINTER_VAL_NA) {
        return {
            sample: line.sampleId,
            attr_id: attribute.trackName,
            attr_val_counts: {},
            attr_val: '',
            uid: line.sampleId,
            na: true,
        };
    } else {
        let attr_val_counts, attr_val;
        switch (attribute.datatype as ClinicalTrackDataType) {
            case ClinicalTrackDataType.STRING:
                attr_val_counts = { [rawValue]: 1 };
                attr_val = rawValue;
                break;
            case ClinicalTrackDataType.NUMBER:
            case ClinicalTrackDataType.LOG_NUMBER:
                const parsed = parseFloat(rawValue);
                if (isNaN(parsed)) {
                    throw new Error(
                        `${errorPrefix} input ${rawValue} is not valid for numerical track ${attribute.trackName}`
                    );
                }
                attr_val_counts = { [parsed]: 1 };
                attr_val = parsed;
                break;
            case ClinicalTrackDataType.COUNTS:
                const parsedCounts = rawValue.split('/').map(parseFloat);
                if (
                    parsedCounts.length !== attribute.countsCategories!.length
                ) {
                    throw new Error(
                        `${errorPrefix} input ${rawValue} is not valid - must have ${
                            attribute.countsCategories!.length
                        } values to match with header, but only has ${
                            parsedCounts.length
                        }`
                    );
                }
                attr_val_counts = attribute.countsCategories!.reduce(
                    (counts, category, index) => {
                        counts[category] = parsedCounts[index];
                        return counts;
                    },
                    {} as ClinicalTrackDatum['attr_val_counts']
                );
                attr_val = attr_val_counts;
                break;
        }
        return {
            sample: line.sampleId,
            attr_id: attribute.trackName,
            attr_val_counts,
            attr_val,
            uid: line.sampleId,
            na: rawValue === ONCOPRINTER_VAL_NA,
        };
    }
}

function getNumberRange(data: OncoprinterClinicalTrackDatum[]) {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const d of data) {
        if (!isNaN(d.attr_val as number)) {
            min = Math.min(min, d.attr_val as number);
            max = Math.max(max, d.attr_val as number);
        }
    }
    return [min, max];
}

export function getClinicalTrackKey(attributeName: string) {
    return `clinicalTrack_${attributeName}`;
}

export function getHeatmapTrackKey(attributeName: string) {
    return `heatmapTrack_${attributeName}`;
}

export function getClinicalAndHeatmapTracks(
    attributes: TrackSpec[],
    parsedLines: OncoprinterClinicalAndHeatmapInputLine[],
    excludedSampleIds?: string[]
) {
    const attributeToOncoprintData = getClinicalAndHeatmapOncoprintData(
        attributes,
        parsedLines
    );
    // remove excluded sample data
    const excludedSampleIdsMap = _.keyBy(excludedSampleIds || []);
    attributeToOncoprintData.clinicalTracks = _.mapValues(
        attributeToOncoprintData.clinicalTracks,
        data => {
            return data.filter(d => !(d.sample in excludedSampleIdsMap));
        }
    );
    attributeToOncoprintData.heatmapTracks = _.mapValues(
        attributeToOncoprintData.heatmapTracks,
        data => {
            return data.filter(d => !(d.sample in excludedSampleIdsMap));
        }
    );

    const ret = {
        clinicalTracks: [] as ClinicalTrackSpec[],
        heatmapTracks: [] as IHeatmapTrackSpec[],
    };

    attributes.map(attr => {
        if (isHeatmapTrackType(attr.datatype)) {
            const data = attributeToOncoprintData.heatmapTracks[attr.trackName];

            ret.heatmapTracks.push({
                key: getHeatmapTrackKey(attr.trackName),
                label: attr.trackName,
                legendLabel: 'Heatmap',
                tooltipValueLabel: 'Value',
                molecularProfileId: 'input',
                molecularAlterationType: getHeatmapMolecularAlterationType(
                    attr.datatype
                ) as any,
                datatype: '',
                data: data.map(d =>
                    Object.assign(d, { study_id: '', patient: '' })
                ),
                trackGroupIndex: 2,
                hasColumnSpacing: false,
            });
        } else if (isClinicalTrackType(attr.datatype)) {
            const data =
                attributeToOncoprintData.clinicalTracks[attr.trackName];
            let datatype, numberRange, countsCategoryFills;
            switch (attr.datatype) {
                case ClinicalTrackDataType.STRING:
                    datatype = 'string';
                    break;
                case ClinicalTrackDataType.NUMBER:
                case ClinicalTrackDataType.LOG_NUMBER:
                    datatype = 'number';
                    numberRange = getNumberRange(data);
                    break;
                case ClinicalTrackDataType.COUNTS:
                    datatype = 'counts';
                    if (
                        attr.trackName.toLowerCase() === 'mutation_spectrum' &&
                        attr.countsCategories!.length ===
                            MUTATION_SPECTRUM_FILLS.length
                    ) {
                        countsCategoryFills = MUTATION_SPECTRUM_FILLS;
                    }
                    break;
            }
            ret.clinicalTracks.push({
                key: getClinicalTrackKey(attr.trackName),
                attributeId: attr.trackName,
                label: attr.trackName,
                data,
                datatype,
                description: '',
                numberRange,
                numberLogScale:
                    attr.datatype === ClinicalTrackDataType.LOG_NUMBER
                        ? true
                        : undefined,
                countsCategoryLabels: attr.countsCategories,
                countsCategoryFills,
            } as ClinicalTrackSpec);
        }
    });
    return ret;
}
