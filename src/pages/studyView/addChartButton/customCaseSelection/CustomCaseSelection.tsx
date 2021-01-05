import * as React from 'react';
import * as _ from 'lodash';
import { Sample } from 'cbioportal-ts-api-client';
import { observer } from 'mobx-react';
import styles from './styles.module.scss';
import { action, computed, makeObservable, observable } from 'mobx';
import { ButtonGroup, Modal, Radio } from 'react-bootstrap';
import { CustomChart } from '../../StudyViewPageStore';
import ErrorBox from '../../../../shared/components/errorBox/ErrorBox';
import { STUDY_VIEW_CONFIG } from '../../StudyViewConfig';
import {
    DEFAULT_GROUP_NAME_WITHOUT_USER_INPUT,
    CodeEnum,
    parseContent,
    ParseResult,
    ValidationResult,
} from './CustomCaseSelectionUtils';
import autobind from 'autobind-decorator';
import { Collapse } from 'react-collapse';
import { serializeEvent } from '../../../../shared/lib/tracking';
import { ClinicalDataType, ClinicalDataTypeEnum } from '../../StudyViewUtils';

export interface ICustomCaseSelectionProps {
    allSamples: Sample[];
    selectedSamples: Sample[];
    submitButtonText?: string;
    onSubmit: (chart: CustomChart) => void;
    queriedStudies: string[];
    disableGrouping?: boolean;
    getDefaultChartName?: () => string;
    isChartNameValid?: (chartName: string) => boolean;
}

const GroupByOptions: { value: ClinicalDataType; label: string }[] = [
    { value: ClinicalDataTypeEnum.SAMPLE, label: 'By sample ID' },
    { value: ClinicalDataTypeEnum.PATIENT, label: 'By patient ID' },
];

enum SelectMode {
    SELECTED,
    UNSELECTED,
}
@observer
export default class CustomCaseSelection extends React.Component<
    ICustomCaseSelectionProps,
    {}
