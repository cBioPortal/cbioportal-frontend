import OncoprintJS, {
    IGeneticAlterationRuleSetParams,
    IGradientRuleSetParams,
    RuleSetParams,
    RuleSetType,
} from 'oncoprintjs';
import {
    ClinicalTrackSpec,
    GeneticTrackDatum,
    GeneticTrackSpec,
    IGeneHeatmapTrackDatum,
    IGenesetHeatmapTrackDatum,
    IGenesetHeatmapTrackSpec,
    IHeatmapTrackSpec,
    IGenericAssayHeatmapTrackDatum,
    ICategoricalTrackSpec,
} from './Oncoprint';
import {
    genetic_rule_set_different_colors_no_recurrence,
    genetic_rule_set_different_colors_recurrence,
    genetic_rule_set_same_color_for_all_no_recurrence,
    genetic_rule_set_same_color_for_all_recurrence,
    germline_rule_params,
} from './geneticrules';
import {
    AlterationTypeConstants,
    AnnotatedExtendedAlteration,
    CaseAggregatedData,
    IQueriedCaseData,
    IQueriedMergedTrackCaseData,
} from '../../../pages/resultsView/ResultsViewPageStore';
import { CoverageInformation } from '../../lib/GenePanelUtils';
import { remoteData } from 'cbioportal-frontend-commons';
import {
    makeCategoricalTrackData,
    makeClinicalTrackData,
    makeGeneticTrackData,
    makeHeatmapTrackData,
} from './DataUtils';
import ResultsViewOncoprint from './ResultsViewOncoprint';
import _ from 'lodash';
import { action, IObservableArray, ObservableMap, runInAction } from 'mobx';
import { MobxPromise } from 'mobxpromise';
import GenesetCorrelatedGeneCache from 'shared/cache/GenesetCorrelatedGeneCache';
import {
    isMergedTrackFilter,
    UnflattenedOQLLineFilterOutput,
} from '../../lib/oql/oqlfilter';
import {
    ClinicalAttribute,
    MolecularProfile,
    Patient,
    Sample,
    Gene,
} from 'cbioportal-ts-api-client';
import {
    clinicalAttributeIsPROFILEDIN,
    MUTATION_SPECTRUM_CATEGORIES,
    MUTATION_SPECTRUM_FILLS,
    SpecialAttribute,
} from '../../cache/ClinicalDataCache';
import { RESERVED_CLINICAL_VALUE_COLORS } from 'shared/lib/Colors';
import { ISelectOption } from './controls/OncoprintControls';
import {
    COMMON_GENERIC_ASSAY_PROPERTY,
    GenericAssayDataType,
    getGenericAssayMetaPropertyOrDefault,
} from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import ifNotDefined from '../../lib/ifNotDefined';
import { isGenericAssayHeatmapProfile } from 'shared/components/oncoprint/ResultsViewOncoprintUtils';

interface IGenesetExpansionMap {
    [genesetTrackKey: string]: IHeatmapTrackSpec[];
}

function makeGenesetHeatmapExpandHandler(
    oncoprint: ResultsViewOncoprint,
    track_key: string,
    query: { molecularProfileId: string; genesetId: string },
    cache: GenesetCorrelatedGeneCache
) {
    cache.initIteration(track_key, query);
    return async () => {
        const new_genes = (await cache.next(track_key, 5)).map(
            ({
                entrezGeneId,
                hugoGeneSymbol,
                correlationValue,
                zScoreGeneticProfileId,
            }) => ({
                entrezGeneId,
                hugoGeneSymbol,
                correlationValue,
                molecularProfileId: zScoreGeneticProfileId,
            })
        );
        runInAction(() => {
            const list =
                oncoprint.expansionsByGenesetHeatmapTrackKey.get(track_key) ||
                [];
            oncoprint.expansionsByGenesetHeatmapTrackKey.set(
                track_key,
                list.concat(new_genes)
            );
        });
    };
}

function makeGenesetHeatmapUnexpandHandler(
    oncoprint: ResultsViewOncoprint,
    parentKey: string,
    expansionEntrezGeneId: number,
    myTrackGroup: number,
    onRemoveLast: () => void
) {
    return action('genesetHeatmapUnexpansion', () => {
        const list = oncoprint.expansionsByGenesetHeatmapTrackKey.get(
            parentKey
        );
        if (list) {
            // only remove if the expansion if it isn't needed in another track
            // group than the one this track is being removed from; keep the
            // expansion if the track is being re-rendered into a different
            // track group
            if (myTrackGroup === oncoprint.genesetHeatmapTrackGroupIndex) {
                // this is a MobX Observable Array, so it should have findIndex
                // implemented even in IE
                const indexToRemove = list.findIndex(
                    ({ entrezGeneId }) => entrezGeneId === expansionEntrezGeneId
                );
                if (indexToRemove !== -1) {
                    list.splice(indexToRemove, 1);
                    if (!list.length) {
                        onRemoveLast();
                    }
                }
            }
        } else {
            throw new Error(
                `Track '${parentKey}' has no expansions to remove.`
            );
        }
    });
}

function formatGeneticTrackSublabel(
    oqlFilter: UnflattenedOQLLineFilterOutput<object>
): string {
    if (isMergedTrackFilter(oqlFilter)) {
        return ''; // no oql sublabel for merged tracks - too cluttered
    } else {
        return oqlFilter.oql_line
            .substring(oqlFilter.gene.length)
            .replace(';', ''); // get rid of gene in beginning of OQL line, and semicolon at end
    }
}

function formatGeneticTrackLabel(
    oqlFilter: UnflattenedOQLLineFilterOutput<object>
): string {
    return isMergedTrackFilter(oqlFilter)
        ? oqlFilter.label ||
              oqlFilter.list.map(geneLine => geneLine.gene).join(' / ')
        : oqlFilter.gene;
}

function formatGeneticTrackOql(
    oqlFilter: UnflattenedOQLLineFilterOutput<object>
): string {
    return isMergedTrackFilter(oqlFilter)
        ? `[${oqlFilter.list.map(geneLine => geneLine.oql_line).join(' ')}]`
        : oqlFilter.oql_line;
}

export function doWithRenderingSuppressedAndSortingOff(
    oncoprint: OncoprintJS,
    task: () => void
) {
    oncoprint.suppressRendering();
    oncoprint.keepSorted(false);
    task();
    oncoprint.keepSorted(true);
    oncoprint.releaseRendering();
}

