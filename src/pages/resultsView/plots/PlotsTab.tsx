import * as React from "react";
import {action, computed, observable} from "mobx";
import {Observer, observer} from "mobx-react";
import "./styles.scss";
import {AlterationTypeConstants, ResultsViewPageStore} from "../ResultsViewPageStore";
import {FormControl} from "react-bootstrap";
import LockIcon from "../../../shared/components/LockIcon";
import ReactSelect from "react-select";
import _ from "lodash";
import {
    getAxisDescription,
    getAxisLabel, isNumberData, isStringData, logScalePossible,
    makeAxisDataPromise, makeScatterPlotData, molecularProfileTypeDisplayOrder,
    molecularProfileTypeToDisplayType, scatterPlotTooltip
} from "./PlotsTabUtils";
import {ClinicalAttribute, MolecularProfile} from "../../../shared/api/generated/CBioPortalAPI";
import Timer = NodeJS.Timer;
import ScatterPlot from "shared/components/scatterPlot/ScatterPlot";
import TablePlot from "./TablePlot";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import InfoIcon from "../../../shared/components/InfoIcon";

enum EventKey {
    horz_molecularProfile,
    horz_clinicalAttribute,
    horz_logScale,

    vert_molecularProfile,
    vert_clinicalAttribute,
    vert_logScale,

    utilities_viewMutationType,
    utilities_viewCopyNumber,

    downloadSVG,
    downloadPDF,
    downloadData
}

export enum AxisType {
    molecularProfile,
    clinicalAttribute
}

export enum ViewType {
    MutationType,
    CopyNumber
}

export type AxisMenuSelection = {
    axisType: AxisType|undefined;
    entrezGeneId?:number;
    molecularProfileType?:string;
    molecularProfileId?:string;
    clinicalAttributeId?:string;
    logScale: boolean;
};

export interface IPlotsTabProps {
    store:ResultsViewPageStore;
};

const searchInputTimeoutMs = 600;

@observer
export default class PlotsTab extends React.Component<IPlotsTabProps,{}> {

    private horzSelection:AxisMenuSelection;
    private vertSelection:AxisMenuSelection;

    @observable geneLock:boolean;
    @observable searchCaseInput:string;
    @observable searchMutationInput:string;
    @observable viewType:ViewType;

    private searchCaseTimeout:Timer;
    private searchMutationTimeout:Timer;

    constructor(props:IPlotsTabProps) {
        super(props);

        this.horzSelection = this.initAxisMenuSelection();
        this.vertSelection = this.initAxisMenuSelection();

        this.geneLock = false;
        this.searchCaseInput = "";
        this.searchMutationInput = "";
        this.viewType = ViewType.MutationType;

        this.controls = this.controls.bind(this);
        this.plot = this.plot.bind(this);
        this.onInputClick = this.onInputClick.bind(this);
        this.getHorizontalAxisMenu = this.getHorizontalAxisMenu.bind(this);
        this.getVerticalAxisMenu = this.getVerticalAxisMenu.bind(this);
        this.getUtilitiesMenu = this.getUtilitiesMenu.bind(this);
        this.setSearchCaseInput = this.setSearchCaseInput.bind(this);
        this.setSearchMutationInput = this.setSearchMutationInput.bind(this);
        this.onHorizontalAxisGeneLockClick = this.onHorizontalAxisGeneLockClick.bind(this);
        this.onVerticalAxisGeneLockClick = this.onVerticalAxisGeneLockClick.bind(this);
        this.onVerticalAxisGeneSelect = this.onVerticalAxisGeneSelect.bind(this);
        this.onHorizontalAxisGeneSelect = this.onHorizontalAxisGeneSelect.bind(this);
        this.onVerticalAxisProfileTypeSelect = this.onVerticalAxisProfileTypeSelect.bind(this);
        this.onHorizontalAxisProfileTypeSelect = this.onHorizontalAxisProfileTypeSelect.bind(this);
        this.onVerticalAxisProfileIdSelect = this.onVerticalAxisProfileIdSelect.bind(this);
        this.onHorizontalAxisProfileIdSelect = this.onHorizontalAxisProfileIdSelect.bind(this);
        this.onVerticalAxisClinicalAttributeSelect = this.onVerticalAxisClinicalAttributeSelect.bind(this);
        this.onHorizontalAxisClinicalAttributeSelect = this.onHorizontalAxisClinicalAttributeSelect.bind(this);
        this.swapHorzVertSelections = this.swapHorzVertSelections.bind(this);
        this.executeSearchCase = this.executeSearchCase.bind(this);
        this.executeSearchMutation = this.executeSearchMutation.bind(this);
        this.onButtonClick = this.onButtonClick.bind(this);
    }

