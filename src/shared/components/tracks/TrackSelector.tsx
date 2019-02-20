import * as React from "react";
import {computed} from "mobx";
import {observer} from "mobx-react";
const CheckedSelect = require("react-select-checked").CheckedSelect;

import {loaderIcon} from "../annotation/StatusHelpers";

export type TrackVisibility = {[trackName: string]: 'visible' | 'hidden'};
export type TrackDataStatus = {[trackName: string]: 'pending' | 'error' | 'complete' | 'empty'}

export enum TrackNames {
    PDB = "PDB",
    CancerHotspots = "CANCER_HOTSPOTS",
    OncoKB = "ONCO_KB"
}

interface ITrackSelectorProps {
    trackVisibility: TrackVisibility;
    trackDataStatus?: TrackDataStatus;
    onChange: (selectedTrackIds: string[]) => void;
    name?: string;
    placeholder?: string;
}

@observer
export default class TrackSelector extends React.Component<ITrackSelectorProps, {}>
{

    public static defaultProps:Partial<ITrackSelectorProps> = {
        name: "mutationMapperTrackSelector",
        placeholder: "Add annotation tracks"
    };

    @computed get onChange() {
        return (values: {value:string}[]) => {
            this.props.onChange(values.map(o => o.value));
        };
    }

    @computed get selectedValues() {
        return Object.keys(this.props.trackVisibility)
            .filter(id => this.props.trackVisibility[id] === 'visible')
            .map(id => ({value: id}));
    }

    @computed get options() {
        return [
            {
                label: (
                    <span>
                        Cancer Hotspots
                        {this.isPending(TrackNames.CancerHotspots) && this.loaderIcon()}
                    </span>
                ),
                value: TrackNames.CancerHotspots
            },
            {
                label: (
                    <span>
                        OncoKB
                        {this.isPending(TrackNames.OncoKB) && this.loaderIcon()}
                    </span>
                ),
                value: TrackNames.OncoKB
            },
            {
                label: (
                    <span>
                        3D Structure
                        {this.isPending(TrackNames.PDB) && this.loaderIcon()}
                    </span>
                ),
                value: TrackNames.PDB,
                disabled: this.isDisabled(TrackNames.PDB)
            }
        ];
    }

    private isPending(trackName: string) {
        return this.props.trackDataStatus && this.props.trackDataStatus[trackName] === 'pending';
    }

    private isDisabled(trackName: string) {
        return this.props.trackDataStatus && this.props.trackDataStatus[trackName] !== 'complete';
    }

    private loaderIcon()
    {
        return (
            <span
                style={{
                    display: "inline-block",
                    verticalAlign: "bottom",
                    marginLeft: 5,
                }}
            >
                {loaderIcon()}
            </span>
        );
    }

    public render()
    {
        return (
            <CheckedSelect
                name={this.props.name}
                placeholder={this.props.placeholder}
                onChange={this.onChange}
                options={this.options}
                value={this.selectedValues}
                labelKey="label"
            />
        );
    }
}