export function getHeatmapTrackRuleSetParams(
    trackSpec: IHeatmapTrackSpec
): RuleSetParams {
    let value_range: [number, number];
    let legend_label: string;
    let colors: [number, number, number, number][];
    let value_stop_points: number[];
    let null_legend_label = '';
    let na_legend_label = '';
    switch (trackSpec.molecularAlterationType) {
        case AlterationTypeConstants.GENERIC_ASSAY:
            return getGenericAssayTrackRuleSetParams(trackSpec);
            break;
        case AlterationTypeConstants.METHYLATION:
            value_range = [0, 1];
            legend_label = trackSpec.legendLabel || 'Methylation Heatmap';
            value_stop_points = [0, 0.35, 1];
            colors = [
                [0, 0, 255, 1],
                [255, 255, 255, 1],
                [255, 0, 0, 1],
            ];
            break;
        case AlterationTypeConstants.MUTATION_EXTENDED:
            value_range = [0, 1];
            legend_label = trackSpec.legendLabel || 'VAF Heatmap';
            null_legend_label = 'Not mutated/no VAF data';
            na_legend_label = 'Not sequenced';
            value_stop_points = [0, 1];
            colors = [
                [241, 242, 181, 1],
                [19, 80, 88, 1],
            ];
            break;
        default:
            value_range = [-3, 3];
            legend_label = trackSpec.legendLabel || 'Expression Heatmap';
            value_stop_points = [-3, 0, 3];
            colors = [
                [0, 0, 255, 1],
                [0, 0, 0, 1],
                [255, 0, 0, 1],
            ];
            break;
    }

    return {
        type: RuleSetType.GRADIENT,
        legend_label,
        value_key: 'profile_data',
        value_range,
        colors,
        value_stop_points,
        null_color: 'rgba(224,224,224,1)',
        null_legend_label,
        na_legend_label,
        na_shapes: trackSpec.customNaShapes,
    };
}

export const legendColorDarkBlue = [0, 114, 178, 1] as [
    number,
    number,
    number,
    number
];
export const legendColorLightBlue = [204, 236, 255, 1] as [
    number,
    number,
    number,
    number
];
export const legendColorDarkRed = [213, 94, 0, 1] as [
    number,
    number,
    number,
    number
];
export const legendColorLightRed = [255, 226, 204, 1] as [
    number,
    number,
    number,
    number
];

export function getGenericAssayTrackRuleSetParams(
    trackSpec: IHeatmapTrackSpec
): RuleSetParams {
    let value_range: [number, number];
    let legend_label: string;
    let colors: [number, number, number, number][];
    let value_stop_points: number[];
    let category_to_color: { [d: string]: string } | undefined;

    // - Legends for generic assay entities can be configured in two ways:
    //      1. Smaller values are `important` and darker blue (a.k.a. ASC sort order)
    //      2. Larger values are `important` and darker blue (a.k.a. DESC sort order)
    // - The pivot threshold denotes an arbitrary boundary between important (in red)
    //   and unimportant (in blue) values. When a pivot threshold is defined blue
    //   and red gradient to white at the pivotThreshold value.
    // - The most extreme value in the legend is should be the largest value in the
    //   current track group. It is passed in alongside other track specs (if possible).
    // - When the most extreme value does not reach the pivotThreshold (if defined),
    //   the pivotThreshold is included in the legend as the most extreme value.

    legend_label = trackSpec.legendLabel || `${trackSpec.molecularProfileName}`;
    const dataPoints = trackSpec.data;
    const pivotThreshold = trackSpec.pivotThreshold;
    const sortOrder = trackSpec.sortOrder;
    const categoryColorOptions = [
        'rgba(240,228,66,1)',
        'rgba(0,158,115,1)',
        'rgba(204,121,167,1)',
        'rgba(0,0,0,1)',
    ];

    let maxValue = trackSpec.maxProfileValue!;
    let minValue = trackSpec.minProfileValue!;

    if (maxValue === undefined || minValue === undefined) {
        let dataMax = Number.NEGATIVE_INFINITY;
        let dataMin = Number.POSITIVE_INFINITY;
        for (const d of trackSpec.data) {
            if (d.profile_data !== null) {
                dataMax = Math.max(d.profile_data, dataMax);
                dataMin = Math.min(d.profile_data, dataMin);
            }
        }
        maxValue = ifNotDefined(maxValue, dataMax);
        minValue = ifNotDefined(minValue, dataMin);
    }

    if (pivotThreshold !== undefined) {
        maxValue = Math.max(maxValue, pivotThreshold);
        minValue = Math.min(minValue, pivotThreshold);
    }

    // When all observed values are negative or positive
    // assume that 0 should be used in the legend.
    const rightBoundaryValue = Math.max(0, maxValue);
    const leftBoundaryValue = Math.min(0, minValue);
    value_range = [leftBoundaryValue, rightBoundaryValue]; // smaller concentrations are more `important` (ASC)
    value_stop_points = [leftBoundaryValue, rightBoundaryValue];

    if (pivotThreshold === undefined || maxValue === pivotThreshold) {
        // all values are smaller than pivot threshold
        colors = [legendColorDarkBlue, legendColorLightBlue];
    } else if (minValue === pivotThreshold) {
        // all values are larger than pivot threshold
        colors = [legendColorLightRed, legendColorDarkRed];
    } else {
        // pivot threshold lies in the middle of al values
        colors = [
            legendColorDarkBlue,
            legendColorLightBlue,
            legendColorLightRed,
            legendColorDarkRed,
        ];
        if (pivotThreshold <= leftBoundaryValue) {
            // when data points do not bracket the pivotThreshold, add an artificial left boundary in the legend
            value_stop_points = [
                pivotThreshold - (rightBoundaryValue - pivotThreshold),
                pivotThreshold,
                pivotThreshold,
                rightBoundaryValue,
            ];
        } else if (pivotThreshold >= rightBoundaryValue) {
            // when data points do not bracket the pivotThreshold, add an artificial right boundary in the legend
            value_stop_points = [
                leftBoundaryValue,
                pivotThreshold,
                pivotThreshold,
                pivotThreshold + (pivotThreshold - leftBoundaryValue),
            ];
        } else {
            value_stop_points = [
                leftBoundaryValue,
                pivotThreshold,
                pivotThreshold,
                rightBoundaryValue,
            ];
        }
    }

    if (sortOrder === 'DESC') {
        // larger concentrations are more `important` (DESC)
        colors = _.reverse(colors);
    }

    let counter = 0;
    const categories = _(dataPoints as IGenericAssayHeatmapTrackDatum[])
        .filter((d: IGenericAssayHeatmapTrackDatum) => !!d.category)
        .map(d => d.category)
        .uniq()
        .value();
    categories.forEach((d: string) => {
        if (category_to_color === undefined) {
            category_to_color = {};
        }
        category_to_color![d] = categoryColorOptions[counter++];
        if (counter === categoryColorOptions.length) {
            counter = 0;
        }
    });

    return {
        type: RuleSetType.GRADIENT_AND_CATEGORICAL,
        legend_label,
        value_key: 'profile_data',
        value_range,
        colors,
        value_stop_points,
        null_color: 'rgba(224,224,224,1)',
        category_key: 'category',
        category_to_color: category_to_color,
    };
}

