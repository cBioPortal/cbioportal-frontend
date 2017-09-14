import {
    IOncoprintProps, default as Oncoprint, GeneticTrackSpec, HeatmapTrackSpec,
    ClinicalTrackSpec
} from "./Oncoprint";
import OncoprintJS, {TrackId} from "oncoprintjs";
import {ObservableMap} from "mobx";
import _ from "lodash";
import {getClinicalTrackRuleSetParams, getGeneticTrackRuleSetParams} from "./OncoprintUtils";
import {getClinicalTrackSortComparator, getGeneticTrackSortComparator, heatmapTrackSortComparator} from "./SortUtils";
import {makeClinicalTrackTooltip, makeGeneticTrackTooltip, makeHeatmapTrackTooltip} from "./TooltipUtils";

export function transition(
    nextProps:IOncoprintProps,
    prevProps:Partial<IOncoprintProps>,
    oncoprint:OncoprintJS<any>,
    getTrackSpecKeyToTrackId:()=>{[key:string]:TrackId}
) {
    const notKeepingSorted = shouldNotKeepSorted(nextProps, prevProps);
    const suppressingRendering = shouldSuppressRendering(nextProps, prevProps);
    if (suppressingRendering) {
        oncoprint.suppressRendering();
    }
    if (notKeepingSorted) {
        oncoprint.keepSorted(false);
    }
    transitionSortConfig(nextProps, oncoprint);
    transitionWhitespaceBetweenColumns(nextProps, prevProps, oncoprint);
    transitionShowMinimap(nextProps, prevProps, oncoprint);
    transitionOnMinimapCloseCallback(nextProps, prevProps, oncoprint);
    transitionTracks(nextProps, prevProps, oncoprint, getTrackSpecKeyToTrackId);
    transitionHiddenIds(nextProps, prevProps, oncoprint);
    transitionHorzZoomToFit(nextProps, prevProps, oncoprint);
    transitionShowClinicalTrackLegends(nextProps, prevProps, oncoprint, getTrackSpecKeyToTrackId);
    if (notKeepingSorted) {
        oncoprint.keepSorted(true);
    }
    if (suppressingRendering) {
        oncoprint.releaseRendering();
    }
}

function transitionHorzZoomToFit(
    nextProps:IOncoprintProps,
    prevProps:Partial<IOncoprintProps>,
    oncoprint:OncoprintJS<any>
) {
    if (nextProps.horzZoomToFitIds !== prevProps.horzZoomToFitIds) {
        oncoprint.updateHorzZoomToFitIds(nextProps.horzZoomToFitIds || []);
    }
}

function differentTracksOrChangedData(nextTracks:{key:string, data:any}[], prevTracks:{key:string, data:any}[]) {
    // Check if
    // (1) A track added/removed
    // (2) Track data changed
    let ret = false;
    if (nextTracks.length !== prevTracks.length) {
        ret = true;
    } else {
        const prevTracksMap = _.keyBy(prevTracks, x=>x.key);
        for (const nextTrack of nextTracks) {
            const prevTrack = prevTracksMap[nextTrack.key];
            if (!prevTrack) {
                ret = true;
                break;
            } else {
                if (prevTrack.data !== nextTrack.data) {
                    ret = true;
                    break;
                }
            }
        }
    }
    return ret;
}

function shouldNotKeepSorted_GeneticTracksHelper(
    nextProps:IOncoprintProps,
    prevProps:Partial<IOncoprintProps>
) {
    // Check if
    // (1) A track added/removed
    // (2) Track data changed
    if (differentTracksOrChangedData(nextProps.geneticTracks || [], prevProps.geneticTracks || [])) {
        return true;
    }
    // (3) Track sort comparator changed
    return (sortByMutationType(nextProps) !== sortByMutationType(prevProps)) ||
            (sortByDrivers(nextProps) !== sortByDrivers(prevProps));
}

