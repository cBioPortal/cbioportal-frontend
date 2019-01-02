import * as React from 'react';
import * as _ from 'lodash';
import {computed, observable} from "mobx";
import {observer} from 'mobx-react';
import fileDownload from 'react-file-download';
import {AnnotatedExtendedAlteration, ExtendedAlteration, ResultsViewPageStore} from "../ResultsViewPageStore";
import {CoverageInformation} from "../ResultsViewPageStoreUtils";
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
import OqlStatusBanner from "../../../shared/components/oqlStatusBanner/OqlStatusBanner";
import WindowStore from "../../../shared/components/window/WindowStore";
import {WindowWidthBox} from "../../../shared/components/WindowWidthBox/WindowWidthBox";
import {remoteData} from "../../../shared/api/remoteData";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import onMobxPromise from "shared/lib/onMobxPromise";
import {MolecularProfile} from "shared/api/generated/CBioPortalAPI";

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

    readonly geneAlterationData = remoteData<IGeneAlteration[]>({
        await: ()=>[
            this.props.store.oqlFilteredCaseAggregatedDataByOQLLine,
            this.props.store.sequencedSampleKeysByGene
        ],
        invoke:()=>Promise.resolve(generateGeneAlterationData(
            this.props.store.oqlFilteredCaseAggregatedDataByOQLLine.result!,
            this.props.store.sequencedSampleKeysByGene.result!
        ))
    });

    readonly geneAlterationDataByGene = remoteData<{[gene: string]: IGeneAlteration}>({
        await:()=>[this.geneAlterationData],
        invoke:()=>Promise.resolve(_.keyBy(this.geneAlterationData.result!, "gene"))
    });

    readonly caseAlterationData = remoteData<ICaseAlteration[]>({
        await:()=>[
            this.props.store.selectedMolecularProfiles,
            this.props.store.oqlFilteredCaseAggregatedDataByOQLLine,
            this.props.store.coverageInformation,
            this.props.store.samples,
            this.geneAlterationDataByGene,
            this.props.store.molecularProfileIdToMolecularProfile
        ],
        invoke: ()=>Promise.resolve(generateCaseAlterationData(
            this.props.store.selectedMolecularProfiles.result!,
            this.props.store.oqlFilteredCaseAggregatedDataByOQLLine.result!,
            this.props.store.coverageInformation.result!,
            this.props.store.samples.result!,
            this.geneAlterationDataByGene.result!,
            this.props.store.molecularProfileIdToMolecularProfile.result!
        ))
    });

    readonly mutationData = remoteData<{[key: string]: ExtendedAlteration[]}>({
        await:()=>[this.props.store.nonOqlFilteredCaseAggregatedData],
        invoke:()=>Promise.resolve(generateMutationData(this.props.store.nonOqlFilteredCaseAggregatedData.result!))
    });

    readonly mutationDownloadData = remoteData<string[][]>({
        await:()=>[this.mutationData, this.props.store.samples, this.props.store.genes],
        invoke:()=>Promise.resolve(generateMutationDownloadData(
            this.mutationData.result!, this.props.store.samples.result!, this.props.store.genes.result!
        ))
    });

    readonly transposedMutationDownloadData = remoteData<string[][]>({
        await:()=>[this.mutationDownloadData],
        invoke:()=>Promise.resolve(_.unzip(this.mutationDownloadData.result!))
    });

    readonly mutationDataText = remoteData<string>({
        await:()=>[this.mutationDownloadData],
        invoke:()=>Promise.resolve(stringify2DArray(this.mutationDownloadData.result!))
    });

    readonly transposedMutationDataText = remoteData<string>({
        await:()=>[this.transposedMutationDownloadData],
        invoke:()=>Promise.resolve(stringify2DArray(this.transposedMutationDownloadData.result!))
    });

    readonly mrnaData = remoteData<{[key: string]: ExtendedAlteration[]}>({
        await:()=>[this.props.store.nonOqlFilteredCaseAggregatedData],
        invoke:()=>Promise.resolve(generateMrnaData(this.props.store.nonOqlFilteredCaseAggregatedData.result!))
    });

    readonly mrnaDownloadData = remoteData<string[][]>({
        await:()=>[this.mrnaData, this.props.store.samples, this.props.store.genes],
        invoke:()=>Promise.resolve(generateDownloadData(
            this.mrnaData.result!, this.props.store.samples.result!, this.props.store.genes.result!
        ))
    });

    readonly transposedMrnaDownloadData = remoteData<string[][]>({
        await:()=>[this.mrnaDownloadData],
        invoke:()=>Promise.resolve(_.unzip(this.mrnaDownloadData.result!))
    });

    readonly mrnaDataText = remoteData<string>({
        await:()=>[this.mrnaDownloadData],
        invoke:()=>Promise.resolve(stringify2DArray(this.mrnaDownloadData.result!))
    });

    readonly transposedMrnaDataText = remoteData<string>({
        await:()=>[this.transposedMrnaDownloadData],
        invoke:()=>Promise.resolve(stringify2DArray(this.transposedMrnaDownloadData.result!))
    });

    readonly proteinData = remoteData<{[key: string]: ExtendedAlteration[]}>({
        await:()=>[this.props.store.nonOqlFilteredCaseAggregatedData],
        invoke:()=>Promise.resolve(generateProteinData(this.props.store.nonOqlFilteredCaseAggregatedData.result!))
    });

    readonly proteinDownloadData = remoteData<string[][]>({
        await:()=>[this.proteinData, this.props.store.samples, this.props.store.genes],
        invoke:()=>Promise.resolve(generateDownloadData(
            this.proteinData.result!, this.props.store.samples.result!, this.props.store.genes.result!
        ))
    });

    readonly transposedProteinDownloadData = remoteData<string[][]>({
        await:()=>[this.proteinDownloadData],
        invoke:()=>Promise.resolve(_.unzip(this.proteinDownloadData.result!))
    });

    readonly proteinDataText = remoteData<string>({
        await:()=>[this.proteinDownloadData],
        invoke:()=>Promise.resolve(stringify2DArray(this.proteinDownloadData.result!))
    });

    readonly transposedProteinDataText = remoteData<string>({
        await:()=>[this.transposedProteinDownloadData],
        invoke:()=>Promise.resolve(stringify2DArray(this.transposedProteinDownloadData.result!))
    });

    readonly cnaData = remoteData<{[key: string]: ExtendedAlteration[]}>({
        await:()=>[this.props.store.nonOqlFilteredCaseAggregatedData],
        invoke:()=>Promise.resolve(generateCnaData(this.props.store.nonOqlFilteredCaseAggregatedData.result!))
    });

    readonly cnaDownloadData = remoteData<string[][]>({
        await:()=>[this.cnaData, this.props.store.samples, this.props.store.genes],
        invoke:()=>Promise.resolve(generateDownloadData(
            this.cnaData.result!, this.props.store.samples.result!, this.props.store.genes.result!
        ))
    });

    readonly transposedCnaDownloadData = remoteData<string[][]>({
        await:()=>[this.cnaDownloadData],
        invoke:()=>Promise.resolve(_.unzip(this.cnaDownloadData.result!))
    });

    readonly cnaDataText = remoteData<string>({
        await:()=>[this.cnaDownloadData],
        invoke:()=>Promise.resolve(stringify2DArray(this.cnaDownloadData.result!))
    });

    readonly transposedCnaDataText = remoteData<string>({
        await:()=>[this.transposedCnaDownloadData],
        invoke:()=>Promise.resolve(stringify2DArray(this.transposedCnaDownloadData.result!))
    });

    readonly alteredSamples = remoteData<string[]>({
        await:()=>[this.caseAlterationData],
        invoke:()=>Promise.resolve(this.caseAlterationData.result!
            .filter(caseAlteration => caseAlteration.altered)
            .map(caseAlteration => `${caseAlteration.studyId}:${caseAlteration.sampleId}`))
    });

    readonly alteredSamplesText = remoteData<string>({
        await: ()=>[this.alteredSamples],
        invoke:()=>Promise.resolve(this.alteredSamples.result!.join("\n"))
    });

    readonly sampleMatrix = remoteData<string[][]>({
        await:()=>[this.caseAlterationData],
        invoke:()=>Promise.resolve(this.caseAlterationData.result!
            .map(caseAlteration =>
                [`${caseAlteration.studyId}:${caseAlteration.sampleId}`, caseAlteration.altered ? "1" : "0"]))
    });

    readonly sampleMatrixText = remoteData<string>({
        await:()=>[this.sampleMatrix],
        invoke:()=>Promise.resolve(stringify2DArray(this.sampleMatrix.result!))
    });

    readonly oqls = remoteData<OQLLineFilterOutput<AnnotatedExtendedAlteration>[]>({
        await:()=>[this.props.store.oqlFilteredCaseAggregatedDataByOQLLine],
        invoke:()=>Promise.resolve(this.props.store.oqlFilteredCaseAggregatedDataByOQLLine.result!
                        .map(data => data.oql))
    });

    public render() {
        const loadingGeneAlterationData =
            this.props.store.oqlFilteredCaseAggregatedDataByOQLLine.status === "pending" ||
            this.props.store.sequencedSampleKeysByGene.status === "pending";

        const errorGeneAlterationData =
            this.props.store.oqlFilteredCaseAggregatedDataByOQLLine.status === "error" ||
            this.props.store.sequencedSampleKeysByGene.status === "error";

        const loadingCaseAlterationData =
            this.props.store.oqlFilteredCaseAggregatedDataByOQLLine.status === "pending" ||
            this.props.store.samples.status === "pending" ||
            this.props.store.coverageInformation.status === "pending";

        const errorCaseAlterationData =
            this.props.store.oqlFilteredCaseAggregatedDataByOQLLine.status === "error" ||
            this.props.store.samples.status === "error" ||
            this.props.store.coverageInformation.status === "error";

        const loadingDownloadData = loadingGeneAlterationData ||
            this.props.store.nonOqlFilteredCaseAggregatedData.status === "pending";

        const errorDownloadData = errorCaseAlterationData ||
            this.props.store.nonOqlFilteredCaseAggregatedData.status === "error";

        return (
            <WindowWidthBox data-test="downloadTabDiv" offset={60}>
                <div className={"tabMessageContainer"}>
                    <OqlStatusBanner className="download-oql-status-banner" store={this.props.store} tabReflectsOql={true} />
                </div>
                <div>
                    <FeatureTitle
                        title="Downloadable Data Files"
                        className="forceHeaderStyle h4"
                        isLoading={this.downloadableFilesTable.isPending}
                        style={{marginBottom:15}}
                    />
                    {this.downloadableFilesTable.isComplete && this.downloadableFilesTable.result}
                </div>
                <hr/>
                <div className={styles["tables-container"]} data-test="dataDownloadGeneAlterationTable">
                    <FeatureTitle
                        title="Gene Alteration Frequency"
                        isLoading={this.geneAlterationData.isPending}
                        className="pull-left forceHeaderStyle h4"
                    />
                    {this.geneAlterationData.isComplete && (<GeneAlterationTable geneAlterationData={this.geneAlterationData.result} />)}
                </div>
                <hr/>
                <div className={styles["tables-container"]}>
                    <FeatureTitle
                        title="Type of Genetic Alterations Across All Samples"
                        isLoading={this.caseAlterationData.isPending || this.oqls.isPending}
                        className="pull-left forceHeaderStyle h4"
                    />
                    {this.oqls.isComplete && this.caseAlterationData.isComplete && this.props.store.alterationsBySelectedMolecularProfiles.isComplete && (
                        <CaseAlterationTable
                            caseAlterationData={this.caseAlterationData.result}
                            oqls={this.oqls.result}
                            alterationTypes={this.props.store.alterationsBySelectedMolecularProfiles.result}
                        />
                    )}
                </div>
            </WindowWidthBox>
        );
    }

    readonly downloadableFilesTable = remoteData({
        await:()=>[
            this.cnaData, this.mutationData, this.mrnaData, this.proteinData,
            this.alteredSamplesDownloadControls, this.sampleMatrixDownloadControls
        ],
        invoke:()=>Promise.resolve(
            <table className={ classNames("table", "table-striped", styles.downloadCopyTable) }>
                <tbody>
                    {hasValidData(this.cnaData.result!) && this.cnaDownloadControls()}
                    {hasValidMutationData(this.mutationData.result!) && this.mutationDownloadControls()}
                    {hasValidData(this.mrnaData.result!) && this.mrnaExprDownloadControls()}
                    {hasValidData(this.proteinData.result!) && this.proteinExprDownloadControls()}
                    {this.alteredSamplesDownloadControls.result!}
                    {this.sampleMatrixDownloadControls.result!}
                </tbody>
            </table>
        )
    });

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

    readonly alteredSamplesDownloadControls = remoteData({
        await:()=>[this.alteredSamplesText],
        invoke:()=>{
            const handleDownload = () => this.alteredSamplesText.result!;

            return Promise.resolve(this.copyDownloadControlsRow("Samples affected: Only samples with an alteration are included",
                                                handleDownload,
                                                "affected_samples.txt"));
        }
    });

    readonly sampleMatrixDownloadControls = remoteData({
        await:()=>[this.sampleMatrixText],
        invoke:()=>{
            const handleDownload = () => this.sampleMatrixText.result!;

            return Promise.resolve(this.copyDownloadControlsRow("Sample matrix: 1 = Sample harbors alteration in one of the input genes",
                                                handleDownload,
                                                "sample_matrix.txt"));
        }
    });

    private handleMutationDownload()
    {
        onMobxPromise(this.mutationDataText, text=>fileDownload(text, "mutations.txt"));
    }

    private handleTransposedMutationDownload()
    {
        onMobxPromise(this.transposedMutationDataText, text=>fileDownload(text, "mutations_transposed.txt"));
    }

    private handleMrnaDownload()
    {
        onMobxPromise(this.mrnaDataText, text=>fileDownload(text, "mRNA_exp.txt"));
    }

    private handleTransposedMrnaDownload()
    {
        onMobxPromise(this.transposedMrnaDataText, text=>fileDownload(text, "mRNA_exp_transposed.txt"));
    }

    private handleProteinDownload()
    {
        onMobxPromise(this.proteinDataText, text=>fileDownload(text, "protein_exp.txt"));
    }

    private handleTransposedProteinDownload()
    {
        onMobxPromise(this.transposedProteinDataText, text=>fileDownload(text, "protein_exp_transposed.txt"));
    }

    private handleCnaDownload()
    {
        onMobxPromise(this.cnaDataText, text=>fileDownload(text, "cna.txt"));
    }

    private handleTransposedCnaDownload()
    {
        onMobxPromise(this.transposedCnaDataText, text=>fileDownload(text, "cna_transposed.txt"));
    }
}