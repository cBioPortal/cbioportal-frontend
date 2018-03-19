import {
    IOncoprintProps, default as Oncoprint, GeneticTrackSpec, IGenesetHeatmapTrackSpec,
    IGeneHeatmapTrackSpec, ClinicalTrackSpec, IBaseHeatmapTrackDatum,
    CLINICAL_TRACK_GROUP_INDEX, GENETIC_TRACK_GROUP_INDEX
} from "./Oncoprint";
import OncoprintJS, {TrackId, SortConfig} from "oncoprintjs";
import {ObservableMap} from "mobx";
import _ from "lodash";
import {
    getClinicalTrackRuleSetParams, getGeneticTrackRuleSetParams,
    getGenesetHeatmapTrackRuleSetParams, getHeatmapTrackRuleSetParams
} from "./OncoprintUtils";
import {getClinicalTrackSortComparator, getGeneticTrackSortComparator, heatmapTrackSortComparator} from "./SortUtils";
import {
    makeClinicalTrackTooltip, makeGeneticTrackTooltip, makeHeatmapTrackTooltip,
    linebreakGenesetId
} from "./TooltipUtils";
import {MolecularProfile} from "../../api/generated/CBioPortalAPI";

export function transition(
    nextProps:IOncoprintProps,
    prevProps:Partial<IOncoprintProps>,
    oncoprint:OncoprintJS<any>,
    getTrackSpecKeyToTrackId:()=>{[key:string]:TrackId}
) {
    const notKeepingSorted = shouldNotKeepSortedForTransition(nextProps, prevProps);
    const suppressingRendering = shouldSuppressRenderingForTransition(nextProps, prevProps);
    if (suppressingRendering) {
        doSuppressRendering(nextProps, oncoprint);
    }
    if (notKeepingSorted) {
        oncoprint.keepSorted(false);
    }
    trySuppressRendering(nextProps, prevProps, oncoprint);
    transitionWhitespaceBetweenColumns(nextProps, prevProps, oncoprint);
    transitionShowMinimap(nextProps, prevProps, oncoprint);
    transitionOnMinimapCloseCallback(nextProps, prevProps, oncoprint);
    transitionTracks(nextProps, prevProps, oncoprint, getTrackSpecKeyToTrackId);
    transitionSortConfig(nextProps, prevProps, oncoprint);
    transitionTrackGroupSortPriority(nextProps, prevProps, oncoprint);
    transitionHiddenIds(nextProps, prevProps, oncoprint);
    transitionHorzZoomToFit(nextProps, prevProps, oncoprint);
    transitionShowClinicalTrackLegends(nextProps, prevProps, oncoprint, getTrackSpecKeyToTrackId);
    tryReleaseRendering(nextProps, prevProps, oncoprint);
    if (notKeepingSorted) {
        oncoprint.keepSorted(true);
    }
    if (suppressingRendering) {
        doReleaseRendering(nextProps, oncoprint);
    }
}

type TrackSpecsWithDynamicGroups = {
    heatmapTracks: {trackGroupIndex: number}[],
    genesetHeatmapTracks: {trackGroupIndex: number}[]
};
export function transitionTrackGroupSortPriority(
    nextProps: TrackSpecsWithDynamicGroups,
    prevProps: Partial<TrackSpecsWithDynamicGroups>,
    oncoprint: OncoprintJS<any>
) {
    const prevHeatmapTrackGroups = _.sortBy(_.uniq(
        (prevProps.heatmapTracks || [])
        .concat(prevProps.genesetHeatmapTracks || [])
        .map(x => x.trackGroupIndex)
    ));
    const nextHeatmapTrackGroups = _.sortBy(_.uniq(
        nextProps.heatmapTracks
        .concat(nextProps.genesetHeatmapTracks)
        .map(x=>x.trackGroupIndex)
    ));
    if (_.xor(nextHeatmapTrackGroups, prevHeatmapTrackGroups).length) {
        // if track groups have changed
        oncoprint.setTrackGroupSortPriority([CLINICAL_TRACK_GROUP_INDEX].concat(nextHeatmapTrackGroups).concat(GENETIC_TRACK_GROUP_INDEX));
    }
}

