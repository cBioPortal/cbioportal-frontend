import * as React from 'react';
import * as _ from 'lodash';
import { Sample } from 'shared/api/generated/CBioPortalAPIInternal';
import { observer } from "mobx-react";
import { bind } from 'bind-decorator';
import Draggable from 'react-draggable';
import classnames from 'classnames';
import styles from "./styles.module.scss";
import { FlexRow } from 'shared/components/flexbox/FlexBox';
import { observable, computed, action } from 'mobx';
import { ButtonGroup, Radio } from 'react-bootstrap';

export interface ICustomCaseSelectionProps {
    selectedSamples: Sample[];
    onClose: () => void;
    onSubmit:(samples:Sample[]) => void;
}

const GroupByOptions: { value: 'sample'|'patient'; label: string;}[] = [
    {value: 'sample', label: 'By sample ID'},
    {value: 'patient', label: 'By patient ID'}
];

@observer
export default class CustomCaseSelection extends React.Component<ICustomCaseSelectionProps, {}> {

    @observable showCaseIds: boolean = false;
    @observable caseIdsMode: 'sample' | 'patient' = 'sample';
    @observable caseIds: string = ''
    @observable invalidCases: string[] = [];
    @observable validCases: Sample[] = []

    @computed get sampleSet(): { [id: string]: Sample } {
        return _.reduce(this.props.selectedSamples, (acc: { [id: string]: Sample }, next) => {
            acc[next.studyId + ':' + next.sampleId] = next;
            return acc;
        }, {});
    }

    @computed get shouldStudyIdPresent() {
        return Object.keys(_.groupBy(this.props.selectedSamples, sample => sample.studyId)).length > 1;
    }

    private header() {
        return (
            <div className={styles.header}>
                <div style={{ flexGrow: 1, textAlign: "center" }} >
                    <span>Custom case selection</span>
                </div>
                <div>
                    <i
                        className="fa fa-times-circle"
                        onClick={this.props.onClose}
                        style={{ cursor: "pointer" }}
                    />
                </div>
            </div>
        );
    }

    @bind
    @action private validateCases(caseIds: string) {
        let invalidEntries: string[] = [];
        let validCases:Sample[] =[];
        if(!_.isEmpty(caseIds)) {
            let cases = _.uniq(caseIds.trim().split('\n'));
            validCases= _.reduce(cases, (acc: Sample[], next) => {
                let pair = next.split(':').map(obj => obj.trim());
    
                if (this.shouldStudyIdPresent) {
                    if (pair.length == 2) {
                        let sample = this.sampleSet[next];
                        if (sample) {
                            acc.push(sample);
                        }
                        else {
                            invalidEntries.push(next);
                        }
                    } else {
                        invalidEntries.push(next);
                    }
                } else {
                    if (pair.length == 2) {
                        let sample = this.sampleSet[next];
                        if (sample) {
                            acc.push(sample);
                        } else {
                            invalidEntries.push(next);
                        }
                    } else {
                        let studyId = this.props.selectedSamples[0].studyId;
                        let sample = this.sampleSet[studyId + ':' + next];
                        if (sample) {
                            acc.push(sample);
                        } else {
                            invalidEntries.push(next);
                        }
                    }
                }
                return acc;
            }, []);
        }
        this.validCases = validCases;
        this.invalidCases = invalidEntries;
        this.caseIds = caseIds;
    }

    public mainContent() {
        let classes: string[] = [styles.textArea]
        if (this.invalidCases.length > 0) {
            classes.push(styles.invalid);
        } else if (this.validCases.length > 0) {
            classes.push(styles.valid);
        }

        return (
            <div className={styles.body}>
                <ButtonGroup>
                    {
                        GroupByOptions.map((option, i) => {
                            return <Radio
                                checked={option.value === this.caseIdsMode}
                                onChange={(e) => {
                                        this.caseIds = '';
                                        this.invalidCases = [];
                                        this.validCases = [];
                                        this.caseIdsMode = $(e.target).attr("data-value") as any;
                                }}
                                inline
                                data-value={option.value}
                            >{option.label}</Radio>
                        })
                    }
                </ButtonGroup>
                <div>
                    <span
                        className={styles.fillIds}
                        onClick={event => {
                            this.caseIds = this.props.selectedSamples.map(sample => {
                                return `${sample.studyId}:${(this.caseIdsMode === 'sample') ? sample.sampleId : sample.patientId}`
                            }).join("\n");
                            this.invalidCases = [];
                            this.validCases = this.props.selectedSamples;
                        }}>
                        Use selected samples/patients
                    </span>

                </div>
                
                <textarea
                    className={classnames(classes)}
                    value={this.caseIds}
                    onChange={event => this.validateCases(event.currentTarget.value)}
                    data-test='CustomCaseSetInput'
                />
            </div>
        );
    }

    private footer() {
        return (
            <div className={styles.footer}>
                <span>Please input IDs (one per line)</span>
                <button
                    disabled={this.invalidCases.length > 0 || this.validCases.length === 0}
                    className="btn btn-sm"
                    style={{ float: "right" }}
                    onClick={event => this.props.onSubmit(this.validCases)} >
                    Submit
                </button>
            </div>
        );
    }

    render() {
        return (
            <Draggable handle={`.${styles.header}`}>
                <div className={styles.customCaseSelection}>
                    {this.header()}
                    {this.mainContent()}
                    {this.footer()}
                </div>
            </Draggable>
        )
    }
}