import {observer} from "mobx-react";
import * as React from 'react';
import * as _ from 'lodash';
import {default as LazyMobXTable, Column} from "shared/components/lazyMobXTable/LazyMobXTable";
import {OQLLineFilterOutput} from "shared/lib/oql/oqlfilter";
import {AnnotatedExtendedAlteration} from "../ResultsViewPageStore";
import {StudyLink} from "shared/components/StudyLink/StudyLink";
import {getPatientViewUrl, getSampleViewUrl} from "shared/api/urls";
import styles from "./styles.module.scss"

export interface ISubAlteration {
    type: string;
    value: number;
}

export interface IOqlData {
    geneSymbol: string;
    sequenced: boolean;
    mutation: string[];
    fusion: string[];
    cna: ISubAlteration[];
    mrnaExp: ISubAlteration[];
    proteinLevel: ISubAlteration[];
    isMutationNotProfiled: boolean;
    isFusionNotProfiled: boolean;
    isCnaNotProfiled: boolean;
    isMrnaExpNotProfiled: boolean;
    isProteinLevelNotProfiled: boolean;
    alterationTypes: string[];
}

export interface ICaseAlteration {
    studyId: string;
    sampleId: string;
    patientId: string;
    altered: boolean;
    oqlData: {[oqlLine: string]: IOqlData};
    oqlDataByGene: {[gene: string]: IOqlData};
}

export interface ICaseAlterationTableProps {
    caseAlterationData: ICaseAlteration[];
    oqls: OQLLineFilterOutput<AnnotatedExtendedAlteration>[];
    alterationTypes: string[];
}

export type PseudoOqlSummary = {
    summaryCategory: SummaryCategory;
    summaryContent: string;
    summaryClass: any;
}

export enum SummaryCategory {
    ALTERED = 'ALTERED',
    NOT_PROFILED = 'NOT_PROFILED',
    NO_ALTERATION = 'NO_ALTERATION'
}

export enum SummaryContent {
    NOT_PROFILED = 'not profiled',
    NO_ALTERATION = 'no alteration'
}

export function generateOqlValue(data: IOqlData, alterationType: string): PseudoOqlSummary | undefined
{
    // helper functions to map the display value for different alteration types
    const stringMapper = (alterationData: (string|ISubAlteration)[]) => alterationData;
    const subAlterationMapper = (alterationData: (string|ISubAlteration)[]) =>
        alterationData.map((alteration: ISubAlteration) => alteration.type);        
    let generator;
    let pseudoOqlSummary: PseudoOqlSummary | undefined = undefined;

    if (data.alterationTypes.length === 0 || !data.alterationTypes.includes(alterationType)) {
        pseudoOqlSummary = {summaryCategory:SummaryCategory.NO_ALTERATION ,summaryContent: SummaryContent.NO_ALTERATION, summaryClass: styles.noAlterationSpan};
    }
    switch (alterationType) {
        case "MUT":
            generator = {
                label: "MUT",
                getAlterationData: (oqlData: IOqlData) => oqlData.mutation,
                isNotProfiled: (oqlData: IOqlData) => oqlData.isMutationNotProfiled,
                getValues: stringMapper
            }
            break;
        case "FUSION":
            generator = {
                label: "FUSION",
                getAlterationData: (oqlData: IOqlData) => oqlData.fusion,
                isNotProfiled: (oqlData: IOqlData) => oqlData.isFusionNotProfiled,
                getValues: stringMapper
            }
            break;
        case "CNA":
            generator = {
                label: "CNA",
                getAlterationData: (oqlData: IOqlData) => oqlData.cna,
                isNotProfiled: (oqlData: IOqlData) => oqlData.isCnaNotProfiled,
                getValues: subAlterationMapper
            }
            break;
        case "EXP":
            generator = {
                label: "EXP",
                getAlterationData: (oqlData: IOqlData) => oqlData.mrnaExp,
                isNotProfiled: (oqlData: IOqlData) => oqlData.isMrnaExpNotProfiled,
                getValues: subAlterationMapper
            }
            break;
        case "PROT":
            generator = {
                label: "PROT",
                getAlterationData: (oqlData: IOqlData) => oqlData.proteinLevel,
                isNotProfiled: (oqlData: IOqlData) => oqlData.isProteinLevelNotProfiled,
                getValues: subAlterationMapper
            }
            break;
        default:
    }

    if (generator) {
        const alterationData = generator.getAlterationData(data);
        if (alterationData.length > 0) {
            pseudoOqlSummary = {summaryCategory:SummaryCategory.ALTERED, summaryContent: generator.getValues(alterationData).join(","), summaryClass: styles.alterationSpan};
        }
        if (generator.isNotProfiled(data)) {
            pseudoOqlSummary = {summaryCategory:SummaryCategory.NOT_PROFILED, summaryContent: `${SummaryContent.NOT_PROFILED} in ${alterationType}`, summaryClass: styles.notProfiledSpan};
        }
    }

    // finally, generate a single line summary with all alteration data combined.
    return pseudoOqlSummary ? pseudoOqlSummary : undefined;
}

