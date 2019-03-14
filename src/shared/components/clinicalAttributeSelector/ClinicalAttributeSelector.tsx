import * as React from "react";
import {observer} from "mobx-react";
import {SpecialAttribute} from "../../cache/ClinicalDataCache";
import {computed, observable} from "mobx";
import {remoteData} from "../../api/remoteData";
import _ from "lodash";
import {ClinicalAttribute} from "../../api/generated/CBioPortalAPI";
import {getPercentage} from "../../lib/FormatUtils";
import {ResultsViewPageStore} from "../../../pages/resultsView/ResultsViewPageStore";
import ReactSelect from "react-select2";
import autobind from "autobind-decorator";
import {ExtendedClinicalAttribute} from "../../../pages/resultsView/ResultsViewPageStoreUtils";

const CheckedSelect = require("react-select-checked").CheckedSelect;

export interface IClinicalAttributeSelectorProps {
    store:ResultsViewPageStore;
    selectedClinicalAttributeIds:(string|SpecialAttribute)[];
    onChange:(selectedAttributeIds:(string|SpecialAttribute)[])=>void;
    name?:string;
}

type Option = { label:string, value:string };

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
            return Promise.resolve(_.reduce(this.sortedClinicalAttributes.result!, (options:{label:string, value:string}[], next:ExtendedClinicalAttribute)=>{
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

    @computed get valueMap() {
        return _.keyBy(this.value, v=>v.value);
    }

    @computed get onChange() {
        return (values:{value:string|SpecialAttribute}[])=>{
            this.props.onChange(values.map(o=>o.value));
        };
    }

    @autobind private onFocus() {
        this.focused = true;
    }

    @autobind private getOptionLabel(option:Option) {
        let box = "";
        if (option.value in this.valueMap) {
            box = String.fromCodePoint(9745); // checked box
        } else {
            box = String.fromCodePoint(9744); // empty box
        }
        return `${box} ${option.label}`;
    }

    render() {
        let disabled:boolean, placeholder:string, options:any[];
        if (this.focused) {
            switch (this.options.status) {
                case "pending":
                    disabled = false;
                    placeholder = "Downloading...";
                    options = [];
                    break;
                case "error":
                    disabled = true;
                    placeholder = "Error";
                    options = [];
                    break;
                default:
                    // complete
                    disabled = false;
                    placeholder = "Add clinical tracks";
                    options = this.options.result!;
            }
        } else {
            // not loading yet - only load on click
            disabled = false;
            placeholder = "Add clinical tracks";
            options = [];
        }

        return (
            <span onFocus={this.onFocus}>
                <ReactSelect
                    styles={{
                        control: (provided:any)=>({
                            ...provided,
                            height:33.5,
                            minHeight:33.5,
                            border: "1px solid rgb(204,204,204)"
                        }),
                        menu: (provided:any)=>({
                            ...provided,
                            maxHeight: 400
                        }),
                        menuList: (provided:any)=>({
                            ...provided,
                            maxHeight:400
                        }),
                        placeholder:(provided:any)=>({
                            ...provided,
                            color: "#000000"
                        }),
                        dropdownIndicator:(provided:any)=>({
                            ...provided,
                            color:"#000000"
                        }),
                        option:(provided:any)=>({
                            ...provided,
                            cursor:"pointer"
                        })
                    }}
                    name={this.props.name}
                    isDisabled={disabled}
                    isClearable={false}
                    isSearchable={true}
                    placeholder={placeholder}
                    getOptionLabel={this.getOptionLabel}
                    hideSelectedOptions={false}
                    onChange={this.onChange}
                    options={options}
                    value={this.value}
                    labelKey="label"
                    isMulti={true}
                    controlShouldRenderValue={false}
                />
            </span>
        );
    }
}