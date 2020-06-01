import _ from 'lodash';
import {
    ClinicalTrackDatum,
    ClinicalTrackSpec,
} from '../../../../shared/components/oncoprint/Oncoprint';
import { makeUniqueColorGetter } from '../../../../shared/components/plots/PlotUtils';

export const ONCOPRINTER_CLINICAL_VAL_NA = 'N/A';

export type OncoprinterClinicalInputLine = {
    sampleId: string;
    orderedValues: string[];
};

type AttributeSpec = {
    clinicalAttributeName: string;
    datatype: ClinicalTrackDataType;
    countsCategories?: string[];
};

type OncoprinterClinicalTrackDatum = Pick<
    ClinicalTrackDatum,
    'attr_id' | 'uid' | 'attr_val_counts' | 'na' | 'attr_val'
> & { sample: string };

const ATTRIBUTE_REGEX = /^((?:[^\(\)])+)(?:\(([^\(\)]+)\))?$/;
const COUNTS_MAP_ATTRIBUTE_TYPE_REGEX = /^(?:[^\/]+\/)+[^\/]+$/;

export enum ClinicalTrackDataType {
    NUMBER = 'number',
    LOG_NUMBER = 'lognumber',
    STRING = 'string',
    COUNTS = 'counts',
}

export function parseClinicalDataHeader(headerLine: string[]) {
    // we dont care about the first column, it's just "sample" or something
    headerLine.shift();

    const errorPrefix = 'Clinical data input error in line 1 (header): ';
    const ret: AttributeSpec[] = [];
    for (const attribute of headerLine) {
        const match = attribute.match(ATTRIBUTE_REGEX);
        if (!match) {
            throw new Error(
                `${errorPrefix}misformatted attribute name ${attribute}`
            );
        }
        let datatype = match[2] || ClinicalTrackDataType.STRING;
        let countsCategories: string[] | undefined = undefined;

        if (
            datatype !== ClinicalTrackDataType.NUMBER &&
            datatype !== ClinicalTrackDataType.LOG_NUMBER &&
            datatype !== ClinicalTrackDataType.STRING
        ) {
            if (COUNTS_MAP_ATTRIBUTE_TYPE_REGEX.test(datatype)) {
                countsCategories = datatype.split('/');
                datatype = ClinicalTrackDataType.COUNTS;
            } else {
                throw new Error(
                    `${errorPrefix}invalid track data type ${datatype}`
                );
            }
        }
        ret.push({
            clinicalAttributeName: match[1],
            datatype: datatype as ClinicalTrackDataType,
            countsCategories,
        });
    }

    return ret;
}

export function parseClinicalInput(
    input: string
):
    | {
          status: 'complete';
          result: {
              headers: AttributeSpec[];
              data: OncoprinterClinicalInputLine[];
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
        const attributes = parseClinicalDataHeader(lines.shift()!);

        const result = lines.map((line, lineIndex) => {
            //                                                  add 2 to line index: 1 because we removed header, 1 because changing from 0- to 1-indexing
            const errorPrefix = `Clinical data input error on line ${lineIndex +
                2}: \n${line.join('\t')}\n\n`;
            if (line.length === attributes.length + 1) {
                const ret: OncoprinterClinicalInputLine = {
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
                data: result.filter(x => !!x) as OncoprinterClinicalInputLine[],
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

export function getClinicalOncoprintData(
    attributes: AttributeSpec[],
    parsedLines: OncoprinterClinicalInputLine[]
) {
    const ret: {
        [clinicalAttributeName: string]: OncoprinterClinicalTrackDatum[];
    } = {};
    for (const attr of attributes) {
        ret[attr.clinicalAttributeName] = [];
    }

    parsedLines.forEach((line, lineIndex) => {
        // add 2 to line index: 1 because we removed header, 1 because changing from 0- to 1-indexing
        const errorPrefix = `Clinical data input error on line ${lineIndex +
            2}: \n\n`;
        for (let i = 0; i < attributes.length; i++) {
            const rawValue = line.orderedValues[i];

            if (rawValue === ONCOPRINTER_CLINICAL_VAL_NA) {
                ret[attributes[i].clinicalAttributeName].push({
                    sample: line.sampleId,
                    attr_id: attributes[i].clinicalAttributeName,
                    attr_val_counts: {},
                    attr_val: '',
                    uid: line.sampleId,
                    na: true,
                });
            } else {
                let attr_val_counts, attr_val;
                switch (attributes[i].datatype) {
                    case ClinicalTrackDataType.STRING:
                        attr_val_counts = { [rawValue]: 1 };
                        attr_val = rawValue;
                        break;
                    case ClinicalTrackDataType.NUMBER:
                    case ClinicalTrackDataType.LOG_NUMBER:
                        const parsed = parseFloat(rawValue);
                        if (isNaN(parsed)) {
                            throw new Error(
                                `${errorPrefix} input ${rawValue} is not valid for numerical track ${attributes[i].clinicalAttributeName}`
                            );
                        }
                        attr_val_counts = { [parsed]: 1 };
                        attr_val = parsed;
                        break;
                    case ClinicalTrackDataType.COUNTS:
                        const parsedCounts = rawValue
                            .split('/')
                            .map(parseFloat);
                        if (
                            parsedCounts.length !==
                            attributes[i].countsCategories!.length
                        ) {
                            throw new Error(
                                `${errorPrefix} input ${rawValue} is not valid - must have ${
                                    attributes[i].countsCategories!.length
                                } values to match with header, but only has ${
                                    parsedCounts.length
                                }`
                            );
                        }
                        attr_val_counts = attributes[
                            i
                        ].countsCategories!.reduce(
                            (counts, category, index) => {
                                counts[category] = parsedCounts[index];
                                return counts;
                            },
                            {} as ClinicalTrackDatum['attr_val_counts']
                        );
                        attr_val = attr_val_counts;
                        break;
                }
                ret[attributes[i].clinicalAttributeName].push({
                    sample: line.sampleId,
                    attr_id: attributes[i].clinicalAttributeName,
                    attr_val_counts,
                    attr_val,
                    uid: line.sampleId,
                    na: rawValue === ONCOPRINTER_CLINICAL_VAL_NA,
                });
            }
        }
    });
    return ret;
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

export function getClinicalTracks(
    attributes: AttributeSpec[],
    parsedLines: OncoprinterClinicalInputLine[],
    excludedSampleIds?: string[]
): ClinicalTrackSpec[] {
    let attributeToOncoprintData = getClinicalOncoprintData(
        attributes,
        parsedLines
    );
    // remove excluded sample data
    const excludedSampleIdsMap = _.keyBy(excludedSampleIds || []);
    attributeToOncoprintData = _.mapValues(attributeToOncoprintData, data => {
        return data.filter(d => !(d.sample in excludedSampleIdsMap));
    });

    const colorGetter = makeUniqueColorGetter();
    return attributes.map(attr => {
        const data = attributeToOncoprintData[attr.clinicalAttributeName];
        let datatype, numberRange;
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
                break;
        }
        return {
            key: getClinicalTrackKey(attr.clinicalAttributeName),
            attributeId: attr.clinicalAttributeName,
            label: attr.clinicalAttributeName,
            data,
            datatype,
            description: '',
            numberRange,
            numberLogScale:
                attr.datatype === ClinicalTrackDataType.LOG_NUMBER
                    ? true
                    : undefined,
            countsCategoryLabels: attr.countsCategories,
            countsCategoryFills:
                attr.countsCategories &&
                attr.countsCategories.map(c => colorGetter()),
        } as ClinicalTrackSpec;
    });
}
