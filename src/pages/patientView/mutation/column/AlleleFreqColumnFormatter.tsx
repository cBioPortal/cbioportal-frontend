import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import 'rc-tooltip/assets/bootstrap_white.css';
import { Mutation } from 'cbioportal-ts-api-client';
import SampleManager from '../../SampleManager';
import { isUncalled } from 'shared/lib/MutationUtils';
import { getFormattedFrequencyValue } from 'shared/components/mutationTable/column/TumorAlleleFreqColumnFormatter';

export type AlleleFreqSource = 'tumor' | 'normal';

type ReadCounts = {
    tumorAltCount: number;
    tumorRefCount: number;
    normalAltCount?: number;
    normalRefCount?: number;
};

export function getReadCounts(
    mutation: ReadCounts,
    source: AlleleFreqSource
): { altReads: number; refReads: number } | null {
    const altReads =
        source === 'normal' ? mutation.normalAltCount : mutation.tumorAltCount;
    const refReads =
        source === 'normal' ? mutation.normalRefCount : mutation.tumorRefCount;
    if (
        altReads === undefined ||
        altReads === null ||
        refReads === undefined ||
        refReads === null ||
        altReads < 0 ||
        refReads < 0
    ) {
        return null;
    }
    return { altReads, refReads };
}

export default class AlleleFreqColumnFormatter {
    static barWidth = 6;
    static barSpacing = 3;
    static maxBarHeight = 12;
    // keeps a normal frequency of 0 visible as a baseline
    static minNormalBarHeight = 1;
    static indexToBarLeft = (n: number) =>
        n *
        (AlleleFreqColumnFormatter.barWidth +
            AlleleFreqColumnFormatter.barSpacing);

    public static getComponentForSampleArgs<
        T extends { tumorAltCount: number; molecularProfileId: string }
    >(mutation: T) {
        const altReads = mutation.tumorAltCount;

        let opacity: number = 1;
        let extraTooltipText: string = '';
        if (isUncalled(mutation.molecularProfileId)) {
            if (altReads > 0) {
                opacity = 0.1;
                extraTooltipText =
                    "Mutation has supporting reads, but wasn't called";
            } else {
                opacity = 0;
                extraTooltipText =
                    "Mutation has 0 supporting reads and wasn't called";
            }
        }
        return {
            opacity,
            extraTooltipText,
        };
    }

    public static convertMutationToSampleElement<
        T extends ReadCounts & {
            sampleId: string;
            molecularProfileId: string;
        }
    >(
        mutation: T,
        color: string,
        barX: number,
        sampleComponent: any,
        source: AlleleFreqSource = 'tumor'
    ) {
        const counts = getReadCounts(mutation, source);
        if (!counts) {
            return null;
        }
        const { altReads, refReads } = counts;
        const freq = altReads / (altReads + refReads);
        const scaledHeight =
            (isNaN(freq) ? 0 : freq) * AlleleFreqColumnFormatter.maxBarHeight;
        const barHeight =
            source === 'normal' && !isNaN(freq)
                ? Math.max(
                      scaledHeight,
                      AlleleFreqColumnFormatter.minNormalBarHeight
                  )
                : scaledHeight;
        const barY = AlleleFreqColumnFormatter.maxBarHeight - barHeight;

        const bar = (
            <rect
                x={barX}
                y={barY}
                width={AlleleFreqColumnFormatter.barWidth}
                height={barHeight}
                fill={color}
            />
        );

        const variantReadText: string = `${
            isUncalled(mutation.molecularProfileId) ? '(uncalled) ' : ''
        }(${altReads} variant reads out of ${altReads + refReads} total)`;

        const text = (
            <span>
                <strong>{getFormattedFrequencyValue(freq)}</strong>{' '}
                {variantReadText}
            </span>
        );
        return {
            sampleId: mutation.sampleId,
            bar,
            component: sampleComponent,
            text,
            freq,
        };
    }

