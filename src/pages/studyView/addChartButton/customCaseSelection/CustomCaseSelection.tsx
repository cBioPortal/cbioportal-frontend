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
import Collapse from "react-collapse";

export interface ICustomCaseSelectionProps {
    allSamples: Sample[];
    selectedSamples: Sample[];
    submitButtonText: string;
    onSubmit: (chart: NewChart) => void;
    queriedStudies: string[];
    disableGrouping?: boolean;
    getDefaultChartName?: () => string;
    isChartNameValid?: (chartName: string) => boolean
}

const GroupByOptions: { value: ClinicalDataType, label: string; }[] = [
    {value: ClinicalDataTypeEnum.SAMPLE, label: 'By sample ID'},
    {value: ClinicalDataTypeEnum.PATIENT, label: 'By patient ID'}
];

@observer
export default class CustomCaseSelection extends React.Component<ICustomCaseSelectionProps, {}> {
    private validateContent: boolean = false;
    private chartNameValidation: ValidationResult = {warning: [], error: []};
    @observable dataFormatCollapsed: boolean = true;
    @observable chartName: string;
    @observable showCaseIds: boolean = false;
    @observable caseIdsMode: ClinicalDataType = ClinicalDataTypeEnum.SAMPLE;
    @observable content: string = '';
    @observable validContent: string = '';

    public static defaultProps = {
        disableGrouping: false
    };

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
        return parseContent(this.validContent, this.validateContent, this.props.queriedStudies, this.caseIdsMode, this.props.allSamples, this.isSingleStudy);
    }

    @computed
    get newChartInfo(): NewChart {
        return {
            name: this.chartName ? this.chartName : this.props.getDefaultChartName ? this.props.getDefaultChartName() : '',
            groups: this.result.validationResult.error.length === 0 ? this.result.groups : []
        }
    }

    @autobind
    @action
    onClick() {
        let cases = this.props.selectedSamples.map(sample => {
            return `${sample.studyId}:${(this.caseIdsMode === ClinicalDataTypeEnum.SAMPLE) ? sample.sampleId : sample.patientId}${this.props.disableGrouping ? '' : ` ${DEFAULT_GROUP_NAME_WITHOUT_USER_INPUT}`}`
        });
        if (this.caseIdsMode === ClinicalDataTypeEnum.PATIENT) {
            cases = _.uniq(cases);
        }
        this.content = cases.join("\n")
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
        const validChartName = this.props.isChartNameValid ? this.props.isChartNameValid(this.chartName) : true;
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
        this.props.onSubmit(this.newChartInfo);
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

    @computed
    get dataFormatContent() {
        return <span>Each row can have two columns separated by space or tab:
                <br/>1) study_id:{this.caseIdsMode === ClinicalDataTypeEnum.SAMPLE ? 'sample_id ' : 'patient_id '}
            and<br/>2) group_name of your choice<br/>group_name is optional if there is only one group.</span>;
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


                {!this.props.disableGrouping && (
                    <span>
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
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
                            <div style={{marginTop: '5px'}}>{this.dataFormatContent}</div>
                        </Collapse>
                    </span>
                )}

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
                    {!this.props.disableGrouping && (
                        <input placeholder={"Chart name (optional)"}
                               style={{width: '200px'}}
                               type="text"
                               onInput={this.onChartNameChange}
                               className='form-control input-sm'/>
                    )}
                    <button
                        disabled={this.addChartButtonDisabled}
                        className="btn btn-primary btn-sm"
                        data-test='CustomCaseSetSubmitButton'
                        onClick={this.onAddChart}>
                        {this.props.submitButtonText}
                    </button>
                </div>
            </div>
        );
    }

    render() {
        return (
            this.mainContent()
        )
    }
}