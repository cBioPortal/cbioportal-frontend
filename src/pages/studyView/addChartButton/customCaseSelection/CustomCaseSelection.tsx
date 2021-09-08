import * as React from 'react';
import * as _ from 'lodash';
import { Sample } from 'cbioportal-ts-api-client';
import { observer } from 'mobx-react';
import styles from './styles.module.scss';
import { action, computed, makeObservable, observable } from 'mobx';
import { ButtonGroup, Radio } from 'react-bootstrap';
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
import {
    ClinicalDataType,
    ClinicalDataTypeEnum,
    DataType,
} from '../../StudyViewUtils';
import { CustomChartData } from 'shared/api/session-service/sessionServiceModels';

export interface ICustomCaseSelectionProps {
    allSamples: Sample[];
    selectedSamples: Sample[];
    submitButtonText?: string;
    disableSubmitButton?: boolean;
    onSubmit: (chart: CustomChartData) => void;
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
    get newChartInfo(): CustomChartData {
        const displayName = this.chartName
            ? this.chartName
            : this.props.getDefaultChartName
            ? this.props.getDefaultChartName()
            : '';
        return {
            displayName,
            description: displayName,
            datatype: DataType.STRING,
            patientAttribute: this.caseIdsMode === ClinicalDataTypeEnum.PATIENT,
            data:
                this.result.validationResult.error.length === 0
                    ? this.result.data
                    : [],
        } as CustomChartData;
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
                        message: new Error('Custom data exists.'),
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

    @computed
    get addChartButtonDisabled() {
        return (
            !!this.props.disableSubmitButton ||
            this.result.validationResult.error.length > 0 ||
            this.newChartInfo.data.length === 0 ||
            this.chartNameValidation.error.length > 0
        );
    }

    @computed
    get exampleData() {
        const caseIdentifier =
            this.caseIdsMode === ClinicalDataTypeEnum.SAMPLE
                ? 'sample_id'
                : 'patient_id';
        return `Example:\nstudy_id:${caseIdentifier}1${
            this.props.disableGrouping ? '' : ' value1'
        }\nstudy_id:${caseIdentifier}2${
            this.props.disableGrouping ? '' : ' value2'
        }`;
    }

    @computed
    get dataFormatContent() {
        return (
            `Each row must have two columns separated by space or tab:` +
            `\n1) study_id: ${
                this.caseIdsMode === ClinicalDataTypeEnum.SAMPLE
                    ? 'sample_id'
                    : 'patient_id'
            } and` +
            `\n2) custom data (currently only support categorical data)`
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
                    </div>
                </span>

                <textarea
                    className="form-control"
                    rows={5}
                    value={this.content}
                    placeholder={this.exampleData}
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
                            placeholder={'Title (optional)'}
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
                                data-test="ValidationResultWarning"
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
