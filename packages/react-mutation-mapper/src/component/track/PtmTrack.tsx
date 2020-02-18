import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { action, computed, observable } from 'mobx';
import { Collapse } from 'react-collapse';
import autobind from 'autobind-decorator';
import { DefaultTooltip, EllipsisTextTooltip } from 'cbioportal-frontend-commons';

import { MobxCache } from '../../model/MobxCache';
import MutationMapperStore from '../../model/MutationMapperStore';
import { compareByPtmTypePriority, ptmColor } from '../../util/PtmUtils';
import PtmAnnotationTable from '../ptm/PtmAnnotationTable';
import { PostTranslationalModification } from '../../model/PostTranslationalModification';
import { default as Track, TrackProps } from './Track';
import { TrackItemSpec } from './TrackCircle';

import styles from './ptmTrackStyles.module.scss';

type PtmTrackProps = TrackProps & {
    store: MutationMapperStore;
    pubMedCache?: MobxCache;
    ensemblTranscriptId?: string;
    subTrackMargin?: number;
};

export function ptmTooltip(ptms: PostTranslationalModification[], pubMedCache?: MobxCache) {
    return <PtmAnnotationTable data={ptms} pubMedCache={pubMedCache} />;
}

export function ptmInfoTooltip(transcriptId?: string) {
    return (
        <div style={{ maxWidth: 400 }}>
            <p>
                Displays all Post Translational Modifications (PTMs) available
                {transcriptId && <span> for the Ensembl transcript {transcriptId}</span>}.
            </p>
            <p className={styles.ptmLegend}>
                PTM types and corresponding color codes are as follows:
                <ul>
                    <li className={styles.Phosphorylation}>
                        <strong>Phosphorylation</strong>
                    </li>
                    <li className={styles.Acetylation}>
                        <strong>Acetylation</strong>
                    </li>
                    <li className={styles.Ubiquitination}>
                        <strong>Ubiquitination</strong>
                    </li>
                    <li className={styles.Methylation}>
                        <strong>Methylation</strong>
                    </li>
                    <li className={styles.multiType}>
                        <strong>Multiple Type</strong>: Sites with more than one PTM type
                    </li>
                    <li className={styles.default}>
                        <strong>Other</strong>: All other PTM types
                    </li>
                </ul>
            </p>
            <div>
                Data Source:{' '}
                <a href="http://dbptm.mbc.nctu.edu.tw/" target="_blank">
                    dbPTM
                </a>
            </div>
        </div>
    );
}

const PTM_ID_CLASS_PREFIX = 'ptm-';

@observer
export default class PtmTrack extends React.Component<PtmTrackProps, {}> {
    public static defaultProps = {
        subTrackMargin: 25,
    };

    @observable
    private expanded = true;

    @computed get ptmSpecs(): TrackItemSpec[] {
        const ptmDataByProteinPosStart = this.props.store.ptmDataByProteinPosStart.result;

        if (ptmDataByProteinPosStart && !_.isEmpty(ptmDataByProteinPosStart)) {
            return _.keys(ptmDataByProteinPosStart)
                .filter(position => Number(position) >= 0)
                .map(position => ({
                    codon: Number(position),
                    color: ptmColor(ptmDataByProteinPosStart[Number(position)]),
                    tooltip: ptmTooltip(
                        ptmDataByProteinPosStart[Number(position)],
                        this.props.pubMedCache
                    ),
                }));
        } else {
            return [];
        }
    }

    @computed get ptmSubSpecs(): { title: string; specs: TrackItemSpec[] }[] {
        const ptmDataByTypeAndProteinPosStart = this.props.store.ptmDataByTypeAndProteinPosStart
            .result;

        if (ptmDataByTypeAndProteinPosStart && !_.isEmpty(ptmDataByTypeAndProteinPosStart)) {
            return _.keys(ptmDataByTypeAndProteinPosStart)
                .sort(compareByPtmTypePriority)
                .map(type => ({
                    title: type,
                    specs: _.keys(ptmDataByTypeAndProteinPosStart[type])
                        .filter(position => Number(position) >= 0)
                        .map(position => ({
                            codon: Number(position),
                            color: ptmColor(
                                ptmDataByTypeAndProteinPosStart[type][Number(position)]
                            ),
                            tooltip: ptmTooltip(
                                ptmDataByTypeAndProteinPosStart[type][Number(position)],
                                this.props.pubMedCache
                            ),
                        })),
                }));
        } else {
            return [];
        }
    }

    @computed get mainTrackTitle() {
        return (
            <span style={{ cursor: 'pointer' }}>
                <span onClick={this.handleToggleExpand}>{this.expander}</span>
                <DefaultTooltip
                    placement="left"
                    overlay={() => ptmInfoTooltip(this.props.ensemblTranscriptId)}
                    destroyTooltipOnHide={true}
                >
                    <span style={{ marginLeft: 4 }} onClick={this.handleToggleExpand}>
                        PTM Sites <i className="fa fa-info-circle" />
                    </span>
                </DefaultTooltip>
            </span>
        );
    }

    @computed get expander(): JSX.Element | null {
        const className = this.hasSubTracks
            ? this.mainTrackHidden
                ? 'fa fa-caret-down'
                : 'fa fa-caret-right'
            : null;

        if (className) {
            return <i className={className} style={{ width: 10, marginLeft: 2 }} />;
        }

        return null;
    }

    @computed get subTrackMargin() {
        return this.props.subTrackMargin || PtmTrack.defaultProps.subTrackMargin;
    }

    @computed get subTrackTitleWidth() {
        return this.props.xOffset ? this.props.xOffset - this.subTrackMargin : 0;
    }

    @computed get subTracks() {
        return this.hasSubTracks
            ? this.ptmSubSpecs.map((item, index) => (
                  <Track
                      key={item.title}
                      dataStore={this.props.dataStore}
                      xOffset={this.props.xOffset}
                      trackTitle={
                          <span
                              style={{
                                  marginLeft: this.subTrackMargin,
                                  width: this.subTrackTitleWidth,
                                  display: 'flex',
                              }}
                          >
                              <EllipsisTextTooltip
                                  text={item.title}
                                  style={{
                                      overflow: 'hidden',
                                      whiteSpace: 'nowrap',
                                      textOverflow: 'ellipsis',
                                  }}
                              />
                          </span>
                      }
                      width={this.props.width}
                      proteinLength={this.props.proteinLength}
                      trackItems={item.specs}
                      idClassPrefix={`${PTM_ID_CLASS_PREFIX}${index}-`}
                  />
              ))
            : null;
    }

    @computed get mainTrackHidden() {
        return this.expanded && this.hasSubTracks;
    }

    @computed get hasSubTracks() {
        return this.ptmSubSpecs.length > 0;
    }

    public render() {
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
