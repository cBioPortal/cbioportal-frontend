import * as React from 'react';
import * as _ from 'lodash';
import { MolecularProfile, Gene } from 'shared/api/generated/CBioPortalAPI';
import { GenomicChart } from 'pages/studyView/StudyViewPageStore';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { action, computed, observable } from 'mobx';
import styles from "./styles.module.scss";
import ReactSelect from "react-select";
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import { GeneReplacement } from 'shared/components/query/QueryStore';
import { AlterationTypeConstants } from 'pages/resultsView/ResultsViewPageStore';
import OQLTextArea, { GeneBoxType } from 'shared/components/GeneSelectionBox/OQLTextArea';

export interface IGeneLevelSelectionProps {
    molecularProfileOptions: {
        value: string[];
        label: string;
    }[];
    submitButtonText: string;
    onSubmit: (chart: GenomicChart) => void;
}

@observer
export default class GeneLevelSelection extends React.Component<IGeneLevelSelectionProps, {}> {
    @observable private geneInput: string = '';
    @observable private validGene: Gene | undefined = undefined;
    @observable private isQueryInvalid: boolean = true;
    @observable private isMultipleValidGene: boolean = false;
    @observable private selectedProfileOption?: {
        value: string[];
        label: string;
    };

    public static defaultProps = {
        disableGrouping: false
    };

    @computed
    private get newChartInfo(): GenomicChart {
        return {
            name: this.validGene!.hugoGeneSymbol + ': ' + this.selectedProfileOption!.label,
            patientAttribute: false,
            molecularProfileIds: this.selectedProfileOption!.value,
            hugoGeneSymbol: this.validGene!.hugoGeneSymbol
        }
    }

    @autobind
    @action
    private onAddChart() {
        this.props.onSubmit(this.newChartInfo);
    }

    @computed
    private get addChartButtonDisabled() {
        return !this.validGene || !this.selectedProfileOption;
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
        this.validGene = undefined;
        this.isMultipleValidGene = false;
        if (genes.found.length === 1 && !this.isQueryInvalid) {
            this.validGene = genes.found[0];
        }
        if (genes.found.length > 1 && !this.isQueryInvalid) {
            this.isMultipleValidGene = true;
        }
        this.geneInput = queryStr;
    }

    public mainContent() {
        return (
            <div className={styles.body}>
                Gene:
                <OQLTextArea
                    inputGeneQuery={this.geneInput}
                    validateInputGeneQuery={false}
                    callback={this.updateSelectedGenes}
                    location={GeneBoxType.ONCOPRINT_HEATMAP}
                />
                {
                    (this.geneInput && !this.validGene && this.isMultipleValidGene) && (
                        <div className="alert alert-warning" role="alert">Should just have one valid gene. Please modify your input.</div>
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
                        disabled={this.addChartButtonDisabled}
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