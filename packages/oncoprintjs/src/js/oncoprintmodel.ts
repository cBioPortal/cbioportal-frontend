/* jshint browserify: true, asi: true */

import binarysearch from './binarysearch';
import hasElementsInInterval from './haselementsininterval';
import CachedProperty from './CachedProperty';
import {hclusterColumns, hclusterTracks} from './clustering';
import $ from 'jquery';
import * as BucketSort from "./bucketsort";
import {cloneShallow, doesCellIntersectPixel, ifndef} from "./utils";
import _ from "lodash";
import {RuleSet, RuleSetParams, RuleWithId} from "./oncoprintruleset";
import {InitParams} from "./oncoprint";
import {ComputedShapeParams} from "./oncoprintshape";
import {CaseItem, EntityItem} from "./workers/clustering-worker";
import PrecomputedComparator from "./precomputedcomparator";

export type ColumnId = string;
export type TrackId = number;
export type Datum = any;
export type RuleSetId = number;
export type TrackGroup = TrackId[];
export type TrackGroupIndex = number;
export type TrackSortDirection = 0|1|-1;
export type TrackSortComparator<D> = (d1:D, d2:D)=>number;//returns (0|1|2|-1|-2); for comparison-based sort, where 2 and -2 mean force to end or beginning (resp) no matter what direction sorted in
export type TrackSortVector<D> = (d:D)=>(number|string)[]; // maps data to vector used for bucket sort - types of elements in each position must be same, i.e. Kth element must always be a number, or always be a string
export type TrackTooltipFn<D> = (cell_data:D[])=>HTMLElement|string|any;
export type TrackSortSpecificationComparators<D> = {
    mandatory:TrackSortComparator<D>; // specifies the mandatory order for the track
    preferred:TrackSortComparator<D>; // specifies the preferred order for the track (can be overridden by mandatory order of higher track)
    isVector?:false;
};
export type TrackSortSpecificationVectors<D> = {
    mandatory: TrackSortVector<D>; // specifies the mandatory order for the track
    preferred: TrackSortVector<D>; // specifies the preferred order for the track (can be overridden by mandatory order of higher track)
    isVector: true;
    compareEquals?:TrackSortComparator<D>; // specifies a comparator to be applied to sort among equal sort vectors in the *preferred* order (optional). eg sort by sample id if all else equal
};
export type TrackSortSpecification<D> = TrackSortSpecificationComparators<D> | TrackSortSpecificationVectors<D>;
export type ActiveRules = {[ruleId:number]:boolean};
export type ActiveRulesCount = {[ruleId:number]:number};
export type TrackSortDirectionChangeCallback = (track_id:TrackId, dir:number)=>void;
export type CustomTrackOption = {label?:string, separator?: boolean, onClick?:(id:TrackId)=>void, weight?:string, disabled?:boolean};
export type UserTrackSpec<D> = {
    target_group?:TrackGroupIndex;
    track_group_header?:string;
    cell_height?: number;
    track_padding?: number;
    has_column_spacing?: boolean;
    data_id_key?: string & keyof D;
    tooltipFn?: TrackTooltipFn<D>;
    movable?:boolean;
    removable?:boolean;
    removeCallback?:(track_id:TrackId)=>void;
    label?: string;
    sublabel?: string;
    html_label?: string;
    track_label_color?: string;
    track_label_circle_color?: string;
    track_label_font_weight?: string;
    track_label_left_padding?: number;
    link_url?: string;
    description?: string;
    track_info?:string;
    sortCmpFn:TrackSortSpecification<D>;
    sort_direction_changeable?:boolean;
    onSortDirectionChange?:TrackSortDirectionChangeCallback;
    init_sort_direction?:TrackSortDirection;
    data?:D[];
    rule_set_params?: RuleSetParams;
    expansion_of?: TrackId;
    expandCallback?: (id: TrackId) => void;
    expandButtonTextGetter?: (is_expanded: boolean) => string;
    important_ids?:string[];
    custom_track_options?:CustomTrackOption[];
    $track_info_tooltip_elt?:JQuery;
};
export type LibraryTrackSpec<D> = UserTrackSpec<D> & { rule_set:RuleSet, track_id:TrackId};
export type TrackOverlappingCells = {
    ids:ColumnId[],
    track:TrackId,
    top:number,
    left:number
};

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

export type IdentifiedShapeList = {
    id:ColumnId;
    shape_list:ComputedShapeParams[];
};

export type ClusterSortResult = {
    track_group_index:TrackGroupIndex;
    track_id_order:TrackId[];
};

export type ColumnLabel = {
    left_padding_percent?:number;
    text_color?:string;
    circle_color?:string;
    angle_in_degrees?:number;
    text:string;
};

class UnionOfSets {
    // a set, to be passed in as argument, is an object where the values are truthy
    private union_count:{[key:string]:number} = {};
    private sets:{[setId:string]:{[key:string]:boolean}} = {};

    private setOfKeys(obj:{[key:string]:any}) {
        const set:{[key:string]:boolean} = {};
        for (const k of Object.keys(obj)) {
            if (typeof obj[k] !== 'undefined') {
                set[k] = true;
            }
        }
        return set;
    }

    public putSet(id:string, set:{[key:string]:boolean}) {
        this.removeSet(id);
        this.sets[id] = set;

        for (const k of Object.keys(set)) {
            if (set[k]) {
                this.union_count[k] = this.union_count[k] || 0;
                this.union_count[k] += 1;
            }
        }
    }

    public removeSet(id:string) {
        const union_count = this.union_count;
        const old_set = this.sets[id] || {};
        for (const k of Object.keys(old_set)) {
            if (old_set[k]) {
                union_count[k] -= 1;
                if (union_count[k] === 0) {
                    delete union_count[k];
                }
            }
        }
        delete this.sets[id];
    }

    public getUnion() {
        return this.setOfKeys(this.union_count);
    }
}

function arrayUnique(arr:string[]) {
    const present:{[elt:string]:boolean} = {};
    const unique = [];
    for (let i=0; i<arr.length; i++) {
        if (typeof present[arr[i]] === 'undefined') {
            present[arr[i]] = true;
            unique.push(arr[i]);
        }
    }
    return unique;
}

function copyShallowObject<T>(obj:{[key:string]:T}) {
    const copy:{[key:string]:T} = {};
    for (const key of Object.keys(obj)) {
        copy[key] = obj[key];
    }
    return copy;
}

function clamp(x:number, lower:number, upper:number) {
    return Math.min(upper, Math.max(lower, x));
}

const MIN_ZOOM_PIXELS = 100;
const MIN_CELL_HEIGHT_PIXELS = 3;

export type TrackProp<T> = {[trackId:number]:T};
export type ColumnProp<T> = {[columnId:string]:T};

export default class OncoprintModel {

    // Global properties
    private sort_config:SortConfig;
    public rendering_suppressed_depth:number;

    // Rendering properties
    public readonly max_height:number;
    private cell_width:number;
    private horz_zoom:number;
    private vert_zoom:number;
    private horz_scroll:number;
    private vert_scroll:number;
    private bottom_padding:number;
    private track_group_padding:number;
    private cell_padding:number;
    private cell_padding_on:boolean;
    private cell_padding_off_cell_width_threshold:number;
    private cell_padding_off_because_of_zoom:boolean;
    private id_order:ColumnId[];
    private hidden_ids:ColumnProp<boolean>;
    private highlighted_ids:ColumnId[];
    private highlighted_tracks:TrackId[];
    private track_group_legend_order:TrackGroupIndex[];
    private show_track_sublabels:boolean;
    private column_labels:ColumnProp<ColumnLabel>;

