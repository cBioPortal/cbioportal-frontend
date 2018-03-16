import * as React from "react";
import {observer} from "mobx-react";
import {ButtonGroup, MenuItem, Button, Checkbox, Radio} from "react-bootstrap";
import {Observer} from "mobx-react";
import FontAwesome from "react-fontawesome";
import {ChangeEvent, SyntheticEvent} from "react";
import NonClosingDropdown from "./NonClosingDropdown";
import CustomDropdown from "./CustomDropdown";
import ReactSelect from "react-select";
import {MobxPromise} from "mobxpromise";
import {computed, IObservableObject, IObservableValue, observable, ObservableMap, reaction} from "mobx";
import _ from "lodash";
import {OncoprintClinicalAttribute, SortMode} from "../ResultsViewOncoprint";
import {MolecularProfile} from "shared/api/generated/CBioPortalAPI";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
import Slider from "react-rangeslider";
import 'react-rangeslider/lib/index.css';
import EditableSpan from "shared/components/editableSpan/EditableSpan";
import FadeInteraction from "shared/components/fadeInteraction/FadeInteraction";
import './styles.scss';
import {SpecialAttribute} from "../../../cache/ClinicalDataCache";
const CheckedSelect = require("react-select-checked").CheckedSelect;
import classNames from "classnames";

export interface IOncoprintControlsHandlers {
    onSelectColumnType?:(type:"sample"|"patient")=>void,
    onSelectShowUnalteredColumns?:(unalteredColumnsShown:boolean)=>void,
    onSelectShowWhitespaceBetweenColumns?:(showWhitespace:boolean)=>void,
    onSelectShowClinicalTrackLegends?:(showLegends:boolean)=>void,
    onSelectShowMinimap?:(showMinimap:boolean)=>void,
    onSelectDistinguishMutationType?:(distinguish:boolean)=>void,
    onSelectDistinguishDrivers?:(distinguish:boolean)=>void,

    onSelectAnnotateOncoKb?:(annotate:boolean)=>void,
    onSelectAnnotateHotspots?:(annotate:boolean)=>void,
    onSelectAnnotateCBioPortal?:(annotate:boolean)=>void,
    onSelectAnnotateCOSMIC?:(annotate:boolean)=>void,
    onSelectHidePutativePassengers?:(hide:boolean)=>void,
    onChangeAnnotateCBioPortalInputValue?:(value:string)=>void,
    onChangeAnnotateCOSMICInputValue?:(value:string)=>void,
    onSelectCustomDriverAnnotationBinary?:(s:boolean)=>void;
    onSelectCustomDriverAnnotationTier?:(value:string, s:boolean)=>void;

    onSelectSortByMutationType?:(sort:boolean)=>void;
    onSelectSortByDrivers?:(sort:boolean)=>void;
    onClickSortByData?:()=>void;
    onClickSortAlphabetical?:()=>void;
    onClickSortCaseListOrder?:()=>void;
    onClickDownload?:(type:string)=>void; // type is "pdf", "png", "svg", "order", or "tabular"
    onChangeSelectedClinicalTracks?:(attributeIds:(string|SpecialAttribute)[])=>void;

    onClickAddGenesToHeatmap?:()=>void;
    onClickRemoveHeatmap?:()=>void;
    onClickClusterHeatmap?:()=>void;
    onSelectHeatmapProfile?:(molecularProfileId:string)=>void;
    onChangeHeatmapGeneInputValue?:(value:string)=>void;

    onSetHorzZoom:(z:number)=>void;
    onClickZoomIn:()=>void;
    onClickZoomOut:()=>void;
};
export interface IOncoprintControlsState {
    selectedColumnType?:"sample"|"patient",
    showUnalteredColumns?:boolean,
    showWhitespaceBetweenColumns?:boolean,
    showClinicalTrackLegends?:boolean,
    showMinimap?:boolean,
    distinguishMutationType?:boolean,
    distinguishDrivers?:boolean,
    sortByMutationType?:boolean,
    sortByDrivers?:boolean,
    annotateDriversOncoKb?:boolean,
    annotateDriversHotspots?:boolean,
    annotateDriversCBioPortal?:boolean,
    annotateDriversCOSMIC?:boolean,
    hidePutativePassengers?:boolean,
    annotateCBioPortalInputValue?:string,
    annotateCOSMICInputValue?:string,