export function generatePseudoOqlSummary(oqlData: {[oqlLine: string]: IOqlData}, oqlLine: string, alterationType: string): PseudoOqlSummary | undefined
{  
    if (!_.isEmpty(oqlData))
    {
        const datum = oqlData[oqlLine];

        if (datum) {
            return generateOqlValue(oqlData[oqlLine], alterationType);
        }
    }

    return undefined;
}

export function getPseudoOqlSummaryByAlterationTypes(oqlData: {[oqlLine: string]: IOqlData}, oqlLine: string, alterationTypes: string[]) : PseudoOqlSummary {
    let summaryCategory, summaryContent, summaryClass;
    const pseudoOqlSummarys = _.map(alterationTypes, (type) => generatePseudoOqlSummary(oqlData, oqlLine, type)).filter((summary) => summary != undefined);
    const summaryGroupedByCategory = _.groupBy(pseudoOqlSummarys, (summary: PseudoOqlSummary) => summary.summaryCategory);
    if (SummaryCategory.ALTERED in summaryGroupedByCategory) {
        summaryCategory = SummaryCategory.ALTERED;
        summaryContent = _.map(summaryGroupedByCategory[SummaryCategory.ALTERED], (summary : PseudoOqlSummary)=>summary.summaryContent).join(",");
        summaryClass = (summaryGroupedByCategory[SummaryCategory.ALTERED][0] as PseudoOqlSummary).summaryClass;
    }
    else if (SummaryCategory.NOT_PROFILED in summaryGroupedByCategory) {
        summaryCategory = SummaryCategory.NOT_PROFILED;
        summaryContent = _.map(summaryGroupedByCategory[SummaryCategory.NOT_PROFILED], (summary : PseudoOqlSummary)=>summary.summaryContent).join(",");
        summaryClass = (summaryGroupedByCategory[SummaryCategory.NOT_PROFILED][0] as PseudoOqlSummary).summaryClass;
    }
    else {
        summaryCategory = SummaryCategory.NO_ALTERATION;
        summaryContent = (summaryGroupedByCategory[SummaryCategory.NO_ALTERATION][0] as PseudoOqlSummary).summaryContent;
        summaryClass = (summaryGroupedByCategory[SummaryCategory.NO_ALTERATION][0] as PseudoOqlSummary).summaryClass;
    }

    return {summaryCategory, summaryContent, summaryClass};
}

class CaseAlterationTableComponent extends LazyMobXTable<ICaseAlteration> {}