    // Track properties
    private track_important_ids:TrackProp<ColumnProp<boolean>>;// set of "important" ids - only these ids will cause a used rule to become active and thus shown in the legend
    private track_label:TrackProp<string>;
    private track_label_color:TrackProp<string>;
    private track_label_circle_color:TrackProp<string>;
    private track_label_font_weight:TrackProp<string>;
    private track_label_left_padding:TrackProp<number>;
    private track_sublabel:TrackProp<string>;
    private track_html_label:TrackProp<string>;
    private track_link_url:TrackProp<string>;
    private track_description:TrackProp<string>;
    private cell_height:TrackProp<number>;
    private track_padding:TrackProp<number>;
    private track_data_id_key:TrackProp<string>;
    private track_tooltip_fn:TrackProp<TrackTooltipFn<any>>;
    private track_movable:TrackProp<boolean>;
    private track_removable:TrackProp<boolean>;
    private track_remove_callback:TrackProp<(track_id:TrackId)=>void>;
    private track_sort_cmp_fn:TrackProp<TrackSortSpecification<Datum>>;
    private track_sort_direction_changeable:TrackProp<boolean>;
    private track_sort_direction:TrackProp<TrackSortDirection>;
    private track_sort_direction_change_callback:TrackProp<TrackSortDirectionChangeCallback>;
    private track_data:TrackProp<Datum[]>;
    private track_rule_set_id:TrackProp<RuleSetId>;
    private track_active_rules:TrackProp<ActiveRules>;
    private track_info:TrackProp<string>;
    private $track_info_tooltip_elt:TrackProp<JQuery>;
    private track_has_column_spacing:TrackProp<boolean>;
    private track_expansion_enabled:TrackProp<boolean>;
    private track_expand_callback:TrackProp<(trackId:TrackId)=>void>;
    private track_expand_button_getter:TrackProp<(is_expanded:boolean)=>string>;
    public track_expansion_tracks:TrackProp<TrackId[]>;
    private track_expansion_parent:TrackProp<TrackId>;
    private track_custom_options:TrackProp<CustomTrackOption[]>;

    // Rule set properties
    private rule_sets:{[ruleSetId:number]:RuleSet};
    private rule_set_active_rules:{[ruleSetId:number]:ActiveRulesCount};

    // Cached and recomputed properties
    private visible_id_order:CachedProperty<ColumnId[]>;
    private track_id_to_datum:CachedProperty<TrackProp<ColumnProp<Datum>>>;
    private track_present_ids:CachedProperty<UnionOfSets>;
    private present_ids:CachedProperty<ColumnProp<boolean>>;
    private id_to_index:CachedProperty<ColumnProp<number>>;
    private visible_id_to_index:CachedProperty<ColumnProp<number>>;
    private track_tops:CachedProperty<TrackProp<number>>;
    private cell_tops:CachedProperty<TrackProp<number>>;
    private label_tops:CachedProperty<TrackProp<number>>;
    private track_tops_zoomed:CachedProperty<TrackProp<number>>;
    private cell_tops_zoomed:CachedProperty<TrackProp<number>>;
    private label_tops_zoomed:CachedProperty<TrackProp<number>>;
    private column_left:CachedProperty<ColumnProp<number>>;
    private zoomed_column_left:CachedProperty<ColumnProp<number>>;
    private column_left_no_padding:CachedProperty<ColumnProp<number>>;
    private precomputed_comparator:CachedProperty<TrackProp<PrecomputedComparator<Datum>>>;

    private track_groups:TrackGroup[];
    private track_group_sort_priority:TrackGroupIndex[];
    private track_group_header:string[];

    constructor(params:InitParams) {

        const model = this;

        this.sort_config = {};
        this.rendering_suppressed_depth = 0;

        this.max_height = 500;
        this.cell_width = ifndef(params.init_cell_width, 6);
        this.horz_zoom = ifndef(params.init_horz_zoom, 1);
        this.vert_zoom = ifndef(params.init_vert_zoom, 1);
        this.horz_scroll = 0;
        this.vert_scroll = 0;
        this.bottom_padding = 0;
        this.track_group_padding = ifndef(params.init_track_group_padding, 10);
        this.cell_padding = ifndef(params.init_cell_padding, 3);
        this.cell_padding_on = ifndef(params.init_cell_padding_on, true);
        this.cell_padding_off_cell_width_threshold = ifndef(params.cell_padding_off_cell_width_threshold, 2);
        this.cell_padding_off_because_of_zoom = (this.getCellWidth() < this.cell_padding_off_cell_width_threshold);
        this.id_order = [];
        this.hidden_ids = {};
        this.highlighted_ids = [];
        this.highlighted_tracks = [];
        this.track_group_legend_order = [];
        this.show_track_sublabels = false;
        this.column_labels = {};

        // Track Properties
        this.track_important_ids = {}; // a set of "important" ids - only these ids will cause a used rule to become active and thus shown in the legend
        this.track_label = {};
        this.track_label_color = {};
        this.track_label_circle_color = {};
        this.track_label_font_weight = {};
        this.track_label_left_padding = {}; // TODO: consolidate track styling properties into one object (help me typescript)
        this.track_sublabel = {};
        this.track_html_label = {};
        this.track_link_url = {};
        this.track_description = {};
        this.cell_height = {};
        this.track_padding = {};
        this.track_data_id_key = {};
        this.track_tooltip_fn = {};
        this.track_movable = {};
        this.track_removable = {};
        this.track_remove_callback = {};
        this.track_sort_cmp_fn = {};
        this.track_sort_direction_changeable = {};
        this.track_sort_direction = {}; // 1: ascending, -1: descending, 0: not
        this.track_sort_direction_change_callback = {};
        this.track_data = {};
        this.track_rule_set_id = {}; // track id -> rule set id
        this.track_active_rules = {}; // from track id to active rule map (map with rule ids as keys)
        this.track_info = {};
        this.$track_info_tooltip_elt = {};
        this.track_has_column_spacing = {}; // track id -> boolean
        this.track_expansion_enabled = {}; // track id -> boolean or undefined
        this.track_expand_callback = {}; // track id -> function that adds expansion tracks for its track if set
        this.track_expand_button_getter = {}; // track id -> function from boolean to string if customized
        this.track_expansion_tracks = {}; // track id -> array of track ids if applicable
        this.track_expansion_parent = {}; // track id -> track id if applicable
        this.track_custom_options = {}; // track id -> { label, onClick, weight, disabled }[] ( see index.d.ts :: CustomTrackOption )

        // Rule Set Properties
        this.rule_sets = {}; // map from rule set id to rule set
        this.rule_set_active_rules = {}; // map from rule set id to map from rule id to use count

        // Cached and Recomputed Properties
        this.visible_id_order = new CachedProperty([], function () {
            const hidden_ids = model.hidden_ids;
            return model.id_order.filter(function (id) {
                return !hidden_ids[id];
            });
        });
        this.track_id_to_datum = new CachedProperty({}, function(model, track_id) {
            const curr = model.track_id_to_datum.get();
            if (model.getContainingTrackGroup(track_id) !== null) {
                const map:ColumnProp<Datum> = {};
                const data = model.getTrackData(track_id) || [];
                const data_id_key = model.getTrackDataIdKey(track_id) || '';
                for (let i=0; i<data.length; i++) {
                    map[data[i][data_id_key] as string] = data[i];
                }
                curr[track_id] = map;
            } else {
                delete curr[track_id];
            }
            return curr;
        });
        this.track_present_ids = new CachedProperty(new UnionOfSets(), function(model, track_id) {
            const union = model.track_present_ids.get();
            if (model.getContainingTrackGroup(track_id) !== null) {
                const ids:ColumnProp<boolean> = {};
                const data = model.getTrackData(track_id) || [];
                const data_id_key = model.getTrackDataIdKey(track_id) || '';
                for (let i = 0; i < data.length; i++) {
                    ids[data[i][data_id_key] as string] = true;
                }
                union.putSet(track_id, ids);
            } else {
                union.removeSet(track_id);
            }
            return union;
        });
        this.present_ids = new CachedProperty({}, function() {
            return model.track_present_ids.get().getUnion();
        });
        this.track_present_ids.addBoundProperty(this.present_ids);

        this.id_to_index = new CachedProperty({}, function() {
            const id_to_index:ColumnProp<number> = {};
            const id_order = model.getIdOrder(true);
            for (let i=0; i<id_order.length; i++) {
                id_to_index[id_order[i]] = i;
            }
            return id_to_index;
        });
        this.visible_id_to_index = new CachedProperty({}, function() {
            const id_to_index:ColumnProp<number> = {};
            const id_order = model.getIdOrder();
            for (let i=0; i<id_order.length; i++) {
                id_to_index[id_order[i]] = i;
            }
            return id_to_index;
        });
        this.visible_id_order.addBoundProperty(this.visible_id_to_index);

        this.track_groups = [];
        this.track_group_sort_priority = [];
        this.track_group_header = [];

        this.track_tops = new CachedProperty({}, function () {
            const tops:TrackProp<number> = {};
            const groups = model.getTrackGroups();
            let y = 0;
            for (let i = 0; i < groups.length; i++) {
                const group = groups[i];
                if (model.getTrackGroupHeader(i).length > 0 && group.length > 0) {
                    y += model.getTrackGroupHeaderSize();
                }
                for (let j = 0; j < group.length; j++) {
                    const track_id = group[j];
                    tops[track_id] = y;
                    y += model.getTrackHeight(track_id, true);
                }
                if (group.length > 0) {
                    y += model.getTrackGroupPadding(true);
                }
            }
            return tops;
        });
        this.cell_tops = new CachedProperty({}, function() {
            const track_tops = model.track_tops.get();
            const cell_tops:TrackProp<number> = {};
            for (const k in track_tops) {
                if (track_tops.hasOwnProperty(k)) {
                    const key = parseInt(k, 10);
                    cell_tops[key] = track_tops[key] + model.getTrackPadding(key, true);
                }
            }
            return cell_tops;
        });
        this.label_tops = new CachedProperty({}, function() {
            return model.cell_tops.get();
        });

        this.track_tops.addBoundProperty(this.cell_tops);
        this.cell_tops.addBoundProperty(this.label_tops);

        this.track_tops_zoomed = new CachedProperty({}, function () {
            const tops:TrackProp<number> = {};
            const groups = model.getTrackGroups();
            let y = 0;
            for (let i = 0; i < groups.length; i++) {
                const group = groups[i];
                for (let j = 0; j < group.length; j++) {
                    const track_id = group[j];
                    tops[track_id] = y;
                    y += model.getTrackHeight(track_id);
                }
                if (group.length > 0) {
                    y += model.getTrackGroupPadding();
                }
            }
            return tops;
        });
        this.cell_tops_zoomed = new CachedProperty({}, function() {
            const track_tops = model.track_tops_zoomed.get();
            const cell_tops:TrackProp<number> = {};
            for (const k in track_tops) {
                if (track_tops.hasOwnProperty(k)) {
                    const key = parseInt(k, 10);
                    cell_tops[key] = track_tops[key] + model.getTrackPadding(key);
                }
            }
            return cell_tops;
        });
        this.label_tops_zoomed = new CachedProperty({}, function() {
            return model.cell_tops_zoomed.get();
        });

        this.track_tops.addBoundProperty(this.track_tops_zoomed);
        this.track_tops_zoomed.addBoundProperty(this.cell_tops_zoomed);
        this.cell_tops_zoomed.addBoundProperty(this.label_tops_zoomed);

        this.column_left = new CachedProperty({}, function() {
            const cell_width = model.getCellWidth(true);
            const cell_padding = model.getCellPadding(true);
            const left:ColumnProp<number> = {};
            const ids = model.getIdOrder();
            for (let i = 0; i < ids.length; i++) {
                left[ids[i]] = i * (cell_width + cell_padding);
            }
            return left;
        });

        this.zoomed_column_left = new CachedProperty({}, function() {
            const cell_width = model.getCellWidth();
            const cell_padding = model.getCellPadding();
            const left:ColumnProp<number> = {};
            const ids = model.getIdOrder();
            for (let i = 0; i < ids.length; i++) {
                left[ids[i]] = i * (cell_width + cell_padding);
            }
            return left;
        });
        this.column_left_no_padding = new CachedProperty({}, function() {
            const cell_width = model.getCellWidth(true);
            const left:ColumnProp<number> = {};
            const ids = model.getIdOrder();
            for (let i = 0; i < ids.length; i++) {
                left[ids[i]] = i * cell_width;
            }
            return left;
        });
        this.column_left.addBoundProperty(this.zoomed_column_left);
        this.column_left.addBoundProperty(this.column_left_no_padding);

        this.precomputed_comparator = new CachedProperty({}, function(model:OncoprintModel, track_id:TrackId) {
            const curr_precomputed_comparator = model.precomputed_comparator.get();
            curr_precomputed_comparator[track_id] = new PrecomputedComparator(model.getTrackData(track_id),
                model.getTrackSortComparator(track_id),
                model.getTrackSortDirection(track_id),
                model.getTrackDataIdKey(track_id));
            return curr_precomputed_comparator;
        });// track_id -> PrecomputedComparator
    }

