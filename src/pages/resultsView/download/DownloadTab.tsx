import * as React from 'react';
import * as _ from 'lodash';
import {computed} from "mobx";
import {observer} from 'mobx-react';
import fileDownload from 'react-file-download';
import {AnnotatedExtendedAlteration, ExtendedAlteration, ResultsViewPageStore} from "../ResultsViewPageStore";
import {OQLLineFilterOutput} from "shared/lib/oql/oqlfilter";
import FeatureTitle from "shared/components/featureTitle/FeatureTitle";
import {SimpleCopyDownloadControls} from "shared/components/copyDownloadControls/SimpleCopyDownloadControls";
import {default as GeneAlterationTable, IGeneAlteration} from "./GeneAlterationTable";
import {default as CaseAlterationTable, ICaseAlteration} from "./CaseAlterationTable";
import {
    generateCaseAlterationData, generateCnaData, generateDownloadData, generateGeneAlterationData, generateMrnaData,
    generateMutationData, generateMutationDownloadData,
    generateProteinData, hasValidData, hasValidMutationData, stringify2DArray
} from "./DownloadUtils";

import styles from "./styles.module.scss";
import classNames from 'classnames';

export interface IDownloadTabProps {
    store: ResultsViewPageStore;
}

@observer
export default class DownloadTab extends React.Component<IDownloadTabProps, {}>
{
    constructor(props: IDownloadTabProps)
    {
        super(props);

        this.handleMutationDownload = this.handleMutationDownload.bind(this);
        this.handleTransposedMutationDownload = this.handleTransposedMutationDownload.bind(this);
        this.handleCnaDownload = this.handleCnaDownload.bind(this);
        this.handleTransposedCnaDownload = this.handleTransposedCnaDownload.bind(this);
        this.handleMrnaDownload = this.handleMrnaDownload.bind(this);
        this.handleTransposedMrnaDownload = this.handleTransposedMrnaDownload.bind(this);
        this.handleProteinDownload = this.handleProteinDownload.bind(this);
        this.handleTransposedProteinDownload = this.handleTransposedProteinDownload.bind(this);
    }

    @computed get caseAggregatedDataByOQLLine() {
        return this.props.store.putativeDriverFilteredCaseAggregatedDataByOQLLine.result;
    }

    @computed get unfilteredCaseAggregatedData() {
        return this.props.store.unfilteredCaseAggregatedData.result;
    }

    @computed get sequencedSampleKeysByGene() {
        return this.props.store.sequencedSampleKeysByGene.result;
    }

    @computed get samples() {
        return this.props.store.samples.result;
    }

    @computed get genes() {
        return this.props.store.genes.result;
    }

    @computed get genePanelInformation() {
        return this.props.store.genePanelInformation.result;
    }

    @computed get geneAlterationData(): IGeneAlteration[] {
        return generateGeneAlterationData(this.caseAggregatedDataByOQLLine, this.sequencedSampleKeysByGene);
    }

    @computed get caseAlterationData(): ICaseAlteration[] {
        return generateCaseAlterationData(
            this.caseAggregatedDataByOQLLine, this.genePanelInformation, this.samples);
    }

    @computed get mutationData(): {[key: string]: ExtendedAlteration[]} {
        return generateMutationData(this.unfilteredCaseAggregatedData);
    }

    @computed get mutationDownloadData(): string[][] {
        return generateMutationDownloadData(this.mutationData, this.samples, this.genes);
    }

    @computed get transposedMutationDownloadData(): string[][] {
        return _.unzip(this.mutationDownloadData);
    }

    @computed get mutationDataText(): string {
        return stringify2DArray(this.mutationDownloadData);
    }

    @computed get transposedMutationDataText(): string {
        return stringify2DArray(this.transposedMutationDownloadData);
    }

    @computed get mrnaData(): {[key: string]: ExtendedAlteration[]} {
        return generateMrnaData(this.unfilteredCaseAggregatedData);
    }

    @computed get mrnaDownloadData(): string[][] {
        return generateDownloadData(this.mrnaData, this.samples, this.genes);
    }

    @computed get transposedMrnaDownloadData(): string[][] {
        return _.unzip(this.mrnaDownloadData);
    }

    @computed get mrnaDataText(): string {
        return stringify2DArray(this.mrnaDownloadData);
    }

    @computed get transposedMrnaDataText(): string {
        return stringify2DArray(this.transposedMrnaDownloadData);
    }