function shouldNotKeepSorted_ClinicalTracksHelper(
    nextProps:IOncoprintProps,
    prevProps:Partial<IOncoprintProps>
) {
    // Check if
    // (1) A track added/removed
    // (2) Track data changed
    if (differentTracksOrChangedData(nextProps.geneticTracks || [], prevProps.geneticTracks || [])) {
        return true;
    }
}

function shouldNotKeepSorted_HeatmapTracksHelper(
    nextProps:IOncoprintProps,
    prevProps:Partial<IOncoprintProps>
) {
    // Check if
    // (1) A track added/removed
    // (2) Track data changed
    if (differentTracksOrChangedData(nextProps.geneticTracks || [], prevProps.geneticTracks || [])) {
        return true;
    }
}

function shouldNotKeepSorted(nextProps: IOncoprintProps, prevProps: Partial<IOncoprintProps>) {
    // Dont keep sorted during changes if changes will involve resorting. In that case,
    //  we might as well just wait until they're done to resort - that can only make it more efficient
    //  than potentially sorting multiple times.

    return shouldNotKeepSorted_GeneticTracksHelper(nextProps, prevProps) ||
        shouldNotKeepSorted_ClinicalTracksHelper(nextProps, prevProps) ||
        shouldNotKeepSorted_HeatmapTracksHelper(nextProps, prevProps);
}

function shouldSuppressRendering(nextProps: IOncoprintProps, prevProps: Partial<IOncoprintProps>) {
    // As of now, the oncoprint rendering pipeline is separated enough by track that I actually dont think
    //  this is ever useful with the update system we have set up here.
    // Because if you suppress rendering, then at the end you have to do a FULL rerender - generate all the shapes,
    //  vertexes, then render to webGL. Whereas currently, the worst that would happen inefficiently is a few extra
    //  webGL renderings, which is the cheapest part of it. I can't think of a situation where it would make sense.
    return false;
}

function sortOrder(props:IOncoprintProps):string[]|undefined {
    return props.sortConfig && props.sortConfig.order;
};

function transitionSortConfig(
    nextProps: IOncoprintProps,
    oncoprint: OncoprintJS<any>
) {
    const newSortOrder = sortOrder(nextProps);
    oncoprint.setSortConfig(newSortOrder ? {
        type: "order",
        order: newSortOrder
    } : {});
}

function transitionHiddenIds(
    nextProps:IOncoprintProps,
    prevProps:Partial<IOncoprintProps>,
    oncoprint:OncoprintJS<any>
) {
    if (nextProps.hiddenIds !== prevProps.hiddenIds) {
        // do it on shallow inequality
        oncoprint.hideIds(nextProps.hiddenIds || [], true);
    }
}

function transitionShowClinicalTrackLegends(
    nextProps:IOncoprintProps,
    prevProps:Partial<IOncoprintProps>,
    oncoprint:OncoprintJS<any>,
    getTrackSpecKeyToTrackId:()=>{[key:string]:TrackId}
) {
    const trackSpecKeyToTrackId = getTrackSpecKeyToTrackId();
    const clinicalTrackIds = nextProps.clinicalTracks.map(track=>trackSpecKeyToTrackId[track.key]);
    if (nextProps.showClinicalTrackLegends && !prevProps.showClinicalTrackLegends) {
        oncoprint.showTrackLegends(clinicalTrackIds);
    } else if (!nextProps.showClinicalTrackLegends && prevProps.showClinicalTrackLegends) {
        oncoprint.hideTrackLegends(clinicalTrackIds);
    }
}

function transitionWhitespaceBetweenColumns(
    nextProps:IOncoprintProps,
    prevProps:Partial<IOncoprintProps>,
    oncoprint:OncoprintJS<any>
) {
    if (nextProps.showWhitespaceBetweenColumns !== prevProps.showWhitespaceBetweenColumns) {
        oncoprint.setCellPaddingOn(!!nextProps.showWhitespaceBetweenColumns);
    }
}

function transitionShowMinimap(
    nextProps:IOncoprintProps,
    prevProps:Partial<IOncoprintProps>,
    oncoprint:OncoprintJS<any>
) {
    if (nextProps.showMinimap !== prevProps.showMinimap) {
        oncoprint.setMinimapVisible(!!nextProps.showMinimap);
    }
}