    public toggleCellPadding() {
        this.cell_padding_on = !this.cell_padding_on;
        this.column_left.update();
        return this.cell_padding_on;
    }

    public getCellPadding(base?:boolean, dont_consider_zoom?:boolean) {
        return (this.cell_padding * (base ? 1 : this.horz_zoom)) * (+this.cell_padding_on) * (dont_consider_zoom ? 1 : +(!this.cell_padding_off_because_of_zoom));
    }

    public getHorzZoom() {
        return this.horz_zoom;
    }

    public getHorzZoomToFitNumCols(width:number, num_cols:number) {
        const cell_width = this.getCellWidth(true);
        const zoom_if_cell_padding_on = clamp(width / (num_cols*(cell_width + this.cell_padding)),
            0,1);
        const zoom_if_cell_padding_off = clamp(width / (num_cols*cell_width),
            0,1);
        let zoom;
        if (!this.cell_padding_on) {
            zoom = zoom_if_cell_padding_off;
        } else {
            if (cell_width * zoom_if_cell_padding_on < this.cell_padding_off_cell_width_threshold) {
                if (cell_width * zoom_if_cell_padding_off >= this.cell_padding_off_cell_width_threshold) {
                    // Because of cell padding toggling there's no way to get exactly the desired number of columns.
                    // We can see this by contradiction: if we assume that cell padding is on, and try to fit exactly
                    // our number of columns, we end up turning cell padding off (outer if statement). If we assume that
                    // cell padding is off and try to fit our number of columns, we find that cell padding is on (inner if statement).
                    // Thus, it's impossible to show this exact number of columns - we either under or overshoot it. We
                    // thus should overshoot it by as little as possible, show as few columns as possible while still fitting
                    // this amount. It must be exactly at the threshold for switching.
                    //
                    const unrounded_zoom = this.cell_padding_off_cell_width_threshold / cell_width;
                    const unrounded_num_cols = width / (unrounded_zoom * cell_width);
                    const rounded_num_cols = Math.ceil(unrounded_num_cols);
                    zoom = width / (rounded_num_cols * cell_width);
                } else {
                    zoom = zoom_if_cell_padding_off;
                }
            } else {
                zoom = zoom_if_cell_padding_on;
            }
        }
        return zoom;
    }

    public getHorzZoomToFit(width:number, ids:ColumnId[]) {
        ids = ids || [];
        if (ids.length === 0) {
            return 1;
        }
        const id_to_index_map = this.getVisibleIdToIndexMap();
        const indexes = ids.map(function(id) { return id_to_index_map[id]; });
        let max = Number.NEGATIVE_INFINITY;
        let min = Number.POSITIVE_INFINITY;
        for (let i=0; i<indexes.length; i++) {
            max = Math.max(indexes[i], max);
            min = Math.min(indexes[i], min);
        }
        const num_cols = max - min + 1;
        return this.getHorzZoomToFitNumCols(width, num_cols);
    }

    public getMinHorzZoom() {
        return Math.min(MIN_ZOOM_PIXELS / (this.getIdOrder().length*this.getCellWidth(true) + (this.getIdOrder().length-1)*this.getCellPadding(true)), 1);
    }

    public getMinVertZoom() {
        // Can't zoom to be smaller than max height
        // That zoom would be z*this.getOncoprintHeight(true) = max_height
        return this.max_height / this.getOncoprintHeight(true);
    }

