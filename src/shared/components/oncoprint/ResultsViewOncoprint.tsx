import * as React from "react";
import request from "superagent";
import {
    KnownMutationSettings,
    OncoprintHeatmapTrackData, OncoprintPatientGeneticTrackData, OncoprintSampleGeneticTrackData,
    QuerySession
} from "../../lib/QuerySession";
import {observer} from "mobx-react";
import {
    autorun,
    computed, IObservableObject, IObservableValue, IReactionDisposer, observable, ObservableMap,
    reaction
} from "mobx";
import {ClinicalTrackSpec, GeneticTrackDatum, GeneticTrackSpec, HeatmapTrackSpec} from "./Oncoprint";
import {remoteData} from "../../api/remoteData";
import Oncoprint from "./Oncoprint";
import OncoprintControls, {
    IOncoprintControlsHandlers,
    IOncoprintControlsState
} from "shared/components/oncoprint/controls/OncoprintControls";
import {ResultsViewPageStore} from "../../../pages/resultsView/ResultsViewPageStore";
import {ClinicalAttribute, Gene, MolecularProfile} from "../../api/generated/CBioPortalAPI";
import {percentAltered, getPercentAltered} from "./OncoprintUtils";
import _ from "lodash";
import onMobxPromise from "shared/lib/onMobxPromise";
import AppConfig from "appConfig";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import OncoprintJS from "oncoprintjs";
import fileDownload from 'react-file-download';
import svgToPdfDownload from "shared/lib/svgToPdfDownload";
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
import {Button} from "react-bootstrap";
import tabularDownload from "./tabularDownload";

interface IResultsViewOncoprintProps {
    divId: string;
    querySession: QuerySession;
    store:ResultsViewPageStore;
    routing:any;
    customDriverMetadata:{
        hasDriverAnnotations: boolean,
        customDriverTiers: string[]
    };
}

export type OncoprintClinicalAttribute =
    Pick<ClinicalAttribute, "clinicalAttributeId"|"datatype"|"description"|"displayName"|"patientAttribute">;

type OncoprintTrackData = OncoprintSampleGeneticTrackData | OncoprintPatientGeneticTrackData;

const specialClinicalAttributes:OncoprintClinicalAttribute[] = [
    {
        clinicalAttributeId: "FRACTION_GENOME_ALTERED",
        datatype: "NUMBER",
        description: "Fraction Genome Altered",
        displayName: "Fraction Genome Altered",
        patientAttribute: false
    },
    {
        clinicalAttributeId: "# mutations",
        datatype: "NUMBER",
        description: "Number of mutations",
        displayName: "Total mutations",
        patientAttribute: false
    },
    {
        clinicalAttributeId: "NO_CONTEXT_MUTATION_SIGNATURE",
        datatype: "COUNTS_MAP",
        description: "Number of point mutations in the sample counted by different types of nucleotide changes.",
        displayName: "Mutation spectrum",
        patientAttribute: false
    }
];

const SAMPLE_MODE_URL_PARAM = "show_samples";
const CLINICAL_TRACKS_URL_PARAM = "clinicallist";
const HEATMAP_TRACKS_URL_PARAM = "heatmap_track_groups";

type HeatmapTrackGroupRecord = {
    trackGroupIndex:number,
    genes:ObservableMap<boolean>,
    molecularProfileId:string
};

@observer
export default class ResultsViewOncoprint extends React.Component<IResultsViewOncoprintProps, {}> {
    @observable columnMode:"sample"|"patient" = "sample";
    @observable sortMode:{type:"data"|"alphabetical"|"caseList"|"heatmap", clusteredHeatmapProfile?:string} = {type:"data"};

    @observable distinguishMutationType:boolean = true;
    @observable distinguishDrivers:boolean = true;
    @observable sortByMutationType:boolean = true;
    @observable sortByDrivers:boolean = true;

    @observable annotateDriversOncoKb:boolean;
    @observable annotateDriversHotspots:boolean;
    @observable annotateDriversCBioPortal:boolean;
    @observable annotateDriversCOSMIC:boolean;
    @observable annotateDriversCBioPortalThreshold:string;
    @observable annotateDriversCOSMICThreshold:string;
    @observable hidePutativePassengers:boolean;
    @observable annotateCustomDriverBinary:boolean;
    private selectedCustomDriverAnnotationTiers = observable.map<boolean>();

    @observable showUnalteredColumns:boolean = true;
    @observable showWhitespaceBetweenColumns:boolean = true;
    @observable showClinicalTrackLegends:boolean = true;
    @observable showMinimap:boolean = false;

