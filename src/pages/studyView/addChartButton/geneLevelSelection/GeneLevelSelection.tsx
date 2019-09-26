import * as React from 'react';
import * as _ from 'lodash';
import { MolecularProfile, Gene } from 'shared/api/generated/CBioPortalAPI';
import { CustomChart, GenomicChart } from 'pages/studyView/StudyViewPageStore';
import { observer } from 'mobx-react';
import { ValidationResult, CodeEnum, ParseResult } from '../customCaseSelection/CustomCaseSelectionUtils';
import autobind from 'autobind-decorator';
import { action, computed, observable } from 'mobx';
import styles from "./styles.module.scss";
import { serializeEvent } from 'shared/lib/tracking';
import { ClinicalDataTypeEnum } from 'pages/studyView/StudyViewUtils';
import ReactSelect from "react-select";
import GeneSelectionBox, { GeneBoxType } from 'shared/components/GeneSelectionBox/GeneSelectionBox';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import { GeneReplacement } from 'shared/components/query/QueryStore';

export interface IGeneLevelSelectionProps {
    molecularProfiles: MolecularProfile[];
    submitButtonText: string;
    onSubmit: (chart: GenomicChart) => void;
}

@observer
export default class GeneLevelSelection extends React.Component<IGeneLevelSelectionProps, {}> {
    @observable dataFormatCollapsed: boolean = true;
    @observable geneInput: string = '';
    @observable validGene: Gene | undefined = undefined;
    @observable isQueryInvalid: boolean = true;
    @observable isMultipleValidGene: boolean = false;
    @observable selectedProfileOption = this.props.molecularProfiles.length > 0 ? {value: this.props.molecularProfiles[0].molecularProfileId, label: this.props.molecularProfiles[0].name} : undefined;

    public static defaultProps = {
        disableGrouping: false
    };

    @computed
    get newChartInfo(): GenomicChart {
        return {
            name: this.validGene!.hugoGeneSymbol,
            patientAttribute: false,
            molecularProfileId: this.selectedProfileOption!.value,
            entrezGeneId: this.validGene!.entrezGeneId
        }
    }

    @computed
    get molecularProfileOptions(): { value: string, label: string; }[] {
        return this.props.molecularProfiles.map((profile: MolecularProfile) => {
            return {
                value: profile.molecularProfileId,
                label: profile.name
            }
        })
    }

    @autobind
    @action
    onAddChart() {
        this.props.onSubmit(this.newChartInfo);
    }

    @computed
    get addChartButtonDisabled() {
        return !this.validGene || !this.selectedProfileOption;
    }

    @autobind
    @action
    handleSelect(option: any) {
        if (option && option.value) {
            this.selectedProfileOption = option;
        }
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
        this.isQueryInvalid = queryStr==='' || !_.isUndefined(oql.error) || genes.suggestions.length !== 0;
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
                <GeneSelectionBox
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
                            value={this.selectedProfileOption}
                            onChange={this.handleSelect}
                            options={this.molecularProfileOptions}
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