export function getGenesetHeatmapTrackRuleSetParams() {
    return {
        type: RuleSetType.GRADIENT,
        legend_label: 'Gene Set Heatmap',
        value_key: 'profile_data',
        value_range: [-1, 1] as [number, number],
        /*
         * The PiYG colormap is based on color specifications and designs
         * developed by Cynthia Brewer (http://colorbrewer.org).
         * The palette has been included under the terms
         * of an Apache-style license.
         */
        colors: [
            [39, 100, 25, 1],
            [77, 146, 33, 1],
            [127, 188, 65, 1],
            [184, 225, 134, 1],
            [230, 245, 208, 1],
            [247, 247, 247, 1],
            [253, 224, 239, 1],
            [241, 182, 218, 1],
            [222, 119, 174, 1],
            [197, 27, 125, 1],
            [142, 1, 82, 1],
        ] as [number, number, number, number][],
        value_stop_points: [
            -1,
            -0.8,
            -0.6,
            -0.4,
            -0.2,
            0,
            0.2,
            0.4,
            0.6,
            0.8,
            1,
        ],
        null_color: 'rgba(224,224,224,1)',
    } as IGradientRuleSetParams;
}

export function getGeneticTrackRuleSetParams(
    distinguishMutationType?: boolean,
    distinguishDrivers?: boolean,
    distinguishGermlineMutations?: boolean
): IGeneticAlterationRuleSetParams {
    let rule_set;
    if (!distinguishMutationType && !distinguishDrivers) {
        rule_set = genetic_rule_set_same_color_for_all_no_recurrence;
    } else if (!distinguishMutationType && distinguishDrivers) {
        rule_set = genetic_rule_set_same_color_for_all_recurrence;
    } else if (distinguishMutationType && !distinguishDrivers) {
        rule_set = genetic_rule_set_different_colors_no_recurrence;
    } else {
        rule_set = genetic_rule_set_different_colors_recurrence;
    }
    rule_set = _.cloneDeep(rule_set);
    if (distinguishGermlineMutations) {
        Object.assign(rule_set.rule_params.conditional, germline_rule_params);
    }
    return rule_set;
}

export function getClinicalTrackRuleSetParams(track: ClinicalTrackSpec) {
    let params: RuleSetParams;
    switch (track.datatype) {
        case 'number':
            params = {
                type: RuleSetType.BAR,
                value_key: 'attr_val',
                value_range: track.numberRange,
                log_scale: track.numberLogScale,
            };
            break;
        case 'counts':
            params = {
                type: RuleSetType.STACKED_BAR,
                value_key: 'attr_val',
                categories: track.countsCategoryLabels,
                fills: track.countsCategoryFills,
            };
            break;
        case 'string':
        default:
            params = {
                type: RuleSetType.CATEGORICAL,
                category_key: 'attr_val',
                category_to_color: Object.assign(
                    {},
                    track.category_to_color,
                    RESERVED_CLINICAL_VALUE_COLORS
                ),
            };
            break;
    }
    return params;
}

export function getCategoricalTrackRuleSetParams(track: ICategoricalTrackSpec) {
    return {
        type: RuleSetType.CATEGORICAL,
        category_key: 'attr_val',
        category_to_color: _.cloneDeep(RESERVED_CLINICAL_VALUE_COLORS),
    };
}

export function percentAltered(altered: number, sequenced: number) {
    if (sequenced === 0) {
        return 'N/P';
    }

    const p = altered / sequenced;
    const percent = 100 * p;
    let fixed: string;
    if (p < 0.03) {
        // if less than 3%, use one decimal digit
        fixed = percent.toFixed(1);
        // if last digit is a 0, use no decimal digits
        if (fixed[fixed.length - 1] === '0') {
            fixed = percent.toFixed();
        }
    } else {
        fixed = percent.toFixed();
    }
    return fixed + '%';
}

function getAlterationInfoSequenced(
    sampleMode: boolean,
    oql: { gene: string } | string[],
    sequencedSampleKeysByGene: { [hugoGeneSymbol: string]: string[] },
    sequencedPatientKeysByGene: { [hugoGeneSymbol: string]: string[] }
) {
    const geneSymbolArray = oql instanceof Array ? oql : [oql.gene];
    const sequenced = sampleMode
        ? _.uniq(
              _.flatMap(
                  geneSymbolArray,
                  symbol => sequencedSampleKeysByGene[symbol]
              )
          ).length
        : _.uniq(
              _.flatMap(
                  geneSymbolArray,
                  symbol => sequencedPatientKeysByGene[symbol]
              )
          ).length;

    return sequenced;
}

export function alterationInfoForOncoprintTrackData(
    sampleMode: boolean,
    data: {
        trackData: GeneticTrackDatum[];
        oql: { gene: string } | string[];
    },
    sequencedSampleKeysByGene: { [hugoGeneSymbol: string]: string[] },
    sequencedPatientKeysByGene: { [hugoGeneSymbol: string]: string[] }
) {
    const sequenced = getAlterationInfoSequenced(
        sampleMode,
        data.oql,
        sequencedSampleKeysByGene,
        sequencedPatientKeysByGene
    );
    const altered = _.sumBy(data.trackData!, d => +isAltered(d));
    const percent = percentAltered(altered, sequenced);
    return {
        sequenced,
        altered,
        percent,
    };
}

export function alterationInfoForCaseAggregatedDataByOQLLine(
    sampleMode: boolean,
    data: {
        cases: CaseAggregatedData<AnnotatedExtendedAlteration>; // one of `cases` or `trackData` must be present
        oql: { gene: string } | string[];
    },
    sequencedSampleKeysByGene: { [hugoGeneSymbol: string]: string[] },
    sequencedPatientKeysByGene: { [hugoGeneSymbol: string]: string[] }
) {
    const sequenced = getAlterationInfoSequenced(
        sampleMode,
        data.oql,
        sequencedSampleKeysByGene,
        sequencedPatientKeysByGene
    );
    const altered = sampleMode
        ? Object.keys(data.cases.samples).filter(
              k => !!data.cases.samples[k].length
          ).length
        : Object.keys(data.cases.patients).filter(
              k => !!data.cases.patients[k].length
          ).length;
    const percent = percentAltered(altered, sequenced);
    return {
        sequenced,
        altered,
        percent,
    };
}

interface IGeneticTrackAppState {
    sampleMode: boolean;
    oncoprint: ResultsViewOncoprint;
    samples: Pick<Sample, 'sampleId' | 'studyId' | 'uniqueSampleKey'>[];
    patients: Pick<Patient, 'patientId' | 'studyId' | 'uniquePatientKey'>[];
    coverageInformation: CoverageInformation;
    sequencedSampleKeysByGene: any;
    sequencedPatientKeysByGene: any;
    selectedMolecularProfiles: MolecularProfile[];
    expansionIndexMap: ObservableMap<string, number[]>;
}