@observer
export default class CaseAlterationTable extends React.Component<ICaseAlterationTableProps, {}> {
    public render()
    {
        const columns: Column<ICaseAlteration>[] = [
            {
                name: 'Study ID',
                render: (data: ICaseAlteration) => <span style={{whiteSpace: "nowrap"}}><StudyLink studyId={data.studyId}>{data.studyId}</StudyLink></span>,
                download: (data: ICaseAlteration) => data.studyId,
                sortBy: (data: ICaseAlteration) => data.studyId,
                filter: (data: ICaseAlteration, filterString: string, filterStringUpper: string) => {
                    return data.studyId.toUpperCase().includes(filterStringUpper);
                }
            },
            {
                name: 'Sample ID',
                render: (data: ICaseAlteration) => <span style={{whiteSpace: "nowrap"}}><a href={getSampleViewUrl(data.studyId, data.sampleId)} target='_blank'>{data.sampleId}</a></span>,
                download: (data: ICaseAlteration) => `${data.sampleId}`,
                sortBy: (data: ICaseAlteration) => data.sampleId,
                filter: (data: ICaseAlteration, filterString: string, filterStringUpper: string) => {
                    return data.sampleId.toUpperCase().includes(filterStringUpper);
                }
            },
            {
                name: 'Patient ID',
                render: (data: ICaseAlteration) => <span style={{whiteSpace: "nowrap"}}><a href={getPatientViewUrl(data.studyId, data.patientId)} target='_blank'>{data.patientId}</a></span>,
                download: (data: ICaseAlteration) => `${data.patientId}`,
                sortBy: (data: ICaseAlteration) => data.patientId,
                filter: (data: ICaseAlteration, filterString: string, filterStringUpper: string) => {
                    return data.patientId.toUpperCase().includes(filterStringUpper);
                }
            },
            {
                name: 'Altered',
                tooltip: <span>1 = Sample harbors alteration in one of the input genes</span>,
                render: (data: ICaseAlteration) => <span>{data.altered ? "1" : "0"}</span>,
                download: (data: ICaseAlteration) => data.altered ? "1" : "0",
                sortBy: (data: ICaseAlteration) => data.altered ? 1 : 0
            }
        ];

        const geneSet : {[x: string]: OQLLineFilterOutput<AnnotatedExtendedAlteration>} = {};
        _.forEach(_.cloneDeep(this.props.oqls), (oql => {
            if (oql.gene in geneSet) {
                geneSet[oql.gene].oql_line += oql.oql_line;
            }
            else {
                geneSet[oql.gene] = oql;
            }
        }));
        
        _.forEach(geneSet, (oql) => {
            const alterationTypes = this.props.alterationTypes;
            //add column for each gene
            columns.push({
                name: `${oql.gene}`,
                tooltip: <span>{oql.oql_line}</span>,
                headerDownload: (name: string) => `${oql.gene}`,
                render: (data: ICaseAlteration) => {
                    const pseudoOqlSummary = getPseudoOqlSummaryByAlterationTypes(data.oqlDataByGene, oql.gene, alterationTypes); 

                    return <span className={pseudoOqlSummary.summaryClass}>{pseudoOqlSummary.summaryContent}</span>;
                },
                download: (data: ICaseAlteration) => getPseudoOqlSummaryByAlterationTypes(data.oqlDataByGene, oql.gene, alterationTypes)!.summaryContent,
                sortBy: (data: ICaseAlteration) => getPseudoOqlSummaryByAlterationTypes(data.oqlDataByGene, oql.gene, alterationTypes)!.summaryContent,
                filter: (data: ICaseAlteration, filterString: string, filterStringUpper: string) =>
                    getPseudoOqlSummaryByAlterationTypes(data.oqlDataByGene, oql.gene, alterationTypes)!.summaryContent.toUpperCase().includes(filterStringUpper),
                visible: false
            });
        });

        this.props.oqls.forEach(oql => {
            //add column for each oql
            const alterationTypes = oql.parsed_oql_line.alterations ? 
                _.uniq(_.map(oql.parsed_oql_line.alterations, (alteration) => {
                    return alteration.alteration_type.toUpperCase();
                })) : [];
            columns.push({
                name: `${oql.oql_line}`,
                tooltip: <span>{oql.oql_line}</span>,
                headerDownload: (name: string) => `${oql.oql_line}`,
                render: (data: ICaseAlteration) => {
                    const pseudoOqlSummary = getPseudoOqlSummaryByAlterationTypes(data.oqlDataByGene, oql.gene, alterationTypes); 

                    return <span className={pseudoOqlSummary.summaryClass}>{pseudoOqlSummary.summaryContent}</span>;
                },
                download: (data: ICaseAlteration) => getPseudoOqlSummaryByAlterationTypes(data.oqlDataByGene, oql.gene, alterationTypes)!.summaryContent,
                sortBy: (data: ICaseAlteration) => getPseudoOqlSummaryByAlterationTypes(data.oqlDataByGene, oql.gene, alterationTypes)!.summaryContent,
                filter: (data: ICaseAlteration, filterString: string, filterStringUpper: string) =>
                    getPseudoOqlSummaryByAlterationTypes(data.oqlDataByGene, oql.gene, alterationTypes)!.summaryContent.toUpperCase().includes(filterStringUpper)
            });
        });

        return (
            <CaseAlterationTableComponent
                data={this.props.caseAlterationData}
                columns={columns}
                initialSortColumn="Altered"
                initialSortDirection={'desc'}
                initialItemsPerPage={20}
                showPagination={true}
                showColumnVisibility={true}
                showFilter={true}
                showCopyDownload={true}
                enableHorizontalScroll={true}
                copyDownloadProps={{downloadFilename: "alterations_across_samples.tsv"}}
            />
        );
    }
}
