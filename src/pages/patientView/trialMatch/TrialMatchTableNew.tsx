import * as React from 'react';
import { ButtonGroup, Radio } from 'react-bootstrap';
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
    @observable selectedView: string = 'Detailed view';

    constructor(props: ITrialMatchNewProps) {
        super(props);
        makeObservable(this);
    }

    public getSampleIdIcons(sampleIds: string[]) {
        let sortedSampleIds = sampleIds;
        if (sampleIds.length > 1) {
            const sampleOrder = this.props.sampleManager!.getSampleIdsInOrder();
            sortedSampleIds = sampleOrder.filter((sampleId: string) =>
                sampleIds.includes(sampleId)
            );
        }
        return (
            <React.Fragment>
                {sortedSampleIds.map((sampleId: string) => (
                    <div className={styles.genomicSpan}>
                        {this.props.sampleManager!.getComponentForSample(
                            sampleId,
                            1,
                            ''
                        )}
                    </div>
                ))}
            </React.Fragment>
        );
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
    get groupedByTrial() {
        return _.groupBy(this.sortedTrialMatches, 'nctId');
    }

    @computed
    get groupedByTrialArm() {
        return _.groupBy(
            this.sortedTrialMatches,
            trialmatch => `${trialmatch.nctId}-${trialmatch.trial_arm_number}`
        );
    }

    @computed
    get formattedByTrialArm() {
        return _.map(this.groupedByTrialArm, (group, key) => {
            const [nctId, trial_arm_number] = key.split('-');
            const combined = group.reduce((acc: ITrialMatch, trialmatch) => {
                acc.nctId = nctId;
                acc.trial_arm_number = parseInt(trial_arm_number, 10);
                acc.protocolNo = trialmatch.protocolNo;
                acc.shortTitle = trialmatch.shortTitle;
                acc.sampleId = acc.sampleId
                    ? acc.sampleId.indexOf(trialmatch.sampleId) > -1
                        ? acc.sampleId
                        : acc.sampleId.concat(', ').concat(trialmatch.sampleId)
                    : trialmatch.sampleId;
                acc.arm_code = trialmatch.arm_code;
                acc.trial_step_number = trialmatch.trial_step_number;
                acc.trial_match_date = acc.trial_match_date
                    ? acc.trial_match_date
                    : trialmatch.trial_match_date;
                acc.patient_match_values =
                    '{"Expand for Details":"Expand for Details"}';
                acc.queries_used =
                    '[{"Expand for Details":"Expand for Details"}]';
                // trial links to be added
                return acc;
            }, {} as ITrialMatch);
            return combined;
        });
    }

    @computed
    get formattedByTrial() {
        return _.map(this.groupedByTrial, (group, nctId) => {
            const combined = group.reduce((acc: ITrialMatch, trialmatch) => {
                acc.nctId = nctId;
                acc.protocolNo = trialmatch.protocolNo;
                acc.shortTitle = trialmatch.shortTitle;
                acc.sampleId = acc.sampleId
                    ? acc.sampleId.indexOf(trialmatch.sampleId) > -1
                        ? acc.sampleId
                        : acc.sampleId.concat(', ').concat(trialmatch.sampleId)
                    : trialmatch.sampleId;
                //acc.trial_arm_number = trialmatch.trial_arm_number;
                acc.arm_code = acc.arm_code
                    ? acc.arm_code.indexOf(trialmatch.arm_code) > -1
                        ? acc.arm_code
                        : acc.arm_code.concat(
                              ', #' +
                                  trialmatch.trial_arm_number.toString() +
                                  ' - ' +
                                  trialmatch.arm_code
                          )
                    : '#' +
                      trialmatch.trial_arm_number.toString() +
                      ' - ' +
                      trialmatch.arm_code;
                //acc.arm_code = acc.arm_code ? acc.arm_code.concat(', ').concat(trialmatch.arm_code) : trialmatch.arm_code;
                //acc.arm_code.concat(trialmatch.arm_code).concat(',');
                acc.trial_step_number = trialmatch.trial_step_number;
                acc.trial_match_date = acc.trial_match_date
                    ? acc.trial_match_date
                    : trialmatch.trial_match_date;
                acc.patient_match_values =
                    '{"Expand for Details":"Expand for Details"}';
                acc.queries_used =
                    '[{"Expand for Details":"Expand for Details"}]';
                //trial links to be added
                return acc;
            }, {} as ITrialMatch);
            return combined;
        });
    }

    @action
    handleViewChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        this.selectedView = event.target.value;
    };


    formattedtrialMatchDate (trial_date: string) {
        const date = new Date(trial_date);
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        };
        return date.toLocaleDateString('en-CA', options);
    }

    formattedtrialMatchField (field_name: string) {
        const field_terms = field_name.split('_');
        const new_field_terms = field_terms.map(term => {
            return term.charAt(0).toUpperCase() + term.slice(1);
        });
        const new_field = new_field_terms.join(' ');
        return new_field;
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
                    <div>{trialmatch.sampleId}
                        {this.getSampleIdIcons(
                                                [trialmatch.sampleId]
                                            )}
                                            </div>
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
                        <p>{this.formattedtrialMatchField(key) as React.ReactNode}</p>
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
                    <div>{this.formattedtrialMatchDate(trialmatch.trial_match_date)}</div>
                </div>
            ),
            sortBy: (trialmatch: ITrialMatch) => trialmatch.trial_match_date,
            width: this.columnWidths[ColumnKey.MATCHDATE],
        },
        {
            name: ColumnKey.TRIALDETAILS,
            render: (trialmatch: ITrialMatch) => (
                <div>
                    <div>
                        <a href="https://beta-app.ctims.ca/" target="_blank">
                            CTIMS Editor
                        </a>
                    </div>
                    <div>
                        <a href="https://beta-app.ctims.ca/" target="_blank">
                            CTIMS Viewer
                        </a>
                    </div>
                </div>
            ),
            //sortBy: (trialmatch: ITrialMatch) => trialmatch.arm_code,
            width: this.columnWidths[ColumnKey.TRIALDETAILS],
        },
        {
            name: ColumnKey.TRIAL_MATCHING_CRITERIA,
            render: (trialmatch: ITrialMatch) => (
                <div>
                    {/*JSON.stringify(
                        JSON.parse(trialmatch.queries_used.replace(/\{/g, '').replace(/\}/g, '').replace(/'/g, '"')),
                        null,
                        2
                    )*/
                    JSON.stringify(
                        JSON.parse(
                            trialmatch.queries_used
                                .replace(/\{/g, '')
                                .replace(/\}/g, '')
                                .replace(/'/g, '"')
                                .replace(/\[/g, '{ ')
                                .replace(/\]/g, ' }') //.replace(/,/g, ', ' )
                        ),
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
            render: (trialmatch: ITrialMatch) => (
                <div>
                    {JSON.stringify(
                        JSON.parse(
                            trialmatch.patient_match_values.replace(/'/g, '"')
                        ),
                        null,
                        2
                    )}
                </div>
            ),
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
        const viewdata =
            this.selectedView === 'Trial view'
                ? this.formattedByTrial
                : this.selectedView === 'Arm view'
                ? this.formattedByTrialArm
                : this.sortedTrialMatches;

        return (
            <div>
                <div>
                    <div>
                        <div className={'cancer-summary--main-options'}>
                            <ButtonGroup>
                                <Radio
                                    checked={this.selectedView === 'Trial view'}
                                    inline
                                    onChange={() =>
                                        this.handleViewChange({
                                            target: { value: 'Trial view' },
                                        } as React.ChangeEvent<
                                            HTMLSelectElement
                                        >)
                                    }
                                >
                                    Trial view
                                </Radio>
                                <Radio
                                    checked={this.selectedView === 'Arm view'}
                                    inline
                                    onChange={() =>
                                        this.handleViewChange({
                                            target: { value: 'Arm view' },
                                        } as React.ChangeEvent<
                                            HTMLSelectElement
                                        >)
                                    }
                                >
                                    Arm view
                                </Radio>
                                <Radio
                                    checked={
                                        this.selectedView === 'Detailed view'
                                    }
                                    inline
                                    onChange={() =>
                                        this.handleViewChange({
                                            target: { value: 'Detailed view' },
                                        } as React.ChangeEvent<
                                            HTMLSelectElement
                                        >)
                                    }
                                >
                                    Detailed view
                                </Radio>
                            </ButtonGroup>
                        </div>
                    </div>
                </div>
                <TrialMatchNewTableComponent
                    data={viewdata}
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
