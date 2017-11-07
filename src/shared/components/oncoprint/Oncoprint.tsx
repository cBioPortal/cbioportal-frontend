import * as React from "react";
import reactionWithPrev from "shared/lib/reactionWithPrev";
import OncoprintJS, {TrackId, TrackSpec} from "oncoprintjs";
import {ClinicalAttribute, GeneMolecularData, MolecularProfile, Mutation} from "../../api/generated/CBioPortalAPI";
import {observer} from "mobx-react";
import {computed, observable} from "mobx";
import {doWithRenderingSuppressedAndSortingOff, getClinicalTrackRuleSetParams, getGeneticTrackRuleSetParams} from "./OncoprintUtils";
import {getClinicalTrackSortComparator, getGeneticTrackSortComparator, heatmapTrackSortComparator} from "./SortUtils";
import {transition} from "./DeltaUtils";
import _ from "lodash";

export type ClinicalTrackSpec<D> = {
    key: string; // for efficient diffing, just like in React. must be unique
    label: string;
    description: string;
    data: D[];
    valueKey: string;
} & ({
    datatype: "counts";
    countsCategoryLabels:string[];
    countsCategoryFills:string[];
} | {
    datatype: "number";
    numberRange:[number, number];
    numberLogScale:boolean;
} | {
    datatype: "string";
});

export type HeatmapTrackDatum = {
    hugo_gene_symbol: string;
    profile_data: number;
    sample?: string;
    patient?: string;
    study: string;
    uid: string;
};

export type GeneticTrackDatum = {
    gene: string;
    sample?:string;
    patient?:string;
    study_id:string;
    uid:string;
    data:(Mutation|GeneMolecularData)[];
    coverage?: any; // todo
    na?: boolean;
    disp_mut?:string;
    disp_cna?:string;
    disp_mrna?:string;
    disp_prot?:string;
    disp_fusion?:boolean;
};

export type GeneticTrackSpec = {
    key: string; // for efficient diffing, just like in React. must be unique
    label: string;
    oql: string; // OQL corresponding to the track
    info: string;
    data: GeneticTrackDatum[];
};

export type HeatmapTrackSpec = {
    key: string; // for efficient diffing, just like in React. must be unique
    label: string;
    molecularProfileId: string; // source
    molecularAlterationType: MolecularProfile["molecularAlterationType"];
    datatype: MolecularProfile["datatype"];
    data: HeatmapTrackDatum[];
    trackGroupIndex: number;
    onRemove:()=>void;
};

export interface IOncoprintProps {
    oncoprintRef?:(oncoprint:OncoprintJS<any>)=>void;

    clinicalTracks: ClinicalTrackSpec<any>[];
    geneticTracks: GeneticTrackSpec[];
    heatmapTracks: HeatmapTrackSpec[];
    divId:string;
    width:number;

    horzZoomToFitIds?:string[];

    hiddenIds?:string[];

    distinguishMutationType?:boolean;
    distinguishDrivers?:boolean;

    showBinaryCustomDriverAnnotation?:boolean;
    showTiersCustomDriverAnnotation?:boolean;

    sortConfig?:{
        order?:string[]; // overrides below options if present

        clusterHeatmapTrackGroupIndex?: number; // overrides below options if present

        sortByMutationType?:boolean;
        sortByDrivers?:boolean;
    };
    showClinicalTrackLegends?:boolean;
    showWhitespaceBetweenColumns?:boolean;
    showMinimap?:boolean;

    onMinimapClose?:()=>void;
    onDeleteClinicalTrack?:(key:string)=>void;

    suppressRendering?:boolean;
}

@observer
export default class Oncoprint extends React.Component<IOncoprintProps, {}> {
    private div:HTMLDivElement;
    public oncoprint:OncoprintJS<any>;
    private trackSpecKeyToTrackId:{[key:string]:TrackId};
    private lastTransitionProps:IOncoprintProps;

    constructor() {
        super();

        this.trackSpecKeyToTrackId = {};
        this.divRefHandler = this.divRefHandler.bind(this);
        this.refreshOncoprint = _.debounce(this.refreshOncoprint, 50);
    }

    private divRefHandler(div:HTMLDivElement) {
        this.div = div;
    }

    @computed get sortByMutationType() {
        return  this.props.distinguishMutationType &&
                this.props.sortConfig &&
                this.props.sortConfig.sortByMutationType;
    }

    @computed get sortByDrivers() {
        return this.props.distinguishDrivers &&
                this.props.sortConfig &&
                this.props.sortConfig.sortByDrivers;
    }

    private refreshOncoprint(props:IOncoprintProps) {
        if (!this.oncoprint) {
            // instantiate new one
            this.oncoprint = new OncoprintJS(`#${props.divId}`, props.width);
            (window as any).frontendOnc = this.oncoprint;
            if (props.oncoprintRef) {
                props.oncoprintRef(this.oncoprint);
            }
        }
        transition(props, this.lastTransitionProps || {}, this.oncoprint, ()=>this.trackSpecKeyToTrackId);
        this.lastTransitionProps = _.clone(this.props);
    }

    componentWillReceiveProps(nextProps:IOncoprintProps) {
        this.refreshOncoprint(nextProps);
    }

    shouldComponentUpdate() {
        return false;
    }

    componentDidMount() {
        this.refreshOncoprint(this.props);
    }

    render() {
        return (<div id={this.props.divId} ref={this.divRefHandler}/>);
    }
}