declare module "oncoprintjs"
{
    // global
    export type SortConfig = {
        type: "alphabetical"
    } | {
        type: "order";
        order: string[];
    } | {};

    // track properties
    export type TrackId = number;
    export type TrackGroup = number[];
    export type TrackGroupIndex = number;
    export type TrackSortDirection = 0|1|-1;
    export type TrackSortComparator<D> = (d1:D, d2:D)=>(0|1|2|-1|-2);
    export type TrackTooltipFn<D> = (cell_datum:D)=>HTMLElement|string;

    export type RuleSetSpec = {
    }

    export type TrackSpec<D> = {
        target_group?:TrackGroupIndex;
        track_group_header?:string;
        cell_height?: number;
        track_padding?: number;
        has_column_spacing?: boolean;
        data_id_key?: string;
        tooltipFn?:TrackTooltipFn<D>;
        removable?:boolean;
        removeCallback?:(track_id:TrackId)=>void;
        label?:string;
        description?:string;
        track_info?:string;
        sortCmpFn?:TrackSortComparator<D> | {
            mandatory:TrackSortComparator<D>;
            preferred:TrackSortComparator<D>;
        };
        sort_direction_changeable?:boolean;
        init_sort_direction?:TrackSortDirection;
        data?:D[];
        rule_set_params?:RuleSetSpec;
    };

    export default class Oncoprint<D> {
        setMinimapVisible:(visible:boolean)=>void;
        scrollTo:(left:number)=>void;
        onHorzZoom:(callback:(newHorzZoom:number)=>void)=>void;
        onMinimapClose:(callback:()=>void)=>void;
        moveTrack:(target_track:TrackId, new_previous_track:TrackId)=>void;
        setTrackGroupOrder:(index:TrackGroupIndex, track_order:TrackGroup)=>void;
        keepSorted:(keep_sorted:boolean)=>void;
        addTracks:(params_list:TrackSpec<D>[])=>TrackId[];
        removeTrack:(track_id:TrackId)=>void;
        removeTracks:(track_ids:TrackId[])=>void;
        getTracks:()=>TrackId[];
        removeAllTracks:()=>void;
        setHorzZoomToFit:(ids:string[])=>void;
        updateHorzZoomToFitIds:(ids:string[])=>void;
        getHorzZoom:()=>number;
        setHorzZoom:(z:number, still_keep_horz_zoomed_to_fit?:boolean)=>number;
        getVertZoom:()=>number;
        setVertZoom:(z:number)=>number;
        setScroll:(scroll_left:number, scroll_top:number)=>void;
        setZoom:(zoom_x:number, zoom_y:number)=>void;
        setHorzScroll:(s:number)=>number;
        setVertScroll:(s:number)=>number;
        setViewport:(col:number, scroll_y_proportion:number, num_cols:number, zoom_y:number)=>void;
        getTrackData:(track_id:TrackId)=>D[];
        getTrackDataIdKey:(track_id:TrackId)=>string;
        setTrackData:(track_id:TrackId, data:D[], data_id_key:string)=>void;
        setTrackGroupSortPriority:(priority:TrackGroupIndex[])=>void;
        setTrackSortDirection:(track_id:TrackId, dir:TrackSortDirection)=>TrackSortDirection;
        setTrackSortComparator:(track_id:TrackId, sortCmpFn:TrackSortComparator<D>)=>void;
        getTrackSortDirection:(track_id:TrackId)=>TrackSortDirection;
        setTrackInfo:(track_id:TrackId, msg:string)=>void;
        setTrackTooltipFn:(track_id:TrackId, tooltipFn:TrackTooltipFn<D>)=>void;
        sort:()=>void;
        shareRuleSet:(source_track_id:TrackId, target_track_id:TrackId)=>void;
        setRuleSet:(track_id:TrackId, rule_set_params:RuleSetSpec)=>void;
        setSortConfig:(params:SortConfig)=>void;
        setIdOrder:(ids:string[])=>void;
        suppressRendering:()=>void;
        releaseRendering:()=>void;
        hideIds:(to_hide:string[], show_others?:boolean)=>void;
        hideTrackLegends:(track_ids:TrackId[])=>void;
        showTrackLegends:(track_ids:TrackId[])=>void;
        setCellPaddingOn:(cell_padding_on:boolean)=>void;
        toSVG:(with_background:boolean)=>SVGElement;
        toCanvas:(callback:(canvas:HTMLCanvasElement, truncated:boolean)=>void, resolution:number)=>HTMLImageElement;
        highlightTrack:(track_id:TrackId|null)=>void;
        getIdOrder:(all?:boolean)=>string[];
        setIdClipboardContents:(array:string[])=>void;
        getIdClipboardContents:()=>string[];
        onClipboardChange:(callback:(array:string[])=>void)=>void;
    }
}