function transitionOnMinimapCloseCallback(
    nextProps:IOncoprintProps,
    prevProps:Partial<IOncoprintProps>,
    oncoprint:OncoprintJS<any>
) {
    if (nextProps.onMinimapClose && nextProps.onMinimapClose !== prevProps.onMinimapClose) {
        oncoprint.onMinimapClose(nextProps.onMinimapClose);
    }
}

function transitionTracks(
    nextProps:IOncoprintProps,
    prevProps:Partial<IOncoprintProps>,
    oncoprint:OncoprintJS<any>,
    getTrackSpecKeyToTrackId:()=>{[key:string]:TrackId}
) {
    const prevGeneticTracks = _.keyBy(prevProps.geneticTracks || [], track=>track.key);
    for (const track of nextProps.geneticTracks) {
        transitionGeneticTrack(track, prevGeneticTracks[track.key], getTrackSpecKeyToTrackId, oncoprint, nextProps, prevProps);
        delete prevGeneticTracks[track.key];
    }
    for (const track of (prevProps.geneticTracks || [])) {
        if (prevGeneticTracks.hasOwnProperty(track.key)) {
            // if its still there, then this track no longer exists, we need to remove it
            transitionGeneticTrack(undefined, prevGeneticTracks[track.key], getTrackSpecKeyToTrackId, oncoprint, nextProps, prevProps);
        }
    }
    shareRuleSet(nextProps.geneticTracks, getTrackSpecKeyToTrackId, oncoprint);

    const prevClinicalTracks = _.keyBy(prevProps.clinicalTracks || [], track=>track.key);
    for (const track of nextProps.clinicalTracks) {
        transitionClinicalTrack(track, prevClinicalTracks[track.key], getTrackSpecKeyToTrackId, oncoprint, nextProps);
        delete prevClinicalTracks[track.key];
    }
    for (const track of (prevProps.clinicalTracks || [])) {
        if (prevClinicalTracks.hasOwnProperty(track.key)) {
            // if its still there, then this track no longer exists
            transitionClinicalTrack(undefined, prevClinicalTracks[track.key], getTrackSpecKeyToTrackId, oncoprint, nextProps);
        }
    }

    const prevHeatmapTracks = _.keyBy(prevProps.heatmapTracks || [], track=>track.key);
    for (const track of nextProps.heatmapTracks) {
        transitionHeatmapTrack(track, prevHeatmapTracks[track.key], getTrackSpecKeyToTrackId, oncoprint);
        delete prevHeatmapTracks[track.key];
    }
    for (const track of (prevProps.heatmapTracks || [])) {
        if (prevHeatmapTracks.hasOwnProperty(track.key)) {
            // if its still there, then this track no longer exists
            transitionHeatmapTrack(undefined, prevHeatmapTracks[track.key], getTrackSpecKeyToTrackId, oncoprint);
        }
    }
    shareRuleSet(nextProps.heatmapTracks, getTrackSpecKeyToTrackId, oncoprint);
}

function tryRemoveTrack(
    nextSpec: {key:string}|undefined,
    prevSpec: {key:string}|undefined,
    trackSpecKeyToTrackId:{[key:string]:TrackId},
    oncoprint:OncoprintJS<any>
) {
    if (!nextSpec && prevSpec) {
        // remove track
        const trackId = trackSpecKeyToTrackId[prevSpec.key];
        if (typeof trackId !== "undefined") {
            oncoprint.removeTrack(trackId);
            delete trackSpecKeyToTrackId[prevSpec.key];
        }
        return true;
    } else {
        return false;
    }
}

function sortByMutationType(nextProps:Partial<IOncoprintProps>) {
    return nextProps.distinguishMutationType &&
        nextProps.sortConfig &&
        nextProps.sortConfig.sortByMutationType;
}

function sortByDrivers(nextProps:Partial<IOncoprintProps>) {
    return nextProps.distinguishDrivers &&
        nextProps.sortConfig &&
        nextProps.sortConfig.sortByDrivers;
}

