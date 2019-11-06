import * as React from 'react';
import * as _ from 'lodash';
import { Gene } from 'shared/api/generated/CBioPortalAPI';
import { GenomicChart } from 'pages/studyView/StudyViewPageStore';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { action, computed, observable } from 'mobx';
import styles from "./styles.module.scss";
import ReactSelect from "react-select";
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import { GeneReplacement } from 'shared/components/query/QueryStore';
import OQLTextArea, { GeneBoxType } from 'shared/components/GeneSelectionBox/OQLTextArea';
import classnames from 'classnames';

export interface IGeneLevelSelectionProps {
    molecularProfileOptions: {
        value: string[];
        label: string;
        description: string;
    }[];
    submitButtonText: string;
    onSubmit: (charts: GenomicChart[]) => void;
}

@observer
export default class GeneLevelSelection extends React.Component<IGeneLevelSelectionProps, {}> {
    @observable private geneInput: string = '';
    @observable private validGenes: Gene[] = [];
    @observable private isQueryInvalid: boolean = true;
    @observable private hasOQL: boolean = false;
    @observable private selectedProfileOption?: {
        value: string[];
        label: string;
        description: string;
    };

    public static defaultProps = {
        disableGrouping: false
    };

    @autobind
    @action
    private onAddChart() {
        const charts = this.validGenes.map(gene => {
            return {
                name: gene.hugoGeneSymbol + ': ' + this.selectedOption.label,
                description: this.selectedOption.description,
                patientAttribute: false,
                molecularProfileIds: this.selectedOption.value,
                hugoGeneSymbol: gene.hugoGeneSymbol
            }
        });
        this.props.onSubmit(charts);
    }

    @autobind
    @action
    private handleSelect(option: any) {
        if (option && option.value) {
            this.selectedProfileOption = option;
        }
    }

    @computed
    private get selectedOption() {
        if (this.selectedProfileOption !== undefined) {
            return this.selectedProfileOption
        }
        return this.props.molecularProfileOptions[0];
    }

    @autobind
    @action
    private updateSelectedGenes(oql: {
        query: SingleGeneQuery[],
        error?: { start: number, end: number, message: string }
    },
        genes: {
            found: Gene[];
            suggestions: GeneReplacement[];
        },
        queryStr: string) {
        this.hasOQL = false;
        this.isQueryInvalid = queryStr === '' || !_.isUndefined(oql.error) || genes.suggestions.length !== 0;

        this.validGenes = [];
        if (!this.isQueryInvalid) {
            this.hasOQL = _.some(oql.query, singleGeneQuery => singleGeneQuery.alterations !== false);
            if (!this.hasOQL) {
                this.validGenes = genes.found;
            }
        }
        this.geneInput = queryStr;
    }

    public mainContent() {
        if (this.props.molecularProfileOptions.length === 0) {
            return (<div style={{ textAlign: 'center' }}>
                No molecular profiles found
            </div>)
        }
        return (
            <div className={styles.body}>
                Gene:
                <OQLTextArea
                    inputGeneQuery={this.geneInput}
                    validateInputGeneQuery={false}
                    callback={this.updateSelectedGenes}
                    location={GeneBoxType.ONCOPRINT_HEATMAP}
                    textBoxPrompt={'Enter gene symbols'}
                />
                {
                    (this.hasOQL) && (
                        <div className={classnames("alert", styles.oqlerror)}>
                            <span className="fa fa-exclamation-circle"></span>
                            OQL not allowed
                        </div>
                    )
                }
                Molecular Profile:
                <div>
                    <ReactSelect
                        value={this.selectedOption}
                        onChange={this.handleSelect}
                        options={this.props.molecularProfileOptions}
                        isClearable={false}
                        isSearchable={false}
                    />
                </div>

                <div className={styles.operations}>
                    <button
                        disabled={this.isQueryInvalid || this.hasOQL}
                        className="btn btn-primary btn-sm"
                        data-test='GeneLevelSelectionSubmitButton'
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