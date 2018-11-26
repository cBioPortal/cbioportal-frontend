import * as React from "react";
import {observer} from "mobx-react";
import {MobxPromise} from "mobxpromise";
import {OncoprintClinicalAttribute} from "../oncoprint/ResultsViewOncoprint";
import {SpecialAttribute} from "../../cache/OncoprintClinicalDataCache";
import {computed, observable} from "mobx";
import {remoteData} from "../../api/remoteData";
import _ from "lodash";
import {ClinicalAttribute} from "../../api/generated/CBioPortalAPI";
import {getPercentage} from "../../lib/FormatUtils";
import {ResultsViewPageStore} from "../../../pages/resultsView/ResultsViewPageStore";
import {makeProfiledInClinicalAttributes} from "../oncoprint/ResultsViewOncoprintUtils";
const CheckedSelect = require("react-select-checked").CheckedSelect;
import ReactSelect from "react-select";
import autobind from "autobind-decorator";

export interface IClinicalAttributeSelectorProps {
    store:ResultsViewPageStore;
    selectedClinicalAttributeIds:(string|SpecialAttribute)[];
    onChange:(selectedAttributeIds:(string|SpecialAttribute)[])=>void;
    multiple?:boolean;
    name?:string;
}

@observer
export default class ClinicalAttributeSelector extends React.Component<IClinicalAttributeSelectorProps, {}> {

    @observable private focused = false;

    readonly sortedClinicalAttributes = remoteData({
        await: ()=>[
            this.props.store.clinicalAttributes,
            this.props.store.clinicalAttributeIdToAvailableSampleCount
        ],
        invoke:()=>{
            const availableSampleCount = this.props.store.clinicalAttributeIdToAvailableSampleCount.result!;
            return Promise.resolve(_.sortBy<ClinicalAttribute>(
                this.props.store.clinicalAttributes.result!,
                [   (x:ClinicalAttribute)=>{
                        if (x.clinicalAttributeId === SpecialAttribute.StudyOfOrigin) {
                            return 0;
                        } else if (x.clinicalAttributeId === SpecialAttribute.MutationSpectrum) {
                            return 1;
                        } else if (x.clinicalAttributeId.startsWith(SpecialAttribute.ProfiledInPrefix)) {
                            return 2;
                        } else {
                            return 3;
                        }
                    },
                    (x:ClinicalAttribute)=>{
                        let sampleCount = availableSampleCount[x.clinicalAttributeId];
                        if (sampleCount === undefined) {
                            sampleCount = 0;
                        }
                        return -sampleCount;
                    },
                    (x:ClinicalAttribute)=>-x.priority
                    ,
                    (x:ClinicalAttribute)=>x.displayName
                ]
            )); // sort server clinical attrs by predetermined order, then sample data availability, then priority, then display name
        }
    });

    readonly options = remoteData({
        await: ()=>[
            this.sortedClinicalAttributes,
            this.props.store.clinicalAttributeIdToAvailableSampleCount,
            this.props.store.samples
        ],
        invoke: ()=>{
            const totalSampleCount = this.props.store.samples.result!.length;
            const clinicalAttributeIdToAvailableSampleCount = this.props.store.clinicalAttributeIdToAvailableSampleCount.result!;
            return Promise.resolve(_.reduce(this.sortedClinicalAttributes.result!, (options:{label:string, value:string}[], next:OncoprintClinicalAttribute)=>{
                let sampleCount = clinicalAttributeIdToAvailableSampleCount[next.clinicalAttributeId];
                if (sampleCount === undefined && next.clinicalAttributeId.startsWith(SpecialAttribute.ProfiledInPrefix)) {
                    // for 'Profiled In' tracks, we have data for all the samples - gene panel data
                    // but these tracks have special, locally-constructed clinical attribute ids, and aren't placed in that map.
                    // TODO: maybe they should be?
                    sampleCount = totalSampleCount;
                }
                const newOption = {
                    label: `${next.displayName} (${getPercentage(sampleCount/totalSampleCount, 0)})`,
                    value: next.clinicalAttributeId,
                    disabled: false
                };
                if (sampleCount === 0) {
                    newOption.disabled = true;
                }
                options.push(newOption);
                return options;
            }, []));
        }
    });

    @computed get value() {
        return this.props.selectedClinicalAttributeIds.map(x=>({value:x}));
    }

    @computed get onChangeMultiple() {
        return (values:{value:string|SpecialAttribute}[])=>{
            this.props.onChange(values.map(o=>o.value));
        };
    }

    @computed get onChangeSingle() {
        return (option:any|null)=>{
            if (option !== null) {
                this.props.onChange([option.value]);
            }
        };
    }

    @autobind private onFocus() {
        this.focused = true;
    }

    render() {
        let disabled:boolean, placeholder:string, options:any[];
        if (this.focused) {
            switch (this.options.status) {
                case "pending":
                    disabled = false;
                    placeholder = "Downloading clinical tracks...";
                    options = [];
                    break;
                case "error":
                    disabled = true;
                    placeholder = "Error downloading clinical tracks.";
                    options = [];
                    break;
                default:
                    // complete
                    disabled = false;
                    placeholder = "Add clinical tracks..";
                    options = this.options.result!;
            }
        } else {
            // not loading yet - only load on click
            disabled = false;
            placeholder = "Add clinical tracks..";
            options = [];
        }

        let selectElt:any = null;
        if (this.props.multiple) {
            selectElt = (
                <CheckedSelect
                    name={this.props.name}
                    disabled={disabled}
                    placeholder={placeholder}
                    onChange={this.onChangeMultiple}
                    options={options}
                    value={this.value}
                    labelKey="label"
                />
            );
        } else {
            selectElt = (
                <ReactSelect
                    name={this.props.name}
                    disabled={disabled}
                    placeholder={placeholder}
                    onChange={this.onChangeSingle}
                    options={options}
                    clearable={false}
                    searchable={true}
                    value={this.value}
                />
            );
        }

        return (
            <span onFocus={this.onFocus}>
                {selectElt}
            </span>
        );
    }
}