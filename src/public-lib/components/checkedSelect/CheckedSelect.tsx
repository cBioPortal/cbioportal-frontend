import * as React from "react";
import * as _ from "lodash";
import ReactSelect from "react-select2";
import autobind from "autobind-decorator";
import {computed} from "mobx";
import {observer} from "mobx-react";

import './checkedSelect.scss';

export type Option = {
    value: string;
    label: string | JSX.Element;
    disabled?: boolean;
};

type CheckedSelectProps = {
    name?: string;
    onChange: (values: {value: string}[]) => void;
    value: {value: string}[];
    options: Option[];
    placeholder?: string | JSX.Element;
    isClearable?: boolean;
    isDisabled?: boolean;
    onAddAll?: () => void;
    onClearAll?: () => void;
    isAddAllDisabled?: boolean;
    addAllLabel?: string | JSX.Element;
};

@observer
export default class CheckedSelect extends React.Component<CheckedSelectProps, {}>
{
    public static defaultProps: Partial<CheckedSelectProps> = {
        isClearable: false,
        isDisabled: false,
        isAddAllDisabled: false
    };

    @computed
    get valueMap() {
        return _.keyBy(this.props.value, v => v.value);
    }

    @computed
    get addAllLabel() {
        if (this.props.addAllLabel) {
            return this.props.addAllLabel;
        }
        else {
            return `Add all (${this.props.options.length})`;
        }
    }

    @autobind
    private defaultOnAddAll() {
        this.props.onChange(this.props.options);
    }

    @autobind
    private defaultOnClearAll() {
        this.props.onChange([]);
    }

    @autobind
    private getOptionLabel(option: Option): JSX.Element
    {
        let box = "";

        if (option.value in this.valueMap) {
            box = String.fromCodePoint(9745); // checked box
        } else {
            box = String.fromCodePoint(9744); // empty box
        }

        return <span>{box} {option.label}</span>;
    }

    @autobind
    private buttonsSection() {
        return (
            <div style={{
                marginTop:-7,
                paddingBottom:5,
                display:"flex",
                justifyContent:"center",
                alignItems:"center",
                borderBottom:"1px solid #ccc"
            }}>
                <button
                    className="btn btn-sm btn-default"
                    onClick={this.props.onAddAll || this.defaultOnAddAll}
                    style={{marginRight:5}}
                    disabled={this.props.isAddAllDisabled}
                >
                    {this.addAllLabel}
                </button>
                <button
                    className="btn btn-sm btn-default"
                    disabled={this.props.value.length === 0}
                    onClick={this.props.onClearAll || this.defaultOnClearAll}
                >
                    Clear
                </button>
            </div>
        );
    }

    public render() {
        return (
            <div className="default-checked-select">
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
                        option:(provided:any, state:any)=>{
                            const ret:any = {
                                ...provided,
                                cursor:"pointer",
                                color:"black"
                            };
                            if (state.isSelected && !state.isFocused) {
                                ret.backgroundColor = state.theme.colors.primary25;
                            }
                            return ret;
                        }
                    }}
                    theme={(theme:any)=>({
                        ...theme,
                        colors: {
                            ...theme.colors,
                            primary: theme.colors.primary50
                        },
                    })}
                    components={{ GroupHeading: this.buttonsSection }}
                    name={this.props.name}
                    isMulti={true}
                    isClearable={this.props.isClearable}
                    isDisabled={this.props.isDisabled}
                    closeMenuOnSelect={false}
                    hideSelectedOptions={false}
                    controlShouldRenderValue={false}
                    placeholder={this.props.placeholder}
                    onChange={this.props.onChange}
                    options={[{
                        label:"dummy label, this is only here to create group so we can add the buttons section as the group label component",
                        options: this.props.options
                    }]}
                    getOptionLabel={this.getOptionLabel}
                    value={this.props.value}
                    labelKey="label"
                />
            </div>
        );
    }
}