function isAltered(d: GeneticTrackDatum) {
    return d.data.length > 0;
}

export function getAlteredUids(tracks: GeneticTrackSpec[]) {
    const isAlteredMap: { [uid: string]: boolean } = {};
    for (const track of tracks) {
        for (const d of track.data) {
            if (isAltered(d)) {
                isAlteredMap[d.uid] = true;
            }
        }
    }
    return Object.keys(isAlteredMap);
}

export function getAlterationData(
    samples: Pick<Sample, 'sampleId' | 'studyId' | 'uniqueSampleKey'>[],
    patients: Pick<Patient, 'patientId' | 'studyId' | 'uniquePatientKey'>[],
    coverageInformation: CoverageInformation,
    sequencedSampleKeysByGene: any,
    sequencedPatientKeysByGene: any,
    selectedMolecularProfiles: MolecularProfile[],
    caseData:
        | IQueriedMergedTrackCaseData
        | (IQueriedCaseData<any> & { mergedTrackOqlList?: never }),
    isQueriedGeneSampling: boolean,
    queryGenes: Gene[]
) {
    const sampleMode = false;
    const oql = caseData.oql;
    const geneSymbolArray = isMergedTrackFilter(oql)
        ? oql.list.map(({ gene }) => gene)
        : [oql.gene];
    const dataByCase = caseData.cases;
    const data = makeGeneticTrackData(
        dataByCase.patients,
        geneSymbolArray,
        patients as Patient[],
        coverageInformation,
        selectedMolecularProfiles
    );

    const alterationInfo = alterationInfoForOncoprintTrackData(
        sampleMode,
        { trackData: data, oql: geneSymbolArray },
        sequencedSampleKeysByGene,
        sequencedPatientKeysByGene
    );
    if (
        isQueriedGeneSampling ||
        !queryGenes.map(gene => gene.hugoGeneSymbol).includes((oql as any).gene)
    ) {
        return {
            gene: (oql as any).gene,
            altered: alterationInfo.altered,
            sequenced: alterationInfo.sequenced,
            percentAltered: alterationInfo.percent,
        };
    } else {
        return undefined;
    }
}

export function getUnalteredUids(tracks: GeneticTrackSpec[]) {
    const allUids: string[] = _.chain(tracks)
        .map(spec => spec.data.map(d => d.uid))
        .flatten()
        .uniq()
        .value();
    return _.difference(allUids, getAlteredUids(tracks));
}

export function makeGeneticTrackWith({
    sampleMode,
    oncoprint,
    samples,
    patients,
    coverageInformation,
    sequencedSampleKeysByGene,
    sequencedPatientKeysByGene,
    selectedMolecularProfiles,
    expansionIndexMap,
}: IGeneticTrackAppState) {
    return function makeTrack(
        caseData:
            | IQueriedMergedTrackCaseData
            | (IQueriedCaseData<any> & { mergedTrackOqlList?: never }), // the & is to get around annoying TS error -- its never passed in, as the `never` type indicates
        index: number,
        parentKey?: string
    ): GeneticTrackSpec {
        const oql = caseData.oql;
        const geneSymbolArray = isMergedTrackFilter(oql)
            ? oql.list.map(({ gene }) => gene)
            : [oql.gene];
        const dataByCase = caseData.cases;
        const data = sampleMode
            ? makeGeneticTrackData(
                  dataByCase.samples,
                  geneSymbolArray,
                  samples as Sample[],
                  coverageInformation,
                  selectedMolecularProfiles
              )
            : makeGeneticTrackData(
                  dataByCase.patients,
                  geneSymbolArray,
                  patients as Patient[],
                  coverageInformation,
                  selectedMolecularProfiles
              );
        const alterationInfo = alterationInfoForOncoprintTrackData(
            sampleMode,
            { trackData: data, oql: geneSymbolArray },
            sequencedSampleKeysByGene,
            sequencedPatientKeysByGene
        );
        const trackKey =
            parentKey === undefined
                ? `GENETICTRACK_${index}`
                : `${parentKey}_EXPANSION_${index}`;
        const expansionCallback = isMergedTrackFilter(oql)
            ? () => {
                  expansionIndexMap.set(trackKey, _.range(oql.list.length));
              }
            : undefined;
        const removeCallback =
            parentKey !== undefined
                ? () => {
                      (expansionIndexMap.get(parentKey) as IObservableArray<
                          number
                      >).remove(index);
                  }
                : undefined;
        let expansions: GeneticTrackSpec[] = [];

        if (caseData.mergedTrackOqlList) {
            const subTrackData = caseData.mergedTrackOqlList;
            expansions = (
                expansionIndexMap.get(trackKey) || []
            ).map(expansionIndex =>
                makeTrack(
                    subTrackData[expansionIndex],
                    expansionIndex,
                    trackKey
                )
            );
        }

        let info = alterationInfo.percent;
        let infoTooltip = undefined;
        if (alterationInfo.sequenced !== 0) {
            // show tooltip explaining percent calculation, as long as its not N/P
            infoTooltip = `altered / profiled = ${alterationInfo.altered} / ${alterationInfo.sequenced}`;
        }
        if (
            alterationInfo.sequenced > 0 &&
            alterationInfo.sequenced < (sampleMode ? samples : patients).length
        ) {
            // add asterisk to percentage if not all samples/patients are profiled for this track
            // dont add asterisk if none are profiled
            info = `${info}*`;
        }
        return {
            key: trackKey,
            label:
                (parentKey !== undefined ? '  ' : '') +
                formatGeneticTrackLabel(oql),
            sublabel: formatGeneticTrackSublabel(oql),
            labelColor: parentKey !== undefined ? 'grey' : undefined,
            oql: formatGeneticTrackOql(oql),
            info,
            infoTooltip,
            data,
            expansionCallback,
            removeCallback,
            expansionTrackList: expansions.length ? expansions : undefined,
            customOptions: [
                { separator: true },
                {
                    label: 'Sort by genes',
                    onClick: oncoprint.clearSortDirectionsAndSortByData,
                },
            ],
        };
    };
}