    public static renderFunction(
        mutations: Mutation[],
        sampleManager: SampleManager | null,
        source: AlleleFreqSource = 'tumor'
    ) {
        if (!sampleManager) {
            return <span></span>;
        }

        const sampleOrder = sampleManager.getSampleIdsInOrder();
        const barX = sampleOrder.reduce((map, sampleId: string, i: number) => {
            map[sampleId] = AlleleFreqColumnFormatter.indexToBarLeft(i);
            return map;
        }, {} as { [s: string]: number });
        const sampleElements = mutations.map((m: Mutation) => {
            const args = AlleleFreqColumnFormatter.getComponentForSampleArgs(m);
            return AlleleFreqColumnFormatter.convertMutationToSampleElement(
                m,
                sampleManager.getColorForSample(m.sampleId),
                barX[m.sampleId],
                sampleManager.getComponentForSample(
                    m.sampleId,
                    args.opacity,
                    args.extraTooltipText
                ),
                source
            );
        });
        const sampleToElements = sampleElements.reduce((map, elements: any) => {
            if (elements) {
                map[elements.sampleId] = elements;
            }
            return map;
        }, {} as { [s: string]: any });
        const elementsInSampleOrder = sampleOrder
            .map((sampleId: string) => sampleToElements[sampleId])
            .filter((x: any) => !!x);
        const tooltipLines = elementsInSampleOrder.map((elements: any) => (
            <span key={elements.sampleId}>
                {elements.component} {elements.text}
                <br />
            </span>
        ));
        const freqs = sampleOrder.map((sampleId: string) =>
            AlleleFreqColumnFormatter.toValidFrequency(
                sampleToElements[sampleId] && sampleToElements[sampleId].freq,
                source
            )
        );
        const bars = elementsInSampleOrder.map((elements: any) => elements.bar);

        let content: JSX.Element = <span />;

        // single sample: just show the number
        if (sampleManager.sampleIdsInHeader.length === 1) {
            // The frequency is populated by the sampleOrder.
            // In the sample view of multi-sample patient, it still populates frequency for all samples.
            const visualizedSampleIndex = sampleOrder.indexOf(
                sampleManager.sampleIdsInHeader[0]
            );
            const visualizedFreq = freqs[visualizedSampleIndex];
            content = (
                <span>
                    {visualizedFreq !== undefined
                        ? getFormattedFrequencyValue(visualizedFreq)
                        : ''}
                </span>
            );
        }
        // multiple samples: show a graphical component
        // (if no tooltip info available do not update content)
        else if (tooltipLines.length > 0) {
            content = (
                <svg
                    width={AlleleFreqColumnFormatter.getSVGWidth(
                        sampleOrder.length
                    )}
                    height={AlleleFreqColumnFormatter.maxBarHeight}
                >
                    {bars}
                </svg>
            );
        }

        // as long as we have tooltip lines, show tooltip in either cases (single or multiple)
        if (
            tooltipLines.length > 0 &&
            freqs.filter(freq => freq !== undefined).length > 0
        ) {
            const overlay = () => <span>{tooltipLines}</span>;
            content = (
                <DefaultTooltip
                    placement="left"
                    overlay={overlay}
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}
                    destroyTooltipOnHide={true}
                >
                    <div
                        data-test={
                            source === 'normal'
                                ? 'normal-allele-freq-cell'
                                : 'allele-freq-cell'
                        }
                    >
                        {content}
                    </div>
                </DefaultTooltip>
            );
        }

        return content;
    }

    public static getSVGWidth(numSamples: number) {
        return (
            numSamples * AlleleFreqColumnFormatter.barWidth +
            (numSamples - 1) * AlleleFreqColumnFormatter.barSpacing
        );
    }

    public static getSortValue(
        d: Mutation[],
        sampleManager: SampleManager | null,
        source: AlleleFreqSource = 'tumor'
    ) {
        if (!sampleManager) {
            return [null];
        }

        // frequencies in sample order
        const sampleToMutation = d.reduce(
            (map: { [s: string]: Mutation }, next: Mutation) => {
                map[next.sampleId] = next;
                return map;
            },
            {} as { [s: string]: Mutation }
        );
        return sampleManager
            .getSampleIdsInOrder()
            .map(sampleId => sampleToMutation[sampleId])
            .map(
                mutation =>
                    AlleleFreqColumnFormatter.toValidFrequency(
                        AlleleFreqColumnFormatter.calcFrequency(
                            mutation,
                            source
                        ),
                        source
                    ) ?? null
            );
    }

    public static isVisible(
        sampleManager: SampleManager | null,
        allMutations?: Mutation[][],
        source: AlleleFreqSource = 'tumor'
    ): boolean {
        if (allMutations) {
            for (const rowMutations of allMutations) {
                const frequency = this.getSortValue(
                    rowMutations,
                    sampleManager,
                    source
                );
                // if there is at least one valid value, it should be visible
                if (frequency.some(f => f !== null)) {
                    return true;
                }
            }
        }

        return false;
    }

    public static getFrequency(
        data: Mutation[],
        source: AlleleFreqSource = 'tumor'
    ): string | string[] {
        const result: string[] = [];

        if (data) {
            for (const mutation of data) {
                const frequency = AlleleFreqColumnFormatter.calcFrequency(
                    mutation,
                    source
                );
                const value = frequency === null ? '' : String(frequency);

                result.push(value);
            }
        }

        if (result.length === 1) {
            return result[0];
        }

        return result;
    }

    protected static calcFrequency(
        mutation: Mutation,
        source: AlleleFreqSource = 'tumor'
    ): number | null {
        if (!mutation) {
            return null;
        }

        const counts = getReadCounts(mutation, source);
        if (!counts) {
            return null;
        }

        return counts.altReads / (counts.altReads + counts.refReads);
    }

    // A tumor frequency of 0 carries no information (the mutation was not
    // observed), whereas a normal frequency of 0 is the expected value.
    private static toValidFrequency(
        freq: number | null | undefined,
        source: AlleleFreqSource
    ): number | undefined {
        if (freq === null || freq === undefined || isNaN(freq)) {
            return undefined;
        }
        if (source === 'tumor' && !freq) {
            return undefined;
        }
        return freq;
    }
}