    sortMode:SortMode,
    clinicalAttributesPromise?:MobxPromise<OncoprintClinicalAttribute[]>,
    selectedClinicalAttributeIds?:string[],
    heatmapProfilesPromise?:MobxPromise<MolecularProfile[]>,
    selectedHeatmapProfile?:string;
    heatmapIsDynamicallyQueried:boolean;
    heatmapGeneInputValue?: string;
    clusterHeatmapButtonActive?:boolean;
    hideClusterHeatmapButton?:boolean;
    hideHeatmapMenu?:boolean;

    customDriverAnnotationBinaryMenuLabel?:string;
    customDriverAnnotationTiersMenuLabel?:string;
    customDriverAnnotationTiers?:string[];
    selectedCustomDriverAnnotationTiers?:ObservableMap<boolean>;
    annotateCustomDriverBinary?:boolean;

    columnMode?:"sample"|"patient";

    horzZoom:number;
};

export interface IOncoprintControlsProps {
    handlers: IOncoprintControlsHandlers;
    state: IOncoprintControlsState & IObservableObject
}

const EVENT_KEY = {
    columnTypeSample: "0",
    columnTypePatient: "1",
    showUnalteredColumns: "2",
    showWhitespaceBetweenColumns: "3",
    showClinicalTrackLegends: "4",
    distinguishMutationType: "5",
    sortByMutationType: "6",
    sortAlphabetical: "7",
    sortCaseListOrder: "8",
    sortByData:"9",
    sortByDrivers:"10",
    sortByHeatmapClustering:"11",
    heatmapGeneInput:"12",
    addGenesToHeatmap: "13",
    removeHeatmap: "14",
    distinguishDrivers: "15",
    annotateOncoKb:"16",
    annotateHotspots:"17",
    annotateCBioPortal:"18",
    annotateCOSMIC:"19",
    annotateCBioPortalInput:"20",
    annotateCOSMICInput:"21",
    hidePutativePassengers:"22",
    customDriverBinaryAnnotation:"23",
    customDriverTierAnnotation:"24",
    downloadPDF:"25",
    downloadPNG:"26",
    downloadSVG:"27",
    downloadOrder:"28",
    downloadTabular:"29",
    horzZoomSlider:"30",
};

@observer
export default class OncoprintControls extends React.Component<IOncoprintControlsProps, {}> {
    @observable horzZoomSliderState:number;
    @observable clinicalTracksMenuFocused = false;

    constructor(props:IOncoprintControlsProps) {
        super(props);

        this.getHeatmapMenu = this.getHeatmapMenu.bind(this);
        this.getClinicalTracksMenu = this.getClinicalTracksMenu.bind(this);
        this.getSortMenu = this.getSortMenu.bind(this);
        this.getViewMenu = this.getViewMenu.bind(this);
        this.getDownloadMenu = this.getDownloadMenu.bind(this);
        this.onInputClick = this.onInputClick.bind(this);
        this.getMutationColorMenu = this.getMutationColorMenu.bind(this);
        this.getHorzZoomControls = this.getHorzZoomControls.bind(this);
        this.onSelect = this.onSelect.bind(this);
        this.onChangeSelectedClinicalTracks = this.onChangeSelectedClinicalTracks.bind(this);
        this.toggleShowMinimap = this.toggleShowMinimap.bind(this);
        this.onType = this.onType.bind(this);
        this.onHeatmapProfileSelect = this.onHeatmapProfileSelect.bind(this);
        this.onButtonClick = this.onButtonClick.bind(this);
        this.onZoomInClick = this.onZoomInClick.bind(this);
        this.onZoomOutClick = this.onZoomOutClick.bind(this);
        this.onCustomDriverTierCheckboxClick = this.onCustomDriverTierCheckboxClick.bind(this);
        this.onHorzZoomSliderChange = this.onHorzZoomSliderChange.bind(this);
        this.onHorzZoomSliderSet = this.onHorzZoomSliderSet.bind(this);
        this.onSetHorzZoomTextInput = this.onSetHorzZoomTextInput.bind(this);
        this.onClinicalTracksMenuFocus = this.onClinicalTracksMenuFocus.bind(this);

        this.horzZoomSliderState = props.state.horzZoom;
        reaction(()=>this.props.state.horzZoom,
            z=>(this.horzZoomSliderState = z)); // when horz zoom changes, set slider state
    }

    private onZoomInClick() {
        this.props.handlers.onClickZoomIn();
    }

    private onZoomOutClick() {
        this.props.handlers.onClickZoomOut();
    }

    private onSetHorzZoomTextInput(val:string) {
        const percentage = parseFloat(val);
        const zoom = percentage/100;
        this.props.handlers.onSetHorzZoom(zoom);
    }