    public setHorzScroll(s:number) {
        this.horz_scroll = Math.max(0, s);
        return this.horz_scroll;
    }
    public setVertScroll(s:number) {
        this.vert_scroll = Math.max(0, s);
        return this.vert_scroll;
    }
    public setScroll(h:number, v:number) {
        this.setHorzScroll(h);
        this.setVertScroll(v);
    }
    public getHorzScroll() {
        return this.horz_scroll;
    }
    public getVertScroll() {
        return this.vert_scroll;
    }
    public setZoom(zoom_x:number, zoom_y:number) {
        this.setHorzZoom(zoom_x);
        this.setVertZoom(zoom_y);
    }
    private setCellPaddingOffBecauseOfZoom(val:boolean) {
        this.cell_padding_off_because_of_zoom = val;
        this.column_left.update();
    }
    public setHorzZoom(z:number) {
        const min_zoom = this.getMinHorzZoom();
        this.horz_zoom = clamp(z, min_zoom, 1);
        this.column_left.update();

        if (this.getCellWidth() < this.cell_padding_off_cell_width_threshold && !this.cell_padding_off_because_of_zoom) {
            this.setCellPaddingOffBecauseOfZoom(true);
        } else if (this.getCellWidth() >= this.cell_padding_off_cell_width_threshold && this.cell_padding_off_because_of_zoom) {
            this.setCellPaddingOffBecauseOfZoom(false);
        }
        return this.horz_zoom;
    }

    public getVertZoom() {
        return this.vert_zoom;
    }

    public setVertZoom(z:number) {
        const min_zoom = this.getMinVertZoom();
        this.vert_zoom = clamp(z, min_zoom, 1);
        this.track_tops.update();
        return this.vert_zoom;
    }

    public hideTrackLegends(track_ids:TrackId[]) {
        track_ids = [].concat(track_ids);
        for (let i=0; i<track_ids.length; i++) {
            this.getRuleSet(track_ids[i]).exclude_from_legend = true;
        }
    }

    public showTrackLegends(track_ids:TrackId[]) {
        track_ids = [].concat(track_ids);
        for (let i=0; i<track_ids.length; i++) {
            this.getRuleSet(track_ids[i]).exclude_from_legend = false;
        }
    }

    private clearTrackActiveRules(track_id:TrackId) {
        const rule_set_id = this.track_rule_set_id[track_id];
        const track_active_rules = this.track_active_rules[track_id];
        const rule_set_active_rules = this.rule_set_active_rules[rule_set_id];

        const track_active_rule_ids = Object.keys(track_active_rules).map(x=>parseInt(x,10));
        for (let i=0; i<track_active_rule_ids.length; i++) {
            const rule_id = track_active_rule_ids[i];
            if (rule_set_active_rules.hasOwnProperty(rule_id)) {
                rule_set_active_rules[rule_id] -= 1;
                if (rule_set_active_rules[rule_id] <= 0) {
                    delete rule_set_active_rules[rule_id];
                }
            }
        }
        this.track_active_rules[track_id] = {};
    };

    private setTrackActiveRules(track_id:TrackId, active_rules:ActiveRules) {
        this.clearTrackActiveRules(track_id);
        this.track_active_rules[track_id] = active_rules;
        const rule_set_id = this.track_rule_set_id[track_id];
        const rule_set_active_rules = this.rule_set_active_rules[rule_set_id];

        const track_active_rule_ids = Object.keys(active_rules).map(x=>parseInt(x, 0));
        for (let i=0; i<track_active_rule_ids.length; i++) {
            const rule_id = track_active_rule_ids[i];
            rule_set_active_rules[rule_id] = rule_set_active_rules[rule_id] || 0;
            rule_set_active_rules[rule_id] += 1;
        }
    };

    public getIdentifiedShapeListList(track_id:TrackId, use_base_size:boolean, sort_by_z:boolean):IdentifiedShapeList[] {
        const active_rules = {};
        const data = this.getTrackData(track_id);
        const id_key = this.getTrackDataIdKey(track_id);
        const spacing = this.getTrackHasColumnSpacing(track_id);
        const width = this.getCellWidth(use_base_size) + (!spacing ? this.getCellPadding(use_base_size, true) : 0);
        const shapes = this.getRuleSet(track_id).apply(
            data, width, this.getCellHeight(track_id, use_base_size), active_rules, id_key, this.getTrackImportantIds(track_id)
        );

        this.setTrackActiveRules(track_id, active_rules);


        function z_comparator(shapeA:ComputedShapeParams, shapeB:ComputedShapeParams) {
            const zA = parseFloat(shapeA.z as any);
            const zB = parseFloat(shapeB.z as any);
            if (zA < zB) {
                return -1;
            } else if (zA > zB) {
                return 1;
            } else {
                return 0;
            }
        }
        return shapes.map(function(shape_list:ComputedShapeParams[], index:number) {
            if (sort_by_z) {
                shape_list.sort(z_comparator);
            }
            return {
                id: data[index][id_key],
                shape_list: shape_list
            };
        });
    }

    public getActiveRules(rule_set_id:RuleSetId) {
        const rule_set_active_rules = this.rule_set_active_rules[rule_set_id];
        if (rule_set_active_rules) {
            return this.rule_sets[rule_set_id].getRulesWithId().filter(function(rule_with_id:RuleWithId) {
                return !!rule_set_active_rules[rule_with_id.id];
            });
        } else {
            return [];
        }
    }

    public setTrackImportantIds(track_id:TrackId, ids?:ColumnId[]) {
        if (!ids) {
            this.track_important_ids[track_id] = undefined;
        } else {
            this.track_important_ids[track_id] = ids.reduce(function(map:ColumnProp<boolean>, next_id:ColumnId) {
                map[next_id] = true;
                return map;
            }, {});
        }
    }

    public getTrackImportantIds(track_id:TrackId) {
        return this.track_important_ids[track_id];
    }

    public getRuleSets() {
        // return rule sets, in track group legend order
        const self = this;
        const legend_order = this.getTrackGroupLegendOrder();
        const used_track_groups:{[trackGroupIndex:number]:boolean} = {};
        const track_groups = this.getTrackGroups();
        const sorted_track_groups = [];
        for (let i=0; i<legend_order.length; i++) {
            // add track groups in legend order
            used_track_groups[legend_order[i]] = true;
            if (track_groups[legend_order[i]]) {
                sorted_track_groups.push(track_groups[legend_order[i]]);
            }
        }
        for (let i=0; i<track_groups.length; i++) {
            // add groups not in legend order to end
            if (!used_track_groups[i] && track_groups[i]) {
                sorted_track_groups.push(track_groups[i]);
            }
        }
        const sorted_tracks = sorted_track_groups.reduce(function(acc, next) { return acc.concat(next); }, []);
        const rule_set_ids:number[] = sorted_tracks.map(function(track_id:TrackId) {
            return self.track_rule_set_id[track_id];
        });
        const unique_rule_set_ids = arrayUnique(rule_set_ids.map(x=>x.toString()));
        return unique_rule_set_ids.map(function(rule_set_id) {
            return self.rule_sets[parseInt(rule_set_id, 10)];
        });
    }

    public getTrackHasColumnSpacing(track_id:TrackId) {
        return !!(this.track_has_column_spacing[track_id]);
    }

    public getCellWidth(base?:boolean) {
        return this.cell_width * (base ? 1 : this.horz_zoom);
    }

    public getCellHeight(track_id:TrackId, base?:boolean) {
        return this.cell_height[track_id] * (base ? 1 : this.vert_zoom);
    }

    public getTrackInfo(track_id:TrackId) {
        return this.track_info[track_id];
    }

    public setTrackInfo(track_id:TrackId, msg:string) {
        this.track_info[track_id] = msg;
    }

    public getTrackHeight(track_id:TrackId, base?:boolean) {
        return this.getCellHeight(track_id, base) + 2*this.getTrackPadding(track_id, base);
    }

    public getTrackPadding(track_id:TrackId, base?:boolean) {
        return this.track_padding[track_id] * (base ? 1 : this.vert_zoom);
    }
    public getBottomPadding() {
        return this.bottom_padding;
    }
    public getTrackSortDirection(track_id:TrackId) {
        return this.track_sort_direction[track_id];
    }
    public setTrackSortDirection(track_id:TrackId, dir:TrackSortDirection, no_callback?:boolean) {
        // see above for dir options
        this.track_sort_direction[track_id] = dir;
        if (!no_callback) {
            this.track_sort_direction_change_callback[track_id](track_id, dir);
        }
        this.precomputed_comparator.update(this, track_id);
    }