    private initAxisMenuSelection():AxisMenuSelection {
        const self = this;

        return observable({
            get axisType() {
                if (!self.profileTypeOptions.length && !self.clinicalAttributeOptions.length) {
                    return undefined;
                } else if (!self.profileTypeOptions.length) {
                    return AxisType.clinicalAttribute;
                } else if (!self.clinicalAttributeOptions.length) {
                    return AxisType.molecularProfile;
                } else {
                    return this._axisType;
                }
            },
            set axisType(a:AxisType|undefined) {
                this._axisType = a;
            },
            get entrezGeneId() {
                if (this._entrezGeneId === undefined && self.geneOptions.length) {
                    return self.geneOptions[0].value;
                } else {
                    return this._entrezGeneId;
                }
            },
            set entrezGeneId(e:number|undefined) {
                this._entrezGeneId = e;
            },
            get molecularProfileType() {
                if (this._molecularProfileType === undefined && self.profileTypeOptions.length) {
                    return self.profileTypeOptions[0].value;
                } else {
                    return this._molecularProfileType;
                }
            },
            set molecularProfileType(t:string|undefined) {
                this._molecularProfileType = t;
            },
            get molecularProfileId() {
                if (this._molecularProfileId === undefined &&
                    this.molecularProfileType &&
                    self.profileNameOptionsByType[this.molecularProfileType] &&
                    self.profileNameOptionsByType[this.molecularProfileType].length) {
                    return self.profileNameOptionsByType[this.molecularProfileType][0].value;
                } else {
                    return this._molecularProfileId;
                }
            },
            set molecularProfileId(id:string|undefined) {
                this._molecularProfileId = id;
            },
            get clinicalAttributeId() {
                if (this._clinicalAttributeId === undefined && self.clinicalAttributeOptions.length) {
                    return self.clinicalAttributeOptions[0].value;
                } else {
                    return this._clinicalAttributeId;
                }
            },
            set clinicalAttributeId(id:string|undefined) {
                this._clinicalAttributeId = id;
            },
            get logScale() {
                return this._logScale && this.molecularProfileId && logScalePossible(this.molecularProfileId)
            },
            set logScale(v:boolean) {
                this._logScale = v;
            },
            _axisType: AxisType.molecularProfile,
            _entrezGeneId: undefined,
            _molecularProfileType: undefined,
            _molecularProfileId: undefined,
            _clinicalAttributeId: undefined,
            _logScale: true
        });
    }

    private onButtonClick(event:React.MouseEvent<HTMLButtonElement>) {
        switch (parseInt((event.target as HTMLButtonElement).name, 10)) {
            case EventKey.downloadSVG:
                // TODO;
                break;
            case EventKey.downloadPDF:
                // TODO;
                break;
            case EventKey.downloadData:
                // TODO;
                break;
        }
    }

    private onInputClick(event:React.MouseEvent<HTMLInputElement>) {
        switch (parseInt((event.target as HTMLInputElement).value, 10)) {
            case EventKey.horz_molecularProfile:
                this.horzSelection.axisType = AxisType.molecularProfile;
                break;
            case EventKey.horz_clinicalAttribute:
                this.horzSelection.axisType = AxisType.clinicalAttribute;
                break;
            case EventKey.vert_molecularProfile:
                this.vertSelection.axisType = AxisType.molecularProfile;
                break;
            case EventKey.vert_clinicalAttribute:
                this.vertSelection.axisType = AxisType.clinicalAttribute;
                break;
            case EventKey.horz_logScale:
                this.horzSelection.logScale = !this.horzSelection.logScale;
                break;
            case EventKey.vert_logScale:
                this.vertSelection.logScale = !this.vertSelection.logScale;
                break;
            case EventKey.utilities_viewCopyNumber:
                this.viewType = ViewType.CopyNumber;
                break;
            case EventKey.utilities_viewMutationType:
                this.viewType = ViewType.MutationType;
                break;
        }
    }

