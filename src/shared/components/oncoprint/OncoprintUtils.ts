import OncoprintJS, {RuleSetParams, TrackSortComparator} from "oncoprintjs";
import {
    ClinicalTrackSpec,
    GeneticTrackSpec,
    IGeneHeatmapTrackDatum,
    IGeneHeatmapTrackSpec,
    IGenesetHeatmapTrackDatum,
    IGenesetHeatmapTrackSpec,
} from "./Oncoprint";
import {genetic_rule_set_same_color_for_all_no_recurrence,
    genetic_rule_set_same_color_for_all_recurrence,
    genetic_rule_set_different_colors_no_recurrence,
    genetic_rule_set_different_colors_recurrence} from "./geneticrules";
import {OncoprintPatientGeneticTrackData, OncoprintSampleGeneticTrackData} from "../../lib/QuerySession";
import {
    AlterationTypeConstants,
    AnnotatedExtendedAlteration,
    AnnotatedMutation, CaseAggregatedData, ExtendedAlteration,
    ResultsViewPageStore
} from "../../../pages/resultsView/ResultsViewPageStore";
import {CoverageInformation} from "../../../pages/resultsView/ResultsViewPageStoreUtils";
import {remoteData} from "../../api/remoteData";
import {
    makeClinicalTrackData,
    makeGeneticTrackData,
    makeHeatmapTrackData
} from "./DataUtils";
import ResultsViewOncoprint from "./ResultsViewOncoprint";
import _ from "lodash";
import {action, runInAction, ObservableMap, IObservableArray} from "mobx";
import {MobxPromise} from "mobxpromise";
import GenesetCorrelatedGeneCache from "shared/cache/GenesetCorrelatedGeneCache";
import Spec = Mocha.reporters.Spec;
import {UnflattenedOQLLineFilterOutput, isMergedTrackFilter} from "../../lib/oql/oqlfilter";
import {
    ClinicalAttribute,
    MolecularProfile,
    Patient,
    Sample
} from "../../api/generated/CBioPortalAPI";
import {SpecialAttribute} from "../../cache/OncoprintClinicalDataCache";

interface IGenesetExpansionMap {
        [genesetTrackKey: string]: IGeneHeatmapTrackSpec[];
}

function makeGenesetHeatmapExpandHandler(
    oncoprint: ResultsViewOncoprint,
    track_key: string,
    query: {molecularProfileId: string, genesetId: string},
    cache: GenesetCorrelatedGeneCache,
) {
    cache.initIteration(track_key, query);
    return (async () => {
        const new_genes = (await cache.next(track_key, 5)).map(
            ({
                entrezGeneId, hugoGeneSymbol, correlationValue,
                zScoreGeneticProfileId
            }) => ({
                entrezGeneId, hugoGeneSymbol, correlationValue,
                molecularProfileId: zScoreGeneticProfileId
            })
        );
        runInAction('genesetHeatmapExpansion', () => {
            const list = (
                oncoprint.expansionsByGenesetHeatmapTrackKey.get(track_key)
                || []
            );
            oncoprint.expansionsByGenesetHeatmapTrackKey.set(
                track_key, list.concat(new_genes)
            );
        });
    });
}

function makeGenesetHeatmapUnexpandHandler(
    oncoprint: ResultsViewOncoprint,
    parentKey: string,
    expansionEntrezGeneId: number,
    myTrackGroup: number,
    onRemoveLast: () => void
) {
    return action('genesetHeatmapUnexpansion', () => {
        const list = oncoprint.expansionsByGenesetHeatmapTrackKey.get(parentKey);
        if (list) {
            // only remove if the expansion if it isn't needed in another track
            // group than the one this track is being removed from; keep the
            // expansion if the track is being re-rendered into a different
            // track group
            if (myTrackGroup === oncoprint.genesetHeatmapTrackGroup) {
                // this is a MobX Observable Array, so it should have findIndex
                // implemented even in IE
                const indexToRemove = list.findIndex(
                    ({entrezGeneId}) => entrezGeneId === expansionEntrezGeneId
                );
                if (indexToRemove !== -1) {
                    list.splice(indexToRemove, 1);
                    if (!list.length) {
                        onRemoveLast();
                    }
                }
            }
        } else {
            throw new Error(`Track '${parentKey}' has no expansions to remove.`);
        }
    });
}