    public setCellPaddingOn(cell_padding_on:boolean) {
        this.cell_padding_on = cell_padding_on;
        this.column_left.update();
    }
    public getIdOrder(all?:boolean) {
        if (all) {
            return this.id_order; // TODO: should be read-only
        } else {
            return this.visible_id_order.get();
        }
    }
    public getIdToIndexMap() {
        return this.id_to_index.get();
    }
    public getVisibleIdToIndexMap() {
        return this.visible_id_to_index.get();
    }

    public getHiddenIds() {
        const hidden_ids = this.hidden_ids;
        return this.id_order.filter(function (id) {
            return !!hidden_ids[id];
        });
    }

    public isSortAffected(modified_ids:TrackId | TrackId[], group_or_track:"track"|"group") {
        modified_ids = [].concat(modified_ids);
        let group_indexes;
        const self = this;
        if (group_or_track === "track") {
            group_indexes = modified_ids.map(function(id) {
                return self.getContainingTrackGroupIndex(id);
            });
        } else {
            group_indexes = modified_ids;
        }
        return (this.sort_config.type !== "cluster" ||
            (group_indexes.indexOf(this.sort_config.track_group_index) > -1));
    }

    public setIdOrder(ids:ColumnId[]) {
        this.id_order = ids.slice();
        Object.freeze(this.id_order);
        this.id_to_index.update();
        this.visible_id_order.update();
        this.column_left.update();
    }

    public hideIds(to_hide:ColumnId[], show_others?:boolean) {
        if (show_others) {
            this.hidden_ids = {};
        }
        for (let j = 0, len = to_hide.length; j < len; j++) {
            this.hidden_ids[to_hide[j]] = true;
        }
        this.visible_id_order.update();
        this.column_left.update();
    }

    public setHighlightedTracks(track_ids:TrackId[]) {
        this.highlighted_tracks = track_ids;
    }

    public getHighlightedTracks() {
        const realTracks = _.keyBy(this.getTracks());
        return this.highlighted_tracks.filter(trackId=>(trackId in realTracks));
    }

    public setHighlightedIds(ids:ColumnId[]) {
        this.highlighted_ids = ids;
    }

    public getVisibleHighlightedIds() {
        const visibleIds = this.getVisibleIdToIndexMap();
        return this.highlighted_ids.filter(uid=>(uid in visibleIds));
    }

    public setTrackGroupOrder(index:TrackGroupIndex, track_order:TrackGroup) {
        this.track_groups[index] = track_order;

        this.track_tops.update();
    }

    public moveTrackGroup(from_index:TrackGroupIndex, to_index:TrackGroupIndex) {
        const new_groups = [];
        const new_headers = [];
        const group_to_move = this.track_groups[from_index];
        for (let i = 0; i < this.track_groups.length; i++) {
            if (i !== from_index && i !== to_index) {
                new_groups.push(this.track_groups[i]);
                new_headers.push(this.track_group_header[i]);
            }
            if (i === to_index) {
                new_groups.push(group_to_move);
                new_headers.push(this.track_group_header[from_index]);
            }
        }
        this.track_groups = new_groups;
        this.track_group_header = new_headers;
        this.track_tops.update();
        return this.track_groups;
    }

    public addTracks(params_list:LibraryTrackSpec<Datum>[]) {
        for (let i = 0; i < params_list.length; i++) {
            const params = params_list[i];
            this.addTrack(params);
        }
        this.track_tops.update();
    }

    private addTrack(params: LibraryTrackSpec<Datum>) {
        const track_id = params.track_id;
        this.$track_info_tooltip_elt[track_id] = params.$track_info_tooltip_elt;
        this.track_custom_options[track_id] = ifndef(params.custom_track_options, []);
        this.track_label[track_id] = ifndef(params.label, "Label");
        this.track_sublabel[track_id] = ifndef(params.sublabel, "");
        this.track_label_color[track_id] = ifndef(params.track_label_color, "black");
        this.track_label_circle_color[track_id] = params.track_label_circle_color;
        this.track_label_font_weight[track_id] = params.track_label_font_weight;
        this.track_label_left_padding[track_id] = ifndef(params.track_label_left_padding, 0);
        this.track_link_url[track_id] = ifndef(params.link_url, null);
        this.track_description[track_id] = ifndef(params.description, "");
        this.cell_height[track_id] = ifndef(params.cell_height, 23);
        this.track_padding[track_id] = ifndef(params.track_padding, 5);
        this.track_has_column_spacing[track_id] = ifndef(params.has_column_spacing, true);

        this.track_tooltip_fn[track_id] = ifndef(params.tooltipFn, function (d) {
            return d + '';
        });
        this.track_movable[track_id] = ifndef(params.movable, true);
        this.track_removable[track_id] = ifndef(params.removable, false);
        this.track_remove_callback[track_id] = ifndef(params.removeCallback, function() {});

        if (typeof params.expandCallback !== 'undefined') {
            this.track_expand_callback[track_id] = params.expandCallback;
            this.track_expansion_enabled[track_id] = true;
        }
        if (typeof params.expandButtonTextGetter !== 'undefined') {
            this.track_expand_button_getter[track_id] = params.expandButtonTextGetter;
        }

        this.track_sort_cmp_fn[track_id] = params.sortCmpFn;

        this.track_sort_direction_changeable[track_id] = ifndef(params.sort_direction_changeable, false);
        this.track_sort_direction_change_callback[track_id] = ifndef(params.onSortDirectionChange, function() {});
        this.track_data[track_id] = ifndef(params.data, []);
        this.track_data_id_key[track_id] = ifndef(params.data_id_key, 'id');

        this.track_info[track_id] = ifndef(params.track_info, "");

        if (typeof params.html_label !== 'undefined') {
            this.track_html_label[track_id] = params.html_label;
        }

        if (typeof params.rule_set !== 'undefined') {
            this.rule_sets[params.rule_set.rule_set_id] = params.rule_set;
            this.rule_set_active_rules[params.rule_set.rule_set_id] = {};
            this.track_rule_set_id[track_id] = params.rule_set.rule_set_id;
        }
        this.track_active_rules[track_id] = {};

        if (params.important_ids) {
            this.setTrackImportantIds(track_id, params.important_ids);
        }

        this.track_sort_direction[track_id] = ifndef(params.init_sort_direction, 1);

        params.target_group = ifndef(params.target_group, 0);
        while (params.target_group >= this.track_groups.length) {
            this.track_groups.push([]);
            this.track_group_header.push("");
        }
        if (params.track_group_header) {
            this.track_group_header[params.target_group] = params.track_group_header;
        }

        const group_array = this.track_groups[params.target_group];
        const target_index = (params.expansion_of !== undefined
                ? group_array.indexOf(this.getLastExpansion(params.expansion_of)) + 1
                : group_array.length
        );
        group_array.splice(target_index, 0, track_id);

        if (params.expansion_of !== undefined) {
            if (!this.track_expansion_tracks.hasOwnProperty(params.expansion_of)) {
                this.track_expansion_tracks[params.expansion_of] = [];
            }
            if (this.track_expansion_tracks[params.expansion_of].indexOf(track_id) !== -1) {
                throw new Error('Illegal state: duplicate expansion track ID');
            }
            this.track_expansion_parent[track_id] = params.expansion_of;
            this.track_expansion_tracks[params.expansion_of].push(track_id);
        }

        this.track_id_to_datum.update(this, track_id);
        this.track_present_ids.update(this, track_id);
        this.precomputed_comparator.update(this, track_id);

        this.setIdOrder(Object.keys(this.present_ids.get()));
    }

    // get a reference to the array that stores the order of tracks in
    // the same group
    private _getMajorTrackGroup(track_id:TrackId, return_index?:boolean) {
        let group;
        let i;
        for (i = 0; i < this.track_groups.length; i++) {
            if (this.track_groups[i].indexOf(track_id) > -1) {
                group = this.track_groups[i];
                break;
            }
        }
        if (group) {
            return return_index ? i : group;
        } else {
            return null;
        }
    }
    // get an array listing the track IDs that a track can move around
    private _getEffectiveTrackGroup(track_id:TrackId) {
        const self = this;
        let group,
            parent_id = this.track_expansion_parent[track_id];
        if (parent_id === undefined) {
            group = (function(major_group:TrackGroup) {
                return (major_group === null ? null
                    : major_group.filter(function (sibling_id) {
                        return self.track_expansion_parent[sibling_id] === undefined;
                    }));
            })(this._getMajorTrackGroup(track_id) as TrackGroup);
        } else {
            group = this.track_expansion_tracks[parent_id];
        }
        return group ? group.slice() : null;
    }