    private setSearchCaseInput(e:any) {
        this.searchCaseInput = e.target.value;
        clearTimeout(this.searchCaseTimeout);
        this.searchCaseTimeout = setTimeout(this.executeSearchCase, searchInputTimeoutMs);
    }

    private setSearchMutationInput(e:any) {
        this.searchMutationInput = e.target.value;
        clearTimeout(this.searchMutationTimeout);
        this.searchMutationTimeout = setTimeout(this.executeSearchMutation, searchInputTimeoutMs);
    }

    private executeSearchCase() {
        // TODO
    }

    private executeSearchMutation() {
        // TODO
    }

    private getHorizontalAxisMenu() {
        return this.getAxisMenu(false);
    }

    private getVerticalAxisMenu() {
        return this.getAxisMenu(true);
    }

    @action
    private onGeneLockClick(vertical:boolean) {
        this.geneLock = !this.geneLock;
        if (vertical) {
            this.horzSelection.entrezGeneId = this.vertSelection.entrezGeneId;
        } else {
            this.vertSelection.entrezGeneId = this.horzSelection.entrezGeneId;
        }
    }

    private onVerticalAxisGeneLockClick() {
        this.onGeneLockClick(true);
    }

    private onHorizontalAxisGeneLockClick() {
        this.onGeneLockClick(false);
    }

    @action
    private onGeneSelect(vertical:boolean, option:any) {
        let targetSelection;
        let otherSelection;
        if (vertical) {
            targetSelection = this.vertSelection;
            otherSelection = this.horzSelection;
        } else {
            targetSelection = this.horzSelection;
            otherSelection = this.vertSelection;
        }
        targetSelection.entrezGeneId = option.value;
        if (this.geneLock) {
            otherSelection.entrezGeneId = option.value;
        }
    }

    private onVerticalAxisGeneSelect(option:any) {
        this.onGeneSelect(true, option);
    }

    private onHorizontalAxisGeneSelect(option:any) {
        this.onGeneSelect(false, option);
    }

    @computed get geneOptions() {
        if (this.props.store.genes.isComplete) {
            return this.props.store.genes.result.map(gene=>({ value: gene.entrezGeneId, label: gene.hugoGeneSymbol }));
        } else {
            return [];
        }
    }

    @computed get clinicalAttributeIdToClinicalAttribute():{[clinicalAttributeId:string]:ClinicalAttribute} {
        if (this.props.store.clinicalAttributes.isComplete) {
            return this.props.store.clinicalAttributes.result.reduce((map:{[clinicalAttributeId:string]:ClinicalAttribute}, next)=>{
                map[next.clinicalAttributeId] = next;
                return map;
            }, {});
        } else {
            return {};
        }
    }

    @computed get clinicalAttributeOptions() {
        if (this.props.store.clinicalAttributes.isComplete) {
            return this.props.store.clinicalAttributes.result.map(attribute=>({
                value: attribute.clinicalAttributeId,
                label: attribute.displayName
            }));
        } else {
            return [];
        }
    }

    @computed get profileTypeOptions() {
        if (this.props.store.molecularProfilesInStudies.isComplete) {
            return _.sortBy(
                _.uniq(
                    this.props.store.molecularProfilesInStudies.result.map(profile=>profile.molecularAlterationType)
                ).filter(type=>!!molecularProfileTypeToDisplayType[type]),
                type=>molecularProfileTypeDisplayOrder.indexOf(type)
            ).map(type=>({
                value: type,
                label: molecularProfileTypeToDisplayType[type]
            }));
        } else {
            return [];
        }
    }