    private onSelect(eventKey:any) {
        if (eventKey === EVENT_KEY.distinguishMutationType) {
            this.props.handlers.onSelectDistinguishMutationType &&
            this.props.handlers.onSelectDistinguishMutationType(!this.props.state.distinguishMutationType);
        }
    }
    private onChangeSelectedClinicalTracks(options:{label:string, value:string|SpecialAttribute}[]) {
        this.props.handlers.onChangeSelectedClinicalTracks &&
        this.props.handlers.onChangeSelectedClinicalTracks(options.map(o=>o.value));
    }
    private onHeatmapProfileSelect(option:{label:string, value:string}) {
        this.props.handlers.onSelectHeatmapProfile &&
        this.props.handlers.onSelectHeatmapProfile(option.value);
    }

    private toggleShowMinimap(eventKey:any) {
        this.props.handlers.onSelectShowMinimap &&
        this.props.handlers.onSelectShowMinimap(!this.props.state.showMinimap);
    }

    private onInputClick(event:React.MouseEvent<HTMLInputElement>) {
        switch ((event.target as HTMLInputElement).value) {
            case EVENT_KEY.showUnalteredColumns:
                this.props.handlers.onSelectShowUnalteredColumns &&
                this.props.handlers.onSelectShowUnalteredColumns(!this.props.state.showUnalteredColumns);
                break;
            case EVENT_KEY.showWhitespaceBetweenColumns:
                this.props.handlers.onSelectShowWhitespaceBetweenColumns &&
                this.props.handlers.onSelectShowWhitespaceBetweenColumns(!this.props.state.showWhitespaceBetweenColumns);
                break;
            case EVENT_KEY.showClinicalTrackLegends:
                this.props.handlers.onSelectShowClinicalTrackLegends &&
                this.props.handlers.onSelectShowClinicalTrackLegends(!this.props.state.showClinicalTrackLegends);
                break;
            case EVENT_KEY.columnTypeSample:
                this.props.handlers.onSelectColumnType && this.props.handlers.onSelectColumnType("sample");
                break;
            case EVENT_KEY.columnTypePatient:
                this.props.handlers.onSelectColumnType && this.props.handlers.onSelectColumnType("patient");
                break;
            case EVENT_KEY.sortByData:
                this.props.handlers.onClickSortByData && this.props.handlers.onClickSortByData();
                break;
            case EVENT_KEY.sortAlphabetical:
                this.props.handlers.onClickSortAlphabetical && this.props.handlers.onClickSortAlphabetical();
                break;
            case EVENT_KEY.sortCaseListOrder:
                this.props.handlers.onClickSortCaseListOrder && this.props.handlers.onClickSortCaseListOrder();
                break;
            case EVENT_KEY.sortByMutationType:
                this.props.handlers.onSelectSortByMutationType &&
                this.props.handlers.onSelectSortByMutationType(!this.props.state.sortByMutationType);
                break;
            case EVENT_KEY.sortByDrivers:
                this.props.handlers.onSelectSortByDrivers &&
                this.props.handlers.onSelectSortByDrivers(!this.props.state.sortByDrivers);
                break;
            case EVENT_KEY.distinguishDrivers:
                this.props.handlers.onSelectDistinguishDrivers &&
                this.props.handlers.onSelectDistinguishDrivers(!this.props.state.distinguishDrivers);
                break;
            case EVENT_KEY.distinguishMutationType:
                this.props.handlers.onSelectDistinguishMutationType &&
                this.props.handlers.onSelectDistinguishMutationType(!this.props.state.distinguishMutationType);
                break;
            case EVENT_KEY.annotateOncoKb:
                this.props.handlers.onSelectAnnotateOncoKb &&
                this.props.handlers.onSelectAnnotateOncoKb(!this.props.state.annotateDriversOncoKb);
                break;
            case EVENT_KEY.annotateHotspots:
                this.props.handlers.onSelectAnnotateHotspots &&
                this.props.handlers.onSelectAnnotateHotspots(!this.props.state.annotateDriversHotspots);
                break;
            case EVENT_KEY.annotateCBioPortal:
                this.props.handlers.onSelectAnnotateCBioPortal &&
                this.props.handlers.onSelectAnnotateCBioPortal(!this.props.state.annotateDriversCBioPortal);
                break;
            case EVENT_KEY.annotateCOSMIC:
                this.props.handlers.onSelectAnnotateCOSMIC &&
                this.props.handlers.onSelectAnnotateCOSMIC(!this.props.state.annotateDriversCOSMIC);
                break;
            case EVENT_KEY.hidePutativePassengers:
                this.props.handlers.onSelectHidePutativePassengers &&
                this.props.handlers.onSelectHidePutativePassengers(!this.props.state.hidePutativePassengers);
                break;
            case EVENT_KEY.customDriverBinaryAnnotation:
                this.props.handlers.onSelectCustomDriverAnnotationBinary &&
                this.props.handlers.onSelectCustomDriverAnnotationBinary(!this.props.state.annotateCustomDriverBinary);
                break;
        }
    }

