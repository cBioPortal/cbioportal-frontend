import * as React from 'react';
import { ClinicalData, Mutation } from 'cbioportal-ts-api-client';
import { DefaultTooltip, MobxPromise } from 'cbioportal-frontend-commons';
import { errorIcon, loaderIcon } from 'oncokb-frontend-commons';
import SampleManager from 'pages/patientView/SampleManager';
import { hasASCNProperty } from 'shared/lib/MutationUtils';
import { MutationTableColumnType } from '../../MutationTable';
import ColumnLegend from 'shared/components/mutationTable/ColumnLegend';
import {
    ASCNCopyNumberElementTooltip,
    ASCNCopyNumberValueEnum,
} from 'shared/components/mutationTable/column/ascnCopyNumber/ASCNCopyNumberElement';
import {
    getTotalCopyNumber,
    getWGD,
} from 'shared/components/mutationTable/column/ascnCopyNumber/ASCNCopyNumberColumnFormatter';
import { getExpectedAltCopies } from 'shared/components/mutationTable/column/expectedAltCopies/ExpectedAltCopiesColumnFormatter';
import styles from 'shared/components/mutationTable/column/ascnCopyNumber/ascnCopyNumber.module.scss';

type SampleCopies = {
    sampleId: string;
    mutant: number | null;
    total: number | null;
    minor: string;
    wgd: string;
};

// each copy is drawn as a box, up to this many per sample, with a '+' on
// top for more
const MAX_BOXES = 4;
const BOX_WIDTH = 8;
const BOX_HEIGHT = 5;
const BOX_GAP = 1;
const SAMPLE_SPACING = 4;
// room above a stack for the WGD mark or the '+'
const TOP_MARGIN = 5;

function getSampleCopies(
    mutations: Mutation[],
    sampleIds: string[],
    clinicalData: { [sampleId: string]: ClinicalData[] }
): SampleCopies[] {
    return sampleIds.map(sampleId => {
        const mutation = mutations.find(m => m.sampleId === sampleId);
        return {
            sampleId,
            mutant: mutation ? getExpectedAltCopies(mutation) : null,
            total: mutation ? getTotalCopyNumber(mutation) : null,
            minor:
                mutation && hasASCNProperty(mutation, 'minorCopyNumber')
                    ? mutation.alleleSpecificCopyNumber.minorCopyNumber.toString()
                    : ASCNCopyNumberValueEnum.NA,
            wgd: getWGD(clinicalData, sampleId),
        };
    });
}

const SampleCopiesTooltipLine: React.FunctionComponent<{
    copies: SampleCopies;
    sampleManager?: SampleManager | null;
}> = ({ copies, sampleManager }) => (
    <div>
        {sampleManager &&
            sampleManager.getComponentForSample(copies.sampleId, 1, '')}{' '}
        <b>
            {copies.mutant} of {copies.total}
        </b>{' '}
        copies mutated
        {copies.wgd !== ASCNCopyNumberValueEnum.NA && (
            <div style={{ marginLeft: sampleManager ? 20 : 0 }}>
                <ASCNCopyNumberElementTooltip
                    sampleId={copies.sampleId}
                    wgdValue={copies.wgd}
                    totalCopyNumberValue={`${copies.total}`}
                    minorCopyNumberValue={copies.minor}
                    ascnCopyNumberValue={ASCNCopyNumberValueEnum.NA}
                />
            </div>
        )}
    </div>
);

// one stack of boxes per sample, one box per copy of the gene: filled boxes
// are mutant copies, with a mark on top for whole genome doubling
const PerSampleCopyBoxes: React.FunctionComponent<{
    samples: SampleCopies[];
    sampleManager: SampleManager;
}> = ({ samples, sampleManager }) => {
    const tallest = Math.min(
        MAX_BOXES,
        Math.max(...samples.map(s => s.total || 0))
    );
    const height = tallest * (BOX_HEIGHT + BOX_GAP) + TOP_MARGIN;
    const boxY = (n: number) => height - (n + 1) * (BOX_HEIGHT + BOX_GAP);
    return (
        <svg
            width={
                samples.length * (BOX_WIDTH + SAMPLE_SPACING) - SAMPLE_SPACING
            }
            height={height}
            style={{ verticalAlign: 'middle' }}
        >
            {samples.map((s, i) => {
                if (s.total === null || s.mutant === null) {
                    return null;
                }
                const x = i * (BOX_WIDTH + SAMPLE_SPACING);
                const color = sampleManager.getColorForSample(s.sampleId);
                const boxes = Math.min(s.total, MAX_BOXES);
                const top = boxY(boxes - 1);
                return (
                    <g key={s.sampleId}>
                        {Array.from({ length: boxes }, (_, n) =>
                            n < s.mutant! ? (
                                <rect
                                    key={n}
                                    x={x}
                                    y={boxY(n)}
                                    width={BOX_WIDTH}
                                    height={BOX_HEIGHT}
                                    fill={color}
                                />
                            ) : (
                                <rect
                                    key={n}
                                    x={x + 0.5}
                                    y={boxY(n) + 0.5}
                                    width={BOX_WIDTH - 1}
                                    height={BOX_HEIGHT - 1}
                                    fill="white"
                                    stroke={color}
                                />
                            )
                        )}
                        {s.total > MAX_BOXES && (
                            <text
                                x={x + BOX_WIDTH / 2}
                                y={top - 1}
                                fontSize={8}
                                textAnchor="middle"
                                fill={color}
                            >
                                +
                            </text>
                        )}
                        {s.wgd === ASCNCopyNumberValueEnum.WGD &&
                            s.total <= MAX_BOXES && (
                                <rect
                                    x={x}
                                    y={top - 3}
                                    width={BOX_WIDTH}
                                    height={2}
                                    fill="black"
                                />
                            )}
                    </g>
                );
            })}
        </svg>
    );
};