    @computed get profileNameOptionsByType() {
        if (this.props.store.molecularProfilesInStudies.isComplete) {
            return _.mapValues(
                _.groupBy(this.props.store.molecularProfilesInStudies.result, profile=>profile.molecularAlterationType),
                profiles=>profiles.map(p=>({value:p.molecularProfileId, label:p.name}))
            );
        } else {
            return {};
        }
    }

    private onVerticalAxisProfileTypeSelect(option:any) {
        this.vertSelection.molecularProfileType = option.value;
    }

    private onHorizontalAxisProfileTypeSelect(option:any) {
        this.horzSelection.molecularProfileType = option.value;
    }

    private onVerticalAxisProfileIdSelect(option:any) {
        this.vertSelection.molecularProfileId = option.value;
    }

    private onHorizontalAxisProfileIdSelect(option:any) {
        this.horzSelection.molecularProfileId = option.value;
    }

    private onVerticalAxisClinicalAttributeSelect(option:any) {
        this.vertSelection.clinicalAttributeId = option.value;
    }

    private onHorizontalAxisClinicalAttributeSelect(option:any) {
        this.horzSelection.clinicalAttributeId = option.value;
    }

    @action
    private swapHorzVertSelections() {
        for (const key of (Object.keys(this.horzSelection) as (keyof AxisMenuSelection)[])) {
            const horzVersion = this.horzSelection[key];
            this.horzSelection[key] = this.vertSelection[key];
            this.vertSelection[key] = horzVersion;
        }
    }

    @computed get horzAxisDataPromise() {
        return makeAxisDataPromise(
            this.horzSelection,
            true,
            this.clinicalAttributeIdToClinicalAttribute,
            this.props.store.patientKeyToSamples,
            this.props.store.clinicalDataMxPCache,
            this.props.store.numericGeneMolecularDataCache
        );
    }

    @computed get vertAxisDataPromise() {
        return makeAxisDataPromise(
            this.vertSelection,
            true,
            this.clinicalAttributeIdToClinicalAttribute,
            this.props.store.patientKeyToSamples,
            this.props.store.clinicalDataMxPCache,
            this.props.store.numericGeneMolecularDataCache
        );
    }


    @computed get horzLabel() {
        if (this.props.store.molecularProfileIdToMolecularProfile.isComplete) {
            return getAxisLabel(
                this.horzSelection,
                this.props.store.molecularProfileIdToMolecularProfile.result,
                this.clinicalAttributeIdToClinicalAttribute
            );
        } else {
            return "";
        }
    }

    @computed get vertLabel() {
        if (this.props.store.molecularProfileIdToMolecularProfile.isComplete) {
            return getAxisLabel(
                this.vertSelection,
                this.props.store.molecularProfileIdToMolecularProfile.result,
                this.clinicalAttributeIdToClinicalAttribute
            );
        } else {
            return "";
        }
    }

    @computed get horzDescription() {
        if (this.props.store.molecularProfileIdToMolecularProfile.isComplete) {
            return getAxisDescription(
                this.horzSelection,
                this.props.store.molecularProfileIdToMolecularProfile.result,
                this.clinicalAttributeIdToClinicalAttribute
            );
        } else {
            return "";
        }
    }

    @computed get vertDescription() {
        if (this.props.store.molecularProfileIdToMolecularProfile.isComplete) {
            return getAxisDescription(
                this.vertSelection,
                this.props.store.molecularProfileIdToMolecularProfile.result,
                this.clinicalAttributeIdToClinicalAttribute
            );
        } else {
            return "";
        }
    }