    @computed get proteinData(): {[key: string]: ExtendedAlteration[]} {
        return generateProteinData(this.unfilteredCaseAggregatedData);
    }

    @computed get proteinDownloadData(): string[][] {
        return generateDownloadData(this.proteinData, this.samples, this.genes);
    }

    @computed get transposedProteinDownloadData(): string[][] {
        return _.unzip(this.proteinDownloadData);
    }

    @computed get proteinDataText(): string {
        return stringify2DArray(this.proteinDownloadData);
    }

    @computed get transposedProteinDataText(): string {
        return stringify2DArray(this.transposedProteinDownloadData);
    }

    @computed get cnaData(): {[key: string]: ExtendedAlteration[]} {
        return generateCnaData(this.unfilteredCaseAggregatedData);
    }

    @computed get cnaDownloadData(): string[][] {
        return generateDownloadData(this.cnaData, this.samples, this.genes);
    }

    @computed get transposedCnaDownloadData(): string[][] {
        return _.unzip(this.cnaDownloadData);
    }

    @computed get cnaDataText(): string {
        return stringify2DArray(this.cnaDownloadData);
    }

    @computed get transposedCnaDataText(): string {
        return stringify2DArray(this.transposedCnaDownloadData);
    }

    @computed get alteredSamples(): string[] {
        return this.caseAlterationData
            .filter(caseAlteration => caseAlteration.altered)
            .map(caseAlteration => `${caseAlteration.studyId}:${caseAlteration.sampleId}`);
    }

    @computed get alteredSamplesText(): string {
        return this.alteredSamples.join("\n");
    }

    @computed get sampleMatrix(): string[][] {
        return this.caseAlterationData
            .map(caseAlteration =>
                [`${caseAlteration.studyId}:${caseAlteration.sampleId}`, caseAlteration.altered ? "1" : "0"]);
    }

    @computed get sampleMatrixText(): string {
        return stringify2DArray(this.sampleMatrix);
    }

    @computed get oqls(): OQLLineFilterOutput<AnnotatedExtendedAlteration>[] {
        return this.caseAggregatedDataByOQLLine ?
            this.caseAggregatedDataByOQLLine.map(data => data.oql) : [];
    }

    public render() {
        const loadingGeneAlterationData =
            this.props.store.putativeDriverFilteredCaseAggregatedDataByOQLLine.status === "pending" ||
            this.props.store.sequencedSampleKeysByGene.status === "pending";

        const errorGeneAlterationData =
            this.props.store.putativeDriverFilteredCaseAggregatedDataByOQLLine.status === "error" ||
            this.props.store.sequencedSampleKeysByGene.status === "error";

        const loadingCaseAlterationData =
            this.props.store.putativeDriverFilteredCaseAggregatedDataByOQLLine.status === "pending" ||
            this.props.store.samples.status === "pending" ||
            this.props.store.genePanelInformation.status === "pending";

        const errorCaseAlterationData =
            this.props.store.putativeDriverFilteredCaseAggregatedDataByOQLLine.status === "error" ||
            this.props.store.samples.status === "error" ||
            this.props.store.genePanelInformation.status === "error";

        const loadingDownloadData = loadingGeneAlterationData ||
            this.props.store.unfilteredCaseAggregatedData.status === "pending";

        const errorDownloadData = errorCaseAlterationData ||
            this.props.store.unfilteredCaseAggregatedData.status === "error";

        return (
            <div className="cbioportal-frontend">
                <div>
                    <FeatureTitle
                        title="Downloadable Data Files"
                        className="forceHeaderStyle h4"
                        isLoading={loadingDownloadData}
                        style={{marginBottom:15}}
                    />
                    {!loadingDownloadData && !errorDownloadData && this.downloadableFilesTable()}
                </div>
                <hr/>
                <div className={styles["tables-container"]}>
                    <FeatureTitle
                        title="Gene Alteration Frequency"
                        isLoading={loadingGeneAlterationData}
                        className="pull-left forceHeaderStyle h4"
                    />
                    <GeneAlterationTable geneAlterationData={this.geneAlterationData} />
                </div>
                <hr/>
                <div className={styles["tables-container"]}>
                    <FeatureTitle
                        title="Type of Genetic Alterations Across All Samples"
                        isLoading={loadingCaseAlterationData}
                        className="pull-left forceHeaderStyle h4"
                    />
                    <CaseAlterationTable
                        caseAlterationData={this.caseAlterationData}
                        oqls={this.oqls}
                    />
                </div>
            </div>
        );
    }

