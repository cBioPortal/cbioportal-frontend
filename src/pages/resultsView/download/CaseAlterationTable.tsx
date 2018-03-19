import {observer} from "mobx-react";
import * as React from 'react';
import {default as LazyMobXTable, Column} from "shared/components/lazyMobXTable/LazyMobXTable";
import {OQLLineFilterOutput} from "shared/lib/oql/oqlfilter";
import {AnnotatedExtendedAlteration} from "../ResultsViewPageStore";

export interface ISubAlteration {
    type: string;
    value: string;
}

export interface IOqlData {
    geneSymbol: string;
    mutation: string[];
    fusion: string[];
    cna: ISubAlteration[];
    mrnaExp: ISubAlteration[];
    proteinLevel: ISubAlteration[];
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
}

export function generateOqlValue(data: IOqlData): string
{
    const oqlValue: string[] = [];

    // helper functions to map the display value for different alteration types
    const stringMapper = (alterationData: (string|ISubAlteration)[]) => alterationData;
    const subAlterationMapper = (alterationData: (string|ISubAlteration)[]) =>
        alterationData.map((alteration: ISubAlteration) => alteration.type);

    // generator labels and data extraction functions for different alteration types
    const generators = [
        {
            label: "MUT",
            getAlterationData: (oqlData: IOqlData) => oqlData.mutation,
            getValues: stringMapper
        },
        {
            label: "FUSION",
            getAlterationData: (oqlData: IOqlData) => oqlData.fusion,
            getValues: stringMapper
        },
        {
            label: "CNA",
            getAlterationData: (oqlData: IOqlData) => oqlData.cna,
            getValues: subAlterationMapper
        },
        {
            label: "EXP",
            getAlterationData: (oqlData: IOqlData) => oqlData.mrnaExp,
            getValues: subAlterationMapper
        },
        {
            label: "PROT",
            getAlterationData: (oqlData: IOqlData) => oqlData.proteinLevel,
            getValues: subAlterationMapper
        }
    ];

    // for each alteration type, transform alteration data into a comma separated string
    generators.forEach((generator) => {
        const alterationData = generator.getAlterationData(data);

        if (alterationData.length > 0) {
            oqlValue.push(`${generator.label}: ${generator.getValues(alterationData).join(",")};`);
        }
    });

    // finally, generate a single line summary with all alteration data combined.
    return oqlValue.join(" ");
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

        this.props.oqls.forEach(oql => {
            columns.push({
                name: oql.gene,
                tooltip: <span>{oql.oql_line}</span>,
                headerDownload: (name: string) => oql.oql_line,
                render: (data: ICaseAlteration) =>
                    <span style={{whiteSpace: "nowrap"}}>{data.oqlData ? generateOqlValue(data.oqlData[oql.oql_line]) : ""}</span>,
                download: (data: ICaseAlteration) =>
                    data.oqlData ? generateOqlValue(data.oqlData[oql.oql_line]) : "",
                sortBy: (data: ICaseAlteration) =>
                    data.oqlData ? generateOqlValue(data.oqlData[oql.oql_line]) : "",
                filter: (data: ICaseAlteration, filterString: string, filterStringUpper: string) => {
                    return data.oqlData &&
                        generateOqlValue(data.oqlData[oql.oql_line]).toUpperCase().includes(filterStringUpper);
                }
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