    private getAxisMenu(vertical:boolean) {
        const axisSelection = vertical ? this.vertSelection : this.horzSelection;
        return (
            <div>
                <h4>{vertical ? "Vertical" : "Horizontal"} Axis</h4>
                <div>
                    <div className="radio"><label>
                        <input
                            type="radio"
                            name={vertical ? "vert_molecularProfile" : "horz_molecularProfile"}
                            value={vertical ? EventKey.vert_molecularProfile : EventKey.horz_molecularProfile}
                            checked={axisSelection.axisType === AxisType.molecularProfile}
                            onClick={this.onInputClick}
                        /> Molecular Profile
                    </label></div>
                    <div className="radio"><label>
                        <input
                            type="radio"
                            name={vertical ? "vert_clinicalAttribute" : "horz_clinicalAttribute"}
                            value={vertical ? EventKey.vert_clinicalAttribute : EventKey.horz_clinicalAttribute}
                            checked={axisSelection.axisType === AxisType.clinicalAttribute}
                            onClick={this.onInputClick}
                        /> Clinical Attribute
                    </label></div>
                </div>
                {(axisSelection.axisType === AxisType.molecularProfile) && (
                    <div>
                        <div>
                            Gene
                            <ReactSelect
                                name={`${vertical ? "v" : "h"}-gene-selector`}
                                value={axisSelection.entrezGeneId}
                                onChange={vertical ? this.onVerticalAxisGeneSelect : this.onHorizontalAxisGeneSelect}
                                options={this.geneOptions}
                                clearable={false}
                                searchable={false}
                            />
                            <LockIcon locked={this.geneLock} className="lockIcon" onClick={vertical ? this.onVerticalAxisGeneLockClick : this.onHorizontalAxisGeneLockClick}/>
                        </div>
                        <div>
                            Profile Type
                            <ReactSelect
                                name={`${vertical ? "v" : "h"}-profile-type-selector`}
                                value={axisSelection.molecularProfileType}
                                onChange={vertical ? this.onVerticalAxisProfileTypeSelect : this.onHorizontalAxisProfileTypeSelect}
                                options={this.profileTypeOptions}
                                clearable={false}
                                searchable={false}
                            />
                        </div>
                        <div>
                            Profile Name
                            <ReactSelect
                                name={`${vertical ? "v" : "h"}-profile-name-selector`}
                                value={axisSelection.molecularProfileId}
                                onChange={vertical ? this.onVerticalAxisProfileIdSelect : this.onHorizontalAxisProfileIdSelect}
                                options={this.profileNameOptionsByType[axisSelection.molecularProfileType+""] || []}
                                clearable={false}
                                searchable={false}
                            />
                        </div>
                        { axisSelection.molecularProfileId && logScalePossible(axisSelection.molecularProfileId) && (
                            <div className="checkbox"><label>
                                <input
                                    type="checkbox"
                                    name={vertical ? "vert_logScale" : "vert_logScale"}
                                    value={vertical ? EventKey.vert_logScale : EventKey.horz_logScale}
                                    checked={axisSelection.logScale}
                                    onClick={this.onInputClick}
                                /> Apply Log Scale
                            </label></div>
                        )}
                    </div>
                )}
                {(axisSelection.axisType === AxisType.clinicalAttribute) && (
                    <div>
                        Clinical Attribute
                        <ReactSelect
                            name={`${vertical ? "v" : "h"}-clinical-attribute-selector`}
                            value={axisSelection.clinicalAttributeId}
                            onChange={vertical ? this.onVerticalAxisClinicalAttributeSelect : this.onHorizontalAxisClinicalAttributeSelect}
                            options={this.clinicalAttributeOptions}
                            clearable={false}
                            searchable={false}
                        />
                    </div>
                )}
            </div>
        );
    }

    private getUtilitiesMenu() {
        return (
            <div>
                <h4>Utilities</h4>
                <div>
                    <div>
                        Search Case(s)
                        <FormControl
                            type="text"
                            value={this.searchCaseInput}
                            onChange={this.setSearchCaseInput}
                            placeholder="Case ID.."
                        />
                    </div>
                    <div>
                        Search Mutation(s)
                        <FormControl
                            type="text"
                            value={this.searchMutationInput}
                            onChange={this.setSearchMutationInput}
                            placeholder="Protein Change.."
                        />
                    </div>
                    {(this.horzSelection.entrezGeneId === this.vertSelection.entrezGeneId) && (typeof this.horzSelection.entrezGeneId !== "undefined") && (
                        <div>
                            View
                            <div className="radio"><label>
                                <input
                                    type="radio"
                                    name="utilities_viewMutationType"
                                    value={EventKey.utilities_viewMutationType}
                                    checked={this.viewType === ViewType.MutationType}
                                    onClick={this.onInputClick}
                                /> Mutation Type
                            </label></div>
                            <div className="radio"><label>
                                <input
                                    type="radio"
                                    name="utilities_viewMutationType"
                                    value={EventKey.utilities_viewCopyNumber}
                                    checked={this.viewType === ViewType.CopyNumber}
                                    onClick={this.onInputClick}
                                /> Copy Number
                            </label></div>
                        </div>
                    )}
                    <div>
                        <button name={EventKey.downloadSVG+""} onClick={this.onButtonClick}>SVG</button>
                        <button name={EventKey.downloadPDF+""} onClick={this.onButtonClick}>PDF</button>
                        <button name={EventKey.downloadData+""} onClick={this.onButtonClick}>Data</button>
                    </div>
                </div>
            </div>
        );
    }

