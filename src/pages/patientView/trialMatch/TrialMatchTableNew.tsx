import * as React from 'react';
import { If, Then, Else } from 'react-if';
import { observer } from 'mobx-react';
import _ from 'lodash';
import { ITrialMatch } from '../../../shared/model/MatchMiner';
import styles from './style/trialMatch.module.scss';
import { action, computed, makeObservable, observable } from 'mobx';
import LazyMobXTable from '../../../shared/components/lazyMobXTable/LazyMobXTable';
import SampleManager from '../SampleManager';

export type ITrialMatchNewProps = {
    sampleManager: SampleManager | null;
    trialMatches: ITrialMatch[];
    containerWidth: number;
};

export type ISelectedTrialFeedbackFormData = {
    nctId: string;
    protocolNo: string;
};

enum ColumnKey {
    TITLE = 'Trial',
    ARM = 'Arm',
    GENE = 'Gene',
    MATCHTYPE = 'Match Type',
    MATCHING_CRITERIA = 'Matching Criteria',
    STATUS = 'Status',
}

enum ColumnWidth {
    STATUS = 140,
}

enum AlterationType {
    MUTATION = 'Mutation',
    CNA = 'Copy Number Alteration',
    MSI = 'Microsatellite Instability',
    WILDTYPE = 'Wildtype',
}

class TrialMatchNewTableComponent extends LazyMobXTable<ITrialMatch> {}

@observer
export default class TrialMatchTableNew extends React.Component<
    ITrialMatchNewProps
> {
    constructor(props: ITrialMatchNewProps) {
        super(props);
        makeObservable(this);
    }

    @computed
    get columnWidths() {
        return {
            [ColumnKey.STATUS]: ColumnWidth.STATUS,
            [ColumnKey.TITLE]:
                0.3 * (this.props.containerWidth - ColumnWidth.STATUS),
            [ColumnKey.ARM]:
                0.1 * (this.props.containerWidth - ColumnWidth.STATUS),
            [ColumnKey.GENE]:
                0.1 * (this.props.containerWidth - ColumnWidth.STATUS),
            [ColumnKey.MATCHTYPE]:
                0.1 * (this.props.containerWidth - ColumnWidth.STATUS),
            [ColumnKey.MATCHING_CRITERIA]:
                0.4 * (this.props.containerWidth - ColumnWidth.STATUS),
        };
    }

    private _columns = [
        {
            name: ColumnKey.TITLE,
            render: (trialmatch: ITrialMatch) => (
                <div>
                    <If condition={trialmatch.protocolNo.length > 0}>
                        <div>{trialmatch.protocolNo}</div>
                    </If>

                    <If condition={trialmatch.nctId.length > 0}>
                        <div>
                            <a
                                target="_blank"
                                href={
                                    'https://clinicaltrials.gov/ct2/show/' +
                                    trialmatch.nctId
                                }
                            >
                                {trialmatch.nctId}
                            </a>
                        </div>
                    </If>
                    <div>{trialmatch.shortTitle}</div>
                </div>
            ),
            sortBy: (trialmatch: ITrialMatch) => trialmatch.shortTitle,
            width: this.columnWidths[ColumnKey.TITLE],
        },
        {
            name: ColumnKey.ARM,
            render: (trialmatch: ITrialMatch) => (
                <div>
                    <div>{trialmatch.armDescription}</div>
                </div>
            ),
            sortBy: (trialmatch: ITrialMatch) => trialmatch.armDescription,
            width: this.columnWidths[ColumnKey.ARM],
        },
        {
            name: ColumnKey.GENE,
            render: (trialmatch: ITrialMatch) => (
                <div>
                    <div>{trialmatch.trueHugoSymbol}</div>
                </div>
            ),
            sortBy: (trialmatch: ITrialMatch) => trialmatch.trueHugoSymbol,
            width: this.columnWidths[ColumnKey.GENE],
        },
        {
            name: ColumnKey.MATCHTYPE,
            render: (trialmatch: ITrialMatch) => (
                <div>
                    <div>{trialmatch.matchType}</div>
                </div>
            ),
            sortBy: (trialmatch: ITrialMatch) => trialmatch.matchType,
            width: this.columnWidths[ColumnKey.MATCHTYPE],
        },
        {
            name: ColumnKey.MATCHING_CRITERIA,
            render: (trialmatch: ITrialMatch) => (
                <div>
                    genomicAlteration:
                    <div>&nbsp;{trialmatch.genomicAlteration}</div>
                    <br />
                    oncotreePrimaryDiagnosisName:
                    <div>&nbsp;{trialmatch.oncotreePrimaryDiagnosisName}</div>
                    <br />
                    trialOncotreePrimaryDiagnosis:
                    <div>&nbsp;{trialmatch.trialOncotreePrimaryDiagnosis}</div>
                    <br />
                    trueProteinChange:
                    <div>&nbsp;{trialmatch.trueProteinChange}</div>
                    <br />
                </div>
            ),
            sortBy: (trialmatch: ITrialMatch) => trialmatch.genomicAlteration,
            width: this.columnWidths[ColumnKey.MATCHING_CRITERIA],
        },
        {
            name: ColumnKey.STATUS,
            render: (trialmatch: ITrialMatch) => (
                <div className={styles.statusContainer}>
                    <span className={styles.statusBackground}>
                        {trialmatch.status}
                    </span>
                </div>
            ),
            sortBy: (trialmatch: ITrialMatch) => trialmatch.status,
            width: this.columnWidths[ColumnKey.STATUS],
        },
    ];

    render() {
        return (
            <div>
                <TrialMatchNewTableComponent
                    data={this.props.trialMatches}
                    columns={this._columns}
                    showCopyDownload={false}
                />
                <div className={styles.powered}>
                    Powered by{' '}
                    <a href="https://oncokb.org/" target="_blank">
                        OncoKB
                    </a>{' '}
                    &{' '}
                    <a href="https://matchminer.org/" target="_blank">
                        MatchMiner
                    </a>
                </div>
            </div>
        );
    }
}