    private onHorzZoomSliderChange(z:number) {
        this.horzZoomSliderState = z;
    }

    private onHorzZoomSliderSet() {
        this.props.handlers.onSetHorzZoom(this.horzZoomSliderState);
        this.horzZoomSliderState = this.props.state.horzZoom; // set it back in case it doesnt change
    }

    private onCustomDriverTierCheckboxClick(event:React.MouseEvent<HTMLInputElement>) {
        this.props.handlers.onSelectCustomDriverAnnotationTier &&
        this.props.handlers.onSelectCustomDriverAnnotationTier(
            (event.target as HTMLInputElement).value,
            !(this.props.state.selectedCustomDriverAnnotationTiers && this.props.state.selectedCustomDriverAnnotationTiers.get((event.target as HTMLInputElement).value))
        );
    }

    private onButtonClick(event:React.MouseEvent<HTMLButtonElement>) {
        switch ((event.target as HTMLButtonElement).name) {
            case EVENT_KEY.addGenesToHeatmap:
                this.props.handlers.onClickAddGenesToHeatmap &&
                this.props.handlers.onClickAddGenesToHeatmap();
                break;
            case EVENT_KEY.removeHeatmap:
                this.props.handlers.onClickRemoveHeatmap &&
                this.props.handlers.onClickRemoveHeatmap();
                break;
            case EVENT_KEY.downloadSVG:
                this.props.handlers.onClickDownload &&
                this.props.handlers.onClickDownload("svg");
                break;
            case EVENT_KEY.downloadPNG:
                this.props.handlers.onClickDownload &&
                this.props.handlers.onClickDownload("png");
                break;
            case EVENT_KEY.downloadPDF:
                this.props.handlers.onClickDownload &&
                this.props.handlers.onClickDownload("pdf");
                break;
            case EVENT_KEY.downloadOrder:
                this.props.handlers.onClickDownload &&
                this.props.handlers.onClickDownload("order");
                break;
            case EVENT_KEY.downloadTabular:
                this.props.handlers.onClickDownload &&
                this.props.handlers.onClickDownload("tabular");
                break;
            case EVENT_KEY.sortByHeatmapClustering:
                this.props.handlers.onClickClusterHeatmap &&
                this.props.handlers.onClickClusterHeatmap();
                break;
        }
    }

    private onType(event:React.ChangeEvent<HTMLTextAreaElement>) {
        switch ((event.target as HTMLTextAreaElement).name) {
            case EVENT_KEY.heatmapGeneInput:
                this.props.handlers.onChangeHeatmapGeneInputValue &&
                this.props.handlers.onChangeHeatmapGeneInputValue(event.target.value);
                break;
            case EVENT_KEY.annotateCBioPortalInput:
                this.props.handlers.onChangeAnnotateCBioPortalInputValue &&
                this.props.handlers.onChangeAnnotateCBioPortalInputValue(event.target.value);
                break;
            case EVENT_KEY.annotateCOSMICInput:
                this.props.handlers.onChangeAnnotateCOSMICInputValue &&
                this.props.handlers.onChangeAnnotateCOSMICInputValue(event.target.value);
                break;
        }
    }

    private onClinicalTracksMenuFocus() {
        this.clinicalTracksMenuFocused = true;
    }

    @computed get clinicalTrackOptions() {
        if (this.clinicalTracksMenuFocused && this.props.state.clinicalAttributesPromise && this.props.state.clinicalAttributesPromise.result) {
            return _.map(this.props.state.clinicalAttributesPromise.result, clinicalAttribute=>({
                label: clinicalAttribute.displayName,
                value: clinicalAttribute.clinicalAttributeId
            }));
        } else {
            return [];
        }
    }

    @computed get heatmapProfileOptions() {
        if (this.props.state.heatmapProfilesPromise && this.props.state.heatmapProfilesPromise.result) {
            return _.map(this.props.state.heatmapProfilesPromise.result, profile=>({
                label: profile.name,
                value: profile.molecularProfileId
            }));
        } else {
            return [];
        }
    }

