import {observer} from "mobx-react";
import * as React from 'react';
import * as _ from 'lodash';
import {default as LazyMobXTable, Column} from "shared/components/lazyMobXTable/LazyMobXTable";
import {OQLLineFilterOutput} from "shared/lib/oql/oqlfilter";
import {AnnotatedExtendedAlteration} from "../ResultsViewPageStore";

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
}

export interface ICaseAlterationTableProps {
    caseAlterationData: ICaseAlteration[];
    oqls: OQLLineFilterOutput<AnnotatedExtendedAlteration>[];
    alterationTypes: string[];
}

export function generateOqlValue(data: IOqlData, alterationType: string): string
{
    // helper functions to map the display value for different alteration types
    const stringMapper = (alterationData: (string|ISubAlteration)[]) => alterationData;
    const subAlterationMapper = (alterationData: (string|ISubAlteration)[]) =>
        alterationData.map((alteration: ISubAlteration) => alteration.type);        
    let generator;
    let pseudoOqlSummary: string = "";

    if (data.alterationTypes.length === 0 || !data.alterationTypes.includes(alterationType)) {
        pseudoOqlSummary = "no alteration";
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
            pseudoOqlSummary = generator.getValues(alterationData).join(",");
        }
        if (generator.isNotProfiled(data)) {
            pseudoOqlSummary = "not profiled";
        }
    }

    // finally, generate a single line summary with all alteration data combined.
    return pseudoOqlSummary;
}

export function generatePseudoOqlSummary(oqlData: {[oqlLine: string]: IOqlData}, oqlLine: string, alterationType: string)
{
    let pseudoOqlSummary = "";

    if (!_.isEmpty(oqlData))
    {
        const datum = oqlData[oqlLine];

        if (datum) {
            pseudoOqlSummary = generateOqlValue(oqlData[oqlLine], alterationType);
        }
    }

    return pseudoOqlSummary;
}

export function computeAlterationTypes(alterationData: ICaseAlteration[]): string[]
{
    const types = _.chain(alterationData)
        .map((alteration) => _.values(alteration.oqlData))
        .flatten()
        .map((oqlDataValue) => oqlDataValue.alterationTypes)
        .flatten()
        .uniq()
        .value();
    return types;
}

export function getDisplayStyle(value: string): object {
    switch(value) {
        case "no alteration":
            return {whiteSpace: "nowrap" , color: "orange"};
        case "not profiled":
            return {whiteSpace: "nowrap" , color: "indianred"};
        default:
            return {whiteSpace: "nowrap"};
    }
}

class CaseAlterationTableComponent extends LazyMobXTable<ICaseAlteration> {}

@observer
export default class CaseAlterationTable extends React.Component<ICaseAlterationTableProps, {}> {
    public render()
    {
        const columns: Column<ICaseAlteration>[] = [
            {
                name: 'Study ID',
                render: (data: ICaseAlteration) => <span style={{whiteSpace: "nowrap"}}>{data.studyId}</span>,
                download: (data: ICaseAlteration) => data.studyId,
                sortBy: (data: ICaseAlteration) => data.studyId,
                filter: (data: ICaseAlteration, filterString: string, filterStringUpper: string) => {
                    return data.studyId.toUpperCase().includes(filterStringUpper);
                }
            },
            {
                name: 'Sample ID',
                render: (data: ICaseAlteration) => <span style={{whiteSpace: "nowrap"}}>{data.sampleId}</span>,
                download: (data: ICaseAlteration) => `${data.sampleId}`,
                sortBy: (data: ICaseAlteration) => data.sampleId,
                filter: (data: ICaseAlteration, filterString: string, filterStringUpper: string) => {
                    return data.sampleId.toUpperCase().includes(filterStringUpper);
                }
            },
            {
                name: 'Patient ID',
                render: (data: ICaseAlteration) => <span style={{whiteSpace: "nowrap"}}>{data.patientId}</span>,
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

        const typeSet : {[x: string]: boolean} = {};
        this.props.oqls.forEach(oql => {
            const alterationTypes = this.props.alterationTypes;
            if (!(oql.gene in typeSet)){
                typeSet[oql.gene] = true;
                alterationTypes.forEach(alterationType => {
                    columns.push({
                        name: `${oql.gene} ${alterationType}`,
                        tooltip: <span>{oql.oql_line}</span>,
                        headerDownload: (name: string) => oql.oql_line,
                        render: (data: ICaseAlteration) => {
                            const oqlDisplayValue = generatePseudoOqlSummary(data.oqlData, oql.oql_line, alterationType); 
                            const style = getDisplayStyle(oqlDisplayValue);
    
                            return <span style={style}>{oqlDisplayValue}</span>;
                        },
                        download: (data: ICaseAlteration) => generatePseudoOqlSummary(data.oqlData, oql.oql_line, alterationType),
                        sortBy: (data: ICaseAlteration) => generatePseudoOqlSummary(data.oqlData, oql.oql_line, alterationType),
                        filter: (data: ICaseAlteration, filterString: string, filterStringUpper: string) =>
                            generatePseudoOqlSummary(data.oqlData, oql.oql_line, alterationType).toUpperCase().includes(filterStringUpper)
                    });
                });
            }
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