    private downloadableFilesTable(): JSX.Element
    {
        return (
            <table className={ classNames("table", "table-striped", styles.downloadCopyTable) }>
                <tbody>
                    {hasValidData(this.cnaData) && this.cnaDownloadControls()}
                    {hasValidMutationData(this.mutationData) && this.mutationDownloadControls()}
                    {hasValidData(this.mrnaData) && this.mrnaExprDownloadControls()}
                    {hasValidData(this.proteinData) && this.proteinExprDownloadControls()}
                    {this.alteredSamplesDownloadControls()}
                    {this.sampleMatrixDownloadControls()}
                </tbody>
            </table>
        );
    }

    private cnaDownloadControls(): JSX.Element
    {
        return this.downloadControlsRow("Copy-number Alterations",
                                        this.handleCnaDownload,
                                        this.handleTransposedCnaDownload);
    }

    private mutationDownloadControls(): JSX.Element
    {
        return this.downloadControlsRow("Mutations",
                                        this.handleMutationDownload,
                                        this.handleTransposedMutationDownload);
    }

    private mrnaExprDownloadControls(): JSX.Element
    {
        return this.downloadControlsRow("mRNA Expression",
                                        this.handleMrnaDownload,
                                        this.handleTransposedMrnaDownload);
    }

    private proteinExprDownloadControls(): JSX.Element
    {
        return this.downloadControlsRow("Protein Expression",
                                        this.handleProteinDownload,
                                        this.handleTransposedProteinDownload);
    }

    private downloadControlsRow(title:string,
                                handleTabDelimitedDownload: () => void,
                                handleTransposedMatrixDownload: () => void)
    {
        return (
            <tr>
                <td style={{width: 500}}>{title}</td>
                <td>
                    <a onClick={handleTabDelimitedDownload}>
                        <i className='fa fa-cloud-download' style={{marginRight: 5}}/>Tab Delimited Format
                    </a>
                    <span style={{margin:'0px 10px'}}>|</span>
                    <a onClick={handleTransposedMatrixDownload}>
                        <i className='fa fa-cloud-download' style={{marginRight: 5}}/>Transposed Matrix
                    </a>
                </td>
            </tr>
        );
    }

    private copyDownloadControlsRow(title:string,
                                    handleDownload: () => string,
                                    filename: string)
    {
        return (
            <tr>
                <td>{title}</td>
                <td>
                    <SimpleCopyDownloadControls
                        controlsStyle='LINK'
                        downloadData={handleDownload}
                        downloadFilename={filename}
                    />
                </td>
            </tr>
        );
    }

    private alteredSamplesDownloadControls(): JSX.Element
    {
        const handleDownload = () => this.alteredSamplesText;

        return this.copyDownloadControlsRow("Samples affected: Only samples with an alteration are included",
                                            handleDownload,
                                            "affected_samples.txt");
    }

    private sampleMatrixDownloadControls(): JSX.Element
    {
        const handleDownload = () => this.sampleMatrixText;

        return this.copyDownloadControlsRow("Sample matrix: 1 = Sample harbors alteration in one of the input genes",
                                            handleDownload,
                                            "sample_matrix.txt");
    }

    private handleMutationDownload()
    {
        fileDownload(this.mutationDataText, "mutations.txt");
    }

    private handleTransposedMutationDownload()
    {
        fileDownload(this.transposedMutationDataText, "mutations_transposed.txt");
    }

    private handleMrnaDownload()
    {
        fileDownload(this.mrnaDataText, "mRNA_exp.txt");
    }

    private handleTransposedMrnaDownload()
    {
        fileDownload(this.transposedMrnaDataText, "mRNA_exp_transposed.txt");
    }

    private handleProteinDownload()
    {
        fileDownload(this.proteinDataText, "protein_exp.txt");
    }

    private handleTransposedProteinDownload()
    {
        fileDownload(this.transposedProteinDataText, "protein_exp_transposed.txt");
    }

    private handleCnaDownload()
    {
        fileDownload(this.cnaDataText, "cna.txt");
    }

    private handleTransposedCnaDownload()
    {
        fileDownload(this.transposedCnaDataText, "cna_transposed.txt");
    }
}