    private isRuleSetUsed(rule_set_id:RuleSetId) {
        let used = false;
        const tracks = this.getTracks();
        for (let i=0; i<tracks.length; i++) {
            if (this.track_rule_set_id[tracks[i]] === rule_set_id) {
                used = true;
                break;
            }
        }
        return used;
    }

    private removeRuleSet(rule_set_id:RuleSetId) {
        delete this.rule_sets[rule_set_id];
        delete this.rule_set_active_rules[rule_set_id];
    };

    public removeTrack(track_id:TrackId) {
        const rule_set_id = this.track_rule_set_id[track_id];

        // subtract this tracks active rules from usage count,
        //   so that we don't show unused rules in the legend
        this.clearTrackActiveRules(track_id);

        this.track_remove_callback[track_id](track_id);

        delete this.track_data[track_id];
        delete this.track_rule_set_id[track_id];
        delete this.track_label[track_id];
        delete this.track_link_url[track_id];
        delete this.cell_height[track_id];
        delete this.track_padding[track_id];
        delete this.track_data_id_key[track_id];
        delete this.track_tooltip_fn[track_id];
        delete this.track_movable[track_id];
        delete this.track_removable[track_id];
        delete this.track_remove_callback[track_id];
        delete this.track_sort_cmp_fn[track_id];
        delete this.track_sort_direction_changeable[track_id];
        delete this.track_sort_direction[track_id];
        delete this.track_info[track_id];
        delete this.track_has_column_spacing[track_id];
        delete this.track_expansion_enabled[track_id];
        delete this.track_expand_callback[track_id];
        delete this.track_expand_button_getter[track_id];
        delete this.track_expansion_tracks[track_id];
        delete this.track_label_circle_color[track_id];
        delete this.track_label_font_weight[track_id];
        delete this.track_label_left_padding[track_id];

        const containing_track_group = this._getMajorTrackGroup(track_id) as TrackGroup;
        if (containing_track_group !== null) {
            containing_track_group.splice(
                containing_track_group.indexOf(track_id), 1);
        }
        // remove listing of the track as an expansion of its parent track
        const expansion_group = this.track_expansion_tracks[this.track_expansion_parent[track_id]];
        if (expansion_group) {
            expansion_group.splice(expansion_group.indexOf(track_id), 1);
        }
        delete this.track_expansion_parent[track_id];
        this.track_tops.update();
        this.track_present_ids.update(this, track_id);
        this.track_id_to_datum.update(this, track_id);
        this.setIdOrder(Object.keys(this.present_ids.get()));

        // delete rule set if its now unused
        const rule_set_used = this.isRuleSetUsed(rule_set_id);
        if (!rule_set_used) {
            this.removeRuleSet(rule_set_id);
        }
    };

    public getOverlappingCells(x:number,y:number):TrackOverlappingCells|null {
        // First, see if it's in a column
        const id_order = this.getIdOrder();
        const zoomed_column_left = this.getZoomedColumnLeft() as ColumnProp<number>;
        // this gets the nearest lower index
        const nearest_id_index = binarysearch(id_order, x, function(id) { return zoomed_column_left[id];}, true);
        if (nearest_id_index === -1) {
            return null;
        }

        // Next, see if it's in a track
        const tracks = this.getTracks();
        const cell_tops = this.getCellTops() as TrackProp<number>;
        const nearest_track_index = binarysearch(tracks, y, function (track) {
            return cell_tops[track];
        }, true);
        if (nearest_track_index === -1) {
            return null;
        }
        const nearest_track = tracks[nearest_track_index];
        if (y >= cell_tops[nearest_track] + this.getCellHeight(nearest_track)) {
            // we know y is past the top of the track (>= cell_tops[nearest_track]), so this checks if y is past the bottom of the track
            return null;
        }

        // At this point, we know y is inside a track

        // Finally, return all ids within 1 px of x to the right
        const ids = [];
        let hitzone_width = this.getCellWidth();
        if (!this.getTrackHasColumnSpacing(nearest_track)) {
            hitzone_width += this.getCellPadding();
        }
        for (let i=nearest_id_index; i<id_order.length; i++) {
            // if hitzone of cell touches the pixel [x,x+1), then include it
            if (doesCellIntersectPixel([zoomed_column_left[id_order[i]], zoomed_column_left[id_order[i]] + hitzone_width], x)) {
                ids.push(id_order[i]);
            } else if (zoomed_column_left[id_order[i]] > x+1) {
                break;
            }
        }
        if (ids.length > 0) {
            return {'ids': ids, 'track': nearest_track, 'top': cell_tops[nearest_track], 'left': zoomed_column_left[ids[0]]};
        }
        return null;
    };

    public getTrackDatum(track_id:TrackId, id:ColumnId) {
        const datumById = this.track_id_to_datum.get()[track_id];
        if (!datumById) {
            return null;
        }

        return datumById[id] || null;
    }

    public getTrackTops():TrackProp<number>;
    public getTrackTops(desired_track_id:TrackId):number;
    public getTrackTops(desired_track_id?:TrackId) {
        if (typeof desired_track_id === 'undefined') {
            return copyShallowObject(this.track_tops.get());
        } else {
            return this.track_tops.get()[desired_track_id];
        }
    }

    public getZoomedTrackTops():TrackProp<number>;
    public getZoomedTrackTops(desired_track_id:TrackId):number;
    public getZoomedTrackTops(desired_track_id?:TrackId) {
        if (typeof desired_track_id === 'undefined') {
            return copyShallowObject(this.track_tops_zoomed.get());
        } else {
            return this.track_tops_zoomed.get()[desired_track_id];
        }
    }

    public getCellTops(desired_track_id?:undefined, base?:boolean):TrackProp<number>;
    public getCellTops(desired_track_id:TrackId, base?:boolean):number;
    public getCellTops(desired_track_id?:TrackId, base?:boolean) {
        if (typeof desired_track_id === 'undefined') {
            return copyShallowObject((base ? this.cell_tops : this.cell_tops_zoomed).get());
        } else {
            return (base ? this.cell_tops : this.cell_tops_zoomed).get()[desired_track_id];
        }
    }

    public getLabelTops():TrackProp<number>;
    public getLabelTops(desired_track_id:TrackId):number;
    public getLabelTops(desired_track_id?:TrackId, base?:boolean) {
        if (typeof desired_track_id === 'undefined') {
            return copyShallowObject((base ? this.label_tops : this.label_tops_zoomed).get());
        } else {
            return (base ? this.label_tops : this.label_tops_zoomed).get()[desired_track_id];
        }
    }

    public getContainingTrackGroup(track_id:TrackId) {
        return this._getEffectiveTrackGroup(track_id);
    }

    public getContainingTrackGroupIndex(track_id:TrackId) {
        return this._getMajorTrackGroup(track_id, true);
    }

    public setTrackGroupHeader(track_group_id:TrackGroupIndex, text:string) {
        this.track_group_header[track_group_id] = text;
        this.track_tops.update();
    }

    public getTrackGroupHeader(track_group_id:TrackGroupIndex) {
        return this.track_group_header[track_group_id] || "";
    }

    public getTrackGroupHeaderSize() {
        return 20;
    }

    public getTrackGroups() {
        // TODO: make read-only
        return this.track_groups;
    }

    public getTracks() {
        const ret = [];
        for (let i = 0; i < this.track_groups.length; i++) {
            for (let j = 0; j < this.track_groups[i].length; j++) {
                ret.push(this.track_groups[i][j]);
            }
        }
        return ret;
    }