export function makeGeneticTracksMobxPromise(
    oncoprint: ResultsViewOncoprint,
    sampleMode: boolean
) {
    return remoteData<GeneticTrackSpec[]>({
        await: () => [
            oncoprint.props.store.filteredSamples,
            oncoprint.props.store.filteredPatients,
            oncoprint.props.store
                .oqlFilteredCaseAggregatedDataByUnflattenedOQLLine,
            oncoprint.props.store.coverageInformation,
            oncoprint.props.store.filteredSequencedSampleKeysByGene,
            oncoprint.props.store.filteredSequencedPatientKeysByGene,
            oncoprint.props.store.selectedMolecularProfiles,
        ],
        invoke: async () => {
            const trackFunction = makeGeneticTrackWith({
                sampleMode,
                oncoprint,
                samples: oncoprint.props.store.filteredSamples.result!,
                patients: oncoprint.props.store.filteredPatients.result!,
                coverageInformation: oncoprint.props.store.coverageInformation
                    .result!,
                sequencedSampleKeysByGene: oncoprint.props.store
                    .filteredSequencedSampleKeysByGene.result!,
                sequencedPatientKeysByGene: oncoprint.props.store
                    .filteredSequencedPatientKeysByGene.result!,
                selectedMolecularProfiles: oncoprint.props.store
                    .selectedMolecularProfiles.result!,
                expansionIndexMap: oncoprint.expansionsByGeneticTrackKey,
            });
            return oncoprint.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.map(
                (alterationData, trackIndex) =>
                    trackFunction(alterationData, trackIndex, undefined)
            );
        },
        default: [],
    });
}

export function makeClinicalTracksMobxPromise(
    oncoprint: ResultsViewOncoprint,
    sampleMode: boolean
) {
    return remoteData<ClinicalTrackSpec[]>({
        await: () => {
            let ret: MobxPromise<any>[] = [
                oncoprint.props.store.filteredSamples,
                oncoprint.props.store.filteredPatients,
                oncoprint.props.store.clinicalAttributeIdToClinicalAttribute,
                oncoprint.alteredKeys,
            ];
            if (
                oncoprint.props.store.clinicalAttributeIdToClinicalAttribute
                    .isComplete
            ) {
                const attributes = Array.from(
                    oncoprint.selectedClinicalAttributeIds.keys()
                )
                    .map(attrId => {
                        return oncoprint.props.store
                            .clinicalAttributeIdToClinicalAttribute.result![
                            attrId
                        ];
                    })
                    .filter(x => !!x);
                ret = ret.concat(
                    oncoprint.props.store.clinicalDataCache.getAll(attributes)
                );
            }
            return ret;
        },
        invoke: async () => {
            if (oncoprint.selectedClinicalAttributeIds.size === 0) {
                return [];
            }
            const attributes = Array.from(
                oncoprint.selectedClinicalAttributeIds.keys()
            )
                .map(attrId => {
                    return oncoprint.props.store
                        .clinicalAttributeIdToClinicalAttribute.result![attrId];
                })
                .filter(x => !!x); // filter out nonexistent attributes
            return attributes.map((attribute: ClinicalAttribute) => {
                const dataAndColors = oncoprint.props.store.clinicalDataCache.get(
                    attribute
                ).result!;
                let altered_uids = undefined;
                if (oncoprint.onlyShowClinicalLegendForAlteredCases) {
                    altered_uids = oncoprint.alteredKeys.result!;
                }
                const ret: Partial<ClinicalTrackSpec> = {
                    key: oncoprint.clinicalAttributeIdToTrackKey(
                        attribute.clinicalAttributeId
                    ),
                    attributeId: attribute.clinicalAttributeId,
                    label: attribute.displayName,
                    description: attribute.description,
                    data: makeClinicalTrackData(
                        attribute,
                        sampleMode
                            ? oncoprint.props.store.filteredSamples.result!
                            : oncoprint.props.store.filteredPatients.result!,
                        dataAndColors.data
                    ),
                    altered_uids,
                };
                if (clinicalAttributeIsPROFILEDIN(attribute)) {
                    // For "Profiled-In" clinical attribute: show "No" on N/A items
                    ret.na_tooltip_value = 'No';
                    ret.na_legend_label = 'No';
                }
                if (attribute.datatype === 'NUMBER') {
                    ret.datatype = 'number';
                    if (
                        attribute.clinicalAttributeId ===
                        'FRACTION_GENOME_ALTERED'
                    ) {
                        (ret as any).numberRange = [0, 1];
                    } else if (
                        attribute.clinicalAttributeId === 'MUTATION_COUNT'
                    ) {
                        (ret as any).numberLogScale = true;
                    } else if (
                        attribute.clinicalAttributeId ===
                        SpecialAttribute.NumSamplesPerPatient
                    ) {
                        (ret as any).numberRange = [0, undefined];
                        ret.custom_options = sampleMode
                            ? [
                                  {
                                      label: 'Show one column per patient.',
                                      onClick: () =>
                                          oncoprint.controlsHandlers
                                              .onSelectColumnType!('patient'),
                                  },
                              ]
                            : [
                                  {
                                      label: 'Show one column per sample.',
                                      onClick: () =>
                                          oncoprint.controlsHandlers
                                              .onSelectColumnType!('sample'),
                                  },
                              ];
                    }
                } else if (attribute.datatype === 'STRING') {
                    ret.datatype = 'string';
                    (ret as any).category_to_color =
                        dataAndColors.categoryToColor;
                } else if (
                    attribute.clinicalAttributeId ===
                    SpecialAttribute.MutationSpectrum
                ) {
                    ret.datatype = 'counts';
                    (ret as any).countsCategoryLabels = MUTATION_SPECTRUM_CATEGORIES;
                    (ret as any).countsCategoryFills = MUTATION_SPECTRUM_FILLS;
                }
                return ret as ClinicalTrackSpec;
            });
        },
        default: [],
    });
}