    private controls() {
        return (
            <div style={{display:"flex", flexDirection:"column"}}>
                <div style={{margin:5, padding:10, border: "1px solid #aaaaaa", borderRadius:4}}>
                    <Observer>
                        {this.getHorizontalAxisMenu}
                    </Observer>
                </div>
                <div style={{margin:5}}>
                    <button onClick={this.swapHorzVertSelections}>Swap Axes</button>
                </div>
                <div style={{margin:5, padding:10, border: "1px solid #aaaaaa", borderRadius:4}}>
                    <Observer>
                        {this.getVerticalAxisMenu}
                    </Observer>
                </div>
                <div style={{margin:5, padding:10, border: "1px solid #aaaaaa", borderRadius:4}}>
                    <Observer>
                        {this.getUtilitiesMenu}
                    </Observer>
                </div>
            </div>
        );
    }



    private plot() {
        if (this.horzAxisDataPromise.isPending || this.vertAxisDataPromise.isPending || this.props.store.sampleKeyToSample.isPending) {
            return <LoadingIndicator isLoading={true}/>
        } else if (this.horzAxisDataPromise.isComplete && this.vertAxisDataPromise.isComplete && this.props.store.sampleKeyToSample.isComplete) {
            const horzAxisData = this.horzAxisDataPromise.result!;
            const vertAxisData = this.vertAxisDataPromise.result!;
            if (isStringData(horzAxisData) && isStringData(vertAxisData)) {
                return (
                    <TablePlot
                        horzData={horzAxisData.data}
                        vertData={vertAxisData.data}
                    />
                );
            } else if (isNumberData(horzAxisData) && isNumberData(vertAxisData)) {
                const data = makeScatterPlotData(horzAxisData.data, vertAxisData.data, this.props.store.sampleKeyToSample.result!);
                return (
                    <ScatterPlot
                        data={data}
                        chartWidth={300}
                        chartHeight={300}
                        tooltip={scatterPlotTooltip}
                        logX={this.horzSelection.logScale}
                        logY={this.vertSelection.logScale}
                    />
                );
            } else {
                return <span>Not implemented yet.</span>
            }
        } else {
            return <span>Error loading plot data.</span>;
        }
    }

    public render() {
        return (
            <div style={{display:"flex", flexDirection:"row", maxWidth:"inherit"}}>
                <div style={{width:"25%"}}>
                    <Observer>
                        {this.controls}
                    </Observer>
                </div>
                <div style={{display:"flex", flexDirection:"column", width:"75%", maxHeight:700}}>
                    <div style={{display:"flex", flexDirection:"row"}}>
                        <div>
                            <div
                                className="rotateCCW90"
                            >
                                {this.vertLabel}
                                { (this.vertLabel !== this.vertDescription) && (
                                    <InfoIcon
                                        tooltip={<span>{this.vertDescription}</span>}
                                        style={{marginLeft:5}}
                                    />
                                )}
                            </div>
                        </div>
                        <div style={{overflow:"auto", maxHeight:"inherit"}}>
                            <Observer>
                                {this.plot}
                            </Observer>
                        </div>
                    </div>
                    <div style={{height:"10%", alignSelf:"center"}}>
                        {this.horzLabel}
                        { (this.horzLabel !== this.horzDescription) && (
                            <InfoIcon
                                tooltip={<span>{this.horzDescription}</span>}
                                style={{marginLeft:5}}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }
}