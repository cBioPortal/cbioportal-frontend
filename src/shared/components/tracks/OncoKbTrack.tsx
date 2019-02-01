import * as React from "react";
import {observer} from "mobx-react";
import {computed} from "mobx";

import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {IOncoKbData} from "shared/model/OncoKB";
import {defaultOncoKbIndicatorFilter, getIndicatorData} from "shared/lib/OncoKbUtils";
import {default as Track, TrackProps} from "./Track";

type OncoKbTrackProps = TrackProps & {
    oncoKbData?: IOncoKbData;
};

const ONCOKB_ID_CLASS_PREFIX = "onco-kb-";

export function getOncoKbImage() {
    const oncoKbImgSrc = require("../annotation/images/oncogenic-only.svg");

    return <img src={oncoKbImgSrc} alt='OncoKB' />;
}

function defaultFilter(d: Mutation[], oncoKbData?: IOncoKbData): boolean
{
    let filter = true;

    if (oncoKbData) {
        const indicatorData = getIndicatorData(d[0], oncoKbData);
        filter = indicatorData ? defaultOncoKbIndicatorFilter(indicatorData) : false;
    }

    return filter;
}

@observer
export default class OncoKbTrack extends React.Component<OncoKbTrackProps, {}>
{
    constructor(props: OncoKbTrackProps) {
        super(props);
    }

    @computed get trackTitle() {
        return (
            <span>
                <span style={{marginRight: 2}}>
                    {getOncoKbImage()}
                </span>
                OncoKB
            </span>
        );
    }

    public render()
    {
        return (
            <Track
                dataStore={this.props.dataStore}
                width={this.props.width}
                xOffset={this.props.xOffset}
                proteinLength={this.props.proteinLength}
                trackTitle={this.trackTitle}
                trackItems={this.props.trackItems}
                dataHighlightFilter={(d: Mutation[]) => defaultFilter(d, this.props.oncoKbData)}
                dataSelectFilter={(d: Mutation[]) => defaultFilter(d, this.props.oncoKbData)}
                idClassPrefix={ONCOKB_ID_CLASS_PREFIX}
            />
        );
    }
}