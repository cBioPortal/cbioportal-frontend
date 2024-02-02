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
    PATIENT_MATCHDATA = 'Patient Matching Data',
    TRIAL_MATCHING_CRITERIA = 'Trial Matching Criteria',
    STATUS = 'Trial Status',
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
                0.2 * (this.props.containerWidth - ColumnWidth.STATUS),
            [ColumnKey.ARM]:
                0.2 * (this.props.containerWidth - ColumnWidth.STATUS),
            [ColumnKey.GENE]:
                0.05 * (this.props.containerWidth - ColumnWidth.STATUS),
            [ColumnKey.PATIENT_MATCHDATA]:
                0.25 * (this.props.containerWidth - ColumnWidth.STATUS),
            [ColumnKey.TRIAL_MATCHING_CRITERIA]:
                0.3 * (this.props.containerWidth - ColumnWidth.STATUS),
        };
    }

    private _columns = [
        {
            name: ColumnKey.TITLE,
            render: (trialmatch: ITrialMatch) => (
                <div>
                    <If condition={trialmatch.protocolNo.length > 0}>
                        <div>Trial protocol Number:&nbsp;{trialmatch.protocolNo}</div>
                    </If>

                    <If condition={trialmatch.nctId.length > 0}>
                        <div>
                            Trial NCTid:&nbsp; 
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
                    <div>Trial Short Title:&nbsp;{trialmatch.shortTitle}</div>
                </div>
            ),
            sortBy: (trialmatch: ITrialMatch) => trialmatch.nctId,
            width: this.columnWidths[ColumnKey.TITLE],
        },
        {
            name: ColumnKey.ARM,
            render: (trialmatch: ITrialMatch) => (
                <div>
                    <div>Arm Id:&nbsp;{trialmatch.arm_internal_id}</div>
                    <div>Arm Code:&nbsp;{trialmatch.arm_code}</div>
                    <div>Arm Description:&nbsp;{trialmatch.armDescription}</div>
                </div>
            ),
            sortBy: (trialmatch: ITrialMatch) => trialmatch.arm_code,
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
            name: ColumnKey.PATIENT_MATCHDATA,
            render: (trialmatch: ITrialMatch) => (
                <div>
                    <div>Match Type:&nbsp;{trialmatch.matchType}</div>
                    <br />
                    <div>Genomic Alteration:&nbsp;{trialmatch.genomicAlteration}</div>
                    <br />
                    <div>True Protein Change:&nbsp;{trialmatch.trueProteinChange}</div>
                    <br />
                    <div>Oncotree Primary Diagnosis Name:&nbsp;{trialmatch.oncotreePrimaryDiagnosisName}</div>
                </div>
            ),
            sortBy: (trialmatch: ITrialMatch) => trialmatch.matchType,
            width: this.columnWidths[ColumnKey.PATIENT_MATCHDATA],
        },
        {
            name: ColumnKey.TRIAL_MATCHING_CRITERIA,
            render: (trialmatch: ITrialMatch) => (
                <div>
                    Trial Oncotree Primary Diagnosis Name:&nbsp;
                    <div>&nbsp;{trialmatch.trialOncotreePrimaryDiagnosis}</div>
                </div>
            ),
            sortBy: (trialmatch: ITrialMatch) => trialmatch.trialOncotreePrimaryDiagnosis,
            width: this.columnWidths[ColumnKey.TRIAL_MATCHING_CRITERIA],
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
