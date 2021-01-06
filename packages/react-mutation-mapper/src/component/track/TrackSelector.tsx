import autobind from 'autobind-decorator';
import * as React from 'react';
import { action, computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';

import { CheckedSelect, Option } from 'cbioportal-frontend-commons';

export type TrackVisibility = { [trackName: string]: 'visible' | 'hidden' };
export type TrackDataStatus = {
    [trackName: string]: 'pending' | 'error' | 'complete' | 'empty';
};

export enum TrackName {
    PDB = 'PDB',
    CancerHotspots = 'CANCER_HOTSPOTS',
    OncoKB = 'ONCO_KB',
    PTM = 'PTM',
}

type TrackSelectorProps = {
    tracks?: TrackName[];
    trackVisibility: TrackVisibility;
    trackDataStatus?: TrackDataStatus;
    onChange: (selectedTrackIds: string[]) => void;
    name?: string;
    placeholder?: string;
};

@observer
export default class TrackSelector extends React.Component<
    TrackSelectorProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    public static defaultProps: Partial<TrackSelectorProps> = {
        name: 'mutationMapperTrackSelector',
        placeholder: 'Add annotation tracks',
        tracks: [
            TrackName.CancerHotspots,
            TrackName.OncoKB,
            TrackName.PTM,
            TrackName.PDB,
        ],
    };

    @action.bound
    private onChange(values: { value: string }[]) {
        this.props.onChange(values.map(o => o.value));
    }

    @computed get selectedValues() {
        return Object.keys(this.props.trackVisibility)
            .filter(id => this.props.trackVisibility[id] === 'visible')
            .map(id => ({ value: id }));
    }

    @computed get availableOptions() {
        return {
            [TrackName.CancerHotspots]: {
                label: (
                    <span>
                        Cancer Hotspots
                        {this.isPending(TrackName.CancerHotspots) &&
                            this.loaderIcon()}
                    </span>
                ),
                value: TrackName.CancerHotspots,
            },
            [TrackName.OncoKB]: {
                label: (
                    <span>
                        OncoKB
                        {this.isPending(TrackName.OncoKB) && this.loaderIcon()}
                    </span>
                ),
                value: TrackName.OncoKB,
            },
            [TrackName.PTM]: {
                label: (
                    <span>
                        Post Translational Modifications
                        {this.isPending(TrackName.PTM) && this.loaderIcon()}
                    </span>
                ),
                value: TrackName.PTM,
            },
            [TrackName.PDB]: {
                label: (
                    <span>
                        3D Structure
                        {this.isPending(TrackName.PDB) && this.loaderIcon()}
                    </span>
                ),
                value: TrackName.PDB,
                disabled: this.isDisabled(TrackName.PDB),
            },
        };
    }

    @computed get options(): Option[] {
        return this.props
            .tracks!.filter(t => this.props.trackVisibility[t] !== undefined)
            .map(t => this.availableOptions[t]);
    }

    private isPending(trackName: string) {
        return (
            this.props.trackDataStatus &&
            this.props.trackDataStatus[trackName] === 'pending'
        );
    }

    private isDisabled(trackName: string) {
        return (
            this.props.trackDataStatus &&
            this.props.trackDataStatus[trackName] !== 'complete'
        );
    }

    private loaderIcon() {
        return (
            <span
                style={{
                    display: 'inline-block',
                    verticalAlign: 'bottom',
                    marginLeft: 5,
                }}
            >
                <i className="fa fa-spinner fa-pulse" />
            </span>
        );
    }

    public render() {
        return (
            <CheckedSelect
                name={this.props.name}
                placeholder={this.props.placeholder}
                onChange={this.onChange}
                options={this.options}
                value={this.selectedValues}
            />
        );
    }
}