function formatGeneticTrackLabel(oqlFilter: UnflattenedOQLLineFilterOutput<object>): string {
    return (isMergedTrackFilter(oqlFilter)
        ? oqlFilter.label || oqlFilter.list.map(geneLine => geneLine.gene).join(' / ')
        : oqlFilter.gene
    );
}

function formatGeneticTrackOql(oqlFilter: UnflattenedOQLLineFilterOutput<object>): string {
    return (isMergedTrackFilter(oqlFilter)
        ? `[${oqlFilter.list.map(geneLine => geneLine.oql_line).join(' ')}]`
        : oqlFilter.oql_line
    );
}

export function doWithRenderingSuppressedAndSortingOff(oncoprint:OncoprintJS<any>, task:()=>void) {
    oncoprint.suppressRendering();
    oncoprint.keepSorted(false);
    task();
    oncoprint.keepSorted(true);
    oncoprint.releaseRendering();
}

export function getHeatmapTrackRuleSetParams(molecularAlterationType: string) {
    let value_range:[number, number];
    let legend_label:string;
    let colors:number[][];
    let value_stop_points:number[];
    if (molecularAlterationType === "METHYLATION") {
        value_range = [0,1];
        legend_label = "Methylation Heatmap";
        value_stop_points = [0,0.35,1];
        colors = [[0,0,255,1], [255,255,255,1], [255,0,0,1]];
    } else {
        value_range = [-3,3];
        legend_label = "Expression Heatmap";
        value_stop_points = [-3, 0, 3];
        colors = [[0,0,255,1], [0,0,0,1], [255,0,0,1]];
    }
    return {
        type: 'gradient' as 'gradient',
        legend_label,
        value_key: "profile_data",
        value_range,
        colors,
        value_stop_points,
        null_color: 'rgba(224,224,224,1)'
    };
}

export function getGenesetHeatmapTrackRuleSetParams() {
    return {
        type: 'gradient' as 'gradient',
        legend_label: 'Gene Set Heatmap',
        value_key: 'profile_data',
        value_range: [-1,1] as [number, number],
        /*
         * The PiYG colormap is based on color specifications and designs
         * developed by Cynthia Brewer (http://colorbrewer.org).
         * The palette has been included under the terms
         * of an Apache-style license.
         */
        colors: [
            [ 39, 100,  25, 1],
            [ 77, 146,  33, 1],
            [127, 188,  65, 1],
            [184, 225, 134, 1],
            [230, 245, 208, 1],
            [247, 247, 247, 1],
            [253, 224, 239, 1],
            [241, 182, 218, 1],
            [222, 119, 174, 1],
            [197,  27, 125, 1],
            [142,   1,  82, 1]
        ],
        value_stop_points: [
            -1, -0.8, -0.6, -0.4, -0.2,
            0, 0.2, 0.4, 0.6, 0.8, 1
        ],
        null_color: 'rgba(224,224,224,1)'
    };
}

export function getGeneticTrackRuleSetParams(distinguishMutationType?:boolean, distinguishDrivers?:boolean):RuleSetParams {
    if (!distinguishMutationType && !distinguishDrivers) {
        return genetic_rule_set_same_color_for_all_no_recurrence;
    } else if (!distinguishMutationType && distinguishDrivers) {
        return genetic_rule_set_same_color_for_all_recurrence;
    } else if (distinguishMutationType && !distinguishDrivers) {
        return genetic_rule_set_different_colors_no_recurrence;
    } else {
        return genetic_rule_set_different_colors_recurrence;
    }
}