    @observable selectedHeatmapProfile:string = "";
    @observable heatmapGeneInputValue:string = "";

    @observable horzZoom:number = 0.5;

    private heatmapGeneInputValueUpdater:IReactionDisposer;

    private selectedClinicalAttributeIds = observable.shallowMap<boolean>();
    private molecularProfileIdToHeatmapTracks =
        observable.map<HeatmapTrackGroupRecord>();

    private controlsHandlers:IOncoprintControlsHandlers & IObservableObject;
    private controlsState:IOncoprintControlsState & IObservableObject;

    @observable knownMutationSettingsAutorunCount = 0;

    private oncoprint:OncoprintJS<any>;

    private putativeDriverSettingsReaction:IReactionDisposer;
    private urlParamsReaction:IReactionDisposer;

    constructor(props:IResultsViewOncoprintProps) {
        super(props);

        this.initKnownMutationSettings(props);
        this.initFromUrlParams(props.routing.location.query);
        
        const self = this;

        this.onSelectClinicalTrack = this.onSelectClinicalTrack.bind(this);
        this.onDeleteClinicalTrack = this.onDeleteClinicalTrack.bind(this);
        this.onMinimapClose = this.onMinimapClose.bind(this);
        this.oncoprintRef = this.oncoprintRef.bind(this);
        this.toggleColumnMode = this.toggleColumnMode.bind(this);

        onMobxPromise(this.props.store.heatmapMolecularProfiles, (profiles:MolecularProfile[])=>{
            // select first initially
            if (profiles.length) {
                this.selectedHeatmapProfile = profiles[0].molecularProfileId;
            }
        });

        this.heatmapGeneInputValueUpdater = onMobxPromise(this.props.store.genes, (genes:Gene[])=>{
            this.heatmapGeneInputValue = genes.map(g=>g.hugoGeneSymbol).join(" ");
        }, Number.POSITIVE_INFINITY);

        this.putativeDriverSettingsReaction = reaction(
            // putative driver settings reaction
            ()=>[
                this.annotateDriversOncoKb,
                this.annotateDriversHotspots,
                this.annotateDriversCBioPortal,
                this.annotateDriversCOSMIC,
                this.annotateDriversCBioPortalThreshold,
                this.annotateDriversCOSMICThreshold,
                this.hidePutativePassengers,
                this.annotateCustomDriverBinary,
                this.selectedCustomDriverAnnotationTiers
            ],
            ()=>{
            const newSettings:KnownMutationSettings = {
                recognize_oncokb_oncogenic: this.annotateDriversOncoKb,
                recognize_hotspot: this.annotateDriversHotspots,
                recognize_cbioportal_count: this.annotateDriversCBioPortal,
                recognize_cosmic_count: this.annotateDriversCOSMIC,
                cbioportal_count_thresh: parseInt(this.annotateDriversCBioPortalThreshold, 10),
                cosmic_count_thresh: parseInt(this.annotateDriversCOSMICThreshold, 10),
                ignore_unknown: this.hidePutativePassengers,
                recognize_driver_filter: this.annotateCustomDriverBinary,
                recognize_driver_tiers: this.selectedCustomDriverAnnotationTiers.toJS()
            };
            if (this.knownMutationSettingsAutorunCount) {
                this.props.querySession.setKnownMutationSettings(newSettings);
            }
            this.knownMutationSettingsAutorunCount += 1;
        });

        this.urlParamsReaction = reaction(
            ()=>[
                this.columnMode,
                this.heatmapTrackGroupsUrlParam,
                this.clinicalTracks.result
            ],
            ()=>{
                this.props.routing.updateRoute({
                    [SAMPLE_MODE_URL_PARAM]: (this.columnMode === "sample"),
                    [CLINICAL_TRACKS_URL_PARAM]: this.clinicalTracks.result.map(x=>x.key).join(","),
                    [HEATMAP_TRACKS_URL_PARAM]: this.heatmapTrackGroupsUrlParam
                });
            }
        );

        this.controlsHandlers = observable({
            onSelectColumnType:(type:"sample"|"patient")=>{this.setColumnMode(type);},
            onSelectShowUnalteredColumns:(show:boolean)=>{this.showUnalteredColumns = show;},
            onSelectShowWhitespaceBetweenColumns:(show:boolean)=>{this.showWhitespaceBetweenColumns = show;},
            onSelectShowClinicalTrackLegends:(show:boolean)=>{this.showClinicalTrackLegends = show; },
            onSelectShowMinimap:(show:boolean)=>{this.showMinimap = show;},
            onSelectDistinguishMutationType:(s:boolean)=>{this.distinguishMutationType = s;},
            onSelectDistinguishDrivers:(s:boolean)=>{
                this.distinguishDrivers = s;
                if (!this.distinguishDrivers) {
                    this.annotateDriversOncoKb = false;
                    this.annotateDriversHotspots = false;
                    this.annotateDriversCBioPortal = false;
                    this.annotateDriversCOSMIC = false;
                    this.hidePutativePassengers = false;
                } else {
                    this.annotateDriversOncoKb = true;
                    this.annotateDriversHotspots = true;
                    this.annotateDriversCBioPortal = true;
                    this.annotateDriversCOSMIC = true;
                }
            },
            onSelectAnnotateOncoKb:(s:boolean)=>{
                this.annotateDriversOncoKb = s;
                if (this.annotateDriversOncoKb) {
                    this.distinguishDrivers = true;
                }
            },
            onSelectAnnotateHotspots:(s:boolean)=>{
                this.annotateDriversHotspots = s;
                if (this.annotateDriversHotspots) {
                    this.distinguishDrivers = true;
                }
            },
            onSelectAnnotateCBioPortal:(s:boolean)=>{
                this.annotateDriversCBioPortal = s;
                if (this.annotateDriversCBioPortal) {
                    this.distinguishDrivers = true;
                }
            },
            onSelectAnnotateCOSMIC:(s:boolean)=>{
                this.annotateDriversCOSMIC = s;
                if (this.annotateDriversCOSMIC) {
                    this.distinguishDrivers = true;
                }
            },
            onChangeAnnotateCBioPortalInputValue:(s:string)=>{
                this.annotateDriversCBioPortalThreshold = s;
                this.controlsHandlers.onSelectAnnotateCBioPortal && this.controlsHandlers.onSelectAnnotateCBioPortal(true);
            },
            onChangeAnnotateCOSMICInputValue:(s:string)=>{
                this.annotateDriversCOSMICThreshold = s;
                this.controlsHandlers.onSelectAnnotateCOSMIC && this.controlsHandlers.onSelectAnnotateCOSMIC(true);
            },
            onSelectCustomDriverAnnotationBinary:(s:boolean)=>{
                this.annotateCustomDriverBinary = s;
                if (this.annotateCustomDriverBinary) {
                    this.distinguishDrivers = true;
                }
            },
            onSelectCustomDriverAnnotationTier:(value:string, checked:boolean)=>{
                this.selectedCustomDriverAnnotationTiers.set(value, checked);
                if (checked) {
                    this.distinguishDrivers = true;
                }
            },
            onSelectHidePutativePassengers:(s:boolean)=>{
                this.hidePutativePassengers = s;
            },
            onSelectSortByMutationType:(s:boolean)=>{this.sortByMutationType = s;},
            onClickSortAlphabetical:()=>{
                this.sortMode = {type:"alphabetical"};
            },
            onClickSortCaseListOrder:()=>{
                this.sortMode = {type:"caseList"};
            },
            onSelectSortByDrivers:(sort:boolean)=>{this.sortByDrivers=sort;},
            onClickSortByData:()=>{this.sortMode={type:"data"};},
            onSelectClinicalTrack: this.onSelectClinicalTrack,
            onChangeHeatmapGeneInputValue:(s:string)=>{
                this.heatmapGeneInputValue = s;
                this.heatmapGeneInputValueUpdater(); // stop updating heatmap input if user has typed
            },
            onSelectHeatmapProfile:(id:string)=>{this.selectedHeatmapProfile = id;},
            onClickAddGenesToHeatmap:()=>{
                this.addHeatmapTracks(this.selectedHeatmapProfile, this.heatmapGeneInputValue.toUpperCase().trim().split(/\s+/));
            },
            onClickRemoveHeatmap:()=>{
                this.molecularProfileIdToHeatmapTracks.clear();
            },
            onClickClusterHeatmap:()=>{
                if (this.sortMode.type === "heatmap") {
                    this.sortMode = {type:"data"};
                } else {
                    this.sortMode = {type: "heatmap", clusteredHeatmapProfile: this.selectedHeatmapProfile};
                }
            },
            onClickDownload:(type:string)=>{
                if (type === "pdf") {
                    if (!svgToPdfDownload("oncoprint.pdf", this.oncoprint.toSVG(true))) {
                        alert("Oncoprint too big to download as PDF - please download as SVG.");
                    }
                } else if (type === "png") {
                    const img = this.oncoprint.toCanvas((canvas, truncated)=>{
                        canvas.toBlob(blob=>{
                            if (truncated) {
                                alert(
                                    `Oncoprint too large - PNG truncated to ${canvas.getAttribute("width")}x${canvas.getAttribute("height")}`
                                );
                            }
                            fileDownload(
                                blob,
                                "oncoprint.png"
                            );
                        });
                    }, 2);
                } else if (type === "svg") {
                    fileDownload(
                        (new XMLSerializer).serializeToString(this.oncoprint.toSVG(false)),
                        "oncoprint.svg"
                    );
                } else if (type === "order") {
                    const capitalizedColumnMode = this.columnMode[0].toUpperCase() + this.columnMode.slice(1);
                    onMobxPromise(
                        this.uidToCaseMap,
                        map=>{
                            let file = `${capitalizedColumnMode} order in the Oncoprint is:\n`;
                            for (const uid of this.oncoprint.getIdOrder()) {
                                file += `${map[uid]}\n`;
                            }
                            fileDownload(
                                file,
                                `OncoPrint${capitalizedColumnMode}s.txt`
                            );
                        }
                    )
                } else if (type === "tabular") {
                    onMobxPromise(
                        this.uidToCaseMap,
                        uidToCaseMap=>{
                            tabularDownload(
                                this.geneticTracks.result,
                                this.clinicalTracks.result,
                                this.heatmapTracks.result,
                                this.oncoprint.getIdOrder(),
                                uidToCaseMap,
                                this.columnMode,
                                this.distinguishDrivers
                            )
                        }
                    );
                }
            },
            onSetHorzZoom:(z:number)=>{
                this.oncoprint.setHorzZoom(z);
            },
            onClickZoomIn:()=>{
                this.oncoprint.setHorzZoom(this.oncoprint.getHorzZoom()/0.7);
            },
            onClickZoomOut:()=>{
                this.oncoprint.setHorzZoom(this.oncoprint.getHorzZoom()*0.7);
            }
        });

        this.controlsState = observable({
            get selectedColumnType() {
                return self.columnMode;
            },
            get showUnalteredColumns() {
                return self.showUnalteredColumns;
            },
            get showWhitespaceBetweenColumns() {
                return self.showWhitespaceBetweenColumns;
            },
            get showClinicalTrackLegends(){
                return self.showClinicalTrackLegends;
            },
            get showMinimap() {
                return self.showMinimap;
            },
            get sortByMutationType() {
                return self.sortByMutationType;
            },
            get distinguishMutationType() {
                return self.distinguishMutationType;
            },
            get distinguishDrivers() {
                return self.distinguishDrivers;
            },
            get annotateDriversOncoKb() {
                return self.annotateDriversOncoKb;
            },
            get annotateDriversHotspots() {
                return self.annotateDriversHotspots;
            },
            get annotateDriversCBioPortal() {
                return self.annotateDriversCBioPortal;
            },
            get annotateDriversCOSMIC() {
                return self.annotateDriversCOSMIC;
            },
            get hidePutativePassengers() {
                return self.hidePutativePassengers;
            },
            get annotateCBioPortalInputValue() {
                return self.annotateDriversCBioPortalThreshold;
            },
            get annotateCOSMICInputValue() {
                return self.annotateDriversCOSMICThreshold;
            },
            get clinicalAttributesPromise() {
                return self.unselectedClinicalAttributes;
            },
            get sortMode() {
                return self.sortMode.type;
            },
            get sortByDrivers() {
                return self.sortByDrivers;
            },
            get heatmapProfilesPromise() {
                return self.props.store.heatmapMolecularProfiles;
            },
            get selectedHeatmapProfile() {
                return self.selectedHeatmapProfile;
            },
            get heatmapGeneInputValue() {
                return self.heatmapGeneInputValue;
            },
            get customDriverAnnotationBinaryMenuLabel() {
                const label = AppConfig.oncoprintCustomDriverAnnotationBinaryMenuLabel;
                if (!label || !self.props.customDriverMetadata.hasDriverAnnotations) {
                    return undefined;
                } else {
                    return label;
                }
            },
            get customDriverAnnotationTiersMenuLabel() {
                const label = AppConfig.oncoprintCustomDriverAnnotationTiersMenuLabel;
                if (!label || !self.props.customDriverMetadata.customDriverTiers
                        || !self.props.customDriverMetadata.customDriverTiers.length) {
                    return undefined;
                } else {
                    return label;
                }
            },
            get customDriverAnnotationTiers() {
                const tiers = self.props.customDriverMetadata.customDriverTiers;
                if (!tiers || !tiers.length) {
                    return undefined;
                } else {
                    return tiers;
                }
            },
            get annotateCustomDriverBinary() {
                return self.annotateCustomDriverBinary;
            },
            get selectedCustomDriverAnnotationTiers() {
                return self.selectedCustomDriverAnnotationTiers;
            },
            get columnMode() {
                return self.columnMode;
            },
            get horzZoom() {
                return self.horzZoom;
            },
        });
    }

