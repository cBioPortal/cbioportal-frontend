import * as React from "react";
import {observer} from "mobx-react";
import {
    action,
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
import {ClinicalAttribute, Gene, MolecularProfile, Mutation, Sample} from "../../api/generated/CBioPortalAPI";
import {
    percentAltered, getPercentAltered, makeGeneticTracksMobxPromise,
    makeHeatmapTracksMobxPromise, makeClinicalTracksMobxPromise
} from "./OncoprintUtils";
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
import {SpecialAttribute} from "shared/cache/ClinicalDataCache";
import * as URL from "url";

interface IResultsViewOncoprintProps {
    divId: string;
    store:ResultsViewPageStore;
    routing:any;
    customDriverMetadata:{
        hasDriverAnnotations: boolean,
        customDriverTiers: string[]
    };
}

export type OncoprintClinicalAttribute =
    Pick<ClinicalAttribute, "datatype"|"description"|"displayName"|"patientAttribute"> &
    {
        clinicalAttributeId: string|SpecialAttribute;
    };

export type SortMode = {type:"data"|"alphabetical"|"caseList"|"heatmap", clusteredHeatmapProfile?:string};

const specialClinicalAttributes:OncoprintClinicalAttribute[] = [
    {
        clinicalAttributeId: SpecialAttribute.FractionGenomeAltered,
        datatype: "NUMBER",
        description: "Fraction Genome Altered",
        displayName: "Fraction Genome Altered",
        patientAttribute: false
    },
    {
        clinicalAttributeId: SpecialAttribute.MutationCount,
        datatype: "NUMBER",
        description: "Number of mutations",
        displayName: "Total mutations",
        patientAttribute: false
    },
    {
        clinicalAttributeId: SpecialAttribute.MutationSpectrum,
        datatype: "COUNTS_MAP",
        description: "Number of point mutations in the sample counted by different types of nucleotide changes.",
        displayName: "Mutation spectrum",
        patientAttribute: false
    }
];

const SAMPLE_MODE_URL_PARAM = "show_samples";
const CLINICAL_TRACKS_URL_PARAM = "clinicallist";
const HEATMAP_TRACKS_URL_PARAM = "heatmap_track_groups";

const CLINICAL_TRACK_KEY_PREFIX = "CLINICALTRACK_";

type HeatmapTrackGroupRecord = {
    trackGroupIndex:number,
    genes:ObservableMap<boolean>,
    molecularProfileId:string
};

@observer
export default class ResultsViewOncoprint extends React.Component<IResultsViewOncoprintProps, {}> {
    @observable columnMode:"sample"|"patient" = "patient";
    @observable sortMode:SortMode = {type:"data"};

    @observable distinguishMutationType:boolean = true;
    @observable distinguishDrivers:boolean = true;
    @observable sortByMutationType:boolean = true;
    @observable sortByDrivers:boolean = true;

    @observable showUnalteredColumns:boolean = true;
    @observable showWhitespaceBetweenColumns:boolean = true;
    @observable showClinicalTrackLegends:boolean = true;
    @observable showMinimap:boolean = false;

    @observable selectedHeatmapProfile:string = "";
    @observable heatmapGeneInputValue:string = "";

    @observable horzZoom:number = 0.5;

    private heatmapGeneInputValueUpdater:IReactionDisposer;

    public selectedClinicalAttributeIds = observable.shallowMap<boolean>();
    public molecularProfileIdToHeatmapTracks =
        observable.map<HeatmapTrackGroupRecord>();

    private controlsHandlers:IOncoprintControlsHandlers;
    private controlsState:IOncoprintControlsState & IObservableObject;

    private oncoprint:OncoprintJS<any>;

    private putativeDriverSettingsReaction:IReactionDisposer;
    private urlParamsReaction:IReactionDisposer;

    constructor(props:IResultsViewOncoprintProps) {
        super(props);

        (window as any).resultsViewOncoprint = this;

        this.initFromUrlParams(URL.parse(window.location.href, true).query);
        
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

        this.urlParamsReaction = reaction(
            ()=>[
                this.columnMode,
                this.heatmapTrackGroupsUrlParam,
                this.clinicalTracksUrlParam
            ],
            ()=>{
                const parsedURL = URL.parse(window.location.href, true);
                const query = Object.assign({}, parsedURL.query);
                //this.props.routing.updateRoute({
                query[SAMPLE_MODE_URL_PARAM] = (this.columnMode === "sample") + "";
                if (!this.clinicalTracksUrlParam) {
                    delete query[CLINICAL_TRACKS_URL_PARAM];
                } else {
                    query[CLINICAL_TRACKS_URL_PARAM] = this.clinicalTracksUrlParam;
                }
                if (!this.heatmapTrackGroupsUrlParam) {
                    delete query[HEATMAP_TRACKS_URL_PARAM];
                } else {
                    query[HEATMAP_TRACKS_URL_PARAM] = this.heatmapTrackGroupsUrlParam;
                }
                //});
                const newParsedURL = Object.assign(parsedURL, { query, search:null });
                window.history.replaceState({}, '', URL.format(newParsedURL));
            }
        );

        this.controlsHandlers = this.buildControlsHandlers();

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
                return self.props.store.mutationAnnotationSettings.oncoKb;
            },
            get annotateDriversHotspots() {
                return self.props.store.mutationAnnotationSettings.hotspots;
            },
            get annotateDriversCBioPortal() {
                return self.props.store.mutationAnnotationSettings.cbioportalCount;
            },
            get annotateDriversCOSMIC() {
                return self.props.store.mutationAnnotationSettings.cosmicCount;
            },
            get hidePutativePassengers() {
                return self.props.store.mutationAnnotationSettings.ignoreUnknown;
            },
            get annotateCBioPortalInputValue() {
                return self.props.store.mutationAnnotationSettings.cbioportalCountThreshold + "";
            },
            get annotateCOSMICInputValue() {
                return self.props.store.mutationAnnotationSettings.cosmicCountThreshold + "";
            },
            get clinicalAttributesPromise() {
                return self.unselectedClinicalAttributes;
            },
            get sortMode() {
                return self.sortMode;
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
            get clusterHeatmapButtonDisabled() {
                return (self.sortMode.type === "heatmap" &&
                    self.selectedHeatmapProfile === self.sortMode.clusteredHeatmapProfile);
            },
            get hideClusterHeatmapButton() {
                return !self.molecularProfileIdToHeatmapTracks.get(self.selectedHeatmapProfile);
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
                return self.props.store.mutationAnnotationSettings.driverFilter;
            },
            get selectedCustomDriverAnnotationTiers() {
                return self.props.store.mutationAnnotationSettings.driverTiers;
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

    private buildControlsHandlers() {
        const considerChangingDistinguishDrivers = action(()=>{
            if (!this.props.store.mutationAnnotationSettings.oncoKb &&
                !this.props.store.mutationAnnotationSettings.hotspots &&
                !this.props.store.mutationAnnotationSettings.cbioportalCount &&
                !this.props.store.mutationAnnotationSettings.cosmicCount) {
                this.distinguishDrivers = false;
                this.props.store.mutationAnnotationSettings.ignoreUnknown = false;
            } else {
                this.distinguishDrivers = true;
            }
        });

        return {
            onSelectColumnType:(type:"sample"|"patient")=>{this.setColumnMode(type);},
            onSelectShowUnalteredColumns:(show:boolean)=>{this.showUnalteredColumns = show;},
            onSelectShowWhitespaceBetweenColumns:(show:boolean)=>{this.showWhitespaceBetweenColumns = show;},
            onSelectShowClinicalTrackLegends:(show:boolean)=>{this.showClinicalTrackLegends = show; },
            onSelectShowMinimap:(show:boolean)=>{this.showMinimap = show;},
            onSelectDistinguishMutationType:(s:boolean)=>{this.distinguishMutationType = s;},
            onSelectDistinguishDrivers:action((s:boolean)=>{
                this.distinguishDrivers = s;
                if (!this.distinguishDrivers) {
                    this.props.store.mutationAnnotationSettings.oncoKb = false;
                    this.props.store.mutationAnnotationSettings.hotspots = false;
                    this.props.store.mutationAnnotationSettings.cbioportalCount = false;
                    this.props.store.mutationAnnotationSettings.cosmicCount = false;
                    this.props.store.mutationAnnotationSettings.ignoreUnknown = false;
                } else {
                    this.props.store.mutationAnnotationSettings.oncoKb = true;
                    this.props.store.mutationAnnotationSettings.hotspots = true;
                    this.props.store.mutationAnnotationSettings.cbioportalCount = true;
                    this.props.store.mutationAnnotationSettings.cosmicCount = true;
                }
            }),
            onSelectAnnotateOncoKb:action((s:boolean)=>{
                this.props.store.mutationAnnotationSettings.oncoKb = s;
                considerChangingDistinguishDrivers();
            }),
            onSelectAnnotateHotspots:action((s:boolean)=>{
                this.props.store.mutationAnnotationSettings.hotspots = s;
                considerChangingDistinguishDrivers();
            }),
            onSelectAnnotateCBioPortal:action((s:boolean)=>{
                this.props.store.mutationAnnotationSettings.cbioportalCount = s;
                considerChangingDistinguishDrivers();
            }),
            onSelectAnnotateCOSMIC:action((s:boolean)=>{
                this.props.store.mutationAnnotationSettings.cosmicCount = s;
                considerChangingDistinguishDrivers();
            }),
            onChangeAnnotateCBioPortalInputValue:action((s:string)=>{
                this.props.store.mutationAnnotationSettings.cbioportalCountThreshold = parseInt(s, 10);
                this.controlsHandlers.onSelectAnnotateCBioPortal && this.controlsHandlers.onSelectAnnotateCBioPortal(true);
            }),
            onChangeAnnotateCOSMICInputValue:action((s:string)=>{
                this.props.store.mutationAnnotationSettings.cosmicCountThreshold = parseInt(s, 10);
                this.controlsHandlers.onSelectAnnotateCOSMIC && this.controlsHandlers.onSelectAnnotateCOSMIC(true);
            }),
            onSelectCustomDriverAnnotationBinary:action((s:boolean)=>{
                this.props.store.mutationAnnotationSettings.driverFilter = s;
                if (this.props.store.mutationAnnotationSettings.driverFilter) {
                    this.distinguishDrivers = true;
                }
            }),
            onSelectCustomDriverAnnotationTier:action((value:string, checked:boolean)=>{
                this.props.store.mutationAnnotationSettings.driverTiers.set(value, checked);
                if (checked) {
                    this.distinguishDrivers = true;
                }
            }),
            onSelectHidePutativePassengers:(s:boolean)=>{
                this.props.store.mutationAnnotationSettings.ignoreUnknown = s;
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
            onChangeHeatmapGeneInputValue:action((s:string)=>{
                this.heatmapGeneInputValue = s;
                this.heatmapGeneInputValueUpdater(); // stop updating heatmap input if user has typed
            }),
            onSelectHeatmapProfile:(id:string)=>{this.selectedHeatmapProfile = id;},
            onClickAddGenesToHeatmap:()=>{
                this.addHeatmapTracks(this.selectedHeatmapProfile, this.heatmapGeneInputValue.toUpperCase().trim().split(/\s+/));
            },
            onClickRemoveHeatmap:action(()=>{
                this.molecularProfileIdToHeatmapTracks.clear();
                if (this.sortMode.type === "heatmap") {
                    this.sortByData();
                }
            }),
            onClickClusterHeatmap:()=>{
                this.sortMode = {type: "heatmap", clusteredHeatmapProfile: this.selectedHeatmapProfile};
            },
            onClickDownload:(type:string)=>{
                switch(type) {
                    case "pdf":
                        if (!svgToPdfDownload("oncoprint.pdf", this.oncoprint.toSVG(true))) {
                            alert("Oncoprint too big to download as PDF - please download as SVG.");
                        }
                        break;
                    case "png":
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
                        break;
                    case "svg":
                        fileDownload(
                            (new XMLSerializer).serializeToString(this.oncoprint.toSVG(false)),
                            "oncoprint.svg"
                        );
                        break;
                    case "order":
                        const capitalizedColumnMode = this.columnMode[0].toUpperCase() + this.columnMode.slice(1);
                        onMobxPromise(
                            [this.props.store.sampleKeyToSample,
                                this.props.store.patientKeyToPatient],
                            (sampleKeyToSample:{[sampleKey:string]:Sample}, patientKeyToPatient)=>{
                                let file = `${capitalizedColumnMode} order in the Oncoprint is:\n`;
                                const keyToCase = (this.columnMode === "sample" ? sampleKeyToSample : patientKeyToPatient);
                                const caseIds = this.oncoprint.getIdOrder().map(
                                    this.columnMode === "sample" ?
                                        (id=>(sampleKeyToSample[id].sampleId)) :
                                        (id=>(patientKeyToPatient[id].patientId))
                                );
                                for (const caseId of caseIds) {
                                    file += `${caseId}\n`;
                                }
                                fileDownload(
                                    file,
                                    `OncoPrint${capitalizedColumnMode}s.txt`
                                );
                            }
                        );
                        break;
                    case "tabular":
                        onMobxPromise(
                            [this.props.store.sampleKeyToSample,
                                this.props.store.patientKeyToPatient],
                            (sampleKeyToSample:{[sampleKey:string]:Sample}, patientKeyToPatient)=>{
                                tabularDownload(
                                    this.geneticTracks.result,
                                    this.clinicalTracks.result,
                                    this.heatmapTracks.result,
                                    this.oncoprint.getIdOrder(),
                                    (this.columnMode === "sample" ?
                                        ((key:string)=>(sampleKeyToSample[key].sampleId)) :
                                        ((key:string)=>(patientKeyToPatient[key].patientId))),
                                    this.columnMode,
                                    this.distinguishDrivers
                                )
                            }
                        );
                        break;
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
        };
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

    @action public sortByData() {
        this.sortMode = {type:"data"};
    }

    @computed get clinicalTracksUrlParam() {
        return this.selectedClinicalAttributeIds.keys().join(",");
    }

    @computed get heatmapTrackGroupsUrlParam() {
        return _.sortBy(this.molecularProfileIdToHeatmapTracks.values(), (x:HeatmapTrackGroupRecord)=>x.trackGroupIndex)
            .filter((x:HeatmapTrackGroupRecord)=>!!x.genes.size)
            .map((x:HeatmapTrackGroupRecord)=>`${x.molecularProfileId},${x.genes.keys().join(",")}`)
            .join(";");
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
        onMobxPromise([this.props.store.alteredSampleKeys, this.props.store.alteredPatientKeys],
            (sampleUIDs:string[], patientUIDs:string[])=>{
                this.oncoprint.setHorzZoomToFit(
                    this.columnMode === "sample" ? sampleUIDs: patientUIDs
                );
            });

    }

    @computed get horzZoomToFitIds() {
        if (this.columnMode === "sample" && this.props.store.alteredSampleKeys.isComplete) {
            return this.props.store.alteredSampleKeys.result;
        } else if (this.columnMode === "patient" && this.props.store.alteredPatientKeys.isComplete) {
            return this.props.store.alteredPatientKeys.result;
        } else {
            return [];
        }
    }

    private setColumnMode(type:"sample"|"patient") {
        if (this.columnMode !== type) {
            this.columnMode = type;
        }
    }

    readonly unalteredKeys = remoteData({
        await: ()=>[
            this.props.store.unalteredSampleKeys,
            this.props.store.unalteredPatientKeys,
        ],
        invoke:async()=>{
            if (this.columnMode === "sample") {
               return this.props.store.unalteredSampleKeys.result!;
            } else {
               return this.props.store.unalteredPatientKeys.result!;
            }
        },
        default: []
    });

    private onMinimapClose() {
        this.showMinimap = false;
    }

    public clinicalTrackKeyToAttributeId(clinicalTrackKey:string) {
        return clinicalTrackKey.substr(CLINICAL_TRACK_KEY_PREFIX.length);
    }

    public clinicalAttributeIdToTrackKey(clinicalAttributeId:string|SpecialAttribute) {
        return `${CLINICAL_TRACK_KEY_PREFIX}${clinicalAttributeId}`;
    }

    private onSelectClinicalTrack(clinicalAttributeId:string|SpecialAttribute) {
        this.selectedClinicalAttributeIds.set(clinicalAttributeId, true);
    }

    private onDeleteClinicalTrack(clinicalTrackKey:string) {
        this.selectedClinicalAttributeIds.delete(this.clinicalTrackKeyToAttributeId(clinicalTrackKey));
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

    readonly clinicalAttributesById = remoteData({
        await:()=>[
            this.clinicalAttributes
        ],
        invoke: ()=>{
            return Promise.resolve(_.reduce(this.clinicalAttributes.result!, (map:any, attr:OncoprintClinicalAttribute)=>{
                map[attr.clinicalAttributeId] = attr;
                return map;
            }, {}));
        }
    });

    @computed get sortOrder() {
        if (this.sortMode.type === "alphabetical") {
            return this.columnMode === "sample" ? this.alphabeticalSampleOrder : this.alphabeticalPatientOrder;
        } else if (this.sortMode.type === "caseList") {
            if (this.columnMode === "sample" && this.props.store.samples.isComplete) {
                return this.props.store.samples.result.map(x=>x.uniqueSampleKey);
            } else if (this.columnMode === "patient" && this.props.store.patients.isComplete) {
                return this.props.store.patients.result.map(x=>x.uniquePatientKey);
            }
        } else {
            return undefined;
        }
    }

    @computed get alphabeticalSampleOrder() {
        if (this.props.store.samples.isComplete) {
            return _.sortBy(this.props.store.samples.result!, sample=>sample.sampleId).map(sample=>sample.uniqueSampleKey);
        } else {
            return undefined;
        }
    };

    @computed get alphabeticalPatientOrder() {
        if (this.props.store.patients.isComplete) {
            return _.sortBy(this.props.store.patients.result!, patient=>patient.patientId).map(patient=>patient.uniquePatientKey);
        } else {
            return undefined;
        }
    };

    readonly sampleGeneticTracks = makeGeneticTracksMobxPromise(this, true);
    readonly patientGeneticTracks = makeGeneticTracksMobxPromise(this, false);
    @computed get geneticTracks() {
        return (this.columnMode === "sample" ? this.sampleGeneticTracks : this.patientGeneticTracks);
    }

    readonly sampleClinicalTracks = makeClinicalTracksMobxPromise(this, true);
    readonly patientClinicalTracks = makeClinicalTracksMobxPromise(this, false);
    @computed get clinicalTracks() {
        return (this.columnMode === "sample" ? this.sampleClinicalTracks : this.patientClinicalTracks);
    }

    readonly sampleHeatmapTracks = makeHeatmapTracksMobxPromise(this, true);
    readonly patientHeatmapTracks = makeHeatmapTracksMobxPromise(this, false);
    @computed get heatmapTracks() {
        return (this.columnMode === "sample" ? this.sampleHeatmapTracks : this.patientHeatmapTracks);
    }

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
        await:()=>[
            this.props.store.sampleLists
        ],
        invoke:()=>{
            if (this.props.store.sampleLists.result!.length === 1) {
                return Promise.resolve(this.props.store.sampleLists.result![0].name);
            } else {
                return Promise.resolve(undefined);
            }
        }
    });

    @computed get headerColumnModeButton() {
        if (!this.props.store.samples.isComplete ||
            !this.props.store.patients.isComplete ||
            (this.props.store.samples.result.length === this.props.store.patients.result.length)) {
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
        if (this.caseSetName.isComplete && this.props.store.patients.isComplete && this.props.store.samples.isComplete &&
            this.caseSetName.result) {
            return (
                <div>
                    <span>Case Set: {this.caseSetName.result} ({this.props.store.patients.result.length} patients / {this.props.store.samples.result.length} samples)</span>
                    {this.headerColumnModeButton}
                </div>
            );
        } else {
            return null;
        }
    }

    @computed get alterationInfo() {
        const alteredIdsPromise = (this.columnMode === "sample" ? this.props.store.alteredSampleKeys : this.props.store.alteredPatientKeys);
        const sequencedIdsPromise = (this.columnMode === "sample" ? this.props.store.sequencedSampleKeys: this.props.store.sequencedPatientKeys);
        const allIdsPromise = (this.columnMode === "sample" ? this.props.store.samples : this.props.store.patients);
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
            <div className="cbioportal-frontend">
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

                    hiddenIds={!this.showUnalteredColumns ? this.unalteredKeys.result : []}

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