export function getClinicalTrackRuleSetParams(track:ClinicalTrackSpec) {
    if (track.datatype === "number") {
        return {
            type: 'bar',
            value_key: "attr_val",
            value_range: track.numberRange,
            log_scale: track.numberLogScale
        };
    } else if (track.datatype === "counts") {
        return {
            type: "stacked_bar",
            value_key: "attr_val",
            categories: track.countsCategoryLabels,
            fills: track.countsCategoryFills
        };
    } else {
        return {
            type: 'categorical',
            category_key: "attr_val"
        };
    }
}

export function percentAltered(altered:number, sequenced:number) {
    if (sequenced === 0) {
        return "N/P";
    }

    const p = altered/sequenced;
    const percent = 100*p;
    let fixed:string;
    if (p < 0.03) {
        // if less than 3%, use one decimal digit
        fixed = percent.toFixed(1);
        // if last digit is a 0, use no decimal digits
        if (fixed[fixed.length-1] === "0") {
            fixed = percent.toFixed();
        }
    } else {
        fixed = percent.toFixed();
    }
    return fixed+"%";
}

export function alterationInfoForCaseAggregatedDataByOQLLine(
    sampleMode: boolean,
    data: {
        cases: CaseAggregatedData<AnnotatedExtendedAlteration>,
        oql: {gene: string} | string[]
    },
    sequencedSampleKeysByGene: {[hugoGeneSymbol:string]:string[]},
    sequencedPatientKeysByGene: {[hugoGeneSymbol:string]:string[]})
{
    const geneSymbolArray = (data.oql instanceof Array
        ? data.oql
        : [data.oql.gene]
    );
    const sequenced = (sampleMode
        ? _.uniq(_.flatMap(geneSymbolArray, symbol => sequencedSampleKeysByGene[symbol])).length
        : _.uniq(_.flatMap(geneSymbolArray, symbol => sequencedPatientKeysByGene[symbol])).length
    );

    const altered =
        sampleMode ?
            Object.keys(data.cases.samples).filter(k=>!!data.cases.samples[k].length).length :
            Object.keys(data.cases.patients).filter(k=>!!data.cases.patients[k].length).length;

    return {
        sequenced,
        altered,
        percent: percentAltered(altered, sequenced)
    };
}