    componentWillUnmount() {
        this.putativeDriverSettingsReaction();
        this.urlParamsReaction();
    }
    
    private initFromUrlParams(paramsMap:any) {
        if (paramsMap[SAMPLE_MODE_URL_PARAM]) {
            this.columnMode = paramsMap[SAMPLE_MODE_URL_PARAM] ? "sample" : "patient";
        }
        if (paramsMap[HEATMAP_TRACKS_URL_PARAM]) {
            const groups = paramsMap[HEATMAP_TRACKS_URL_PARAM].split(";").map((x:string)=>x.split(","));
            for (const group of groups) {
                this.addHeatmapTracks(group[0], group.slice(1));
            }
        }
        if (paramsMap[CLINICAL_TRACKS_URL_PARAM]) {
            const attrIds = paramsMap[CLINICAL_TRACKS_URL_PARAM].split(",");
            attrIds.map((attrId:string)=>this.onSelectClinicalTrack(attrId));
        }
    }
    
    @computed get heatmapTrackGroupsUrlParam() {
        return _.sortBy(this.molecularProfileIdToHeatmapTracks.values(), (x:HeatmapTrackGroupRecord)=>x.trackGroupIndex)
            .filter((x:HeatmapTrackGroupRecord)=>!!x.genes.size)
            .map((x:HeatmapTrackGroupRecord)=>`${x.molecularProfileId},${x.genes.keys().join(",")}`);
    }

