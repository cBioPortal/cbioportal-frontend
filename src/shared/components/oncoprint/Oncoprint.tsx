import * as React from "react";
import OncoprintJS, {TrackId} from "oncoprintjs";
import {MolecularProfile} from "../../api/generated/CBioPortalAPI";
import {observer} from "mobx-react";
import {computed} from "mobx";
import {transition} from "./DeltaUtils";
import _ from "lodash";
import {ExtendedAlteration} from "../../../pages/resultsView/ResultsViewPageStore";
import "./styles.scss";
import {AnnotatedMutation, AnnotatedNumericGeneMolecularData} from "../../lib/oql/AccessorsForOqlFilter";
import {
    CLINICAL_TRACK_GROUP_INDEX,
    ClinicalTrackSpec,
    GENETIC_TRACK_GROUP_INDEX,
    GeneticTrackSpec,
    IGeneHeatmapTrackSpec,
    IGenesetHeatmapTrackSpec
} from "./OncoprintUtils";

export type GeneticTrackDatum_Data =
    Pick<ExtendedAlteration&AnnotatedMutation&AnnotatedNumericGeneMolecularData,
        "hugoGeneSymbol" | "molecularProfileAlterationType" | "proteinChange" | "driverFilter" |
        "driverFilterAnnotation" | "driverTiersFilter" | "driverTiersFilterAnnotation" | "oncoKbOncogenic" |
        "alterationSubType" | "value" | "mutationType" | "isHotspot" | "entrezGeneId" | "putativeDriver" | "mutationStatus">;

export type GeneticTrackDatum_ProfiledIn = {genePanelId?:string, molecularProfileId:string};

export interface IOncoprintProps {
    oncoprintRef?:(oncoprint:OncoprintJS<any>)=>void;

    clinicalTracks: ClinicalTrackSpec[];
    geneticTracks: GeneticTrackSpec[];
    geneticTracksOrder?:string[]; // track keys
    genesetHeatmapTracks: IGenesetHeatmapTrackSpec[];
    heatmapTracks: IGeneHeatmapTrackSpec[];
    divId:string;
    width:number;
    caseLinkOutInTooltips:boolean;

    molecularProfileIdToMolecularProfile?:{[molecularProfileId:string]:MolecularProfile};

    horzZoomToFitIds?:string[];

    hiddenIds?:string[];

    alterationTypesInQuery?:string[];

    distinguishMutationType?:boolean;
    distinguishDrivers?:boolean;
    distinguishGermlineMutations?:boolean;

    showSublabels?:boolean;

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
    onTrackSortDirectionChange?: (trackId:TrackId, dir:number)=>void;

    suppressRendering?:boolean;
    onSuppressRendering?:()=>void;
    onReleaseRendering?:()=>void;
}

@observer
export default class Oncoprint extends React.Component<IOncoprintProps, {}> {
    private div:HTMLDivElement;
    public oncoprint:OncoprintJS<any>|undefined;
    private trackSpecKeyToTrackId:{[key:string]:TrackId};
    private lastTransitionProps:IOncoprintProps;

    constructor() {
        super();

        this.trackSpecKeyToTrackId = {};
        this.divRefHandler = this.divRefHandler.bind(this);
        this.refreshOncoprint = _.debounce(this.refreshOncoprint.bind(this),  0);
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
            this.oncoprint.setTrackGroupLegendOrder([GENETIC_TRACK_GROUP_INDEX, CLINICAL_TRACK_GROUP_INDEX]);
            (window as any).frontendOnc = this.oncoprint;
            if (props.oncoprintRef) {
                props.oncoprintRef(this.oncoprint);
            }
        }
        if (!this.oncoprint.webgl_unavailable) {
            transition(props, this.lastTransitionProps || {}, this.oncoprint, ()=>this.trackSpecKeyToTrackId,
                ()=>this.props.molecularProfileIdToMolecularProfile);
            this.lastTransitionProps = _.clone(props);
        }
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

    componentWillUnmount() {
        if (this.oncoprint) {
            this.oncoprint.destroy();
            this.oncoprint = undefined;
        }
    }

    render() {
        return (<div id={this.props.divId} ref={this.divRefHandler}/>);
    }
}