interface IGeneticTrackAppState {
    sampleMode: boolean;
    samples: Pick<Sample, 'sampleId'|'studyId'|'uniqueSampleKey'>[];
    patients: Pick<Patient, 'patientId'|'studyId'|'uniquePatientKey'>[];
    coverageInformation: CoverageInformation;
    sequencedSampleKeysByGene: any;
    sequencedPatientKeysByGene: any;
    selectedMolecularProfiles: MolecularProfile[];
    expansionIndexMap: ObservableMap<number[]>;
}
export function makeGeneticTrackWith({
    sampleMode,
    samples,
    patients,
    coverageInformation,
    sequencedSampleKeysByGene,
    sequencedPatientKeysByGene,
    selectedMolecularProfiles,
    expansionIndexMap
}: IGeneticTrackAppState) {
    return function makeTrack(
        {cases: dataByCase, oql, list: subTrackData}: {
            cases: CaseAggregatedData<AnnotatedExtendedAlteration>,
            oql: UnflattenedOQLLineFilterOutput<object>,
            list?: {
                cases: CaseAggregatedData<AnnotatedExtendedAlteration>,
                oql: UnflattenedOQLLineFilterOutput<object>
            }[]
        },
        index: number,
        parentKey?: string
    ): GeneticTrackSpec {
        const geneSymbolArray = (isMergedTrackFilter(oql)
            ? oql.list.map(({gene}) => gene)
            : [oql.gene]
        );
        const data = (sampleMode
            ? makeGeneticTrackData(dataByCase.samples, geneSymbolArray, samples as Sample[], coverageInformation, selectedMolecularProfiles)
            : makeGeneticTrackData(dataByCase.patients, geneSymbolArray, patients as Patient[], coverageInformation, selectedMolecularProfiles)
        );
        const info = alterationInfoForCaseAggregatedDataByOQLLine(
            sampleMode,
            {cases: dataByCase, oql: geneSymbolArray},
            sequencedSampleKeysByGene,
            sequencedPatientKeysByGene
        ).percent;
        const trackKey = (parentKey === undefined
            ? `GENETICTRACK_${index}`
            : `${parentKey}_EXPANSION_${index}`
        );
        const expansionCallback = (isMergedTrackFilter(oql)
            ? () => { expansionIndexMap.set(trackKey, _.range(oql.list.length)); }
            : undefined
        );
        const removeCallback = (parentKey !== undefined
            ? () => {
                (expansionIndexMap.get(parentKey) as IObservableArray<number>
                ).remove(index);
            }
            : undefined
        );
        const expansions: GeneticTrackSpec[] = (
            expansionIndexMap.get(trackKey) || []
        ).map(expansionIndex => makeTrack(
            subTrackData![expansionIndex], expansionIndex, trackKey
        ));
        return {
            key: trackKey,
            label: (parentKey !== undefined ? '  ' : '') + formatGeneticTrackLabel(oql),
            labelColor: parentKey !== undefined ? 'grey' : undefined,
            oql: formatGeneticTrackOql(oql),
            info,
            data,
            expansionCallback,
            removeCallback,
            expansionTrackList: expansions.length ? expansions : undefined
        };
    };
}

export function makeGeneticTracksMobxPromise(oncoprint:ResultsViewOncoprint, sampleMode:boolean) {
    return remoteData<GeneticTrackSpec[]>({
        await:()=>[
            oncoprint.props.store.samples,
            oncoprint.props.store.patients,
            oncoprint.props.store.putativeDriverFilteredCaseAggregatedDataByUnflattenedOQLLine,
            oncoprint.props.store.coverageInformation,
            oncoprint.props.store.sequencedSampleKeysByGene,
            oncoprint.props.store.sequencedPatientKeysByGene,
            oncoprint.props.store.selectedMolecularProfiles
        ],
        invoke: async () => {
            const trackFunction = makeGeneticTrackWith({
                sampleMode,
                samples: oncoprint.props.store.samples.result!,
                patients: oncoprint.props.store.patients.result!,
                coverageInformation: oncoprint.props.store.coverageInformation.result!,
                sequencedSampleKeysByGene: oncoprint.props.store.sequencedSampleKeysByGene.result!,
                sequencedPatientKeysByGene: oncoprint.props.store.sequencedPatientKeysByGene.result!,
                selectedMolecularProfiles: oncoprint.props.store.selectedMolecularProfiles.result!,
                expansionIndexMap: oncoprint.expansionsByGeneticTrackKey
            });
            return oncoprint.props.store.putativeDriverFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.map(
                (alterationData, trackIndex) => trackFunction(
                    alterationData, trackIndex, undefined
                )
            );
        },
        default: [],
    });
}