    private addHeatmapTracks(molecularProfileId:string, genes:string[]) {
        let trackGroup = this.molecularProfileIdToHeatmapTracks.get(molecularProfileId);
        if (!trackGroup) {
            let newTrackGroupIndex = 2;
            for (const group of this.molecularProfileIdToHeatmapTracks.values()) {
                newTrackGroupIndex = Math.max(newTrackGroupIndex, group.trackGroupIndex + 1);
            }
            trackGroup = observable({
                trackGroupIndex: newTrackGroupIndex,
                molecularProfileId,
                genes: observable.shallowMap<boolean>({})
            });
        }
        for (const gene of genes) {
            trackGroup!.genes.set(gene, true);
        }
        this.molecularProfileIdToHeatmapTracks.set(molecularProfileId, trackGroup);
    }

    private toggleColumnMode() {
        if (this.columnMode === "sample") {
            this.controlsHandlers.onSelectColumnType && this.controlsHandlers.onSelectColumnType("patient");
        } else {
            this.controlsHandlers.onSelectColumnType && this.controlsHandlers.onSelectColumnType("sample");
        }
    }

    private oncoprintRef(oncoprint:OncoprintJS<any>) {
        this.oncoprint = oncoprint;
        this.oncoprint.onHorzZoom(z=>(this.horzZoom = z));
        this.horzZoom = this.oncoprint.getHorzZoom();
        onMobxPromise([this.alteredSampleUIDs, this.alteredPatientUIDs],
            (sampleUIDs:string[], patientUIDs:string[])=>{
                this.oncoprint.setHorzZoomToFit(
                    this.columnMode === "sample" ? sampleUIDs: patientUIDs
                );
            });

    }

