import * as React from 'react';
import * as _ from 'lodash';
import { GenomicChart } from 'pages/studyView/StudyViewPageStore';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { action, computed, makeObservable, observable } from 'mobx';
import styles from './styles.module.scss';
import ReactSelect from 'react-select';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import { GeneReplacement } from 'shared/components/query/QueryStore';
import OQLTextArea, {
    GeneBoxType,
} from 'shared/components/GeneSelectionBox/OQLTextArea';
import classnames from 'classnames';
import MobxPromise from 'mobxpromise';
import { MakeMobxView } from 'shared/components/MobxView';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from 'shared/components/ErrorMessage';
import { Gene } from 'cbioportal-ts-api-client';
import { MolecularProfileOption } from 'pages/studyView/StudyViewUtils';

export interface IGeneLevelSelectionProps {
    molecularProfileOptionsPromise: MobxPromise<MolecularProfileOption[]>;
    submitButtonText: string;
    onSubmit: (charts: GenomicChart[]) => void;
    containerWidth: number;
}

@observer
export default class GeneLevelSelection extends React.Component<
    IGeneLevelSelectionProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @observable private _selectedProfileOption?: {
        value: string;
        label: string;
        profileName: string;
        description: string;
    };

    @observable private _oql?: {
        query: SingleGeneQuery[];
        error?: { start: number; end: number; message: string };
    };
    @observable private _genes?: {
        found: Gene[];
        suggestions: GeneReplacement[];
    };
    @observable.ref private _queryStr?: string;

    public static defaultProps = {
        disableGrouping: false,
    };

    @action.bound
    private onAddChart() {
        if (this.selectedOption !== undefined) {
            const charts = this.validGenes.map(gene => {
                return {
                    name:
                        gene.hugoGeneSymbol +
                        ': ' +
                        this.selectedOption!.profileName,
                    description: this.selectedOption!.description,
                    profileType: this.selectedOption!.value,
                    hugoGeneSymbol: gene.hugoGeneSymbol,
                };
            });
            this.props.onSubmit(charts);
        }
    }

    @action.bound
    private handleSelect(option: any) {
        if (option && option.value) {
            this._selectedProfileOption = option;
        }
    }

    @computed
    private get selectedOption() {
        if (this._selectedProfileOption !== undefined) {
            return this._selectedProfileOption;
        }
        if (this.props.molecularProfileOptionsPromise.isComplete) {
            return this.molecularProfileOptions[0];
        }
        return undefined;
    }

    @computed
    private get isQueryInvalid() {
        return (
            this._queryStr === '' ||
            this._oql === undefined ||
            this._genes === undefined ||
            !_.isUndefined(this._oql!.error) ||
            this._genes!.suggestions.length !== 0
        );
    }

    @computed
    private get hasOQL() {
        if (!this.isQueryInvalid) {
            return _.some(
                this._oql!.query,
                singleGeneQuery => singleGeneQuery.alterations !== false
            );
        }
        return false;
    }

    @computed
    private get validGenes() {
        if (!this.isQueryInvalid && !this.hasOQL) {
            return this._genes!.found;
        }
        return [];
    }

    @computed
    private get molecularProfileOptions() {
        if (this.props.molecularProfileOptionsPromise.isComplete) {
            return this.props.molecularProfileOptionsPromise.result!.map(
                option => {
                    return {
                        ...option,
                        label: `${option.label} (${option.count} samples)`,
                        profileName: option.label,
                    };
                }
            );
        }
        return [];
    }

    private readonly genomicChartSelection = MakeMobxView({
        await: () => [this.props.molecularProfileOptionsPromise],
        render: () => {
            if (
                this.props.molecularProfileOptionsPromise.result!.length === 0
            ) {
                return (
                    <div style={{ textAlign: 'center' }}>
                        No molecular profiles found
                    </div>
                );
            }
            return (
                <div style={{ width: this.props.containerWidth - 20 }}>
                    <OQLTextArea
                        inputGeneQuery={this._queryStr}
                        validateInputGeneQuery={false}
                        callback={(...args) => {
                            this._oql = args[0];
                            this._genes = args[1];
                            this._queryStr = args[2];
                        }}
                        location={GeneBoxType.DEFAULT}
                        textBoxPrompt={'Enter gene symbols'}
                        textAreaHeight="40px"
                    />
                    {this.hasOQL && (
                        <div className={classnames('alert', styles.oqlerror)}>
                            <span className="fa fa-exclamation-circle"></span>
                            OQL not allowed
                        </div>
                    )}
                    <div style={{ display: 'flex', marginTop: '10px' }}>
                        <div
                            style={{
                                flex: 1,
                                marginRight: 15,
                            }}
                        >
                            <ReactSelect
                                value={this.selectedOption}
                                onChange={this.handleSelect}
                                options={this.molecularProfileOptions}
                                isClearable={false}
                                isSearchable={false}
                            />
                        </div>
                        <button
                            disabled={this.isQueryInvalid || this.hasOQL}
                            className="btn btn-primary btn-sm"
                            data-test="GeneLevelSelectionSubmitButton"
                            onClick={this.onAddChart}
                        >
                            {this.props.submitButtonText}
                        </button>
                    </div>
                    {/* <div className={styles.operations}>
                        
                    </div> */}
                </div>
            );
        },
        renderPending: () => (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <LoadingIndicator isLoading={true} />
                Calculating data availability...
            </div>
        ),
        renderError: () => (
            <div>
                <ErrorMessage
                    message={
                        'There was an error loading data. Please try again.'
                    }
                />
            </div>
        ),
    });

    render() {
        return this.genomicChartSelection.component;
    }
}