    @computed get clinicalTracksMenuLoading() {
        return this.clinicalTracksMenuFocused &&
            this.props.state.clinicalAttributesPromise &&
            this.props.state.clinicalAttributesPromise.isPending;
    }

    private getClinicalTracksMenu() {
        if (this.props.handlers.onChangeSelectedClinicalTracks &&
            this.props.state.clinicalAttributesPromise) {
            // TODO: put onFocus handler on CheckedSelect when possible
            // TODO: pass unmodified string array as value prop when possible
            // TODO: remove labelKey specification, leave to default prop, when possible
            return (
                <div
                    onFocus={this.onClinicalTracksMenuFocus}
                >
                    <CheckedSelect
                        placeholder="Add clinical tracks.."
                        isLoading={this.clinicalTracksMenuLoading}
                        noResultsText={this.clinicalTracksMenuLoading ? "Loading..." : "No matching clinical tracks found"}
                        onChange={this.onChangeSelectedClinicalTracks}
                        options={this.clinicalTrackOptions}
                        value={(this.props.state.selectedClinicalAttributeIds || []).map(x=>({value:x}))}
                        labelKey="label"
                    />
                </div>
            );
        } else {
            return <span/>;
        }
    }

    private getHeatmapMenu() {
        if (this.props.state.hideHeatmapMenu || !this.props.state.heatmapProfilesPromise) {
            return <span/>;
        }
        let menu = <LoadingIndicator isLoading={true}/>;
        if (this.props.state.heatmapProfilesPromise.isComplete) {
            if (!this.props.state.heatmapProfilesPromise.result!.length) {
                return <span/>;
            } else {
                menu = (
                    <div className="oncoprint__controls__heatmap_menu">
                        <ReactSelect
                            clearable={false}
                            searchable={false}
                            isLoading={this.props.state.heatmapProfilesPromise.isPending}
                            onChange={this.onHeatmapProfileSelect}
                            value={this.props.state.selectedHeatmapProfile}
                            options={this.heatmapProfileOptions}
                        />
                        {this.props.state.heatmapIsDynamicallyQueried && [
                            <textarea
                                key="heatmapGeneInputArea"
                                placeholder="Type space- or comma-separated genes here, then click 'Add Genes to Heatmap'"
                                name={EVENT_KEY.heatmapGeneInput}
                                onChange={this.onType}
                                value={this.props.state.heatmapGeneInputValue}
                            >
                            </textarea>,

                            <button
                                key="addGenesToHeatmapButton"
                                className="btn btn-sm btn-default"
                                name={EVENT_KEY.addGenesToHeatmap}
                                onClick={this.onButtonClick}
                             >Add Genes to Heatmap</button>,

                            <button
                                key="removeHeatmapButton"
                                className="btn btn-sm btn-default"
                                name={EVENT_KEY.removeHeatmap}
                                onClick={this.onButtonClick}
                            >Remove Heatmap</button>
                        ]}

                        {!this.props.state.hideClusterHeatmapButton &&
                            (<button
                                data-test="clusterHeatmapBtn"
                                 className={classNames("btn", "btn-sm", "btn-default", {active:this.props.state.clusterHeatmapButtonActive})}
                                 name={EVENT_KEY.sortByHeatmapClustering}
                                 onClick={this.onButtonClick}
                             >Cluster Heatmap</button>)
                        }
                    </div>
                );
            }
        } else if (this.props.state.heatmapProfilesPromise.isError) {
            menu = (<span>Error loading heatmap profiles.</span>);
        }
        return (
            <CustomDropdown bsStyle="default" title="Heatmap" id="heatmapDropdown">
                {menu}
            </CustomDropdown>
        );
    }