    public getIdsInLeftInterval(left:number, right:number) {
        const cell_width = this.getCellWidth();
        const cell_padding = this.getCellPadding();
        const id_order = this.getIdOrder();

        // left_id_index and right_id_index are inclusive
        let left_id_index = Math.floor(left/(cell_width + cell_padding));
        const left_remainder = left - left_id_index*(cell_width + cell_padding);
        if (left_remainder > cell_width) {
            left_id_index += 1;
        }
        const right_id_index = Math.floor(right/(cell_width + cell_padding));
        return id_order.slice(left_id_index, right_id_index+1);
    }

    public getColumnLeft():ColumnProp<number>;
    public getColumnLeft(id:ColumnId):number;
    public getColumnLeft(id?:ColumnId) {
        if (typeof id === 'undefined') {
            return this.column_left.get();
        } else {
            return this.column_left.get()[id];
        }
    }

    public getColumnLeftNoPadding():ColumnProp<number>;
    public getColumnLeftNoPadding(id:ColumnId):number;
    public getColumnLeftNoPadding(id?:ColumnId) {
        if (typeof id === 'undefined') {
            return this.column_left_no_padding.get();
        } else {
            return this.column_left_no_padding.get()[id];
        }
    }

    public getZoomedColumnLeft():ColumnProp<number>;
    public getZoomedColumnLeft(id:ColumnId):number;
    public getZoomedColumnLeft(id?:ColumnId) {
        if (typeof id === 'undefined') {
            return this.zoomed_column_left.get();
        } else {
            return this.zoomed_column_left.get()[id];
        }
    }


    public getOncoprintHeight(base?:boolean) {
        const tracks = this.getTracks();
        const last_track = tracks[tracks.length-1];
        return (base ? this.getTrackTops(last_track) as number : this.getZoomedTrackTops(last_track) as number)+this.getTrackHeight(last_track, base)
            + this.getBottomPadding();
    }

    public getOncoprintWidth(base?:boolean) {
        return this.getIdOrder().length*(this.getCellWidth(base) + this.getCellPadding(base));
    }

    public getOncoprintWidthNoColumnPadding(base?:boolean) {
        return this.getIdOrder().length*this.getCellWidth(base);
    }

    public getColumnLabels() {
        return this.column_labels;
    }

    public setColumnLabels(labels:ColumnProp<ColumnLabel>) {
        this.column_labels = labels;
    }

    public moveTrack(track_id:TrackId, new_previous_track:TrackId) {

        function moveContiguousValues<T>(uniqArray:T[], first_value:T, last_value:T, new_predecessor:T) {
            const old_start_index = uniqArray.indexOf(first_value),
                old_end_index = uniqArray.indexOf(last_value);
            const values = uniqArray.slice(old_start_index, old_end_index + 1);
            uniqArray.splice(old_start_index, values.length);
            const new_position = (new_predecessor === null ? 0 : uniqArray.indexOf(new_predecessor)+1);
            uniqArray.splice.bind(uniqArray, new_position, 0).apply(null, values);
        }

        const track_group = this._getMajorTrackGroup(track_id) as TrackGroup,
            expansion_parent = this.track_expansion_parent[track_id];

        let flat_previous_track;

        if (track_group !== null) {
            // if an expansion track moves above all other tracks it can,
            // place it directly below its expansion parent
            if (expansion_parent !== undefined && new_previous_track === null) {
                flat_previous_track = expansion_parent;
                // otherwise, place the track under (the last expansion track of)
                // its sibling
            } else {
                flat_previous_track = this.getLastExpansion(new_previous_track);
            }
            moveContiguousValues(track_group, track_id, this.getLastExpansion(track_id), flat_previous_track);
        }

        // keep the order of expansion siblings up-to-date as well
        if (this.track_expansion_parent[track_id] !== undefined) {
            moveContiguousValues(this.track_expansion_tracks[expansion_parent], track_id, track_id, new_previous_track);
        }

        this.track_tops.update();
    };

    public getTrackLabel(track_id:TrackId) {
        return this.track_label[track_id];
    }

    public getTrackSublabel(track_id:TrackId) {
        return this.track_sublabel[track_id];
    }

    public getShowTrackSublabels() {
        return this.show_track_sublabels;
    }

    public setShowTrackSublabels(show:boolean) {
        return this.show_track_sublabels = show;
    }

    public getTrackLabelColor(track_id:TrackId) {
        return this.track_label_color[track_id];
    }

    public getTrackLabelCircleColor(track_id:TrackId) {
        return this.track_label_circle_color[track_id];
    }

    public getTrackLabelFontWeight(track_id:TrackId) {
        return this.track_label_font_weight[track_id];
    }

    public getTrackLabelLeftPadding(track_id:TrackId) {
        return this.track_label_left_padding[track_id];
    }

    public getOptionalHtmlTrackLabel(track_id:TrackId) {
        return this.track_html_label[track_id];
    }

    public getTrackLinkUrl(track_id:TrackId) {
        return this.track_link_url[track_id];
    }

    public getTrackDescription(track_id:TrackId) {
        return this.track_description[track_id];
    }

    public getTrackTooltipFn(track_id:TrackId) {
        return this.track_tooltip_fn[track_id];
    }
    public setTrackTooltipFn(track_id:TrackId, tooltipFn:TrackTooltipFn<Datum>) {
        this.track_tooltip_fn[track_id] = tooltipFn;
    }

    public getTrackDataIdKey(track_id:TrackId) {
        return this.track_data_id_key[track_id];
    }

    public getTrackGroupPadding(base?:boolean) {
        return this.track_group_padding * (base ? 1 : this.vert_zoom);
    }

    public isTrackRemovable(track_id:TrackId) {
        return this.track_removable[track_id];
    }

    public isTrackSortDirectionChangeable(track_id:TrackId) {
        return this.track_sort_direction_changeable[track_id];
    }

    public isTrackExpandable(track_id:TrackId) {
        // return true if the flag is defined and true
        return Boolean(this.track_expansion_enabled[track_id]);
    }

    public expandTrack(track_id:TrackId) {
        return this.track_expand_callback[track_id](track_id);
    }

    public disableTrackExpansion(track_id:TrackId) {
        this.track_expansion_enabled[track_id] = false;
    }

    public enableTrackExpansion(track_id:TrackId) {
        if (!this.track_expand_callback.hasOwnProperty(track_id)) {
            throw new Error("Track '" + track_id +"' has no expandCallback");
        }
        this.track_expansion_enabled[track_id] = true;
    }

    public isTrackExpanded(track_id:TrackId) {
        return this.track_expansion_tracks.hasOwnProperty(track_id) &&
            this.track_expansion_tracks[track_id].length > 0;
    }

    public getExpandButtonText(track_id:TrackId) {
        const self = this;
        const getExpandButtonFunction = function (track_id:TrackId) {
            return (self.track_expand_button_getter[track_id] ||
                function (is_expanded) {
                    return is_expanded ? 'Expand more' : 'Expand';
                });
        };
        return getExpandButtonFunction(track_id)(this.isTrackExpanded(track_id));
    }

    /**
     * Checks if one track is the expansion of another
     *
     * @param {number} expansion_track_id - the ID of the track to check
     * @param {number} set_track_id - the ID of the track it may be an expansion of
     */
    public isExpansionOf(expansion_track_id:TrackId, set_track_id:TrackId) {
        return this.track_expansion_tracks.hasOwnProperty(set_track_id) &&
            this.track_expansion_tracks[set_track_id].indexOf(expansion_track_id) !== -1;
    }

    /**
     * Finds the bottom-most track in a track's expansion group
     *
     * @param track_id - the ID of the track to start from
     * @returns the ID of its last expansion, or the unchanged param if none
     */
    public getLastExpansion(track_id:TrackId) {
        let direct_children = this.track_expansion_tracks[track_id];
        while (direct_children && direct_children.length) {
            track_id = direct_children[direct_children.length - 1];
            direct_children = this.track_expansion_tracks[track_id];
        }
        return track_id;
    }

    public getTrackCustomOptions(track_id:TrackId) {
        return this.track_custom_options[track_id];
    }

    public setTrackCustomOptions(track_id:TrackId, options:CustomTrackOption[]|undefined) {
        this.track_custom_options[track_id] = options;
    }

    public setTrackInfoTooltip(track_id:TrackId, $tooltip_elt:JQuery|undefined) {
        this.$track_info_tooltip_elt[track_id] = $tooltip_elt;
    }