function doSuppressRendering(
    nextProps:IOncoprintProps,
    oncoprint:OncoprintJS<any>
) {
    oncoprint.suppressRendering();
    nextProps.onSuppressRendering && nextProps.onSuppressRendering();
}

function doReleaseRendering(
    nextProps:IOncoprintProps,
    oncoprint:OncoprintJS<any>
) {
    oncoprint.releaseRendering(nextProps.onReleaseRendering);
}

function trySuppressRendering(
    nextProps:IOncoprintProps,
    prevProps:Partial<IOncoprintProps>,
    oncoprint:OncoprintJS<any>
){
    if (nextProps.suppressRendering && !prevProps.suppressRendering) {
        doSuppressRendering(nextProps, oncoprint);
    }
}

function tryReleaseRendering(
    nextProps:IOncoprintProps,
    prevProps:Partial<IOncoprintProps>,
    oncoprint:OncoprintJS<any>
){
    if (!nextProps.suppressRendering && prevProps.suppressRendering) {
        doReleaseRendering(nextProps, oncoprint);
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

export function numTracksWhoseDataChanged(nextTracks:{key:string, data:any}[], prevTracks:{key:string, data:any}[]) {
    let ret = 0;
    const prevTracksMap = _.keyBy(prevTracks, x=>x.key);
    const tracksInBothPrevAndNext:{[key:string]:boolean} = {};
    let numTracksAdded = 0;
    let numTracksInBothPrevAndNext = 0;
    let numTracksDataChanged = 0;
    for (const nextTrack of nextTracks) {
        const prevTrack = prevTracksMap[nextTrack.key];
        if (!prevTrack) {
            numTracksAdded += 1;
        } else {
            numTracksInBothPrevAndNext += 1;
            if (prevTrack.data !== nextTrack.data) {
                numTracksDataChanged += 1;
            }
        }
    }
    const numTracksDeleted = prevTracks.length - numTracksInBothPrevAndNext;
    return numTracksAdded + numTracksDeleted + numTracksDataChanged;
}

function differentTracksOrChangedData(nextTracks:{key:string, data:any}[], prevTracks:{key:string, data:any}[]) {
    // Check if
    // (1) A track added/removed
    // (2) Track data changed
    let ret = false;
    if (nextTracks.length !== prevTracks.length) {
        ret = true;
    } else {
        ret = (numTracksWhoseDataChanged(nextTracks, prevTracks) > 0);
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
    if (differentTracksOrChangedData(nextProps.clinicalTracks || [], prevProps.clinicalTracks || [])) {
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
    if (
        differentTracksOrChangedData(nextProps.heatmapTracks, prevProps.heatmapTracks || [] )
        || differentTracksOrChangedData(nextProps.genesetHeatmapTracks, prevProps.genesetHeatmapTracks || [])
    ) {
        return true;
    }
}

function shouldNotKeepSortedForTransition(nextProps: IOncoprintProps, prevProps: Partial<IOncoprintProps>) {
    // Dont keep sorted during changes if changes will involve resorting. In that case,
    //  we might as well just wait until they're done to resort - that can only make it more efficient
    //  than potentially sorting multiple times.

    return shouldNotKeepSorted_GeneticTracksHelper(nextProps, prevProps) ||
        shouldNotKeepSorted_ClinicalTracksHelper(nextProps, prevProps) ||
        shouldNotKeepSorted_HeatmapTracksHelper(nextProps, prevProps);
}

function allTracks(props:Partial<IOncoprintProps>) {
    return (((props.geneticTracks || []) as any[])
            .concat(props.genesetHeatmapTracks || [])
            .concat(props.clinicalTracks || [])
            .concat(props.heatmapTracks || [])
    );
}

function shouldSuppressRenderingForTransition(nextProps: IOncoprintProps, prevProps: Partial<IOncoprintProps>) {
    // If cost of rerendering everything less than cost of all the rerenders that would happen in the process
    //  of incrementally changing the oncoprint state.
    return !nextProps.suppressRendering && // dont add suppress if already suppressing
        (hasGeneticTrackRuleSetChanged(nextProps, prevProps) // will need to rerender all genetic tracks if genetic rule set has changed
        || (numTracksWhoseDataChanged(allTracks(nextProps), allTracks(prevProps)) > 1));
}

function sortOrder(props:Partial<Pick<IOncoprintProps, "sortConfig">>):string[]|undefined {
    return props.sortConfig && props.sortConfig.order;
};

export function heatmapClusterValueFn(d: IBaseHeatmapTrackDatum) {
    return d.profile_data;
}

function createSortConfig(props:Partial<Pick<IOncoprintProps, "sortConfig">>):SortConfig {
    let config = {};
    const newSortOrder = sortOrder(props);
    if (newSortOrder) {
        config = {
            type: "order",
            order: newSortOrder
        };
    } else if (props.sortConfig &&
        typeof props.sortConfig.clusterHeatmapTrackGroupIndex !== "undefined") {
        config = {
            type: "cluster",
            track_group_index: props.sortConfig.clusterHeatmapTrackGroupIndex,
            clusterValueFn: heatmapClusterValueFn
        };
    }
    return config;
}
export function transitionSortConfig(
    nextProps: Pick<IOncoprintProps, "sortConfig">,
    prevProps: Partial<Pick<IOncoprintProps, "sortConfig">>,
    oncoprint: OncoprintJS<any>
) {
    const prevSortConfig = createSortConfig(prevProps);
    const nextSortConfig = createSortConfig(nextProps);

    // do shallow comparison on "order" types, otherwise deep comparison
    // this is because order could potentially be very long and so deep comparison would be too expensive
    if ((prevSortConfig.type === "order" &&
        nextSortConfig.type === "order" &&
        (prevSortConfig.order !== nextSortConfig.order))
        ||
        !_.isEqual(prevSortConfig, nextSortConfig)) {
        oncoprint.setSortConfig(nextSortConfig);
    }
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

function hasGeneticTrackRuleSetChanged(
    nextProps:IOncoprintProps,
    prevProps:Partial<IOncoprintProps>,
) {
    return (getGeneticTrackRuleSetParams(nextProps.distinguishMutationType, nextProps.distinguishDrivers) !==
    getGeneticTrackRuleSetParams(prevProps.distinguishMutationType, prevProps.distinguishDrivers));
    // we can do shallow equality because getGeneticTrackRuleSetParams do not create new objects each time - see impl to understand
}

function transitionTracks(
    nextProps:IOncoprintProps,
    prevProps:Partial<IOncoprintProps>,
    oncoprint:OncoprintJS<any>,
    getTrackSpecKeyToTrackId:()=>{[key:string]:TrackId}
) {
    // Initialize tracks for rule set sharing
    const trackIdForRuleSetSharing = {
        genetic: undefined as undefined|TrackId,
        genesetHeatmap: undefined as undefined|TrackId,
        heatmap: undefined as undefined|TrackId
    };
    const trackSpecKeyToTrackId = getTrackSpecKeyToTrackId();
    if (prevProps.geneticTracks && prevProps.geneticTracks.length && !hasGeneticTrackRuleSetChanged(nextProps, prevProps)) {
        // set rule set to existing track if theres a track and rule set hasnt changed
        trackIdForRuleSetSharing.genetic = trackSpecKeyToTrackId[prevProps.geneticTracks[0].key];
    }
    if (prevProps.genesetHeatmapTracks && prevProps.genesetHeatmapTracks.length) {
        // set rule set to existing track if there is one
        trackIdForRuleSetSharing.genesetHeatmap = trackSpecKeyToTrackId[prevProps.genesetHeatmapTracks[0].key];
    }
    if (prevProps.heatmapTracks && prevProps.heatmapTracks.length) {
        // set rule set to existing track if there is one
        trackIdForRuleSetSharing.heatmap = trackSpecKeyToTrackId[prevProps.heatmapTracks[0].key];
    } else if (prevProps.genesetHeatmapTracks) {
        for (const gsTrack of prevProps.genesetHeatmapTracks) {
            if (gsTrack.expansionTrackList && gsTrack.expansionTrackList.length) {
                trackIdForRuleSetSharing.heatmap = trackSpecKeyToTrackId[
                    gsTrack.expansionTrackList[0].key
                ];
                break;
            }
        }
    }


    // Transition genetic tracks
    const prevGeneticTracks = _.keyBy(prevProps.geneticTracks || [], track=>track.key);
    for (const track of nextProps.geneticTracks) {
        transitionGeneticTrack(track, prevGeneticTracks[track.key], getTrackSpecKeyToTrackId,
                               oncoprint, nextProps, prevProps, trackIdForRuleSetSharing);
        delete prevGeneticTracks[track.key];
    }
    for (const track of (prevProps.geneticTracks || [])) {
        if (prevGeneticTracks.hasOwnProperty(track.key)) {
            // if its still there, then this track no longer exists, we need to remove it
            transitionGeneticTrack(undefined, prevGeneticTracks[track.key], getTrackSpecKeyToTrackId,
                                   oncoprint, nextProps, prevProps, trackIdForRuleSetSharing);
        }
    }

    // Transition clinical tracks
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

    // Transition gene set heatmap tracks
    const prevGenesetHeatmapTracks = _.keyBy(prevProps.genesetHeatmapTracks || [], track=>track.key);
    for (const track of nextProps.genesetHeatmapTracks) {
        transitionGenesetHeatmapTrack(track, prevGenesetHeatmapTracks[track.key], getTrackSpecKeyToTrackId,
                                      oncoprint, nextProps, trackIdForRuleSetSharing);
        delete prevGenesetHeatmapTracks[track.key];
    }
    for (const track of (prevProps.genesetHeatmapTracks || [])) {
        if (prevGenesetHeatmapTracks.hasOwnProperty(track.key)) {
            // if its still there, then this track no longer exists
            transitionGenesetHeatmapTrack(undefined, prevGenesetHeatmapTracks[track.key], getTrackSpecKeyToTrackId,
                                          oncoprint, nextProps, trackIdForRuleSetSharing);
        }
    }

    // Transition heatmap tracks
    const prevHeatmapTracks = _.keyBy(prevProps.heatmapTracks || [], track=>track.key);
    for (const track of nextProps.heatmapTracks) {
        transitionHeatmapTrack(track, prevHeatmapTracks[track.key], getTrackSpecKeyToTrackId,
                               oncoprint, nextProps, trackIdForRuleSetSharing);
        delete prevHeatmapTracks[track.key];
    }
    for (const track of (prevProps.heatmapTracks || [])) {
        if (prevHeatmapTracks.hasOwnProperty(track.key)) {
            // if its still there, then this track no longer exists
            transitionHeatmapTrack(undefined, prevHeatmapTracks[track.key], getTrackSpecKeyToTrackId,
                                   oncoprint, nextProps, trackIdForRuleSetSharing);
        }
    }
}

function tryRemoveTrack(
    nextSpec: {key:string}|undefined,
    prevSpec: {key:string}|undefined,
    trackSpecKeyToTrackId:{[key:string]:TrackId},
    oncoprint:OncoprintJS<any>
) {
    if (!nextSpec && prevSpec) {
        // remove track, if OncoprintJS hasn't already removed it and told a
        // removeCallback to forget its track ID
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

function transitionGeneticTrack(
    nextSpec:GeneticTrackSpec|undefined,
    prevSpec:GeneticTrackSpec|undefined,
    getTrackSpecKeyToTrackId:()=>{[key:string]:TrackId},
    oncoprint:OncoprintJS<any>,
    nextProps:IOncoprintProps,
    prevProps:Partial<IOncoprintProps>,
    trackIdForRuleSetSharing:{genetic?:TrackId}
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
            target_group: GENETIC_TRACK_GROUP_INDEX,
            sortCmpFn: getGeneticTrackSortComparator(sortByMutationType(nextProps), sortByDrivers(nextProps)),
            description: nextSpec.oql,
            data_id_key: "uid",
            data: nextSpec.data,
            tooltipFn: makeGeneticTrackTooltip(true),
            track_info: nextSpec.info
        };
        const newTrackId = oncoprint.addTracks([geneticTrackParams])[0];
        trackSpecKeyToTrackId[nextSpec.key] = newTrackId;

        if (typeof trackIdForRuleSetSharing.genetic !== "undefined") {
            oncoprint.shareRuleSet(trackIdForRuleSetSharing.genetic, newTrackId);
        }
        trackIdForRuleSetSharing.genetic = newTrackId;
    } else if (nextSpec && prevSpec) {
        // Transition track
        const trackId = trackSpecKeyToTrackId[nextSpec.key];
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

        if (nextSpec.info !== prevSpec.info) {
            oncoprint.setTrackInfo(trackId, nextSpec.info);
        }

        // update ruleset if its changed
        if (hasGeneticTrackRuleSetChanged(nextProps, prevProps)) {
            if (typeof trackIdForRuleSetSharing.genetic !== "undefined") {
                // if theres a track to share, share its ruleset
                oncoprint.shareRuleSet(trackIdForRuleSetSharing.genetic, trackId);
            } else {
                // otherwise, update ruleset
                oncoprint.setRuleSet(trackId, getGeneticTrackRuleSetParams(nextProps.distinguishMutationType, nextProps.distinguishDrivers));
            }
        }
        // either way, use this one now
        trackIdForRuleSetSharing.genetic = trackId;
    }
}

function transitionClinicalTrack(
    nextSpec:ClinicalTrackSpec|undefined,
    prevSpec:ClinicalTrackSpec|undefined,
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
            description: ((nextSpec.label || "").trim() === (nextSpec.description || "").trim()) ? undefined : nextSpec.description,
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
            target_group: CLINICAL_TRACK_GROUP_INDEX,
            onSortDirectionChange: nextProps.onTrackSortDirectionChange
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
function transitionGenesetHeatmapTrack(
    nextSpec:IGenesetHeatmapTrackSpec|undefined,
    prevSpec:IGenesetHeatmapTrackSpec|undefined,
    getTrackSpecKeyToTrackId:()=>{[key:string]:TrackId},
    oncoprint:OncoprintJS<any>,
    nextProps:IOncoprintProps,
    trackIdForRuleSetSharing:{genesetHeatmap?:TrackId, heatmap?:TrackId}
) {
    function updateExpansionTracks(
        nextParentSpec: IGenesetHeatmapTrackSpec | undefined,
        prevParentSpec: IGenesetHeatmapTrackSpec | undefined
    ) {
        const expansionTrackList = prevParentSpec ? prevParentSpec.expansionTrackList || [] : [];
        const nextExpansionTracks = nextParentSpec ? nextParentSpec.expansionTrackList || [] : [];
        const prevExpansionTracks = _.keyBy(expansionTrackList, track => track.key);
        for (const track of nextExpansionTracks) {
            // nextParentSpec cannot be undefined, or we wouldn't have entered
            // this loop
            transitionHeatmapTrack(
                track, prevExpansionTracks[track.key], getTrackSpecKeyToTrackId,
                oncoprint, nextProps, trackIdForRuleSetSharing, nextParentSpec!.key);
            delete prevExpansionTracks[track.key];
        }
        for (const track of expansionTrackList) {
            if (prevExpansionTracks.hasOwnProperty(track.key)) {
                // if its still there, then this track no longer exists
                transitionHeatmapTrack(
                    undefined, prevExpansionTracks[track.key], getTrackSpecKeyToTrackId,
                    oncoprint, nextProps, trackIdForRuleSetSharing);
            }
        }
}

    const trackSpecKeyToTrackId = getTrackSpecKeyToTrackId();
    if (tryRemoveTrack(nextSpec, prevSpec, trackSpecKeyToTrackId, oncoprint)) {
        updateExpansionTracks(undefined, prevSpec);
        return;
    } else if (nextSpec && !prevSpec) {
        // Add track
        const heatmapTrackParams = {
            rule_set_params: getGenesetHeatmapTrackRuleSetParams(),
            data: nextSpec.data,
            data_id_key: "uid",
            has_column_spacing: false,
            track_padding: 0,
            label: nextSpec.label,
            html_label: linebreakGenesetId(nextSpec.label),
            track_label_color: 'grey',
            target_group: nextSpec.trackGroupIndex,
            sort_direction_changeable: true,
            sortCmpFn: heatmapTrackSortComparator,
            init_sort_direction: 0 as 0,
            description: `Gene set scores from ${nextSpec.molecularProfileId}`,
            link_url: nextSpec.trackLinkUrl,
            tooltipFn: makeHeatmapTrackTooltip(nextSpec.molecularAlterationType, true),
            onSortDirectionChange: nextProps.onTrackSortDirectionChange,
            expandCallback: nextSpec.expansionCallback,
            expandButtonTextGetter: (is_expanded: boolean) =>
                `${is_expanded ? 'More' : 'Show'}  genes`
        };
        const newTrackId = oncoprint.addTracks([heatmapTrackParams])[0];
        trackSpecKeyToTrackId[nextSpec.key] = newTrackId;

        if (typeof trackIdForRuleSetSharing.genesetHeatmap !== "undefined") {
            oncoprint.shareRuleSet(trackIdForRuleSetSharing.genesetHeatmap, newTrackId);
        }
        trackIdForRuleSetSharing.genesetHeatmap = newTrackId;
        updateExpansionTracks(nextSpec, undefined);
    } else if (nextSpec && prevSpec) {
        // Transition track
        const trackId = trackSpecKeyToTrackId[nextSpec.key];
        if (nextSpec.data !== prevSpec.data) {
            // shallow equality check
            oncoprint.setTrackData(trackId, nextSpec.data, "uid");
        }
        // set tooltip, its cheap
        oncoprint.setTrackTooltipFn(trackId, makeHeatmapTrackTooltip(nextSpec.molecularAlterationType, true));
        updateExpansionTracks(nextSpec, prevSpec);
    }
}
function transitionHeatmapTrack(
    nextSpec:IGeneHeatmapTrackSpec|undefined,
    prevSpec:IGeneHeatmapTrackSpec|undefined,
    getTrackSpecKeyToTrackId:()=>{[key:string]:TrackId},
    oncoprint:OncoprintJS<any>,
    nextProps:IOncoprintProps,
    trackIdForRuleSetSharing:{heatmap?:TrackId},
    expansionParentKey?:string
) {
    const trackSpecKeyToTrackId = getTrackSpecKeyToTrackId();
    if (tryRemoveTrack(nextSpec, prevSpec, trackSpecKeyToTrackId, oncoprint)) {
        return;
    } else if (nextSpec && !prevSpec) {
        // Add track
        const heatmapTrackParams = {
            rule_set_params: getHeatmapTrackRuleSetParams(),
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
            tooltipFn: makeHeatmapTrackTooltip(nextSpec.molecularAlterationType, true),
            track_info: nextSpec.info || "",
            onSortDirectionChange: nextProps.onTrackSortDirectionChange,
            expansion_of: (
                expansionParentKey
                ? trackSpecKeyToTrackId[expansionParentKey]
                : undefined
            )
        };
        const newTrackId = oncoprint.addTracks([heatmapTrackParams])[0];
        trackSpecKeyToTrackId[nextSpec.key] = newTrackId;

        if (typeof trackIdForRuleSetSharing.heatmap !== "undefined") {
            oncoprint.shareRuleSet(trackIdForRuleSetSharing.heatmap, newTrackId);
        }
        trackIdForRuleSetSharing.heatmap = newTrackId;
    } else if (nextSpec && prevSpec) {
        // Transition track
        const trackId = trackSpecKeyToTrackId[nextSpec.key];
        if (nextSpec.data !== prevSpec.data) {
            // shallow equality check
            oncoprint.setTrackData(trackId, nextSpec.data, "uid");
        }
        if (nextSpec.info !== prevSpec.info && nextSpec.info !== undefined) {
            oncoprint.setTrackInfo(trackId, nextSpec.info);
        }
        // set tooltip, its cheap
        oncoprint.setTrackTooltipFn(trackId, makeHeatmapTrackTooltip(nextSpec.molecularAlterationType, true));
    }
}