export function makeHeatmapTracksMobxPromise(
    oncoprint: ResultsViewOncoprint,
    sampleMode: boolean
) {
    return remoteData<IHeatmapTrackSpec[]>({
        await: () => [
            oncoprint.props.store.filteredSamples,
            oncoprint.props.store.filteredPatients,
            oncoprint.props.store.molecularProfileIdToMolecularProfile,
            oncoprint.props.store.geneMolecularDataCache,
        ],
        invoke: async () => {
            const molecularProfileIdToMolecularProfile = oncoprint.props.store
                .molecularProfileIdToMolecularProfile.result!;
            const molecularProfileIdToAdditionalTracks =
                oncoprint.molecularProfileIdToAdditionalTracks;

            const geneProfiles = _.filter(
                _.values(molecularProfileIdToAdditionalTracks),
                d =>
                    d.molecularAlterationType !==
                    AlterationTypeConstants.GENERIC_ASSAY
            );
            const neededGenes = _.flatten(
                geneProfiles.map(v => _.keys(v.entities))
            );
            await oncoprint.props.store.geneCache.getPromise(
                neededGenes.map(g => ({ hugoGeneSymbol: g })),
                true
            );

            const cacheQueries = _.flatten(
                geneProfiles.map(entry =>
                    _.keys(entry.entities).map(g => ({
                        molecularProfileId: entry.molecularProfileId,
                        entrezGeneId: oncoprint.props.store.geneCache.get({
                            hugoGeneSymbol: g,
                        })!.data!.entrezGeneId,
                        hugoGeneSymbol: g.toUpperCase(),
                    }))
                )
            );
            await oncoprint.props.store.geneMolecularDataCache.result!.getPromise(
                cacheQueries,
                true
            );

            const samples = oncoprint.props.store.filteredSamples.result!;
            const patients = oncoprint.props.store.filteredPatients.result!;

            return cacheQueries.map(query => {
                const molecularProfileId = query.molecularProfileId;
                const gene = query.hugoGeneSymbol;
                const data = oncoprint.props.store.geneMolecularDataCache.result!.get(
                    query
                )!.data!;

                return {
                    key: `HEATMAPTRACK_${molecularProfileId},${gene}`,
                    label: gene,
                    molecularProfileId: molecularProfileId,
                    molecularProfileName:
                        molecularProfileIdToMolecularProfile[molecularProfileId]
                            .name,
                    molecularAlterationType:
                        molecularProfileIdToMolecularProfile[molecularProfileId]
                            .molecularAlterationType,
                    datatype:
                        molecularProfileIdToMolecularProfile[molecularProfileId]
                            .datatype,
                    data: makeHeatmapTrackData<
                        IGeneHeatmapTrackDatum,
                        'hugo_gene_symbol'
                    >(
                        'hugo_gene_symbol',
                        gene,
                        sampleMode ? samples : patients,
                        data
                    ),
                    trackGroupIndex:
                        molecularProfileIdToAdditionalTracks[molecularProfileId]
                            .trackGroupIndex,
                    onClickRemoveInTrackMenu: action(() => {
                        const trackGroup =
                            oncoprint.molecularProfileIdToAdditionalTracks[
                                molecularProfileId
                            ];
                        if (trackGroup) {
                            const newEntities = _.keys(
                                trackGroup.entities
                            ).filter(entity => entity !== gene);
                            if (newEntities.length === 0) {
                                oncoprint.removeHeatmapTracksByMolecularProfileId(
                                    molecularProfileId
                                );
                            } else {
                                oncoprint.addHeatmapTracks(
                                    molecularProfileId,
                                    newEntities
                                );
                            }
                        }

                        if (
                            trackGroup === undefined &&
                            oncoprint.sortMode.type === 'heatmap' &&
                            oncoprint.sortMode.clusteredHeatmapProfile ===
                                molecularProfileId
                        ) {
                            oncoprint.sortByData();
                        }
                    }),
                };
            });
        },
        default: [],
    });
}

export function makeGenericAssayProfileCategoricalTracksMobxPromise(
    oncoprint: ResultsViewOncoprint,
    sampleMode: boolean
) {
    return remoteData<ICategoricalTrackSpec[]>({
        await: () => [
            oncoprint.props.store.filteredSamples,
            oncoprint.props.store.filteredPatients,
            oncoprint.props.store.molecularProfileIdToMolecularProfile,
            oncoprint.props.store.genericAssayMolecularDataCache,
            oncoprint.props.store
                .genericAssayEntitiesGroupedByGenericAssayTypeLinkMap,
            oncoprint.props.store.genericAssayEntitiesGroupedByGenericAssayType,
        ],
        invoke: async () => {
            const molecularProfileIdToMolecularProfile = oncoprint.props.store
                .molecularProfileIdToMolecularProfile.result!;
            const molecularProfileIdToAdditionalTracks =
                oncoprint.molecularProfileIdToAdditionalTracks;

            const genericAssayProfiles = _.filter(
                molecularProfileIdToAdditionalTracks,
                d =>
                    d.molecularAlterationType ===
                    AlterationTypeConstants.GENERIC_ASSAY
            );

            const cacheQueries = _.flatten(
                genericAssayProfiles.map(entry => {
                    const type =
                        molecularProfileIdToMolecularProfile[
                            entry.molecularProfileId
                        ].genericAssayType;
                    const genericAssayEntitiesByEntityId = _.keyBy(
                        oncoprint.props.store
                            .genericAssayEntitiesGroupedByGenericAssayType
                            .result![type],
                        t => t.stableId
                    );
                    return _.keys(entry.entities).map(entityId => {
                        const entity = genericAssayEntitiesByEntityId[entityId];
                        const entityName = getGenericAssayMetaPropertyOrDefault(
                            entity,
                            COMMON_GENERIC_ASSAY_PROPERTY.NAME,
                            entityId
                        );
                        const description = getGenericAssayMetaPropertyOrDefault(
                            entity,
                            COMMON_GENERIC_ASSAY_PROPERTY.DESCRIPTION,
                            entityName
                        );

                        return {
                            molecularProfileId: entry.molecularProfileId,
                            stableId: entityId,
                            entityName,
                            description,
                        };
                    });
                })
            );

            await oncoprint.props.store.genericAssayMolecularDataCache.result!.getPromise(
                cacheQueries.map(query => {
                    return {
                        molecularProfileId: query.molecularProfileId,
                        stableId: query.stableId,
                    };
                }),
                true
            );

            const samples = oncoprint.props.store.filteredSamples.result!;
            const patients = oncoprint.props.store.filteredPatients.result!;

            const tracks = cacheQueries.map(query => {
                const molecularProfileId = query.molecularProfileId;
                const profile =
                    molecularProfileIdToMolecularProfile[molecularProfileId];
                const dataCache = oncoprint.props.store
                    .genericAssayMolecularDataCache.result!;

                const entityId = query.stableId;
                const genericAssayType = profile.genericAssayType;
                const entityLinkMap = oncoprint.props.store
                    .genericAssayEntitiesGroupedByGenericAssayTypeLinkMap
                    .result![profile.genericAssayType];

                return {
                    key: `GENERICASSAYCATEGORICALTRACK_${molecularProfileId},${entityId}`,
                    label: query.entityName,
                    description: query.description,
                    molecularProfileId: query.molecularProfileId,
                    molecularProfileName:
                        molecularProfileIdToMolecularProfile[molecularProfileId]
                            .name,
                    molecularAlterationType:
                        molecularProfileIdToMolecularProfile[molecularProfileId]
                            .molecularAlterationType,
                    datatype:
                        molecularProfileIdToMolecularProfile[molecularProfileId]
                            .datatype,
                    data: makeCategoricalTrackData(
                        profile,
                        entityId,
                        sampleMode ? samples : patients,
                        dataCache.get(query)!.data!
                    ),
                    genericAssayType: genericAssayType,
                    trackLinkUrl: entityLinkMap[entityId],
                    trackGroupIndex: molecularProfileIdToAdditionalTracks[
                        molecularProfileId
                    ]!.trackGroupIndex,
                    onClickRemoveInTrackMenu: action(() => {
                        const trackGroup = oncoprint
                            .molecularProfileIdToAdditionalTracks[
                            molecularProfileId
                        ]!;
                        if (trackGroup) {
                            const newEntities = _.keys(
                                trackGroup.entities
                            ).filter(entity => entity !== entityId);
                            oncoprint.addGenericAssayTracks(
                                molecularProfileId,
                                newEntities
                            );
                        }
                    }),
                };
            });
            return tracks;
        },
        default: [],
    });
}

