declare module "oncoprintjs"
{
    // global
    export type SortConfig = {
        type: "alphabetical"
    } | {
        type: "order";
        order: string[];
    } | {
        type: "cluster";
        track_group_index: number;
        clusterValueFn: (datum:any)=>number;
    } | {type?:""};

    // track properties
    export type TrackId = number;
    export type TrackGroup = TrackId[];
    export type TrackGroupIndex = number;
    export type TrackSortDirection = 0|1|-1;
    export type TrackSortComparator<D> = (d1:D, d2:D)=>number;//returns (0|1|2|-1|-2); for comparison-based sort, where 2 and -2 mean force to end or beginning (resp) no matter what direction sorted in
    export type TrackSortVector<D> = (d:D)=>(number|string)[]; // maps data to vector used for bucket sort - types of elements in each position must be same, i.e. Kth element must always be a number, or always be a string
    export type TrackTooltipFn<D> = (cell_data:D[])=>HTMLElement|string|any;
    export type TrackSortSpecification<D> = TrackSortComparator<D> | TrackSortVector<D> | {
        mandatory:TrackSortComparator<D>; // specifies the mandatory order for the track
        preferred:TrackSortComparator<D>; // specifies the preferred order for the track (can be overridden by mandatory order of higher track)
        isVector?:false;
    } | {
        mandatory: TrackSortVector<D>; // specifies the mandatory order for the track
        preferred: TrackSortVector<D>; // specifies the preferred order for the track (can be overridden by mandatory order of higher track)
        isVector: true;
        compareEquals?:TrackSortComparator<D>; // specifies a comparator to be applied to sort among equal sort vectors in the *preferred* order (optional). eg sort by sample id if all else equal
    };

    export type RuleSetParams = ICategoricalRuleSetParams |
                                IGradientRuleSetParams |
                                IBarRuleSetParams |
                                IStackedBarRuleSetParams |
                                IGradientAndCategoricalRuleSetParams |
                                IGeneticAlterationRuleSetParams;

    interface IGeneralRuleSetParams {
        legend_label?: string;
        legend_base_color?: string;
        exclude_from_legend?: boolean;
        na_z?:number; // z index of na shapes (defaults to 1)
        na_legend_label?:string; // legend label associated to NA (defaults to 'No data')
    }

    // all colors are hex, rgb, or rgba
    export interface ICategoricalRuleSetParams extends IGeneralRuleSetParams {
        type: "categorical"
        category_key: string; // key into data which gives category
        category_to_color?: {[category:string]:string};
    }

    export interface IGradientRuleSetParams extends IGeneralRuleSetParams {
        type: "gradient"
        // either `colormap_name` or `colors` needs to be present
        colors?: [number, number, number, number][]; // [r,g,b,a][]
        colormap_name?: string; // name of a colormap found in src/js/heatmapcolors.js
        value_stop_points: number[];
        null_color?: string;
        null_legend_label?:string;

        log_scale?:boolean;
        value_key: string;
        value_range: [number, number];
    }

    // TODO: it would be more elegant to create multiple inheritance (if possible) since
    // IGradientAndCategoricalRuleSetParams is a IGradientRuleSetParams and 
    // ICategoricalRuleSetParams with a different `type` field.
    export interface IGradientAndCategoricalRuleSetParams extends IGeneralRuleSetParams {
        type: "gradient+categorical";
        // either `colormap_name` or `colors` needs to be present
        colors?: [number, number, number, number][]; // [r,g,b,a][]
        colormap_name?: string; // name of a colormap found in src/js/heatmapcolors.js
        value_stop_points: number[];
        null_color?: string;

        log_scale?:boolean;
        value_key: string;
        value_range: [number, number];

        category_key: string; // key into data which gives category
        category_to_color?: {[category:string]:string};
    }

    export interface IBarRuleSetParams extends IGeneralRuleSetParams {
        type: "bar"
        fill?: string;
        negative_fill?: string;

        log_scale?:boolean;
        value_key: string;
        value_range: [number, number];
    }

    export interface IStackedBarRuleSetParams extends IGeneralRuleSetParams {
        type: "stacked_bar"
        value_key: string;
        categories: string[];
        fills?: string[];
    }

    export interface IGeneticAlterationRuleSetParams extends IGeneralRuleSetParams {
        type: "gene"
        rule_params: GeneticAlterationRuleParams;
    }

    export type GeneticAlterationRuleParams = {
        [datumKey:string]:{
            [commaSeparatedDatumValues:string]: {
                shapes: ShapeSpec[];
                legend_label: string;
                exclude_from_legend?:boolean;
            }
        }
    };

    export type ShapeSpec = any; // TODO

