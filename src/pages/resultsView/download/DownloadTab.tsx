import * as React from 'react';
import * as _ from 'lodash';
import {computed, observable, action} from "mobx";
import {observer} from 'mobx-react';
import fileDownload from 'react-file-download';
import {AnnotatedExtendedAlteration, ExtendedAlteration, ResultsViewPageStore, ModifyQueryParams} from "../ResultsViewPageStore";
import {CoverageInformation, getSingleGeneResultKey, getMultipleGeneResultKey} from "../ResultsViewPageStoreUtils";
import {OQLLineFilterOutput, UnflattenedOQLLineFilterOutput, MergedTrackLineFilterOutput} from "shared/lib/oql/oqlfilter";
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
import OqlStatusBanner from "../../../shared/components/banners/OqlStatusBanner";
import WindowStore from "../../../shared/components/window/WindowStore";
import {WindowWidthBox} from "../../../shared/components/WindowWidthBox/WindowWidthBox";
import {remoteData} from "../../../public-lib/api/remoteData";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import onMobxPromise from "shared/lib/onMobxPromise";
import {MolecularProfile, Sample} from "shared/api/generated/CBioPortalAPI";
import {getMobxPromiseGroupStatus} from "../../../shared/lib/getMobxPromiseGroupStatus";
import ErrorMessage from "../../../shared/components/ErrorMessage";
import AlterationFilterWarning from "../../../shared/components/banners/AlterationFilterWarning";
import sessionServiceClient from "shared/api//sessionServiceInstance";
import { buildCBioPortalPageUrl } from 'shared/api/urls';
import { MakeMobxView } from 'shared/components/MobxView';
import { CUSTOM_CASE_LIST_ID } from 'shared/components/query/QueryStore';
import { IVirtualStudyProps } from 'pages/studyView/virtualStudy/VirtualStudy';
import { Alteration } from 'shared/lib/oql/oql-parser';

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
            this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine,
            this.props.store.coverageInformation,
            this.props.store.samples,
            this.geneAlterationDataByGene,
            this.props.store.molecularProfileIdToMolecularProfile,
        ],
        invoke: ()=>Promise.resolve(generateCaseAlterationData(
            this.props.store.rvQuery.oqlQuery,
            this.props.store.selectedMolecularProfiles.result!,
            this.props.store.oqlFilteredCaseAggregatedDataByOQLLine.result!,
            this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!,
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

    readonly alteredCaseAlterationData = remoteData<ICaseAlteration[]>({
        await:()=>[this.caseAlterationData],
        invoke:()=>Promise.resolve(this.caseAlterationData.result!
            .filter(caseAlteration => caseAlteration.altered))
    });

    readonly unalteredCaseAlterationData = remoteData<ICaseAlteration[]>({
        await:()=>[this.caseAlterationData],
        invoke:()=>Promise.resolve(this.caseAlterationData.result!
            .filter(caseAlteration => !caseAlteration.altered))
    });

    readonly sampleMatrix = remoteData<string[][]>({
        await:()=>[this.caseAlterationData],
        invoke:()=>{
            let result : string[][] = [];
            _.map(this.caseAlterationData.result!, (caseAlteration) => {
                // if writing the first line, add titles
                if (_.isEmpty(result)) {
                    const titleMap = _.keys(caseAlteration.oqlDataByGene);
                    result.push(['studyID:sampleId', 'Altered', ...titleMap]);
                }
                // get altered infomation by gene
                const genesAlteredData = _.map(caseAlteration.oqlDataByGene, (oqlData) => {
                    return _.isEmpty(oqlData.alterationTypes) ? "0" : "1";
                });
                result.push([`${caseAlteration.studyId}:${caseAlteration.sampleId}`, caseAlteration.altered ? "1" : "0", ...genesAlteredData]);
            })
            return Promise.resolve(result);
        }
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

    readonly trackLabels = remoteData({
        await:()=>[this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine],
        invoke:()=> {
            const labels: string[] = [];
            this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach((data, index) => {
                // mergedTrackOqlList is undefined means the data is for single track / oql
                if (data.mergedTrackOqlList === undefined) {
                    labels.push(getSingleGeneResultKey(index, this.props.store.rvQuery.oqlQuery, data.oql as OQLLineFilterOutput<AnnotatedExtendedAlteration>));
                }
                // or data is for merged track (group: list of oqls)
                else {
                    labels.push(getMultipleGeneResultKey(data.oql as MergedTrackLineFilterOutput<AnnotatedExtendedAlteration>));
                }
            })
            return Promise.resolve(labels);
        }
    });

    readonly trackAlterationTypesMap = remoteData({
        await:()=>[this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine],
        invoke:()=> {
            const trackAlterationTypesMap: {[label:string]: string[]} = {};
            this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach((data, index) => {
                // mergedTrackOqlList is undefined means the data is for single track / oql
                if (data.mergedTrackOqlList === undefined) {
                    const singleTrackOql = data.oql as OQLLineFilterOutput<AnnotatedExtendedAlteration>;
                    const label = getSingleGeneResultKey(index, this.props.store.rvQuery.oqlQuery, data.oql as OQLLineFilterOutput<AnnotatedExtendedAlteration>);
                    // put types for single track into the map, key is track label
                    if (singleTrackOql.parsed_oql_line.alterations) {
                        trackAlterationTypesMap[label] = _.uniq(_.map(singleTrackOql.parsed_oql_line.alterations, (alteration) => alteration.alteration_type.toUpperCase()));
                    }
                }
                // or data is for merged track (group: list of oqls)
                else {
                    const mergedTrackOql = data.oql as MergedTrackLineFilterOutput<AnnotatedExtendedAlteration>;
                    const label = getMultipleGeneResultKey(data.oql as MergedTrackLineFilterOutput<AnnotatedExtendedAlteration>);
                    // put types for merged track into the map, key is track label
                    let alterations: string[] = [];
                    _.forEach(mergedTrackOql.list, (oql: OQLLineFilterOutput<AnnotatedExtendedAlteration>) => {
                        if (oql.parsed_oql_line.alterations) {
                            const types: string[] = _.map(oql.parsed_oql_line.alterations, (alteration) => alteration.alteration_type.toUpperCase());
                            alterations.push(...types);
                        }
                    })
                    trackAlterationTypesMap[label] = _.uniq(alterations);
                }
            })
            return Promise.resolve(trackAlterationTypesMap);
        }
    });

    readonly geneAlterationMap = remoteData({
        await:()=>[this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine],
        invoke:()=> {
            const geneAlterationMap: {[label:string]: Alteration[]} = {};
            this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach((data, index) => {
                // mergedTrackOqlList is undefined means the data is for single track / oql
                if (data.mergedTrackOqlList === undefined) {
                    const singleTrackOql = data.oql as OQLLineFilterOutput<AnnotatedExtendedAlteration>;
                    // put types for single track into the map, key is gene name
                    if (singleTrackOql.parsed_oql_line.alterations) {
                        geneAlterationMap[singleTrackOql.gene] = _.chain(singleTrackOql.parsed_oql_line.alterations)
                                                                       .union(geneAlterationMap[singleTrackOql.gene])
                                                                       .uniq()
                                                                       .value();
                    }
                }
                // or data is for merged track (group: list of oqls)
                else {
                    const mergedTrackOql = data.oql as MergedTrackLineFilterOutput<AnnotatedExtendedAlteration>;
                    // put types for merged track into the map, key is gene name
                    let alterations: string[] = [];
                    _.forEach(mergedTrackOql.list, (oql: OQLLineFilterOutput<AnnotatedExtendedAlteration>) => {
                        if (oql.parsed_oql_line.alterations) {
                            const types: string[] = _.map(oql.parsed_oql_line.alterations, (alteration) => alteration.alteration_type);
                            geneAlterationMap[oql.gene] = _.chain(oql.parsed_oql_line.alterations)
                                                                .union(geneAlterationMap[oql.gene])
                                                                .uniq()
                                                                .value();
                        }
                    })
                }
            })
            return Promise.resolve(geneAlterationMap);
        }
    });

    public render() {
        const status = getMobxPromiseGroupStatus(this.geneAlterationData, this.caseAlterationData, this.oqls, this.trackLabels, this.trackAlterationTypesMap, this.geneAlterationMap, this.cnaData, this.mutationData, 
            this.mrnaData, this.proteinData, this.unalteredCaseAlterationData, this.alteredCaseAlterationData, this.props.store.virtualStudyParams, this.sampleMatrixText);

        switch (status) {
            case "pending":
                return <LoadingIndicator isLoading={true} center={true} size={"big"}/>;
            case "error":
                return <ErrorMessage/>;
            case "complete":
                return (
                    <WindowWidthBox data-test="downloadTabDiv" offset={60}>
                        <div className={"tabMessageContainer"}>
                            <OqlStatusBanner className="download-oql-status-banner" store={this.props.store} tabReflectsOql={true} />
                            <AlterationFilterWarning store={this.props.store}/>
                        </div>
                        <div>
                            <FeatureTitle
                                title="Downloadable Data Files"
                                className="forceHeaderStyle h4"
                                isLoading={false}
                                style={{marginBottom:15}}
                            />
                            <table className={ classNames("table", "table-striped", styles.downloadCopyTable) }>
                                <tbody>
                                    {hasValidData(this.cnaData.result!) && this.cnaDownloadControls()}
                                    {hasValidMutationData(this.mutationData.result!) && this.mutationDownloadControls()}
                                    {hasValidData(this.mrnaData.result!) && this.mrnaExprDownloadControls()}
                                    {hasValidData(this.proteinData.result!) && this.proteinExprDownloadControls()}
                                    {this.alteredSamplesDownloadControls(this.alteredCaseAlterationData.result!, this.props.store.virtualStudyParams.result!)}
                                    {this.unalteredSamplesDownloadControls(this.unalteredCaseAlterationData.result!, this.props.store.virtualStudyParams.result!)}
                                    {this.sampleMatrixDownloadControls(this.sampleMatrixText.result!)}
                                </tbody>
                            </table>
                        </div>
                        <hr/>
                        <div className={styles["tables-container"]} data-test="dataDownloadGeneAlterationTable">
                            <FeatureTitle
                                title="Gene Alteration Frequency"
                                isLoading={false}
                                className="pull-left forceHeaderStyle h4"
                            />
                            <GeneAlterationTable geneAlterationData={this.geneAlterationData.result!} />
                        </div>
                        <hr/>
                        <div className={styles["tables-container"]}>
                            <FeatureTitle
                                title="Type of Genetic Alterations Across All Samples"
                                isLoading={false}
                                className="pull-left forceHeaderStyle h4"
                            />
                            <CaseAlterationTable
                                caseAlterationData={this.caseAlterationData.result!}
                                oqls={this.oqls.result!}
                                trackLabels={this.trackLabels.result!}
                                trackAlterationTypesMap={this.trackAlterationTypesMap.result!}
                                geneAlterationTypesMap={this.geneAlterationMap.result!}
                            />
                        </div>
                    </WindowWidthBox>
                );
            default:
                return <ErrorMessage/>;
        }
    }

    private cnaDownloadControls(): JSX.Element
    {
        return this.downloadControlsRow("Copy-number Alterations (OQL is not in effect)",
                                        this.handleCnaDownload,
                                        this.handleTransposedCnaDownload);
    }

    private mutationDownloadControls(): JSX.Element
    {
        return this.downloadControlsRow("Mutations (OQL is not in effect)",
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

    private copyDownloadQueryControlsRow(title:string,
                                    handleDownload: () => string,
                                    filename: string,
                                    handleQuery: () => void,
                                    virtualStudyParams: any)
    {
        return (
            <tr>
                <td>{title}</td>
                <td>
                    <SimpleCopyDownloadControls
                        controlsStyle='QUERY'
                        downloadData={handleDownload}
                        downloadFilename={filename}
                        handleQuery={handleQuery}
                        virtualStudyParams={virtualStudyParams}
                    />
                </td>
            </tr>
        );
    }

    private alteredSamplesDownloadControls(alteredCaseAlterationData: ICaseAlteration[], virtualStudyParams: IVirtualStudyProps)
    {
        const alteredSampleCaseIds = _.map(alteredCaseAlterationData, caseAlteration => `${caseAlteration.studyId}:${caseAlteration.sampleId}`);
        const handleDownload = () => alteredSampleCaseIds.join("\n");
        const handleQuery = () => this.handleQueryButtonClick(alteredSampleCaseIds);
        const alteredSamplesVirtualStudyParams = {
                "user": virtualStudyParams.user,
                "name": virtualStudyParams.name,
                "description": virtualStudyParams.description,
                "studyWithSamples": virtualStudyParams.studyWithSamples,
                "selectedSamples": _.filter(virtualStudyParams.selectedSamples, ((sample: Sample) => alteredSampleCaseIds.includes(`${sample.studyId}:${sample.sampleId}`))),
                "filter": virtualStudyParams.filter,
                "attributesMetaSet": virtualStudyParams.attributesMetaSet
            } as IVirtualStudyProps

        return (this.copyDownloadQueryControlsRow("Altered samples: List of samples with alterations",
                                            handleDownload,
                                            "altered_samples.txt",
                                            handleQuery,
                                            alteredSamplesVirtualStudyParams));
    }

    private unalteredSamplesDownloadControls(unalteredCaseAlterationData: ICaseAlteration[], virtualStudyParams: IVirtualStudyProps)
    {
        const unalteredSampleCaseIds = _.map(unalteredCaseAlterationData, caseAlteration => `${caseAlteration.studyId}:${caseAlteration.sampleId}`);
        const handleDownload = () => unalteredSampleCaseIds.join("\n");
        const handleQuery = () => this.handleQueryButtonClick(unalteredSampleCaseIds);
        const unalteredSamplesVirtualStudyParams = {
            "user": virtualStudyParams.user,
            "name": virtualStudyParams.name,
            "description": virtualStudyParams.description,
            "studyWithSamples": virtualStudyParams.studyWithSamples,
            "selectedSamples": _.filter(virtualStudyParams.selectedSamples, ((sample: Sample) => unalteredSampleCaseIds.includes(`${sample.studyId}:${sample.sampleId}`))),
            "filter": virtualStudyParams.filter,
            "attributesMetaSet": virtualStudyParams.attributesMetaSet
        } as IVirtualStudyProps

        return (this.copyDownloadQueryControlsRow("Unaltered samples: List of samples without any alteration",
                                            handleDownload,
                                            "unaltered_samples.txt",
                                            handleQuery,
                                            unalteredSamplesVirtualStudyParams));
    }

    private sampleMatrixDownloadControls(sampleMatrixText: string)
    {
        const handleDownload = () => sampleMatrixText;

        return (this.copyDownloadControlsRow("Sample matrix: List of all samples where 1=altered and 0=unaltered",
                                            handleDownload,
                                            "sample_matrix.txt"));
    };

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

    @action
    private handleQueryButtonClick(querySampleIds: string[]) {
        const modifyQueryParams: ModifyQueryParams = {
            selectedSampleListId: CUSTOM_CASE_LIST_ID,
            selectedSampleIds: querySampleIds,
            caseIdsMode: "sample"
        }
        this.props.store.modifyQueryParams = modifyQueryParams;
        this.props.store.queryFormVisible = true;
    }

    @action
    private async handleVirtualStudyButtonClick(alterations: ICaseAlteration[]) {
        let studies = _.reduce(_.groupBy(alterations, "studyId"), (acc: { id: string; samples: string[] }[], alteration, studyId) => {
            acc.push({
                id: studyId,
                samples: alterations.map(alteration => alteration.sampleId)
            })
            return acc;
        }, []);

        let parameters = {
            name: "virtual study",
            description: "virtual study",
            origin: studies.map(study => study.id),
            studies: studies
        }
        const saveStudyResult = await sessionServiceClient.saveVirtualStudy(parameters, false);
        if (saveStudyResult && saveStudyResult.id) {
            window.open(buildCBioPortalPageUrl({pathname:'study', query: {id: saveStudyResult.id}}), "_blank");
        }
    }
}