export function makeGenericAssayProfileHeatmapTracksMobxPromise(
    oncoprint: ResultsViewOncoprint,
    sampleMode: boolean
) {
    return remoteData<IHeatmapTrackSpec[]>({
        await: () => [
            oncoprint.props.store.filteredSamples,
            oncoprint.props.store.filteredPatients,
            oncoprint.props.store.molecularProfileIdToMolecularProfile,
            oncoprint.props.store.genericAssayMolecularDataCache,
            oncoprint.props.store
                .genericAssayEntitiesGroupedByGenericAssayTypeLinkMap,
            oncoprint.props.store.genericAssayEntitiesGroupedByGenericAssayType,
        ],
        invoke: async () => {
            const molecularProfileIdToMolecularProfile = oncoprint.props.store
                .molecularProfileIdToMolecularProfile.result!;
            const molecularProfileIdToAdditionalTracks =
                oncoprint.molecularProfileIdToAdditionalTracks;

            const genericAssayProfiles = _.filter(
                molecularProfileIdToAdditionalTracks,
                isGenericAssayHeatmapProfile
            );

            const cacheQueries = _.flatten(
                genericAssayProfiles.map(entry => {
                    const type =
                        molecularProfileIdToMolecularProfile[
                            entry.molecularProfileId
                        ].genericAssayType;
                    const genericAssayEntitiesByEntityId = _.keyBy(
                        oncoprint.props.store
                            .genericAssayEntitiesGroupedByGenericAssayType
                            .result![type],
                        t => t.stableId
                    );
                    return _.keys(entry.entities).map(entityId => {
                        const entity = genericAssayEntitiesByEntityId[entityId];
                        const entityName = getGenericAssayMetaPropertyOrDefault(
                            entity,
                            COMMON_GENERIC_ASSAY_PROPERTY.NAME,
                            entityId
                        );
                        const description = getGenericAssayMetaPropertyOrDefault(
                            entity,
                            COMMON_GENERIC_ASSAY_PROPERTY.DESCRIPTION,
                            entityName
                        );

                        return {
                            molecularProfileId: entry.molecularProfileId,
                            stableId: entityId,
                            entityName,
                            description,
                        };
                    });
                })
            );

            await oncoprint.props.store.genericAssayMolecularDataCache.result!.getPromise(
                cacheQueries.map(query => {
                    return {
                        molecularProfileId: query.molecularProfileId,
                        stableId: query.stableId,
                    };
                }),
                true
            );

            const samples = oncoprint.props.store.filteredSamples.result!;
            const patients = oncoprint.props.store.filteredPatients.result!;

            const tracks = cacheQueries.map(query => {
                const molecularProfileId = query.molecularProfileId;
                const profile =
                    molecularProfileIdToMolecularProfile[molecularProfileId];
                const dataCache = oncoprint.props.store
                    .genericAssayMolecularDataCache.result!;

                const entityId = query.stableId;
                const genericAssayType = profile.genericAssayType;
                const pivotThreshold = profile.pivotThreshold;
                const sortOrder = profile.sortOrder;
                const entityLinkMap = oncoprint.props.store
                    .genericAssayEntitiesGroupedByGenericAssayTypeLinkMap
                    .result![profile.genericAssayType];

                return {
                    key: `GENERICASSAYHEATMAPTRACK_${molecularProfileId},${entityId}`,
                    label: query.entityName,
                    description: query.description,
                    molecularProfileId: query.molecularProfileId,
                    molecularProfileName:
                        molecularProfileIdToMolecularProfile[molecularProfileId]
                            .name,
                    molecularAlterationType:
                        molecularProfileIdToMolecularProfile[molecularProfileId]
                            .molecularAlterationType,
                    datatype:
                        molecularProfileIdToMolecularProfile[molecularProfileId]
                            .datatype,
                    data: makeHeatmapTrackData<
                        IGenericAssayHeatmapTrackDatum,
                        'entityId'
                    >(
                        'entityId',
                        entityId,
                        sampleMode ? samples : patients,
                        dataCache.get(query)!.data!.map(d => ({
                            ...d,
                            value: parseFloat(d.value),
                        })),
                        sortOrder
                    ),
                    genericAssayType: genericAssayType,
                    pivotThreshold: pivotThreshold,
                    sortOrder: sortOrder,
                    trackLinkUrl: entityLinkMap[entityId],
                    trackGroupIndex: molecularProfileIdToAdditionalTracks[
                        molecularProfileId
                    ]!.trackGroupIndex,
                    onClickRemoveInTrackMenu: action(() => {
                        const trackGroup = oncoprint
                            .molecularProfileIdToAdditionalTracks[
                            molecularProfileId
                        ]!;
                        if (trackGroup) {
                            const newEntities = _.keys(
                                trackGroup.entities
                            ).filter(entity => entity !== entityId);
                            oncoprint.addHeatmapTracks(
                                molecularProfileId,
                                newEntities
                            );
                        }
                        if (
                            trackGroup === undefined &&
                            oncoprint.sortMode.type === 'heatmap' &&
                            oncoprint.sortMode.clusteredHeatmapProfile ===
                                molecularProfileId
                        ) {
                            oncoprint.sortByData();
                        }
                    }),
                };
            });
            return tracks;
        },
        default: [],
    });
}