export function makeClinicalTracksMobxPromise(oncoprint:ResultsViewOncoprint, sampleMode:boolean) {
    return remoteData<ClinicalTrackSpec[]>({
        await:()=>{
            let ret:MobxPromise<any>[] = [
                oncoprint.props.store.samples,
                oncoprint.props.store.patients,
                oncoprint.clinicalAttributesById
            ];
            if (oncoprint.clinicalAttributesById.isComplete) {
                const attributes = oncoprint.selectedClinicalAttributeIds.keys().map(attrId=>{
                    return oncoprint.clinicalAttributesById.result![attrId];
                }).filter(x=>!!x);
                ret = ret.concat(oncoprint.props.store.oncoprintClinicalDataCache.getAll(attributes));
            }
            return ret;
        },
        invoke: async()=>{
            if (oncoprint.selectedClinicalAttributeIds.keys().length === 0) {
                return [];
            }
            const attributes = oncoprint.selectedClinicalAttributeIds.keys().map(attrId=>{
                return oncoprint.clinicalAttributesById.result![attrId];
            }).filter(x=>!!x);
            return attributes.map((attribute:ClinicalAttribute)=>{
                const data = oncoprint.props.store.oncoprintClinicalDataCache.get(attribute).result!;
                const ret:Partial<ClinicalTrackSpec> = {
                    key: oncoprint.clinicalAttributeIdToTrackKey(attribute.clinicalAttributeId),
                    label: attribute.displayName,
                    description: attribute.description,
                    data:makeClinicalTrackData(
                        attribute,
                        sampleMode ? oncoprint.props.store.samples.result! : oncoprint.props.store.patients.result!,
                        data
                    ),
                };
                if (attribute.datatype === "NUMBER") {
                    ret.datatype = "number";
                    if (attribute.clinicalAttributeId === SpecialAttribute.FractionGenomeAltered) {
                        (ret as any).numberRange = [0,1];
                    } else if (attribute.clinicalAttributeId === SpecialAttribute.MutationCount) {
                        (ret as any).numberLogScale = true;
                    }
                } else if (attribute.datatype === "STRING") {
                    ret.datatype = "string";
                } else if (attribute.clinicalAttributeId === SpecialAttribute.MutationSpectrum) {
                    ret.datatype = "counts";
                    (ret as any).countsCategoryLabels = ["C>A", "C>G", "C>T", "T>A", "T>C", "T>G"];
                    (ret as any).countsCategoryFills = ['#3D6EB1', '#8EBFDC', '#DFF1F8', '#FCE08E', '#F78F5E', '#D62B23'];
                }
                if (attribute.clinicalAttributeId.indexOf(SpecialAttribute.Profiled) === 0) {
                    ret.na_legend_label = "No";
                }
                return ret as ClinicalTrackSpec;
            });
        },
        default: []
    });
}

export function makeHeatmapTracksMobxPromise(oncoprint:ResultsViewOncoprint, sampleMode:boolean) {
    return remoteData<IGeneHeatmapTrackSpec[]>({
        await:()=>[
            oncoprint.props.store.samples,
            oncoprint.props.store.patients,
            oncoprint.props.store.molecularProfileIdToMolecularProfile,
            oncoprint.props.store.geneMolecularDataCache
        ],
        invoke:async()=>{
            const molecularProfileIdToMolecularProfile = oncoprint.props.store.molecularProfileIdToMolecularProfile.result!;
            const molecularProfileIdToHeatmapTracks = oncoprint.molecularProfileIdToHeatmapTracks;

            const neededGenes = _.flatten(molecularProfileIdToHeatmapTracks.values().map(v=>v.genes.keys()));
            const genes = await oncoprint.props.store.geneCache.getPromise(neededGenes.map(g=>({hugoGeneSymbol:g})), true);

            const cacheQueries = _.flatten(molecularProfileIdToHeatmapTracks.entries().map(entry=>(
                entry[1].genes.keys().map(g=>({
                    molecularProfileId: entry[0],
                    entrezGeneId: oncoprint.props.store.geneCache.get({ hugoGeneSymbol:g })!.data!.entrezGeneId,
                    hugoGeneSymbol: g.toUpperCase()
                }))
            )));
            await oncoprint.props.store.geneMolecularDataCache.result!.getPromise(cacheQueries, true);

            const samples = oncoprint.props.store.samples.result!;
            const patients = oncoprint.props.store.patients.result!;

            return cacheQueries.map(query=>{
                const molecularProfileId = query.molecularProfileId;
                const gene = query.hugoGeneSymbol;
                const data = oncoprint.props.store.geneMolecularDataCache.result!.get(query)!.data!;
                return {
                    key: `HEATMAPTRACK_${molecularProfileId},${gene}`,
                    label: gene,
                    molecularProfileId: molecularProfileId,
                    molecularAlterationType: molecularProfileIdToMolecularProfile[molecularProfileId].molecularAlterationType,
                    datatype: molecularProfileIdToMolecularProfile[molecularProfileId].datatype,
                    data: makeHeatmapTrackData<IGeneHeatmapTrackDatum, 'hugo_gene_symbol'>(
                        'hugo_gene_symbol',
                        gene,
                        sampleMode ? samples : patients,
                        data
                    ),
                    trackGroupIndex: molecularProfileIdToHeatmapTracks.get(molecularProfileId)!.trackGroupIndex,
                    onRemove:action(()=>{
                        const trackGroup = molecularProfileIdToHeatmapTracks.get(molecularProfileId);
                        if (trackGroup) {
                            trackGroup.genes.delete(gene);
                            if (!trackGroup.genes.size) {
                                molecularProfileIdToHeatmapTracks.delete(molecularProfileId);
                            }
                        }
                        if (!molecularProfileIdToHeatmapTracks.has(molecularProfileId)
                            && oncoprint.sortMode.type === "heatmap"
                            && oncoprint.sortMode.clusteredHeatmapProfile === molecularProfileId
                        ) {
                            oncoprint.sortByData();
                        }
                    })
                };
            });
        },
        default: []
    });
}

