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
    SAMPLES = 'Samples',
    ARM = 'Arm',
    MATCHING_FIELDS = 'Matching Fields',
    PATIENT_MATCHDATA = 'Patient Match',
    MATCHDATE = 'Match Date',
    TRIALDETAILS = 'Trial Details',
    TRIAL_MATCHING_CRITERIA = 'Trial Matching Criteria JSON',
    PMV = 'Patient Match Values JSON',
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
    get sortedTrialMatches() {
        return _.orderBy(
            this.props.trialMatches,
            ['nctId', 'trial_arm_number'],
            ['asc']
        );
    }

    @computed
    get columnWidths() {
        return {
            [ColumnKey.TITLE]:
                0.05 * (this.props.containerWidth - ColumnWidth.STATUS),
            [ColumnKey.SAMPLES]:
                0.05 * (this.props.containerWidth - ColumnWidth.STATUS),
            [ColumnKey.ARM]:
                0.2 * (this.props.containerWidth - ColumnWidth.STATUS),
            [ColumnKey.MATCHING_FIELDS]:
                0.2 * (this.props.containerWidth - ColumnWidth.STATUS),
            [ColumnKey.PATIENT_MATCHDATA]:
                0.25 * (this.props.containerWidth - ColumnWidth.STATUS),
            [ColumnKey.MATCHDATE]:
                0.05 * (this.props.containerWidth - ColumnWidth.STATUS),
            [ColumnKey.TRIALDETAILS]:
                0.05 * (this.props.containerWidth - ColumnWidth.STATUS),
            [ColumnKey.TRIAL_MATCHING_CRITERIA]:
                0.25 * (this.props.containerWidth - ColumnWidth.STATUS),
            [ColumnKey.PMV]: ColumnWidth.STATUS,
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
                            {/* Trial NCTid:&nbsp; */}
                            <a
                                target="_blank"
                                href={
                                    'https://clinicaltrials.gov/ct2/show/' +
                                    trialmatch.nctId
                                }
                            >
                                {trialmatch.nctId}
                            </a>
                            <br />
                            {trialmatch.shortTitle}
                        </div>
                    </If>
                </div>
            ),
            sortBy: (trialmatch: ITrialMatch) => trialmatch.nctId,
            width: this.columnWidths[ColumnKey.TITLE],
        },
        {
            name: ColumnKey.SAMPLES,
            render: (trialmatch: ITrialMatch) => (
                <div>
                    <div>Sample ID:&nbsp;{trialmatch.sampleId}</div>
                </div>
            ),
            sortBy: (trialmatch: ITrialMatch) => trialmatch.sampleId,
            width: this.columnWidths[ColumnKey.SAMPLES],
        },
        {
            name: ColumnKey.ARM,
            render: (trialmatch: ITrialMatch) => (
                <div>
                    <div>Arm Code:&nbsp;{trialmatch.arm_code}</div>
                    <div>Arm Number:&nbsp;{trialmatch.trial_arm_number}</div>
                    <div>Step Number:&nbsp;{trialmatch.trial_step_number}</div>
                    {/*<div>Arm Description:&nbsp;{trialmatch.armDescription}</div>*/}
                </div>
            ),
            sortBy: (trialmatch: ITrialMatch) => trialmatch.trial_arm_number,
            width: this.columnWidths[ColumnKey.ARM],
        },
        /*
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
        */
        {
            name: ColumnKey.MATCHING_FIELDS,
            render: (trialmatch: ITrialMatch) => (
                <div>
                    {Object.keys(
                        JSON.parse(
                            trialmatch.patient_match_values.replace(/'/g, '"')
                        )
                    ).map(key => (
                        <p>{key as React.ReactNode}</p>
                    ))}
                </div>
            ),
            sortBy: (trialmatch: ITrialMatch) =>
                trialmatch.oncotreePrimaryDiagnosisName,
            width: this.columnWidths[ColumnKey.MATCHING_FIELDS],
        },
        {
            name: ColumnKey.PATIENT_MATCHDATA,
            render: (trialmatch: ITrialMatch) => (
                <div>
                    {Object.values(
                        JSON.parse(
                            trialmatch.patient_match_values.replace(/'/g, '"')
                        )
                    ).map(key => (
                        <p>{key as React.ReactNode}</p>
                    ))}
                </div>
            ),
            sortBy: (trialmatch: ITrialMatch) => trialmatch.matchType,
            width: this.columnWidths[ColumnKey.PATIENT_MATCHDATA],
        },
        {
            name: ColumnKey.MATCHDATE,
            render: (trialmatch: ITrialMatch) => (
                <div>
                    <div>{trialmatch.trial_match_date}</div>
                </div>
            ),
            sortBy: (trialmatch: ITrialMatch) => trialmatch.trial_match_date,
            width: this.columnWidths[ColumnKey.MATCHDATE],
        },
        {
            name: ColumnKey.TRIALDETAILS,
            render: (trialmatch: ITrialMatch) => (
                <div>
                    <div>Trial Details Links TBD</div>
                </div>
            ),
            //sortBy: (trialmatch: ITrialMatch) => trialmatch.arm_code,
            width: this.columnWidths[ColumnKey.TRIALDETAILS],
        },
        {
            name: ColumnKey.TRIAL_MATCHING_CRITERIA,
            render: (trialmatch: ITrialMatch) => (
                <div>
                    {JSON.stringify(
                        JSON.parse(trialmatch.queries_used.replace(/'/g, '"')),
                        null,
                        2
                    )}
                </div>
            ),
            sortBy: (trialmatch: ITrialMatch) =>
                trialmatch.oncotreePrimaryDiagnosisName,
            width: this.columnWidths[ColumnKey.TRIAL_MATCHING_CRITERIA],
        },
        {
            name: ColumnKey.PMV,
            render: (
                trialmatch: ITrialMatch /*
                <div>
                     {
                     JSON.stringify(
                        JSON.parse(
                        trialmatch.patient_match_values.replace(/'/g, '"'))
                        , null, 2)
                     }
                </div>
                */
            ) => <p></p>,
            sortBy: (trialmatch: ITrialMatch) =>
                trialmatch.oncotreePrimaryDiagnosisName,
            width: this.columnWidths[ColumnKey.PMV],
        },
        /*{
            name: ColumnKey.PMV,
            render: (trialmatch: ITrialMatch) => (
                <div>
                        {trialmatch.patient_match_values}
                </div>
            ),
            sortBy: (trialmatch: ITrialMatch) => trialmatch.oncotreePrimaryDiagnosisName,
            width: this.columnWidths[ColumnKey.PMV],
        },*/
    ];

    render() {
        return (
            <div>
                {}
                <TrialMatchNewTableComponent
                    data={this.sortedTrialMatches}
                    columns={this._columns}
                    showCopyDownload={false}
                />
                <div className={styles.powered}>
                    Powered by{' '}
                    <a href="https://matchminer.org/" target="_blank">
                        MatchMiner
                    </a>{' '}
                    &{' '}
                    <a href="https://ctims.ca/" target="_blank">
                        CTIMS
                    </a>
                </div>
            </div>
        );
    }
}