export function makeGenesetHeatmapExpansionsMobxPromise(
    oncoprint: ResultsViewOncoprint,
    sampleMode: boolean
) {
    return remoteData<IGenesetExpansionMap>({
        await: () => [
            oncoprint.props.store.filteredSamples,
            oncoprint.props.store.filteredPatients,
            oncoprint.props.store.molecularProfileIdToMolecularProfile,
            oncoprint.props.store.geneMolecularDataCache,
            oncoprint.props.store.genesetCorrelatedGeneCache,
        ],
        invoke: async () => {
            const samples = oncoprint.props.store.filteredSamples.result!;
            const patients = oncoprint.props.store.filteredPatients.result!;
            const molecularProfileIdToMolecularProfile = oncoprint.props.store
                .molecularProfileIdToMolecularProfile.result!;
            const dataCache = oncoprint.props.store.geneMolecularDataCache
                .result!;
            const genesetGeneCache = oncoprint.props.store
                .genesetCorrelatedGeneCache.result!;

            const trackGroupIndex = oncoprint.genesetHeatmapTrackGroupIndex;
            const expansionsByGenesetTrack =
                oncoprint.expansionsByGenesetHeatmapTrackKey;

            // list all the genes in an array of plain, non-observable objects,
            // as observable arrays cannot be safely passed to external libs
            const cacheQueries: {
                entrezGeneId: number;
                molecularProfileId: string;
            }[] = _.flatten(
                Array.from(expansionsByGenesetTrack.values()).map(mobxArray =>
                    mobxArray.slice()
                )
            ).map(({ entrezGeneId, molecularProfileId }) => ({
                entrezGeneId,
                molecularProfileId,
            }));
            await dataCache.getPromise(cacheQueries, true);

            const tracksByGenesetTrack: {
                [genesetTrackKey: string]: IHeatmapTrackSpec[];
            } = {};
            expansionsByGenesetTrack.toJSON().forEach(([gsTrack, genes]) => {
                tracksByGenesetTrack[gsTrack] = genes.map(
                    ({
                        entrezGeneId,
                        hugoGeneSymbol,
                        molecularProfileId,
                        correlationValue,
                    }) => {
                        const data = dataCache.get({
                            entrezGeneId,
                            molecularProfileId,
                        })!.data!;
                        const profile =
                            molecularProfileIdToMolecularProfile[
                                molecularProfileId
                            ];
                        return {
                            key: `EXPANSIONTRACK_${gsTrack},${hugoGeneSymbol},GROUP${trackGroupIndex!}`,
                            label: '  ' + hugoGeneSymbol,
                            labelColor: 'grey',
                            info: correlationValue.toFixed(2),
                            molecularProfileId: molecularProfileId,
                            molecularAlterationType:
                                profile.molecularAlterationType,
                            datatype: profile.datatype,
                            data: makeHeatmapTrackData<
                                IGeneHeatmapTrackDatum,
                                'hugo_gene_symbol'
                            >(
                                'hugo_gene_symbol',
                                hugoGeneSymbol,
                                sampleMode ? samples : patients,
                                data
                            ),
                            trackGroupIndex: trackGroupIndex!,
                            onRemove: makeGenesetHeatmapUnexpandHandler(
                                oncoprint,
                                gsTrack,
                                entrezGeneId,
                                trackGroupIndex!,
                                genesetGeneCache.reset.bind(
                                    genesetGeneCache,
                                    gsTrack
                                )
                            ),
                        };
                    }
                );
            });
            return tracksByGenesetTrack;
        },
        default: {},
    });
}

export function makeGenesetHeatmapTracksMobxPromise(
    oncoprint: ResultsViewOncoprint,
    sampleMode: boolean,
    expansionMapPromise: MobxPromise<IGenesetExpansionMap>
) {
    return remoteData<IGenesetHeatmapTrackSpec[]>({
        await: () => [
            oncoprint.props.store.filteredSamples,
            oncoprint.props.store.filteredPatients,
            oncoprint.props.store.genesetMolecularProfile,
            oncoprint.props.store.genesetMolecularDataCache,
            oncoprint.props.store.genesetLinkMap,
            oncoprint.props.store.genesetCorrelatedGeneCache,
            expansionMapPromise,
        ],
        invoke: async () => {
            const samples = oncoprint.props.store.filteredSamples.result!;
            const patients = oncoprint.props.store.filteredPatients.result!;
            const molecularProfile = oncoprint.props.store
                .genesetMolecularProfile.result!;
            const dataCache = oncoprint.props.store.genesetMolecularDataCache
                .result!;
            const genesetLinkMap = oncoprint.props.store.genesetLinkMap.result!;
            const correlatedGeneCache = oncoprint.props.store
                .genesetCorrelatedGeneCache.result!;
            const expansions = expansionMapPromise.result!;

            // observe computed property based on other tracks
            const trackGroupIndex = oncoprint.genesetHeatmapTrackGroupIndex;

            if (!molecularProfile.isApplicable) {
                return [];
            }
            const molecularProfileId =
                molecularProfile.value.molecularProfileId;
            const genesetIds = oncoprint.props.store.genesetIds;

            const cacheQueries = genesetIds.map(genesetId => ({
                molecularProfileId,
                genesetId,
            }));
            await dataCache.getPromise(cacheQueries, true);

            return genesetIds.map(genesetId => {
                const expansionMapKey = `GENESETHEATMAPTRACK_${molecularProfileId},${genesetId}`;
                return {
                    key: `GENESETHEATMAPTRACK_${molecularProfileId},${genesetId},GROUP${trackGroupIndex!}`,
                    label: genesetId,
                    molecularProfileId,
                    molecularAlterationType:
                        molecularProfile.value.molecularAlterationType,
                    datatype: molecularProfile.value.datatype,
                    trackLinkUrl: genesetLinkMap[genesetId],
                    data: makeHeatmapTrackData<
                        IGenesetHeatmapTrackDatum,
                        'geneset_id'
                    >(
                        'geneset_id',
                        genesetId,
                        sampleMode ? samples : patients,
                        // TODO: GenesetMolecularData still has type value of
                        // string, other NumericGeneMolecularData have number
                        dataCache
                            .get({ molecularProfileId, genesetId })!
                            .data!.map(d => ({
                                ...d!,
                                value: parseFloat(d.value!),
                            }))
                    ),
                    trackGroupIndex: trackGroupIndex!,
                    expansionCallback: makeGenesetHeatmapExpandHandler(
                        oncoprint,
                        expansionMapKey,
                        { molecularProfileId, genesetId },
                        correlatedGeneCache
                    ),
                    expansionTrackList: expansions[expansionMapKey],
                };
            });
        },
        default: [],
    });
}

export function extractGenericAssaySelections(
    text: string,
    selectedGenericAssayEntityIds: string[],
    genericAssayEntitiesOptionsByValueMap: { [entityId: string]: ISelectOption }
): string {
    // get values from input string
    const elements = splitHeatmapTextField(text);

    // check values for valid entity ids
    const detectedGenericAssayEntityIds: string[] = [];
    _.each(elements, (d: string) => {
        if (d in genericAssayEntitiesOptionsByValueMap) {
            detectedGenericAssayEntityIds.push(d);
            if (!selectedGenericAssayEntityIds.includes(d)) {
                selectedGenericAssayEntityIds.push(d);
            }
        }
    });

    // remove valid entity ids from the input string
    if (detectedGenericAssayEntityIds.length > 0) {
        _.each(detectedGenericAssayEntityIds, (d: string) => {
            text = text.replace(d, '');
        });
    }

    // return the input string
    return text
        .trim()
        .replace('\t+', '\t')
        .replace(' +', ' ');
}

export function splitHeatmapTextField(text: string): string[] {
    text = text.replace(/[,\s\n]+/g, ' ').trim();
    return _.uniq(text.split(/[,\s\n]+/));
}
