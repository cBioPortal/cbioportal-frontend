import * as React from 'react';
import * as _ from 'lodash';
import { Sample } from 'shared/api/generated/CBioPortalAPIInternal';
import { observer } from "mobx-react";
import { bind } from 'bind-decorator';
import Draggable from 'react-draggable';
import classnames from 'classnames';
import styles from "./styles.module.scss";
import { observable, computed, action } from 'mobx';
import { ButtonGroup, Radio } from 'react-bootstrap';
import { debounceAsync } from 'mobxpromise';
import { stringListToSet } from 'shared/lib/StringUtils';
import SectionHeader from 'shared/components/sectionHeader/SectionHeader';
import { remoteData } from 'shared/api/remoteData';

export interface ICustomCaseSelectionProps {
    selectedSamples: Sample[];
    onClose: () => void;
    onSubmit: (samples: Sample[]) => void;
    queriedStudies?: string[];
}

const GroupByOptions: { value: 'sample' | 'patient'; label: string; }[] = [
    { value: 'sample', label: 'By sample ID' },
    { value: 'patient', label: 'By patient ID' }
];

@observer
export default class CustomCaseSelection extends React.Component<ICustomCaseSelectionProps, {}> {

    @observable showCaseIds: boolean = false;
    @observable caseIdsMode: 'sample' | 'patient' = 'sample';
    @observable caseIds: string = ''
    @observable validCases: Sample[] = []

    @computed get sampleSet(): { [id: string]: Sample } {
        return _.keyBy(this.props.selectedSamples, s => `${s.studyId}:${s.sampleId}`)
    }

    @computed get shouldStudyIdPresent() {
        if (this.props.queriedStudies) {
            return this.props.queriedStudies.length > 1;
        } else {
            return _.uniq(this.props.selectedSamples.map(sample => sample.studyId)).length > 1
        }
    }

    @computed get queriedStudiesSet() {
        if (this.props.queriedStudies) {
            return stringListToSet(this.props.queriedStudies);
        } else {
            return stringListToSet(this.props.selectedSamples.map(sample => sample.studyId))
        }
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

    private invokeCustomCaseSetLater = debounceAsync(
        async (params: Pick<this, 'caseIds'>) => {
            let entities = params.caseIds.trim().split(/\s+/g);
            let singleStudyId = _.keys(this.queriedStudiesSet)[0]
            const cases: { id: string, study: string }[] = entities.map(entity => {
                let splitEntity = entity.split(':');
                if (splitEntity.length === 1) {
                    // no study specified
                    if (this.shouldStudyIdPresent) {
                        // otherwise, throw error
                        throw new Error(`No study specified for ${this.caseIdsMode} id: ${entity}, and more than one study selected for query.`);
                    } else {
                        // if only one study selected, fill it in
                        return {
                            id: entity,
                            study: singleStudyId
                        };
                    }
                } else if (splitEntity.length === 2) {
                    const study = splitEntity[0];
                    const id = splitEntity[1];
                    if (!this.queriedStudiesSet[study]) {
                        throw new Error(`Study ${study} is not selected.`);
                    }
                    return {
                        id,
                        study
                    };
                } else {
                    throw new Error(`Input error for entity: ${entity}.`);
                }
            });

            let invalidCases: { id: string, study: string }[] = [];
            let validCases: Sample[] = [];
            let caseSet: { [id: string]: Sample } = {}
            if (this.caseIdsMode === 'sample') {
                caseSet = _.keyBy(this.props.selectedSamples, s => `${s.studyId}:${s.sampleId}`);
            } else {
                caseSet = _.keyBy(this.props.selectedSamples, s => `${s.studyId}:${s.patientId}`);
            }

            cases.forEach((next) => {
                let sample = caseSet[`${next.study}:${next.id}`];
                if (sample) {
                    validCases.push(sample);
                } else {
                    invalidCases.push(next);
                }
            });

            if (invalidCases.length) {
                throw new Error(
                    `Invalid ${
                    this.caseIdsMode
                    }${
                    invalidCases.length > 1 ? 's' : ''
                    } for the selected cancer study: ${
                    invalidCases.map(x => x.id).join(', ')
                    }`
                );
            }
            return validCases;
        },
        500
    );

    public mainContent() {
        return (
            <div className={styles.body}>
                <ButtonGroup>
                    {
                        GroupByOptions.map((option, i) => {
                            return <Radio
                                checked={option.value === this.caseIdsMode}
                                onChange={(e) => {
                                    this.caseIds = '';
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
                            this.validCases = this.props.selectedSamples;
                        }}>
                        Use selected samples/patients
                    </span>

                </div>

                <textarea
                    value={this.caseIds}
                    onChange={event => this.caseIds = event.currentTarget.value}
                    data-test='CustomCaseSetInput'
                />
            </div>
        );
    }

    readonly asyncCustomCaseSet = remoteData<Sample[]>({
        invoke: async () => {
            if (this.caseIds.trim().length === 0)
                return [];
            return this.invokeCustomCaseSetLater({
                caseIds: this.caseIds,
            })
        },
        default: [],
        onResult: (validCases) => {
            this.validCases = validCases;
        }
    });

    private footer() {
        return (
            <div className={styles.footer}>
                <SectionHeader promises={[this.asyncCustomCaseSet]} />
                <div style={{ float: "right", height: "40px" }}>
                    <button
                        disabled={!_.isUndefined(this.asyncCustomCaseSet.error) || this.validCases.length === 0}
                        className="btn btn-sm"
                        style={{ float: "right" }}
                        onClick={event => this.props.onSubmit(this.validCases)} >
                        Submit
                    </button>

                </div>

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