    private initKnownMutationSettings(props:IResultsViewOncoprintProps) {
        const knownMutationSettings = props.querySession.getKnownMutationSettings();
        this.annotateDriversOncoKb = knownMutationSettings.recognize_oncokb_oncogenic;
        this.annotateDriversHotspots = knownMutationSettings.recognize_hotspot;
        this.annotateDriversCBioPortal = knownMutationSettings.recognize_cbioportal_count;
        this.annotateDriversCOSMIC = knownMutationSettings.recognize_cosmic_count;
        this.annotateDriversCBioPortalThreshold = knownMutationSettings.cbioportal_count_thresh + "";
        this.annotateDriversCOSMICThreshold = knownMutationSettings.cosmic_count_thresh + "";
        this.hidePutativePassengers = knownMutationSettings.ignore_unknown;
        this.annotateCustomDriverBinary = knownMutationSettings.recognize_driver_filter;
        for (const tier of Object.keys(knownMutationSettings.recognize_driver_tiers)) {
            this.selectedCustomDriverAnnotationTiers.set(tier, knownMutationSettings.recognize_driver_tiers[tier]);
        }
    }

    @computed get horzZoomToFitIds() {
        if (this.columnMode === "sample" && this.alteredSampleUIDs.isComplete) {
            return this.alteredSampleUIDs.result;
        } else if (this.columnMode === "patient" && this.alteredPatientUIDs.isComplete) {
            return this.alteredPatientUIDs.result;
        } else {
            return [];
        }
    }

