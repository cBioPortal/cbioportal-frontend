import * as React from "react";
import {action, computed, observable} from "mobx";
import {Observer, observer} from "mobx-react";
import "./styles.scss";
import {ResultsViewPageStore} from "../ResultsViewPageStore";
import {FormControl} from "react-bootstrap";
import LockIcon from "../../../shared/components/LockIcon";
import ReactSelect from "react-select";
import _ from "lodash";
import {molecularProfileTypeDisplayOrder, molecularProfileTypeToDisplayType} from "./PlotsTabUtils";
import {MolecularProfile} from "../../../shared/api/generated/CBioPortalAPI";
import Timer = NodeJS.Timer;

enum EventKey {
    horz_geneticProfile,
    horz_clinicalAttribute,
    horz_logScale,

    vert_geneticProfile,
    vert_clinicalAttribute,
    vert_logScale,

    utilities_viewMutationType,
    utilities_viewCopyNumber,

    downloadSVG,
    downloadPDF,
    downloadData
}

enum AxisType {
    geneticProfile,
    clinicalAttribute
}

enum ViewType {
    MutationType,
    CopyNumber
}

type AxisMenuSelection = {
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
                    return AxisType.geneticProfile;
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
            _axisType: AxisType.geneticProfile,
            _entrezGeneId: undefined,
            _molecularProfileType: undefined,
            _molecularProfileId: undefined,
            _clinicalAttributeId: undefined,
            logScale: false
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
            case EventKey.horz_geneticProfile:
                this.horzSelection.axisType = AxisType.geneticProfile;
                break;
            case EventKey.horz_clinicalAttribute:
                this.horzSelection.axisType = AxisType.clinicalAttribute;
                break;
            case EventKey.vert_geneticProfile:
                this.vertSelection.axisType = AxisType.geneticProfile;
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

    private getAxisMenu(vertical:boolean) {
        return (
            <div>
                <h4>{vertical ? "Vertical" : "Horizontal"} Axis</h4>
                <div>
                    <div className="radio"><label>
                        <input
                            type="radio"
                            name={vertical ? "vert_geneticProfile" : "horz_geneticProfile"}
                            value={vertical ? EventKey.vert_geneticProfile : EventKey.horz_geneticProfile}
                            checked={(vertical ? this.vertSelection.axisType: this.horzSelection.axisType) === AxisType.geneticProfile}
                            onClick={this.onInputClick}
                        /> Genetic Profile
                    </label></div>
                    <div className="radio"><label>
                        <input
                            type="radio"
                            name={vertical ? "vert_clinicalAttribute" : "horz_clinicalAttribute"}
                            value={vertical ? EventKey.vert_clinicalAttribute : EventKey.horz_clinicalAttribute}
                            checked={(vertical ? this.vertSelection.axisType: this.horzSelection.axisType) === AxisType.clinicalAttribute}
                            onClick={this.onInputClick}
                        /> Clinical Attribute
                    </label></div>
                </div>
                {((vertical ? this.vertSelection.axisType : this.horzSelection.axisType) === AxisType.geneticProfile) && (
                    <div>
                        <div>
                            Gene
                            <ReactSelect
                                name={`${vertical ? "v" : "h"}-gene-selector`}
                                value={vertical ? this.vertSelection.entrezGeneId : this.horzSelection.entrezGeneId}
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
                                value={vertical ? this.vertSelection.molecularProfileType : this.horzSelection.molecularProfileType}
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
                                value={vertical ? this.vertSelection.molecularProfileId : this.horzSelection.molecularProfileId}
                                onChange={vertical ? this.onVerticalAxisProfileIdSelect : this.onHorizontalAxisProfileIdSelect}
                                options={this.profileNameOptionsByType[(vertical ? this.vertSelection.molecularProfileType : this.horzSelection.molecularProfileType)+""] || []}
                                clearable={false}
                                searchable={false}
                            />
                        </div>
                        <div className="checkbox"><label>
                            <input
                                type="checkbox"
                                name={vertical ? "vert_logScale" : "vert_logScale"}
                                value={vertical ? EventKey.vert_logScale : EventKey.horz_logScale}
                                checked={vertical ? this.vertSelection.logScale: this.horzSelection.logScale}
                                onClick={this.onInputClick}
                            /> Apply Log Scale
                        </label></div>
                    </div>
                )}
                {((vertical ? this.vertSelection.axisType : this.horzSelection.axisType) === AxisType.clinicalAttribute) && (
                    <div>
                        Clinical Attribute
                        <ReactSelect
                            name={`${vertical ? "v" : "h"}-clinical-attribute-selector`}
                            value={vertical ? this.vertSelection.clinicalAttributeId : this.horzSelection.clinicalAttributeId}
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

    private get controls() {
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

    public render() {
        return (
            <div style={{display:"flex", flexDirection: "row"}}>
                <div id="plots-controls" style={{width:"30%"}}>
                    {this.controls}
                </div>
                <div id="plots-box" style={{width:"70%"}}>
                </div>
            </div>
        );
    }
}