function shareRuleSet(
    tracks:(GeneticTrackSpec[]|HeatmapTrackSpec[]),
    getTrackSpecKeyToTrackId:()=>{[key:string]:TrackId},
    oncoprint:OncoprintJS<any>
) {
    if (tracks.length === 0) {
        return;
    }
    const trackSpecKeyToTrackId = getTrackSpecKeyToTrackId();
    const sourceTrack = trackSpecKeyToTrackId[tracks[0].key];
    for (let i=1; i<tracks.length; i++) {
        const targetTrack = trackSpecKeyToTrackId[tracks[i].key];
        oncoprint.shareRuleSet(sourceTrack, targetTrack);
    }
}

function transitionGeneticTrack(
    nextSpec:GeneticTrackSpec|undefined,
    prevSpec:GeneticTrackSpec|undefined,
    getTrackSpecKeyToTrackId:()=>{[key:string]:TrackId},
    oncoprint:OncoprintJS<any>,
    nextProps:IOncoprintProps,
    prevProps:Partial<IOncoprintProps>
) {
    const trackSpecKeyToTrackId = getTrackSpecKeyToTrackId();
    if (tryRemoveTrack(nextSpec, prevSpec, trackSpecKeyToTrackId, oncoprint)) {
        // Remove track
        return;
    } else if (nextSpec && !prevSpec) {
        // Add track
        const geneticTrackParams = {
            rule_set_params: getGeneticTrackRuleSetParams(nextProps.distinguishMutationType, nextProps.distinguishDrivers),
            label: nextSpec.label,
            target_group: 1,
            sortCmpFn: getGeneticTrackSortComparator(sortByMutationType(nextProps), sortByDrivers(nextProps)),
            description: nextSpec.oql,
            data_id_key: "uid",
            data: nextSpec.data,
            tooltipFn: makeGeneticTrackTooltip(nextProps.showBinaryCustomDriverAnnotation, nextProps.showTiersCustomDriverAnnotation, true),
            track_info: nextSpec.info
        };
        trackSpecKeyToTrackId[nextSpec.key] = oncoprint.addTracks([geneticTrackParams])[0];
    } else if (nextSpec && prevSpec) {
        // Transition track
        const trackId = trackSpecKeyToTrackId[nextSpec.key];
        if ((nextProps.distinguishMutationType !== prevProps.distinguishMutationType) ||
            (nextProps.distinguishDrivers !== prevProps.distinguishDrivers)) {
            oncoprint.setRuleSet(trackId, getGeneticTrackRuleSetParams(nextProps.distinguishMutationType, nextProps.distinguishDrivers));
        }
        const nextSortByMutationType = sortByMutationType(nextProps);
        const nextSortByDrivers = sortByDrivers(nextProps);
        if ((nextSortByMutationType !== sortByMutationType(prevProps)) ||
            (nextSortByDrivers !== sortByDrivers(prevProps))) {
            oncoprint.setTrackSortComparator(trackId, getGeneticTrackSortComparator(sortByMutationType(nextProps), sortByDrivers(nextProps)));
        }
        if (nextSpec.data !== prevSpec.data) {
            // shallow equality check
            oncoprint.setTrackData(trackId, nextSpec.data, "uid");
        }
        // set tooltip no matter what, its cheap
        oncoprint.setTrackTooltipFn(trackId, makeGeneticTrackTooltip(nextProps.showBinaryCustomDriverAnnotation, nextProps.showTiersCustomDriverAnnotation, true));
        if (nextSpec.info !== prevSpec.info) {
            oncoprint.setTrackInfo(trackId, nextSpec.info);
        }
    }
}