    private getSortMenu() {
        return (
            <CustomDropdown bsStyle="default" title="Sort" id="sortDropdown">
                <div className="oncoprint__controls__sort_menu">

                        <div className="radio"><label>
                            <input
                                data-test="sortByData"
                                type="radio"
                                name="sortBy"
                                value={EVENT_KEY.sortByData}
                                checked={this.props.state.sortMode.type === "data"}
                                onClick={this.onInputClick}
                            /> Sort by data
                        </label></div>
                        <div style={{marginLeft: "10px"}}>
                            <div className="checkbox"><label>
                                <input
                                    type="checkbox"
                                    value={EVENT_KEY.sortByMutationType}
                                    checked={this.props.state.sortByMutationType}
                                    onClick={this.onInputClick}
                                    disabled={this.props.state.sortMode.type !== "data" || !this.props.state.distinguishMutationType}
                                /> Mutation Type
                            </label></div>
                            <div className="checkbox"><label>
                                <input
                                    type="checkbox"
                                    value={EVENT_KEY.sortByDrivers}
                                    checked={this.props.state.sortByDrivers}
                                    onClick={this.onInputClick}
                                    disabled={this.props.state.sortMode.type !== "data" || !this.props.state.distinguishDrivers}
                                /> Driver/Passenger
                            </label></div>
                        </div>
                        <div className="radio"><label>
                            <input
                                type="radio"
                                name="sortBy"
                                value={EVENT_KEY.sortAlphabetical}
                                checked={this.props.state.sortMode.type === "alphabetical"}
                                onClick={this.onInputClick}
                            /> Sort by case id (alphabetical)
                        </label></div>
                        <div className="radio"><label>
                            <input
                                type="radio"
                                name="sortBy"
                                value={EVENT_KEY.sortCaseListOrder}
                                checked={this.props.state.sortMode.type === "caseList"}
                                onClick={this.onInputClick}
                            /> Sort by case list order
                        </label></div>
                        {(this.props.state.heatmapProfilesPromise &&
                                !(this.props.state.heatmapProfilesPromise.isComplete
                                    && !this.props.state.heatmapProfilesPromise.result!.length))
                        && (<div className="radio"><label>
                            <input
                                data-test="sortByHeatmapClustering"
                                type="radio"
                                name="sortBy"
                                checked={this.props.state.sortMode.type === "heatmap"}
                                disabled
                            /> Sorted by heatmap clustering order
                        </label></div>)}
                </div>
            </CustomDropdown>
        );
    }

