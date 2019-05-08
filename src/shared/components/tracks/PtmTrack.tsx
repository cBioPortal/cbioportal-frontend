import * as React from "react";
import * as _ from "lodash";
import {observer} from "mobx-react";
import {action, computed, observable} from "mobx";
import Collapse from 'react-collapse';
import autobind from "autobind-decorator";
import {PostTranslationalModification} from "shared/api/generated/GenomeNexusAPI";
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
import EllipsisTextTooltip from "shared/components/ellipsisTextTooltip/EllipsisTextTooltip";
import MutationMapperStore from "shared/components/mutationMapper/MutationMapperStore";
import {compareByPtmTypePriority, ptmColor} from "shared/lib/PtmUtils";
import PubMedCache from "shared/cache/PubMedCache";
import PtmAnnotationTable from "./PtmAnnotationTable";
import {default as Track, TrackProps} from "./Track";
import {TrackItemSpec} from "./TrackCircle";

import styles from "./ptmTrackStyles.module.scss";


type PtmTrackProps = TrackProps & {
    store: MutationMapperStore;
    pubMedCache?: PubMedCache;
    ensemblTranscriptId?: string;
    subTrackMargin?: number;
};

export function ptmTooltip(ptms: PostTranslationalModification[], pubMedCache?: PubMedCache)
{
    return <PtmAnnotationTable data={ptms} pubMedCache={pubMedCache}/>;
}

export function ptmInfoTooltip(transcriptId?: string)
{
    return (
        <div style={{maxWidth: 400}}>
            <p>
                Displays all Post Transactional Modifications (PTMs) available
                {transcriptId && <span> for the Ensembl transcript {transcriptId}</span>}.
            </p>
            <p className={styles.ptmLegend}>
                PTM types and corresponding color codes are as follows:
                <ul>
                    <li className={styles.Phosphorylation}>
                        <strong>
                            Phosphorylation
                        </strong>
                    </li>
                    <li className={styles.Acetylation}>
                        <strong>
                            Acetylation
                        </strong>
                    </li>
                    <li className={styles.Ubiquitination}>
                        <strong>
                            Ubiquitination
                        </strong>
                    </li>
                    <li className={styles.Methylation}>
                        <strong>
                            Methylation
                        </strong>
                    </li>
                    <li className={styles.multiType}>
                        <strong>
                            Multiple Type
                        </strong>
                        : Sites with more than one PTM type
                    </li>
                    <li className={styles.default}>
                        <strong>
                            Other
                        </strong>
                        : All other PTM types
                    </li>
                </ul>
            </p>
            <div>Data Source: <a href="http://dbptm.mbc.nctu.edu.tw/" target="_blank">dbPTM</a></div>
        </div>
    );
}

const PTM_ID_CLASS_PREFIX = "ptm-";

@observer
export default class PtmTrack extends React.Component<PtmTrackProps, {}>
{
    public static defaultProps = {
        subTrackMargin: 25
    };

    @observable
    private expanded = false;

    @computed get ptmSpecs(): TrackItemSpec[] {
        const ptmDataByProteinPosStart = this.props.store.ptmDataByProteinPosStart.result;

        if(!_.isEmpty(ptmDataByProteinPosStart)) {
            return _.keys(ptmDataByProteinPosStart)
                .filter(position => Number(position) >= 0)
                .map(position => ({
                    codon: Number(position),
                    color: ptmColor(ptmDataByProteinPosStart[Number(position)]),
                    tooltip: ptmTooltip(ptmDataByProteinPosStart[Number(position)], this.props.pubMedCache)
                }));
        }
        else {
            return [];
        }
    }

    @computed get ptmSubSpecs(): {title: string, specs: TrackItemSpec[]}[]
    {
        const ptmDataByTypeAndProteinPosStart = this.props.store.ptmDataByTypeAndProteinPosStart.result;

        if(!_.isEmpty(ptmDataByTypeAndProteinPosStart)) {
            return _.keys(ptmDataByTypeAndProteinPosStart)
                .sort(compareByPtmTypePriority)
                .map(type => ({
                    title: type,
                    specs: _.keys(ptmDataByTypeAndProteinPosStart[type])
                        .filter(position => Number(position) >= 0)
                        .map(position => ({
                            codon: Number(position),
                            color: ptmColor(ptmDataByTypeAndProteinPosStart[type][Number(position)]),
                            tooltip: ptmTooltip(ptmDataByTypeAndProteinPosStart[type][Number(position)],
                                this.props.pubMedCache)
                        }))
                }));
        }
        else {
            return [];
        }
    }

    @computed get mainTrackTitle() {
        return (
            <span
                style={{cursor: "pointer"}}
                onClick={this.handleToggleExpand}
            >
                {this.expander}
                <DefaultTooltip
                    placement="left"
                    overlay={() => ptmInfoTooltip(this.props.ensemblTranscriptId)}
                    destroyTooltipOnHide={true}
                >
                    <span style={{marginLeft: 4}}>
                        PTM Sites <i className="fa fa-info-circle" />
                    </span>
                </DefaultTooltip>
            </span>
        );
    }

    @computed get expander(): JSX.Element | null
    {
        const className = this.hasSubTracks ?
            (this.mainTrackHidden ? "fa fa-caret-down" : "fa fa-caret-right") : null;

        if (className) {
            return <i className={className} style={{width: 10, marginLeft: 2}}/>;
        }

        return null;
    }

    @computed get subTrackMargin() {
        return this.props.subTrackMargin || PtmTrack.defaultProps.subTrackMargin;
    }

    @computed get subTrackTitleWidth() {
        return this.props.xOffset ? this.props.xOffset - this.subTrackMargin : 0;
    }

    @computed get subTracks()
    {
        return (
            this.hasSubTracks ?
                this.ptmSubSpecs.map((item, index) => (
                    <Track
                        dataStore={this.props.dataStore}
                        xOffset={this.props.xOffset}
                        trackTitle={
                            <span style={{marginLeft: this.subTrackMargin, width: this.subTrackTitleWidth, display: "flex"}}>
                                <EllipsisTextTooltip text={item.title} />
                            </span>
                        }
                        width={this.props.width}
                        proteinLength={this.props.proteinLength}
                        trackItems={item.specs}
                        idClassPrefix={`${PTM_ID_CLASS_PREFIX}-${index}`}
                    />
                )): null
        );
    }

    @computed get mainTrackHidden() {
        return this.expanded && this.hasSubTracks;
    }

    @computed get hasSubTracks() {
        return this.ptmSubSpecs.length > 0;
    }

    public render()
    {
        return (
            <span>
                <Track
                    dataStore={this.props.dataStore}
                    width={this.props.width}
                    xOffset={this.props.xOffset}
                    proteinLength={this.props.proteinLength}
                    trackTitle={this.mainTrackTitle}
                    trackItems={this.mainTrackHidden ? [] : this.ptmSpecs}
                    hideBaseline={this.mainTrackHidden}
                    idClassPrefix={PTM_ID_CLASS_PREFIX}
                />
                <Collapse isOpened={this.mainTrackHidden}>
                    <span>{this.subTracks}</span>
                </Collapse>
            </span>
        );
    }

    @autobind
    @action
    private handleToggleExpand() {
        this.expanded = !this.expanded;
    }
}