function transitionClinicalTrack(
    nextSpec:ClinicalTrackSpec<any>|undefined,
    prevSpec:ClinicalTrackSpec<any>|undefined,
    getTrackSpecKeyToTrackId:()=>{[key:string]:TrackId},
    oncoprint:OncoprintJS<any>,
    nextProps:IOncoprintProps
) {
    const trackSpecKeyToTrackId = getTrackSpecKeyToTrackId();
    if (tryRemoveTrack(nextSpec, prevSpec, trackSpecKeyToTrackId, oncoprint)) {
        return;
    } else if (nextSpec && !prevSpec) {
        // Add track
        const rule_set_params:any = getClinicalTrackRuleSetParams(nextSpec);
        rule_set_params.legend_label = nextSpec.label;
        rule_set_params.exclude_from_legend = !nextProps.showClinicalTrackLegends;
        const clinicalTrackParams = {
            rule_set_params,
            data: nextSpec.data,
            data_id_key: "uid",
            label: nextSpec.label,
            description: nextSpec.description,
            removable: true,
            removeCallback: ()=>{
                delete getTrackSpecKeyToTrackId()[nextSpec.key];
                nextProps.onDeleteClinicalTrack && nextProps.onDeleteClinicalTrack(nextSpec.key);
            },
            sort_direction_changeable: true,
            tooltipFn: makeClinicalTrackTooltip(nextSpec, true),
            //track_info: "\u23f3",
            sortCmpFn: getClinicalTrackSortComparator(nextSpec),
            init_sort_direction: 0 as 0,
            target_group: 0
        };
        trackSpecKeyToTrackId[nextSpec.key] = oncoprint.addTracks([clinicalTrackParams])[0];
    } else if (nextSpec && prevSpec) {
        // Transition track
        const trackId = trackSpecKeyToTrackId[nextSpec.key];
        if (nextSpec.data !== prevSpec.data) {
            // shallow equality check
            oncoprint.setTrackData(trackId, nextSpec.data, "uid");
        }
        // set tooltip, its cheap
        oncoprint.setTrackTooltipFn(trackId, makeClinicalTrackTooltip(nextSpec, true));
    }
}
function transitionHeatmapTrack(
    nextSpec:HeatmapTrackSpec|undefined,
    prevSpec:HeatmapTrackSpec|undefined,
    getTrackSpecKeyToTrackId:()=>{[key:string]:TrackId},
    oncoprint:OncoprintJS<any>
) {
    const trackSpecKeyToTrackId = getTrackSpecKeyToTrackId();
    if (tryRemoveTrack(nextSpec, prevSpec, trackSpecKeyToTrackId, oncoprint)) {
        return;
    } else if (nextSpec && !prevSpec) {
        // Add track
        const heatmapTrackParams = {
            rule_set_params: {
                type: 'gradient' as 'gradient',
                legend_label: 'Heatmap',
                value_key: nextSpec.valueKey,
                value_range: [-3,3] as [number, number],
                colors: [[0,0,255,1], [0,0,0,1], [255,0,0,1]],
                value_stop_points: [-3, 0, 3],
                null_color: 'rgba(224,224,224,1)'
            },
            data: nextSpec.data,
            data_id_key: "uid",
            has_column_spacing: false,
            track_padding: 0,
            label: nextSpec.label,
            target_group: nextSpec.trackGroupIndex,
            removable: true,
            removeCallback: ()=>{
                delete getTrackSpecKeyToTrackId()[nextSpec.key];
                nextSpec.onRemove();
            },
            sort_direction_changeable: true,
            sortCmpFn: heatmapTrackSortComparator,
            init_sort_direction: 0 as 0,
            description: `${nextSpec.label} data from ${nextSpec.molecularProfileId}`,
            tooltipFn: makeHeatmapTrackTooltip(nextSpec.molecularAlterationType, true)
        };
        trackSpecKeyToTrackId[nextSpec.key] = oncoprint.addTracks([heatmapTrackParams])[0];
    } else if (nextSpec && prevSpec) {
        // Transition track
        const trackId = trackSpecKeyToTrackId[nextSpec.key];
        if (nextSpec.data !== prevSpec.data) {
            // shallow equality check
            oncoprint.setTrackData(trackId, nextSpec.data, "uid");
        }
        // set tooltip, its cheap
        oncoprint.setTrackTooltipFn(trackId, makeHeatmapTrackTooltip(nextSpec.molecularAlterationType, true))
    }
}