export function makeGenesetHeatmapExpansionsMobxPromise(oncoprint:ResultsViewOncoprint, sampleMode:boolean) {
    return remoteData<IGenesetExpansionMap>({
        await: () => [
            oncoprint.props.store.samples,
            oncoprint.props.store.patients,
            oncoprint.props.store.molecularProfileIdToMolecularProfile,
            oncoprint.props.store.geneMolecularDataCache,
            oncoprint.props.store.genesetCorrelatedGeneCache
        ],
        invoke: async () => {
            const samples = oncoprint.props.store.samples.result!;
            const patients = oncoprint.props.store.patients.result!;
            const molecularProfileIdToMolecularProfile = oncoprint.props.store.molecularProfileIdToMolecularProfile.result!;
            const dataCache = oncoprint.props.store.geneMolecularDataCache.result!;
            const genesetGeneCache = oncoprint.props.store.genesetCorrelatedGeneCache.result!;

            const trackGroup = oncoprint.genesetHeatmapTrackGroup;
            const expansionsByGenesetTrack = oncoprint.expansionsByGenesetHeatmapTrackKey;

            // list all the genes in an array of plain, non-observable objects,
            // as observable arrays cannot be safely passed to external libs
            const cacheQueries: ({entrezGeneId: number, molecularProfileId: string})[] =
                _.flatten(expansionsByGenesetTrack.values().map(mobxArray => mobxArray.slice()))
                .map(({entrezGeneId, molecularProfileId}) => ({entrezGeneId, molecularProfileId}));
            await dataCache.getPromise(cacheQueries, true);

            const tracksByGenesetTrack: {[genesetTrackKey: string]: IGeneHeatmapTrackSpec[]} = {};
            expansionsByGenesetTrack.entries().forEach(
                ([gsTrack, genes]) => {
                    tracksByGenesetTrack[gsTrack] = genes.map(
                        ({entrezGeneId, hugoGeneSymbol, molecularProfileId, correlationValue}) => {
                            const data = dataCache.get({entrezGeneId, molecularProfileId})!.data!;
                            const profile = molecularProfileIdToMolecularProfile[molecularProfileId];
                            return {
                                key: `EXPANSIONTRACK_${gsTrack},${hugoGeneSymbol},GROUP${trackGroup}`,
                                label: '  ' + hugoGeneSymbol,
                                labelColor: 'grey',
                                info: correlationValue.toFixed(2),
                                molecularProfileId: molecularProfileId,
                                molecularAlterationType: profile.molecularAlterationType,
                                datatype: profile.datatype,
                                data: makeHeatmapTrackData<IGeneHeatmapTrackDatum, 'hugo_gene_symbol'>(
                                    'hugo_gene_symbol',
                                    hugoGeneSymbol,
                                    sampleMode ? samples : patients,
                                    data
                                ),
                                trackGroupIndex: trackGroup,
                                onRemove: makeGenesetHeatmapUnexpandHandler(
                                    oncoprint, gsTrack, entrezGeneId, trackGroup,
                                    genesetGeneCache.reset.bind(
                                        genesetGeneCache, gsTrack
                                    )
                                )
                            };
                        }
                    );
                }
            );
            return tracksByGenesetTrack;
        },
        default: {}
    });
}