> {
    private validateContent: boolean = false;
    private chartNameValidation: ValidationResult = { warning: [], error: [] };
    @observable dataFormatCollapsed: boolean = true;
    @observable.ref chartName: string;
    @observable showCaseIds: boolean = false;
    @observable caseIdsMode: ClinicalDataType = ClinicalDataTypeEnum.SAMPLE;
    @observable content: string = '';
    @observable validContent: string = '';

    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    public static defaultProps = {
        submitButtonText: 'Submit',
        disableGrouping: false,
    };

    @computed
    get sampleSet(): { [id: string]: Sample } {
        return _.keyBy(
            this.props.selectedSamples,
            s => `${s.studyId}:${s.sampleId}`
        );
    }

    @computed
    get isSingleStudy() {
        return this.props.queriedStudies.length === 1;
    }

    @computed
    get result(): ParseResult {
        return parseContent(
            this.validContent,
            this.validateContent,
            this.props.queriedStudies,
            this.caseIdsMode,
            this.props.allSamples,
            this.isSingleStudy
        );
    }

    @computed
    get newChartInfo(): CustomChart {
        return {
            name: this.chartName
                ? this.chartName
                : this.props.getDefaultChartName
                ? this.props.getDefaultChartName()
                : '',
            patientAttribute: this.caseIdsMode === ClinicalDataTypeEnum.PATIENT,
            groups:
                this.result.validationResult.error.length === 0
                    ? this.result.groups
                    : [],
        };
    }

    @action.bound
    onClick(selectMode: SelectMode) {
        let selectedCases;
        if (selectMode === SelectMode.SELECTED) {
            selectedCases = this.props.selectedSamples;
        } else {
            const _selectedCaseIds = _.keyBy(
                this.props.selectedSamples,
                sample => sample.uniqueSampleKey
            );
            selectedCases = this.props.allSamples.filter(sample => {
                return !_selectedCaseIds[sample.uniqueSampleKey];
            });
        }
        let cases = selectedCases.map(sample => {
            return `${sample.studyId}:${
                this.caseIdsMode === ClinicalDataTypeEnum.SAMPLE
                    ? sample.sampleId
                    : sample.patientId
            }${
                this.props.disableGrouping
                    ? ''
                    : ` ${DEFAULT_GROUP_NAME_WITHOUT_USER_INPUT}`
            }`;
        });
        if (this.caseIdsMode === ClinicalDataTypeEnum.PATIENT) {
            cases = _.uniq(cases);
        }
        this.content = cases.join('\n');
        this.validateContent = false;
        this.validContent = this.content;
    }

    @action.bound
    onChange(newContent: string) {
        this.validContent = newContent;
        this.validateContent = true;
    }

    @action.bound
    onChartNameChange(event: any) {
        this.chartName = event.currentTarget.value;
        const validChartName = this.props.isChartNameValid
            ? this.props.isChartNameValid(this.chartName)
            : true;
        if (!validChartName) {
            this.chartNameValidation = {
                error: [
                    {
                        code: CodeEnum.INVALID,
                        message: new Error('Chart name exists.'),
                    },
                ],
                warning: [],
            };
        } else {
            this.chartNameValidation = {
                error: [],
                warning: [],
            };
        }
    }

    @action.bound
    onAddChart() {
        this.props.onSubmit(this.newChartInfo);
    }

    @action.bound
    protected handleDataFormatToggle() {
        this.dataFormatCollapsed = !this.dataFormatCollapsed;
    }

    @computed
    get addChartButtonDisabled() {
        return (
            this.result.validationResult.error.length > 0 ||
            this.newChartInfo.groups.length === 0 ||
            this.chartNameValidation.error.length > 0
        );
    }

    @computed
    get dataFormatContent() {
        return (
            <span>
                Each row can have two columns separated by space or tab:
                <br />
                1) study_id:
                {this.caseIdsMode === ClinicalDataTypeEnum.SAMPLE
                    ? 'sample_id '
                    : 'patient_id '}
                and
                <br />
                2) group_name of your choice
                <br />
                group_name is optional if there is only one group.
            </span>
        );
    }

    @computed
    get submitButtonText() {
        if (this.props.disableGrouping) {
            return `Filter to listed ${
                this.caseIdsMode === ClinicalDataTypeEnum.SAMPLE
                    ? 'samples'
                    : 'patients'
            }`;
        }
        return this.props.submitButtonText;
    }

    public mainContent() {
        return (
            <div className={styles.body}>
                <ButtonGroup>
                    {GroupByOptions.map((option, i) => {
                        return (
                            <Radio
                                checked={option.value === this.caseIdsMode}
                                onChange={e => {
                                    this.caseIdsMode = $(e.target).attr(
                                        'data-value'
                                    ) as any;
                                    this.validateContent = true;
                                }}
                                inline
                                data-value={option.value}
                            >
                                {option.label}
                            </Radio>
                        );
                    })}
                </ButtonGroup>

                <span>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: 5,
                        }}
                    >
                        <span
                            className={styles.selection}
                            onClick={() => {
                                this.onClick(SelectMode.SELECTED);
                            }}
                        >
                            <i
                                className="fa fa-arrow-down"
                                style={{ marginRight: 5 }}
                            ></i>
                            <span className={styles.selectionText}>
                                currently selected
                            </span>
                        </span>
                        <span
                            className={styles.selection}
                            onClick={() => {
                                this.onClick(SelectMode.UNSELECTED);
                            }}
                        >
                            <i
                                className="fa fa-arrow-down"
                                style={{ marginRight: 5 }}
                            ></i>
                            <span className={styles.selectionText}>
                                currently unselected
                            </span>
                        </span>

                        <div
                            className="collapsible-header"
                            onClick={this.handleDataFormatToggle}
                        >
                            <a>Data Format</a>
                            <span style={{ paddingLeft: 4, cursor: 'pointer' }}>
                                {this.dataFormatCollapsed ? (
                                    <i className="fa fa-chevron-down" />
                                ) : (
                                    <i className="fa fa-chevron-up" />
                                )}
                            </span>
                        </div>
                    </div>
                    <Collapse isOpened={!this.dataFormatCollapsed}>
                        <div style={{ marginTop: '5px' }}>
                            {this.dataFormatContent}
                        </div>
                    </Collapse>
                </span>

                <textarea
                    className="form-control"
                    rows={5}
                    value={this.content}
                    onChange={event => {
                        this.content = event.currentTarget.value;
                        _.delay(() => {
                            this.onChange(this.content);
                        }, 500);
                    }}
                    data-test="CustomCaseSetInput"
                />

                {this.props.disableGrouping && (
                    <div
                        className="alert alert-warning"
                        style={{ marginTop: '15px', marginBottom: '5px' }}
                    >
                        <i
                            className="fa fa-warning"
                            style={{ marginRight: 3 }}
                        />
                        Submitting will clear current filters.
                    </div>
                )}

                <div className={styles.operations}>
                    {!this.props.disableGrouping && (
                        <input
                            placeholder={'Chart name (optional)'}
                            style={{ width: '200px' }}
                            type="text"
                            onInput={this.onChartNameChange}
                            className="form-control input-sm"
                        />
                    )}
                    <button
                        disabled={this.addChartButtonDisabled}
                        className="btn btn-primary btn-sm"
                        data-test="CustomCaseSetSubmitButton"
                        data-event={serializeEvent({
                            category: 'studyPage',
                            action: 'customCaseSetSelection',
                            label: this.props.queriedStudies.join(','),
                        })}
                        onClick={this.onAddChart}
                    >
                        {this.submitButtonText}
                    </button>
                </div>
                {this.result.validationResult.error
                    .concat(this.chartNameValidation.error)
                    .map(error => {
                        return (
                            <div
                                className="alert alert-danger"
                                role="alert"
                                style={{ marginTop: '10px', marginBottom: '0' }}
                            >
                                {error.message.message}
                            </div>
                        );
                    })}
                {this.result.validationResult.warning
                    .concat(this.chartNameValidation.warning)
                    .map(warning => {
                        return (
                            <div
                                className="alert alert-warning"
                                role="alert"
                                style={{ marginTop: '10px', marginBottom: '0' }}
                            >
                                {warning.message.message}
                            </div>
                        );
                    })}
            </div>
        );
    }

    render() {
        return this.mainContent();
    }
}