    export type CustomTrackOption = {label?:string, separator?: boolean, onClick?:(id:TrackId)=>void, weight?:string, disabled?:boolean};

    export type TrackSpec<D> = {
        target_group?:TrackGroupIndex;
        track_group_header?:string;
        cell_height?: number;
        track_padding?: number;
        has_column_spacing?: boolean;
        data_id_key?: keyof D;
        tooltipFn?: TrackTooltipFn<D>;
        movable?:boolean;
        removable?:boolean;
        removeCallback?:(track_id:TrackId)=>void;
        label?: string;
        sublabel?: string;
        html_label?: string;
        label_color?: string;
        label_circle_color?: string;
        label_font_weight?: string;
        link_url?: string;
        description?: string;
        track_info?:string;
        sortCmpFn?:TrackSortSpecification<D>;
        sort_direction_changeable?:boolean;
        onSortDirectionChange?:(track_id:TrackId, dir:number)=>void;
        init_sort_direction?:TrackSortDirection;
        data?:D[];
        rule_set_params?: RuleSetParams;
        expansion_of?: TrackId;
        expandCallback?: (id: TrackId) => void;
        expandButtonTextGetter?: (is_expanded: boolean) => string;
        important_ids?:string[];
        custom_track_options?:CustomTrackOption[];
    };

    export default class OncoprintJS<D> {
        webgl_unavailable: boolean;
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
        removeAllTracks: () => void;
        removeExpansionTracksFor: (parent_track: TrackId) => void;
        disableTrackExpansion: (track_id: TrackId) => void;
        enableTrackExpansion: (track_id: TrackId) => void;
        removeAllExpansionTracksInGroup: (index: TrackGroupIndex) => void;
        setHorzZoomToFit: (ids: string[]) => void;
        updateHorzZoomToFitIds:(ids:string[])=>void;
        getMinHorzZoom:()=>number;
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
        setTrackImportantIds:(track_id:TrackId, ids?:string[])=>void;
        setTrackGroupSortPriority:(priority:TrackGroupIndex[])=>void;
        setTrackGroupLegendOrder:(group_order:TrackGroupIndex[])=>void;
        setTrackSortDirection:(track_id:TrackId, dir:TrackSortDirection)=>TrackSortDirection;
        setTrackSortComparator:(track_id:TrackId, sortCmpFn:TrackSortSpecification<any>)=>void;
        getTrackSortDirection:(track_id:TrackId)=>TrackSortDirection;
        setTrackInfo:(track_id:TrackId, msg:string)=>void;
        setTrackInfoTooltip:(track_id:TrackId, $tooltip_elt:any)=>void;//$tooltip_elt is JQuery HTML element
        setTrackTooltipFn:(track_id:TrackId, tooltipFn:TrackTooltipFn<any>)=>void;
        sort:()=>void;
        shareRuleSet:(source_track_id:TrackId, target_track_id:TrackId)=>void;
        setRuleSet:(track_id:TrackId, rule_set_params:RuleSetParams)=>void;
        setSortConfig:(params:SortConfig)=>void;
        setIdOrder:(ids:string[])=>void;
        suppressRendering:()=>void;
        releaseRendering:(onComplete?:()=>void)=>void;
        triggerPendingResizeAndOrganize:(onComplete?:()=>void)=>void;
        hideIds:(to_hide:string[], show_others?:boolean)=>void;
        hideTrackLegends:(track_ids:TrackId[])=>void;
        showTrackLegends:(track_ids:TrackId[])=>void;
        setCellPaddingOn:(cell_padding_on:boolean)=>void;
        toSVG:(with_background:boolean)=>SVGElement;
        toCanvas:(callback:(canvas:HTMLCanvasElement, truncated:boolean)=>void, resolution:number)=>HTMLImageElement;
        toDataUrl:(callback:(dataURL:string)=>void)=>void;
        highlightTrack:(track_id:TrackId|null)=>void;
        getIdOrder:(all?:boolean)=>string[];
        setIdClipboardContents:(array:string[])=>void;
        getIdClipboardContents:()=>string[];
        onClipboardChange:(callback:(array:string[])=>void)=>void;
        setTrackCustomOptions:(track_id:TrackId, custom_options?:CustomTrackOption[])=>void;
        setShowTrackSublabels:(show:boolean)=>void;
        clearMouseOverEffects:()=>void;
        setTrackMovable:(track_id:TrackId, movable:boolean)=>void;
        setWidth:(width:number)=>void;
        setColumnLabels:(labels:{[uid:string]:string})=>void;

        constructor(ctr_selector:string, width:number, params?:{ init_cell_width?:number, init_cell_padding?:number });
        destroy:()=>void;
    }
}
