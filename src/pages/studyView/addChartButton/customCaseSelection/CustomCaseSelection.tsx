import * as React from 'react';
import * as _ from 'lodash';
import {Sample} from 'shared/api/generated/CBioPortalAPIInternal';
import {observer} from "mobx-react";
import styles from "./styles.module.scss";
import {action, computed, observable} from 'mobx';
import {ButtonGroup, Modal, Radio} from 'react-bootstrap';
import {ClinicalDataType, ClinicalDataTypeEnum, NewChart} from "../../StudyViewPageStore";
import ErrorBox from "../../../../shared/components/errorBox/ErrorBox";
import {STUDY_VIEW_CONFIG} from "../../StudyViewConfig";
import {
    DEFAULT_GROUP_NAME_WITHOUT_USER_INPUT, ErrorCodeEnum,
    parseContent,
    ParseResult,
    ValidationResult
} from "./CustomCaseSelectionUtils";
import autobind from 'autobind-decorator';
import InfoBanner from "../../infoBanner/InfoBanner";
import {INFO_TIMEOUT} from "../AddChartButton";
import Collapse from "react-collapse";

export interface ICustomCaseSelectionProps {
    selectedSamples: Sample[];
    onSubmit: (chart: NewChart) => void;
    queriedStudies: string[];
    getDefaultChartName: () => string;
    isChartNameValid: (chartName: string) => boolean
}

const GroupByOptions: { value: ClinicalDataType, label: string; }[] = [
    {value: ClinicalDataTypeEnum.SAMPLE, label: 'By sample ID'},
    {value: ClinicalDataTypeEnum.PATIENT, label: 'By patient ID'}
];

@observer
export default class CustomCaseSelection extends React.Component<ICustomCaseSelectionProps, {}> {
    private validateContent: boolean = false;
    private chartNameValidation: ValidationResult = {warning: [], error: []};
    private lastAdded: NewChart;
    @observable dataFormatCollapsed: boolean = true;
    @observable chartName: string;
    @observable showCaseIds: boolean = false;
    @observable caseIdsMode: ClinicalDataType = ClinicalDataTypeEnum.SAMPLE;
    @observable content: string = '';
    @observable validContent: string = '';
    @observable chartAdded: boolean = false;

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
        return {
            name: this.chartName ? this.chartName : this.props.getDefaultChartName(),
            groups: this.result.validationResult.error.length === 0 ? this.result.groups : []
        }
    }

    @autobind
    @action
    onClick() {
        this.content = this.props.selectedSamples.map(sample => {
            return `${sample.studyId}:${(this.caseIdsMode === ClinicalDataTypeEnum.SAMPLE) ? sample.sampleId : sample.patientId} ${DEFAULT_GROUP_NAME_WITHOUT_USER_INPUT}`
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

    @autobind
    @action
    onChartNameChange(event: any) {
        this.chartName = event.currentTarget.value;
        const validChartName = this.props.isChartNameValid(this.chartName);
        if (!validChartName) {
            this.chartNameValidation = {
                error: [{
                    code: ErrorCodeEnum.INVALID,
                    message: new Error('Chart name exists.')
                }],
                warning: []
            }
        } else {
            this.chartNameValidation = {
                error: [],
                warning: []
            }
        }
    }

    @autobind
    @action
    onAddChart() {
        this.lastAdded = this.newChartInfo;
        this.props.onSubmit(this.newChartInfo);
        this.chartAdded = true;
        setTimeout(() => this.chartAdded = false, INFO_TIMEOUT);
    }

    @autobind
    @action
    protected handleDataFormatToggle() {
        this.dataFormatCollapsed = !this.dataFormatCollapsed;
    }

    @computed
    get addChartButtonDisabled() {
        return this.result.validationResult.error.length > 0 || this.newChartInfo.groups.length === 0 || this.chartNameValidation.error.length > 0;
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
                                    this.validateContent = true;
                                }}
                                inline
                                data-value={option.value}
                            >{option.label}</Radio>
                        })
                    }
                </ButtonGroup>

                <div style={{display: 'flex', justifyContent:'space-between'}}>
                    <span
                        className={styles.fillIds}
                        onClick={this.onClick}>
                        Use current selected samples/patients
                    </span>

                    <div className="collapsible-header" onClick={this.handleDataFormatToggle}>
                        <a>Data Format</a>
                        <span style={{paddingLeft: 4, cursor: 'pointer'}}>
                            {this.dataFormatCollapsed ?
                                <i className="fa fa-chevron-down"/> :
                                <i className="fa fa-chevron-up"/>
                            }
                        </span>
                    </div>
                </div>

                <Collapse isOpened={!this.dataFormatCollapsed}>
                    <div style={{marginTop: '5px'}}>Each row can have two columns separated by space or tab:
                        <br/>1) study_id:{this.caseIdsMode === ClinicalDataTypeEnum.SAMPLE ? 'sample_id ' : 'patient_id '}
                        and<br/>2) group_name of your choice<br/>group_name is optional if there is only one group.</div>
                </Collapse>

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
                    this.result.validationResult.error.concat(this.chartNameValidation.error).map(message => {
                        return <ErrorBox className={styles.error} error={message.message}/>
                    })
                }
                {
                    this.result.validationResult.warning.concat(this.chartNameValidation.warning).map(message => {
                        return <ErrorBox style={{backgroundColor: STUDY_VIEW_CONFIG.colors.theme.tertiary}}
                                         error={message.message}/>
                    })
                }
                <div className={styles.operations}>
                    <input placeholder={"Chart name (optional)"}
                           style={{width: '200px'}}
                           type="text"
                           onInput={this.onChartNameChange}
                           className='form-control input-sm'/>
                    <button
                        disabled={this.addChartButtonDisabled}
                        className="btn btn-primary btn-sm"
                        onClick={this.onAddChart}>
                        Add Chart
                    </button>
                </div>
                {this.chartAdded &&
                <InfoBanner message={`${this.lastAdded.name} has been added.`}/>
                }
            </div>
        );
    }

    render() {
        return (
            this.mainContent()
        )
    }
}