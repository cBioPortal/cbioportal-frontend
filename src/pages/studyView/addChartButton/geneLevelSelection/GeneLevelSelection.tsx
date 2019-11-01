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

export interface IGeneLevelSelectionProps {
    molecularProfileOptions: {
        value: string[];
        label: string;
    }[];
    submitButtonText: string;
    onSubmit: (charts: GenomicChart[]) => void;
}

@observer
export default class GeneLevelSelection extends React.Component<IGeneLevelSelectionProps, {}> {
    @observable private geneInput: string = '';
    @observable private validGenes: Gene[] = [];
    @observable private isQueryInvalid: boolean = true;
    @observable private selectedProfileOption?: {
        value: string[];
        label: string;
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
        this.isQueryInvalid = queryStr === '' || !_.isUndefined(oql.error) || genes.suggestions.length !== 0;
        this.validGenes = [];
        if (!this.isQueryInvalid) {
            this.validGenes = genes.found;
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
                />
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
                        disabled={this.isQueryInvalid}
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