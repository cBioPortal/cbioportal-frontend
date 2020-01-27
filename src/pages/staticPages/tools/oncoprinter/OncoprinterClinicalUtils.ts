import _ from 'lodash';
import { fillGeneticTrackDatum } from '../../../../shared/components/oncoprint/DataUtils';
import {
    OncoprinterGeneticTrackDatum,
    OncoprinterGeneticTrackDatum_Data,
} from './OncoprinterGeneticUtils';
import { CustomTrackOption } from 'oncoprintjs';
import {
    ClinicalTrackDatum,
    ClinicalTrackSpec,
} from '../../../../shared/components/oncoprint/Oncoprint';

export const ONCOPRINTER_CLINICAL_VAL_NA = 'N/A';

export type OncoprinterClinicalInputLine = {
    sampleId: string;
    orderedValues: string[];
};

type AttributeSpec = {
    clinicalAttributeName: string;
    datatype: ClinicalTrackDataType;
};

type OncoprinterClinicalTrackDatum = Pick<
    ClinicalTrackDatum,
    'attr_id' | 'uid' | 'attr_val_counts' | 'na'
> & { sample: string; attr_val: string | number };

const ATTRIBUTE_REGEX = /^((?:[^\(\)])+)(?:\(([^\(\)]+)\))?$/;

enum ClinicalTrackDataType {
    NUMBER = 'number',
    LOG_NUMBER = 'lognumber',
    STRING = 'string',
}

function parseClinicalDataHeader(headerLine: string[]) {
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
        const datatype = (
            match[2] || ClinicalTrackDataType.STRING
        ).toLowerCase();
        if (
            datatype !== ClinicalTrackDataType.NUMBER &&
            datatype !== ClinicalTrackDataType.LOG_NUMBER &&
            datatype !== ClinicalTrackDataType.STRING
        ) {
            throw new Error(
                `${errorPrefix}invalid track data type ${datatype}`
            );
        }
        ret.push({
            clinicalAttributeName: match[1],
            datatype: datatype as ClinicalTrackDataType,
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

    for (const line of parsedLines) {
        for (let i = 0; i < attributes.length; i++) {
            const rawValue = line.orderedValues[i];
            const value =
                attributes[i].datatype === ClinicalTrackDataType.STRING
                    ? rawValue
                    : parseFloat(rawValue);
            ret[attributes[i].clinicalAttributeName].push({
                sample: line.sampleId,
                attr_id: attributes[i].clinicalAttributeName,
                attr_val_counts: { [value]: 1 },
                attr_val: value,
                uid: line.sampleId,
                na: rawValue === ONCOPRINTER_CLINICAL_VAL_NA,
            });
        }
    }
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

    return attributes.map(attr => {
        const data = attributeToOncoprintData[attr.clinicalAttributeName];
        return {
            key: getClinicalTrackKey(attr.clinicalAttributeName),
            label: attr.clinicalAttributeName,
            data,
            datatype:
                attr.datatype === ClinicalTrackDataType.STRING
                    ? 'string'
                    : 'number',
            description: '',
            numberRange:
                attr.datatype === ClinicalTrackDataType.STRING
                    ? undefined
                    : getNumberRange(data),
            numberLogScale:
                attr.datatype === ClinicalTrackDataType.LOG_NUMBER
                    ? true
                    : undefined,
        } as ClinicalTrackSpec;
    });
}