    private setColumnMode(type:"sample"|"patient") {
        if (this.columnMode !== type) {
            this.columnMode = type;
        }
    }

    readonly unalteredUids = remoteData({
        await: ()=>[this.geneticTracks],
        invoke:()=>{
            if (this.columnMode === "sample") {
               return this.props.querySession.getUnalteredSampleUIDs();
            } else {
                return this.props.querySession.getUnalteredPatientUIDs();
            }
        },
        default: []
    });

    private onMinimapClose() {
        this.showMinimap = false;
    }

    private onSelectClinicalTrack(clinicalAttributeId:string) {
        this.selectedClinicalAttributeIds.set(clinicalAttributeId, true);
    }

    private onDeleteClinicalTrack(clinicalAttributeId:string) {
        this.selectedClinicalAttributeIds.delete(clinicalAttributeId);
    }

    readonly clinicalAttributes = remoteData({
        await:()=>[this.props.store.clinicalAttributes],
        invoke:()=>{
            const clinicalAttributes = specialClinicalAttributes.concat(_.sortBy(
                this.props.store.clinicalAttributes.result!,
                x=>x.displayName
            ));
            return Promise.resolve(clinicalAttributes);
        }
    });

    readonly unselectedClinicalAttributes = remoteData({
        await:()=>[this.clinicalAttributes],
        invoke:()=>{
            return Promise.resolve(this.clinicalAttributes.result!.filter(attr=>{
                return !this.selectedClinicalAttributeIds.has(attr.clinicalAttributeId);
            }));
        }
    });

    @computed get clinicalAttributesById() {
        if (this.clinicalAttributes.isComplete) {
            return _.reduce(this.clinicalAttributes.result, (map:any, attr:OncoprintClinicalAttribute)=>{
                map[attr.clinicalAttributeId] = attr;
                return map;
            }, {});
        } else {
            return {};
        }
    }

    @computed get sortOrder() {
        if (this.sortMode.type === "alphabetical") {
            return this.columnMode === "sample" ? this.alphabeticalSampleOrder : this.alphabeticalPatientOrder;
        } else if (this.sortMode.type === "caseList") {
            return this.columnMode === "sample" ? this.sampleUIDs.result : this.patientUIDs.result;
        } else {
            return undefined;
        }
    }

    readonly patientUIDs = remoteData({
        invoke:()=>Promise.resolve(this.props.querySession.getPatientUIDs()),
    });
    readonly sampleUIDs = remoteData({
        invoke:()=>Promise.resolve(this.props.querySession.getSampleUIDs()),
    });
    readonly uidToCaseMap = remoteData({
        invoke: ()=>Promise.resolve(this.props.querySession.getUIDToCaseMap()),
    });
    readonly sequencedSamples = remoteData({
        invoke: ()=>Promise.resolve(this.props.querySession.getSequencedSamples()),
    });
    readonly sequencedPatients = remoteData({
        invoke: ()=>Promise.resolve(this.props.querySession.getSequencedPatients()),
    });
    readonly alteredPatientUIDs = remoteData({
        invoke: ()=>Promise.resolve(this.props.querySession.getAlteredPatientUIDs()),
    });
    readonly alteredSampleUIDs = remoteData({
        invoke: ()=>Promise.resolve(this.props.querySession.getAlteredSampleUIDs()),
    });
    @computed get alphabeticalSampleOrder() {
        if (this.sampleUIDs.result && this.uidToCaseMap.result) {
            return _.sortBy(this.sampleUIDs.result, uid=>(this.uidToCaseMap.result![uid] || ""));
        } else {
            return undefined;
        }
    };

    @computed get alphabeticalPatientOrder() {
        if (this.patientUIDs.result && this.uidToCaseMap.result) {
            return _.sortBy(this.patientUIDs.result, uid=>(this.uidToCaseMap.result![uid] || ""))
        } else {
            return undefined;
        }
    };

