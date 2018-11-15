import * as React from 'react';
import * as _ from 'lodash';
import {Sample} from 'shared/api/generated/CBioPortalAPIInternal';
import {observer} from "mobx-react";
import addChartStyles from "../styles.module.scss";
import styles from "./styles.module.scss";
import {action, computed, observable} from 'mobx';
import {ButtonGroup, Modal, Radio} from 'react-bootstrap';
import {ClinicalDataType, ClinicalDataTypeEnum, NewChart} from "../../StudyViewPageStore";
import ErrorBox from "../../../../shared/components/errorBox/ErrorBox";
import {STUDY_VIEW_CONFIG} from "../../StudyViewConfig";
import {getDefaultTitle, parseContent, ParseResult} from "./CustomCaseSelectionUtils";
import autobind from 'autobind-decorator';

export interface ICustomCaseSelectionProps {
    title: string;
    selectedSamples: Sample[];
    show: boolean;
    onClose: () => void;
    onSubmit: (chart: NewChart) => void;
    queriedStudies: string[];
}

const GroupByOptions: { value: ClinicalDataType, label: string; }[] = [
    {value: ClinicalDataTypeEnum.SAMPLE, label: 'By sample ID'},
    {value: ClinicalDataTypeEnum.PATIENT, label: 'By patient ID'}
];

@observer
export default class CustomCaseSelection extends React.Component<ICustomCaseSelectionProps, {}> {
    private validateContent: boolean = false;
    @observable showCaseIds: boolean = false;
    @observable caseIdsMode: ClinicalDataType = ClinicalDataTypeEnum.SAMPLE;
    @observable content: string = '';
    @observable validContent: string = '';

    @computed
    get sampleSet(): { [id: string]: Sample } {
        return _.keyBy(this.props.selectedSamples, s => `${s.studyId}:${s.sampleId}`)
    }

    @computed
    get isSingleStudy() {
        return this.props.queriedStudies.length === 1;
    }

    @computed
    get result(): ParseResult {
        return parseContent(this.validContent, this.validateContent, this.props.queriedStudies, this.caseIdsMode, this.props.selectedSamples, this.isSingleStudy);
    }

    @computed
    get newChartInfo(): NewChart {
        return this.result.validationResult.error.length === 0 ? this.result.chart : {
            name: '',
            groups: []
        };
    }

    @autobind
    @action
    onClick() {
        const content = getDefaultTitle();
        this.content = content + this.props.selectedSamples.map(sample => {
            return `${sample.studyId}:${(this.caseIdsMode === ClinicalDataTypeEnum.SAMPLE) ? sample.sampleId : sample.patientId}`
        }).join("\n")
        this.validateContent = false;
        this.validContent = this.content;
    }

    @autobind
    @action
    onChange(newContent: string) {
        this.validContent = newContent;
        this.validateContent = true;
    }

    public mainContent() {
        return (
            <div className={styles.body}>
                <ButtonGroup>
                    {
                        GroupByOptions.map((option, i) => {
                            return <Radio
                                checked={option.value === this.caseIdsMode}
                                onChange={(e) => {
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
                        onClick={this.onClick}>
                        Use current selected samples/patients
                    </span>

                </div>

                <textarea
                    value={this.content}
                    onChange={(event) => {
                        this.content = event.currentTarget.value;
                        _.delay(() => {
                            this.onChange(this.content);
                        }, 500);
                    }}
                    data-test='CustomCaseSetInput'
                />
                {
                    this.result.validationResult.error.map(message => {
                        return <ErrorBox className={styles.error} error={message.message}/>
                    })
                }
                {
                    this.result.validationResult.warning.map(message => {
                        return <ErrorBox style={{backgroundColor: STUDY_VIEW_CONFIG.colors.theme.tertiary}}
                                         error={message.message}/>
                    })
                }
            </div>
        );
    }

    render() {
        return (
            <Modal
                show={this.props.show}
                onHide={this.props.onClose}
            >
                <Modal.Header closeButton>
                    <span className={addChartStyles.modalHeader}>{this.props.title}</span>
                </Modal.Header>
                <Modal.Body>
                    {this.mainContent()}
                </Modal.Body>
                <Modal.Footer>
                    <button
                        disabled={this.result.validationResult.error.length > 0 || this.newChartInfo.groups.length === 0}
                        className="btn btn-default btn-sm"
                        style={{float: "right"}}
                        onClick={event => this.props.onSubmit(this.newChartInfo)}>
                        Add Chart
                    </button>
                </Modal.Footer>
            </Modal>
        )
    }
}