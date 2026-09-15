import { TimelineEvent } from 'cbioportal-clinical-timeline';
import { ISampleMetaDeta } from 'pages/patientView/timeline/TimelineWrapper';
import { ClinicalEvent } from 'cbioportal-ts-api-client';

const DEFAULT_LABEL = '-';

type CachedEventAttributeMapEntry = {
    attributeMap: Record<string, string>;
    orderedSnapshot: string;
};

const eventAttributeMapCache = new WeakMap<
    NonNullable<ClinicalEvent['attributes']>,
    CachedEventAttributeMapEntry
>();

function getEventAttributeMap(
    attributes: ClinicalEvent['attributes']
): Record<string, string> {
    if (!attributes?.length) {
        return {};
    }

    const entries = new Array<string>(attributes.length);
    for (let index = 0; index < attributes.length; index += 1) {
        const attribute = attributes[index];
        entries[index] = `${attribute.key}:${attribute.value}`;
    }
    const orderedSnapshot = entries.join('|');

    const cached = eventAttributeMapCache.get(attributes);

    if (cached && cached.orderedSnapshot === orderedSnapshot) {
        return cached.attributeMap;
    }

    const attributeMap: Record<string, string> = {};
    for (let index = 0; index < attributes.length; index += 1) {
        const attribute = attributes[index];
        attributeMap[attribute.key] = attribute.value;
    }

    eventAttributeMapCache.set(attributes, {
        attributeMap,
        orderedSnapshot,
    });

    return attributeMap;
}

export function getSampleInfo(
    event: TimelineEvent,
    caseMetaData: ISampleMetaDeta
) {
    const sampleId =
        getEventAttributeMap(event.event.attributes)['SAMPLE_ID'];
    if (sampleId) {
        const color = caseMetaData.color[sampleId] || '#333333';
        const label = caseMetaData.label[sampleId] || DEFAULT_LABEL;

        return { color, label };
    }

    return null;
}

export function getNumberRangeLabel(sortedNumbers: number[]) {
    if (!sortedNumbers.length) {
        return DEFAULT_LABEL;
    }

    const labels: string[] = [];
    let rangeStart = sortedNumbers[0];
    let rangeEnd = sortedNumbers[0];
    for (let index = 1; index < sortedNumbers.length; index += 1) {
        const num = sortedNumbers[index];
        if (num === rangeEnd + 1) {
            // if this number is at the end of the current running range,
            //  then extend the range
            rangeEnd = num;
        } else {
            // otherwise, flush the current running range, and start a new range
            labels.push(
                rangeStart !== rangeEnd
                    ? `${rangeStart}-${rangeEnd}`
                    : rangeStart.toString()
            );
            rangeStart = num;
            rangeEnd = num;
        }
    }
    // finally, flush the last trailing range
    labels.push(
        rangeStart !== rangeEnd
            ? `${rangeStart}-${rangeEnd}`
            : rangeStart.toString()
    );

    return labels.join(', ');
}

export function getSortedSampleInfo(colors: string[], labels: string[]) {
    const pairs: Array<{ color: string; label: number }> = [];
    // filter out NaN and pair with colors
    for (let i = 0; i < labels.length; i++) {
        const num = parseInt(labels[i]);
        if (!isNaN(num)) {
            pairs.push({
                label: num,
                color: colors[i],
            });
        }
    }

    // sort by label
    pairs.sort((left, right) => left.label - right.label);
    return pairs;
}

export function getEventColor(
    event: TimelineEvent,
    statusAttributes: string[],
    colorMappings: { re: RegExp; color: string }[]
) {
    const attributeMap = getEventAttributeMap(event.event.attributes);
    let status: string | undefined;

    for (const attribute of statusAttributes) {
        const value = attributeMap[attribute];
        if (value !== undefined) {
            status = value;
            break;
        }
    }

    let color = '#ffffff';
    if (status !== undefined) {
        const resolvedStatus = status;
        for (let index = 0; index < colorMappings.length; index += 1) {
            const colorConfig = colorMappings[index];
            if (colorConfig.re.test(resolvedStatus)) {
                color = colorConfig.color;
                break;
            }
        }
    }
    return color;
}