    private getMutationColorMenu() {
        return (
            <CustomDropdown bsStyle="default" title="Mutation Color" id="mutationColorDropdown">
                <div className="oncoprint__controls__mutation_color_menu">
                    <form action="" style={{marginBottom: "0"}}>
                        <div className="checkbox"><label>
                            <input
                                type="checkbox"
                                value={EVENT_KEY.distinguishMutationType}
                                checked={this.props.state.distinguishMutationType}
                                onClick={this.onInputClick}
                            /> Type
                        </label></div>
                        <div className="checkbox"><label>
                            <input
                                type="checkbox"
                                value={EVENT_KEY.distinguishDrivers}
                                checked={this.props.state.distinguishDrivers}
                                onClick={this.onInputClick}
                            /> Putative drivers based on:
                        </label>
                        </div>
                        <div style={{marginLeft: "20px"}}>
                            <div className="checkbox"><label>
                                <input
                                    type="checkbox"
                                    value={EVENT_KEY.annotateOncoKb}
                                    checked={this.props.state.annotateDriversOncoKb}
                                    onClick={this.onInputClick}
                                    data-test="annotateOncoKb"
                                />
                                <DefaultTooltip
                                    overlay={<span>Oncogenicity from OncoKB</span>}
                                    placement="top"
                                >
                                    <img
                                        src="images/oncokb.png"
                                        style={{maxHeight:"12px", cursor:"pointer", marginRight:"5px"}}
                                    />
                                </DefaultTooltip>
                                driver annotation
                            </label></div>
                            <div className="checkbox"><label>
                                <input
                                    type="checkbox"
                                    value={EVENT_KEY.annotateHotspots}
                                    checked={this.props.state.annotateDriversHotspots}
                                    onClick={this.onInputClick}
                                    data-test="annotateHotspots"
                                /> Hotspots
                                <DefaultTooltip
                                    overlay={<div style={{maxWidth:"400px"}}>Identified as a recurrent hotspot (statistically significant) in a population-scale cohort of tumor samples of various cancer types using methodology based in part on <a href="http://www.ncbi.nlm.nih.gov/pubmed/26619011" target="_blank">Chang et al., Nat Biotechnol, 2016.</a>
                                        Explore all mutations at <a href="http://www.cancerhotspots.org" target="_blank">http://cancerhotspots.org</a></div>}
                                    placement="top"
                                >
                                    <img
                                        src="images/cancer-hotspots.svg"
                                        style={{height:"15px", width:"15px", cursor:"pointer", marginLeft:"5px"}}
                                    />
                                </DefaultTooltip>
                            </label></div>
                            {this.props.handlers.onChangeAnnotateCBioPortalInputValue && (
                            <div className="checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        value={EVENT_KEY.annotateCBioPortal}
                                        checked={this.props.state.annotateDriversCBioPortal}
                                        onClick={this.onInputClick}
                                        data-test="annotateCBioPortalCount"
                                    />
                                    cBioPortal  >=
                                </label>
                                <EditableSpan
                                    value={this.props.state.annotateCBioPortalInputValue || ""}
                                    setValue={this.props.handlers.onChangeAnnotateCBioPortalInputValue}
                                    numericOnly={true}
                                    textFieldAppearance={true}
                                    maxChars={6}
                                />
                            </div>
                            )}
                            {this.props.handlers.onChangeAnnotateCOSMICInputValue && (
                            <div className="checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        value={EVENT_KEY.annotateCOSMIC}
                                        checked={this.props.state.annotateDriversCOSMIC}
                                        onClick={this.onInputClick}
                                        data-test="annotateCOSMICCount"
                                    />
                                    COSMIC  >=
                                </label>
                                <EditableSpan
                                    value={this.props.state.annotateCOSMICInputValue || ""}
                                    setValue={this.props.handlers.onChangeAnnotateCOSMICInputValue}
                                    numericOnly={true}
                                    textFieldAppearance={true}
                                    maxChars={6}
                                />
                            </div>
                            )}
                            { !!this.props.state.customDriverAnnotationBinaryMenuLabel && (
                                <div className="checkbox"><label>
                                    <input
                                        type="checkbox"
                                        checked={this.props.state.annotateCustomDriverBinary}
                                        value={EVENT_KEY.customDriverBinaryAnnotation}
                                        onClick={this.onInputClick}
                                    /> {this.props.state.customDriverAnnotationBinaryMenuLabel}
                                    <img src="images/driver.png" alt="driver filter" style={{height:"15px", width:"15px", cursor:"pointer", marginLeft:"5px"}}/>
                                </label></div>
                            )}
                            {!!this.props.state.customDriverAnnotationTiersMenuLabel && (
                                <span>
                                    <span className="caret"/>&nbsp;&nbsp;
                                    <span>{this.props.state.customDriverAnnotationTiersMenuLabel}</span>&nbsp;
                                    <img src="images/driver_tiers.png" alt="driver tiers filter" style={{height:"15px", width:"15px", cursor:"pointer", marginLeft:"5px"}}/>
                                    <div style={{marginLeft:"30px"}}>
                                        {(this.props.state.customDriverAnnotationTiers || []).map((tier)=>(
                                            <div className="checkbox"><label>
                                                <input
                                                    type="checkbox"
                                                    value={tier}
                                                    checked={!!(this.props.state.selectedCustomDriverAnnotationTiers && this.props.state.selectedCustomDriverAnnotationTiers.get(tier))}
                                                    onClick={this.onCustomDriverTierCheckboxClick}
                                                /> {tier}
                                            </label></div>
                                        ))
                                        }
                                    </div>
                                </span>
                            )}
                            <div className="checkbox"><label>
                                <input
                                    type="checkbox"
                                    value={EVENT_KEY.hidePutativePassengers}
                                    checked={this.props.state.hidePutativePassengers}
                                    onClick={this.onInputClick}
                                    disabled={!this.props.state.distinguishDrivers}
                                /> Hide VUS (variants of unknown significance)
                            </label></div>
                        </div>
                    </form>
                </div>
            </CustomDropdown>
        );
    }

    private getViewMenu() {
        return (
            <CustomDropdown bsStyle="default" title="View" id="viewDropdownButton">
                <strong>Data type:</strong>
                <div className="radio"><label>
                    <input
                        type="radio"
                        name="columnType"
                        value={EVENT_KEY.columnTypeSample}
                        checked={this.props.state.selectedColumnType === "sample"}
                        onClick={this.onInputClick}
                    /> Events per sample
                </label></div>
                <div className="radio"><label>
                    <input
                        type="radio"
                        name="columnType"
                        value={EVENT_KEY.columnTypePatient}
                        checked={this.props.state.selectedColumnType === "patient"}
                        onClick={this.onInputClick}
                    /> Events per patient
                </label></div>

                <hr />
                <div className="checkbox"><label>
                    <input
                        type="checkbox"
                        value={EVENT_KEY.showUnalteredColumns}
                        checked={this.props.state.showUnalteredColumns}
                        onClick={this.onInputClick}
                    /> Show unaltered columns
                </label></div>
                <div className="checkbox"><label>
                    <input
                        type="checkbox"
                        value={EVENT_KEY.showWhitespaceBetweenColumns}
                        checked={this.props.state.showWhitespaceBetweenColumns}
                        onClick={this.onInputClick}
                    /> Show whitespace between columns
                </label></div>
                <div className="checkbox"><label>
                    <input
                        type="checkbox"
                        value={EVENT_KEY.showClinicalTrackLegends}
                        checked={this.props.state.showClinicalTrackLegends}
                        onClick={this.onInputClick}
                    /> Show legends for clinical tracks
                </label></div>
            </CustomDropdown>
        );
    }

    private getDownloadMenu() {
        return (
            <CustomDropdown bsStyle="default" title="Download" id="downloadDropdownButton">
                <button
                    className="btn btn-sm btn-default"
                    name={EVENT_KEY.downloadPDF}
                    onClick={this.onButtonClick}
                >PDF</button>
                <button
                    className="btn btn-sm btn-default"
                    name={EVENT_KEY.downloadPNG}
                    onClick={this.onButtonClick}
                >PNG</button>
                <button
                    className="btn btn-sm btn-default"
                    name={EVENT_KEY.downloadSVG}
                    onClick={this.onButtonClick}
                >SVG</button>
                <button
                    className="btn btn-sm btn-default"
                    name={EVENT_KEY.downloadOrder}
                    onClick={this.onButtonClick}
                >{(this.props.state.columnMode && this.props.state.columnMode[0].toUpperCase() + this.props.state.columnMode.slice(1))||""} order</button>
                <button
                    className="btn btn-sm btn-default"
                    name={EVENT_KEY.downloadTabular}
                    onClick={this.onButtonClick}
                >Tabular</button>
            </CustomDropdown>
        );
    }

    private getHorzZoomControls() {
        return (
            <div className="btn btn-default oncoprint__zoom-controls">
                <DefaultTooltip
                    overlay={<span>Zoom out of oncoprint.</span>}
                >
                    <div
                        onClick={this.onZoomOutClick}
                    >
                        <i className="fa fa-search-minus"></i>
                    </div>
                </DefaultTooltip>
                <DefaultTooltip
                    overlay={<span>Zoom in/out of oncoprint.</span>}
                >
                    <div style={{width:"90px"}}>
                        <Slider
                            value={this.horzZoomSliderState}
                            onChange={this.onHorzZoomSliderChange}
                            onChangeComplete={this.onHorzZoomSliderSet}
                            step={0.01}
                            max={1}
                            min={0}
                            tooltip={false}
                        />
                    </div>
                </DefaultTooltip>

                <EditableSpan
                    value={(100*this.horzZoomSliderState).toFixed()}
                    setValue={this.onSetHorzZoomTextInput}
                    maxChars={3}
                    numericOnly={true}
                    textFieldAppearance={true}
                    style={{
                        background:"white",
                        minWidth:"30px",
                        fontSize: "14px",
                        fontFamily: "arial",
                        border:'none',
                        padding:0,
                        marginTop:0,
                        marginBottom:0,
                        marginRight:2
                    }}
                />
                <div>%</div>

                <DefaultTooltip
                    overlay={<span>Zoom in to oncoprint.</span>}
                >
                    <div
                        onClick={this.onZoomInClick}
                    >
                          <i className="fa fa-search-plus"></i>
                    </div>
                </DefaultTooltip>
            </div>
        );
    }

    @computed get showMinimap() {
        return this.props.state.showMinimap;
    }

    private get minimapButton() {
        return (
            <div className="btn-group">
            <DefaultTooltip
                overlay={<span>Toggle minimap panel.</span>}
            >
                <Button
                    active={this.showMinimap}
                    onClick={this.toggleShowMinimap}
                    className="oncoprint__controls__minimap_button"
                >
                    <img src={require("./toggle-minimap.svg")} alt="icon" style={{width:15, height:15, margin:2}}/>
                </Button>
            </DefaultTooltip>
            </div>
        );
    }

    render() {
        return (
            <div className="oncoprint__controls">
                <div style={{width:220}}>
                    <Observer>
                        {this.getClinicalTracksMenu}
                    </Observer>
                </div>
                <ButtonGroup>
                    <Observer>
                        {this.getHeatmapMenu}
                    </Observer>
                    <Observer>
                        {this.getSortMenu}
                    </Observer>
                    <Observer>
                        {this.getMutationColorMenu}
                    </Observer>
                    <Observer>
                        {this.getViewMenu}
                    </Observer>
                    <Observer>
                        {this.getDownloadMenu}
                    </Observer>
                    <Observer>
                        {this.getHorzZoomControls}
                    </Observer>
                    {this.minimapButton}
                </ButtonGroup>
            </div>
        );
    }
}