    readonly geneticTracks = remoteData<GeneticTrackSpec[]>({
        invoke: async()=>{
            this.knownMutationSettingsAutorunCount; // register so that we recompute when known mutation settings change
            const oncoprintData:OncoprintTrackData[] =
                await Promise.resolve<OncoprintTrackData[]>((
                    this.columnMode === "sample" ?
                    this.props.querySession.getOncoprintSampleGenomicEventData(this.distinguishDrivers) :
                    this.props.querySession.getOncoprintPatientGenomicEventData(this.distinguishDrivers)
                ));
            return oncoprintData.map((track_data:OncoprintTrackData, index:number)=>{
                return {
                    key: index+"",
                    label: track_data.gene,
                    oql: track_data.oql_line,
                    info: getPercentAltered(track_data),
                    data: track_data.oncoprint_data
                };
            });
        },
        default: [],
    });

    readonly clinicalTracks = remoteData<ClinicalTrackSpec<any>[]>({
        invoke: async()=>{
            if (this.selectedClinicalAttributeIds.keys().length === 0) {
                return [];
            }
            const data = await Promise.resolve(((this.columnMode === "sample" ?
                this.props.querySession.getSampleClinicalData(this.selectedClinicalAttributeIds.keys()) :
                this.props.querySession.getPatientClinicalData(this.selectedClinicalAttributeIds.keys()))));
            const dataByAttrId = _.groupBy(data, "attr_id");
            const trackSpecs = Object.keys(dataByAttrId).map(attrId=>{
                const attr:OncoprintClinicalAttribute = this.clinicalAttributesById[attrId];
                const ret:Partial<ClinicalTrackSpec<any>> = {
                    key: attrId,
                    label: attr.displayName,
                    description: attr.description,
                    data: dataByAttrId[attrId],
                    valueKey: "attr_val"
                };
                if (attr.datatype === "NUMBER") {
                    ret.datatype = "number";
                    if (attrId === "FRACTION_GENOME_ALTERED") {
                        (ret as any).numberRange = [0,1];
                    } else if (attrId === "# mutations") {
                        (ret as any).numberLogScale = true;
                    }
                } else if (attr.datatype === "STRING") {
                    ret.datatype = "string";
                } else if (attrId === "NO_CONTEXT_MUTATION_SIGNATURE") {
                    ret.datatype = "counts";
                    (ret as any).countsCategoryLabels = ["C>A", "C>G", "C>T", "T>A", "T>C", "T>G"];
                    (ret as any).countsCategoryFills = ['#3D6EB1', '#8EBFDC', '#DFF1F8', '#FCE08E', '#F78F5E', '#D62B23'];
                }
                return ret as ClinicalTrackSpec<any>;
            });
            return trackSpecs;
        },
        default: []
    });

    readonly heatmapTracks = remoteData<HeatmapTrackSpec[]>({
        invoke:async()=>{
            const profiles = this.molecularProfileIdToHeatmapTracks.keys();
            const tracksData:OncoprintHeatmapTrackData[] = _.flatten(await Promise.all(profiles.map(profileId=>{
                const genes = this.molecularProfileIdToHeatmapTracks.get(profileId)!.genes.keys();
                if (genes.length > 0) {
                    return Promise.resolve(this.columnMode === "sample" ?
                        this.props.querySession.getSampleHeatmapData(profileId, genes) :
                        this.props.querySession.getPatientHeatmapData(profileId, genes));
                } else {
                    return Promise.resolve([]);
                }
            })));
            return tracksData.map(track=>{
                const molecularProfileId = track.genetic_profile_id;
                const gene = track.gene;
                return {
                    key: `${molecularProfileId},${gene}`,
                    label: gene,
                    molecularProfileId: molecularProfileId,
                    molecularAlterationType: track.genetic_alteration_type as MolecularProfile["molecularAlterationType"],
                    datatype: track.datatype as MolecularProfile["datatype"],
                    data: track.oncoprint_data,
                    trackGroupIndex: this.molecularProfileIdToHeatmapTracks.get(molecularProfileId)!.trackGroupIndex,
                    onRemove:()=>{
                        const trackGroup = this.molecularProfileIdToHeatmapTracks.get(molecularProfileId);
                        if (trackGroup) {
                            trackGroup.genes.delete(gene);
                        }
                    }
                };
            });
        },
        default: []
    });

    @computed get clusterHeatmapTrackGroupIndex() {
        if (this.sortMode.type === "heatmap") {
            return this.molecularProfileIdToHeatmapTracks.get(this.sortMode.clusteredHeatmapProfile!)!.trackGroupIndex;
        } else {
            return undefined;
        }
    }