export const getDefaultMutantTotalCopyNumberColumnDefinition = (
    sampleIds?: string[],
    sampleIdToClinicalDataMap?:
        | MobxPromise<{ [sampleId: string]: ClinicalData[] }>
        | undefined,
    sampleManager?: SampleManager | null
) => ({
    name: MutationTableColumnType.MUTANT_TOTAL_COPY_NUM,
    tooltip: (
        <ColumnLegend
            description={
                <span>
                    Integer number of mutant copies out of the total copies of
                    the gene at the mutated locus, from allele-specific copy
                    number analysis. With several samples, each stack is a
                    sample, with one box per copy: filled boxes are mutant
                    copies. A black mark on top, or a <b>WGD</b> tag, marks
                    whole genome doubling. Hover for the values and the
                    allele-specific call (e.g. CNLOH).
                </span>
            }
        />
    ),
    render: (d: Mutation[]) =>
        MutantTotalCopyNumberColumnFormatter.renderFunction(
            d,
            sampleIds ? sampleIds : d.length > 0 ? [d[0].sampleId] : [],
            sampleIdToClinicalDataMap,
            sampleManager
        ),
    sortBy: (d: Mutation[]) => [
        ...d.map(getExpectedAltCopies),
        ...d.map(getTotalCopyNumber),
    ],
    download: (d: Mutation[]) =>
        d.map(m =>
            getExpectedAltCopies(m) !== null && getTotalCopyNumber(m) !== null
                ? `${getExpectedAltCopies(m)}/${getTotalCopyNumber(m)}`
                : ''
        ),
    visible: false,
});

export default class MutantTotalCopyNumberColumnFormatter {
    public static renderFunction(
        mutations: Mutation[],
        sampleIds: string[],
        sampleIdToClinicalDataMap?:
            | MobxPromise<{ [sampleId: string]: ClinicalData[] }>
            | undefined,
        sampleManager?: SampleManager | null
    ) {
        if (
            sampleIdToClinicalDataMap === undefined ||
            sampleIdToClinicalDataMap.isError
        ) {
            return errorIcon('Error fetching data');
        }
        if (!sampleIdToClinicalDataMap.isComplete) {
            return loaderIcon();
        }
        const samples = getSampleCopies(
            mutations,
            sampleIds,
            sampleIdToClinicalDataMap.result!
        );
        const withValues = samples.filter(
            s => s.mutant !== null && s.total !== null
        );
        if (withValues.length === 0) {
            return <span />;
        }
        const overlay = () => (
            <div data-test="mutant-total-copy-number-tooltip">
                {withValues.map(s => (
                    <SampleCopiesTooltipLine
                        key={s.sampleId}
                        copies={s}
                        sampleManager={sampleManager}
                    />
                ))}
            </div>
        );
        const content =
            sampleManager && samples.length > 1 ? (
                <PerSampleCopyBoxes
                    samples={samples}
                    sampleManager={sampleManager}
                />
            ) : (
                <span className={styles.value}>
                    {withValues[0].mutant} / {withValues[0].total}
                    {withValues[0].wgd === ASCNCopyNumberValueEnum.WGD && (
                        <span className={styles.wgd}>WGD</span>
                    )}
                </span>
            );
        return (
            <DefaultTooltip
                placement="left"
                overlay={overlay}
                destroyTooltipOnHide={true}
            >
                <span data-test="mutant-total-copy-number-cell">{content}</span>
            </DefaultTooltip>
        );
    }
}