export function makeGenesetHeatmapTracksMobxPromise(
    oncoprint: ResultsViewOncoprint,
    sampleMode: boolean,
    expansionMapPromise: MobxPromise<IGenesetExpansionMap>
) {
    return remoteData<IGenesetHeatmapTrackSpec[]>({
        await: () => [
            oncoprint.props.store.samples,
            oncoprint.props.store.patients,
            oncoprint.props.store.genesetMolecularProfile,
            oncoprint.props.store.genesetMolecularDataCache,
            oncoprint.props.store.genesetLinkMap,
            oncoprint.props.store.genesetCorrelatedGeneCache,
            expansionMapPromise
        ],
        invoke: async () => {
            const samples = oncoprint.props.store.samples.result!;
            const patients = oncoprint.props.store.patients.result!;
            const molecularProfile = oncoprint.props.store.genesetMolecularProfile.result!;
            const dataCache = oncoprint.props.store.genesetMolecularDataCache.result!;
            const genesetLinkMap = oncoprint.props.store.genesetLinkMap.result!;
            const correlatedGeneCache = oncoprint.props.store.genesetCorrelatedGeneCache.result!;
            const expansions = expansionMapPromise.result!;

            // observe computed property based on other tracks
            const trackGroup = oncoprint.genesetHeatmapTrackGroup;

            if (!molecularProfile.isApplicable) {
                return [];
            }
            const molecularProfileId = molecularProfile.value.molecularProfileId;
            const genesetIds = oncoprint.props.store.genesetIds;

            const cacheQueries = genesetIds.map((genesetId) => ({molecularProfileId, genesetId}));
            await dataCache.getPromise(cacheQueries, true);

            return genesetIds.map((genesetId) => {
                const expansionMapKey = `GENESETHEATMAPTRACK_${molecularProfileId},${genesetId}`;
                return {
                    key: `GENESETHEATMAPTRACK_${molecularProfileId},${genesetId},GROUP${trackGroup}`,
                    label: genesetId,
                    molecularProfileId,
                    molecularAlterationType: molecularProfile.value.molecularAlterationType,
                    datatype: molecularProfile.value.datatype,
                    trackLinkUrl: genesetLinkMap[genesetId],
                    data: makeHeatmapTrackData<IGenesetHeatmapTrackDatum, 'geneset_id'>(
                        'geneset_id',
                        genesetId,
                        sampleMode ? samples : patients,
                        // TODO: GenesetMolecularData still has type value of
                        // string, other NumericGeneMolecularData have number
                        dataCache.get({molecularProfileId, genesetId})!.data!.map(d => ({...d!, value: parseFloat(d.value!)}))
                    ),
                    trackGroupIndex: trackGroup,
                    expansionCallback: makeGenesetHeatmapExpandHandler(
                        oncoprint,
                        expansionMapKey,
                        {molecularProfileId, genesetId},
                        correlatedGeneCache
                    ),
                    expansionTrackList: expansions[expansionMapKey]
                };
            });
        },
        default: []
    });
}