    @computed get sortConfig() {
        return {
            sortByMutationType:this.sortByMutationType,
            sortByDrivers:this.sortByDrivers,
            order: this.sortOrder,
            clusterHeatmapTrackGroupIndex: this.clusterHeatmapTrackGroupIndex
        };
    }

    readonly caseSetName = remoteData({
        invoke:()=>{
            return Promise.resolve(this.props.querySession.getSampleSetName());
        }
    });

    @computed get headerColumnModeButton() {
        if (!this.sampleUIDs.isComplete ||
            !this.patientUIDs.isComplete ||
            (this.sampleUIDs.result.length === this.patientUIDs.result.length)) {
            return null;
        }
        let text, tooltip;
        if (this.columnMode === "sample") {
            text = "Show only one column per patient.";
            tooltip = "Each sample for each patient is in a separate column. Click to show only one column per patient";
        } else {
            text = "Show all samples";
            tooltip = "All samples from a patient are merged into one column. Click to split samples into multiple columns.";
        }
        return (
            <DefaultTooltip
                overlay={<div style={{maxWidth:"400px"}}>{tooltip}</div>}
                placement="top"
            >
                <Button
                    bsSize="xs"
                    bsStyle="primary"
                    style={{
                        fontSize:"11px",
                        display:"inline-block",
                        color:"white",
                        backgroundColor:"#2986e2",
                        marginLeft:"5px"
                    }}
                    onClick={this.toggleColumnMode}
                >{text}
                </Button>
            </DefaultTooltip>
        );
    }

    @computed get caseSetInfo() {
        if (this.caseSetName.isComplete && this.patientUIDs.isComplete && this.sampleUIDs.isComplete) {
            return (
                <div>
                    <span>Case Set: {this.caseSetName.result} ({this.patientUIDs.result.length} patients / {this.sampleUIDs.result.length} samples)</span>
                    {this.headerColumnModeButton}
                </div>
            );
        } else {
            return null;
        }
    }

    @computed get alterationInfo() {
        const alteredIdsPromise = (this.columnMode === "sample" ? this.alteredSampleUIDs : this.alteredPatientUIDs);
        const sequencedIdsPromise = (this.columnMode === "sample" ? this.sequencedSamples : this.sequencedPatients);
        const allIdsPromise = (this.columnMode === "sample" ? this.sampleUIDs : this.patientUIDs);
        if (allIdsPromise.isComplete && alteredIdsPromise.isComplete && sequencedIdsPromise.isComplete) {
            return (
                <span style={{marginTop:"15px", marginBottom:"15px", display: "block"}}>
                    {`Altered in ${alteredIdsPromise.result.length} `+
                    `(${percentAltered(alteredIdsPromise.result.length, sequencedIdsPromise.result.length)}) `+
                    `of ${sequencedIdsPromise.result.length} sequenced `+
                    `${this.columnMode === "sample" ? "samples" : "cases/patients"} `+
                    `(${allIdsPromise.result.length} total)`}
                </span>
            )
        } else {
            return null;
        }
    }

    public render() {
        return (
            <div>
                {this.caseSetInfo}
                <OncoprintControls
                    handlers={this.controlsHandlers}
                    state={this.controlsState}
                />
                {this.alterationInfo}
                <LoadingIndicator isLoading={this.clinicalTracks.isPending || this.geneticTracks.isPending || this.heatmapTracks.isPending}/>
                <Oncoprint
                    oncoprintRef={this.oncoprintRef}
                    clinicalTracks={this.clinicalTracks.result}
                    geneticTracks={this.geneticTracks.result}
                    heatmapTracks={this.heatmapTracks.result}
                    divId={this.props.divId}
                    width={1050}

                    hiddenIds={!this.showUnalteredColumns ? this.unalteredUids.result : []}

                    horzZoomToFitIds={this.horzZoomToFitIds}
                    distinguishMutationType={this.distinguishMutationType}
                    distinguishDrivers={this.distinguishDrivers}
                    sortConfig={this.sortConfig}
                    showClinicalTrackLegends={this.showClinicalTrackLegends}
                    showWhitespaceBetweenColumns={this.showWhitespaceBetweenColumns}
                    showMinimap={this.showMinimap}

                    onMinimapClose={this.onMinimapClose}
                    onDeleteClinicalTrack={this.onDeleteClinicalTrack}
                />
            </div>
        );
    }
}