    public $getTrackInfoTooltip(track_id:TrackId) {
        return this.$track_info_tooltip_elt[track_id];
    }

    public getRuleSet(track_id:TrackId) {
        return this.rule_sets[this.track_rule_set_id[track_id]];
    }

    public shareRuleSet(source_track_id:TrackId, target_track_id:TrackId) {
        this.setTrackActiveRules(target_track_id, {});

        const old_rule_set_id = this.track_rule_set_id[target_track_id];
        this.track_rule_set_id[target_track_id] = this.track_rule_set_id[source_track_id];
        if (!this.isRuleSetUsed(old_rule_set_id)) {
            this.removeRuleSet(old_rule_set_id);
        }
    }

    public setRuleSet(track_id:TrackId, rule_set:RuleSet) {
        this.setTrackActiveRules(track_id, {});

        const curr_rule_set_id = this.track_rule_set_id[track_id];
        this.rule_sets[rule_set.rule_set_id] = rule_set;
        this.rule_set_active_rules[rule_set.rule_set_id] = {};
        this.track_rule_set_id[track_id] = rule_set.rule_set_id;

        const rule_set_used = this.isRuleSetUsed(curr_rule_set_id);
        if (!rule_set_used) {
            this.removeRuleSet(curr_rule_set_id);
        }
    }

    public getTrackSortComparator(track_id:TrackId) {
        return this.track_sort_cmp_fn[track_id];
    }

    public setTrackSortComparator(track_id:TrackId, sortCmpFn:TrackSortSpecification<Datum>) {
        this.track_sort_cmp_fn[track_id] = sortCmpFn;
        this.precomputed_comparator.update(this, track_id);
    }

    public getTrackData(track_id:TrackId) {
        return this.track_data[track_id];
    }

    public clusterTrackGroup(track_group_index:TrackGroupIndex, clusterValueFn:(d:Datum)=>number):Promise<void | ClusterSortResult> {
        const sort_config_at_call = cloneShallow(this.sort_config);
        // Prepare input
        const self = this;
        //@ts-ignore
        const def = new $.Deferred();
        const cluster_input:ColumnProp<TrackProp<number>> = {};

        // Use data from tracks on the same level of expansion as the first one
        // in the track group as input, i.e. the outer level excluding any
        // expansions
        const track_group = this.getTrackGroups()[track_group_index];
        let track_ids:TrackId[] = [];
        if (track_group !== undefined) {
            track_ids = this._getEffectiveTrackGroup(track_group[0]) || [];
        }
        for (let i = 0; i < track_ids.length; i++) {
            const track_id = track_ids[i];
            const data_id_key = this.getTrackDataIdKey(track_id);
            const data = this.getTrackData(track_id);
            for (let j=0; j<data.length; j++) {
                const id = data[j][data_id_key];
                const value = clusterValueFn(data[j]);
                cluster_input[id] = cluster_input[id] || {};
                cluster_input[id][track_id] = value;
            }
        }
        if (!Object.keys(cluster_input).length) {
            // skip clustering if there's nothing to cluster
            return def.resolve().promise();
        }

        // unset sorting by tracks in this group
        /*track_group.forEach(function (track_id) {
            self.setTrackSortDirection(track_id, 0, true);
        });*/

        //do hierarchical clustering in background:
        $.when(hclusterColumns(cluster_input), hclusterTracks(cluster_input)).then(
            function (columnClusterOrder:CaseItem[], trackClusterOrder:EntityItem[]) {
                // cancel if sort config is no longer what it was
                if (!_.isEqual(self.sort_config, sort_config_at_call)) {
                    return;
                }
                // set clustered column order
                self.setIdOrder(columnClusterOrder.map(function (c) {return c.caseId;})); // TODO
                // determine clustered row order
                const clustered_track_id_order = trackClusterOrder.map(function (entity) { // TODO
                    return parseInt(entity.entityId, 10);
                });
                // re-insert any expansions below each clustered track
                const full_track_id_order:TrackId[] = [];
                clustered_track_id_order.forEach(function (track_id:TrackId) {
                    full_track_id_order.push(track_id);
                    Array.prototype.push.apply(
                        full_track_id_order,
                        self.track_expansion_tracks[track_id] || []
                    );
                });
                def.resolve({
                    track_group_index: track_group_index,
                    track_id_order: full_track_id_order
                });
            }).fail(function () {
            def.reject();
        });
        return def.promise();
    }

    /**
     * Sets the data for an Oncoprint track.
     *
     * @param track_id - the ID that identifies the track
     * @param {Object[]} data - the list of data for the cells
     * @param {string} data_id_key - name of the property of the
     * data objects to use as the (column) key
     */
    public setTrackData(track_id:TrackId, data:Datum[], data_id_key:string & keyof Datum) {
        this.track_data[track_id] = data;
        this.track_data_id_key[track_id] = data_id_key;
        this.track_id_to_datum.update(this, track_id);
        this.track_present_ids.update(this, track_id);
        this.setIdOrder(Object.keys(this.present_ids.get()));
        this.precomputed_comparator.update(this, track_id);
    }

    public setTrackGroupLegendOrder(group_order:TrackGroupIndex[]) {
        this.track_group_legend_order = group_order.slice();
    }

    public getTrackGroupLegendOrder() {
        return this.track_group_legend_order;
    }

    public setTrackGroupSortPriority(priority:TrackGroupIndex[]) {
        this.track_group_sort_priority = priority;
        this.sort();
    }
    private sortAlphabetical() {
        const id_order = this.getIdOrder(true).slice();
        id_order.sort(function(a,b) {
            return a.localeCompare(b);
        });
        this.setIdOrder(id_order);
    }
    private sortByTracks() {
        const track_group_sort_priority = this.track_group_sort_priority;
        const track_groups = this.getTrackGroups();
        let track_groups_in_sort_order:TrackGroup[];

        if (track_group_sort_priority.length < track_groups.length) {
            track_groups_in_sort_order = track_groups;
        } else {
            track_groups_in_sort_order = track_group_sort_priority.map(function(x) {
                return track_groups[x];
            });
        }

        const track_sort_priority = track_groups_in_sort_order.reduce(function(acc, next) {
            return acc.concat(next);
        }, []);

        const precomputed_comparator = this.precomputed_comparator.get();
        function getVector(id:ColumnId) {
            const mandatory_values = [];
            const preferred_values = [];
            for (let i=0; i<track_sort_priority.length; i++) {
                const sort_value = precomputed_comparator[track_sort_priority[i]].getSortValue(id);
                mandatory_values.push(sort_value.mandatory);
                preferred_values.push(sort_value.preferred);
            }
            return mandatory_values.concat(preferred_values);
        }

        const ids_with_vectors = this.getIdOrder(true).map(function(id) {
            return {
                id: id,
                vector: getVector(id)
            };
        });
        const order = BucketSort.bucketSort(ids_with_vectors, function(d:{id:ColumnId, vector:(string|number)[]}) { return d.vector; });
        this.setIdOrder(order.map(function(d:{id:ColumnId, vector:(string|number)[]}) { return d.id; }));
    }
    public sort():Promise<void|ClusterSortResult> {
        //@ts-ignore
        const def = new $.Deferred();
        this.sort_config = this.sort_config || {};
        if (this.sort_config.type === "alphabetical") {
            this.sortAlphabetical();
            def.resolve();
        } else if (this.sort_config.type === "order") {
            this.setIdOrder(this.sort_config.order);
            def.resolve();
        } else if (this.sort_config.type === "cluster") {
            this.clusterTrackGroup(this.sort_config.track_group_index,
                this.sort_config.clusterValueFn).then(function(x) {
                def.resolve(x);
            });
        } else {
            this.sortByTracks();
            def.resolve();
        }
        return def.promise();
    }

    public setSortConfig(params:SortConfig) {
        this.sort_config = params;
    }

    public getTrackMovable(track_id:TrackId) {
        return this.track_movable[track_id];
    }

    public setTrackMovable(track_id:TrackId, movable:boolean) {
        this.track_movable[track_id] = movable;
    }

    public isTrackInClusteredGroup(track_id:TrackId) {
        return this.sort_config.type === "cluster" &&
            (this.sort_config.track_group_index === this.getContainingTrackGroupIndex(track_id));
    }
}