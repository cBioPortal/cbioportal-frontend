import * as React from 'react';
import {Td} from 'reactable';
import {IColumnFormatterData} from "../../../../shared/components/enhancedReactTable/IColumnFormatter";
import DefaultTooltip from 'shared/components/DefaultTooltip';
import {compareNumberLists} from '../../../../shared/lib/SortUtils';
import 'rc-tooltip/assets/bootstrap_white.css';
import {MutationTableRowData} from "../../../../shared/components/mutationTable/IMutationTableProps";
import {DiscreteCNACacheType, DiscreteCNACacheDataType} from "../../clinicalInformation/DiscreteCNACache";
import {Mutation, DiscreteCopyNumberData} from "../../../../shared/api/CBioPortalAPI";

export default class DiscreteCNAColumnFormatter {

    public static renderFunction(data: IColumnFormatterData<MutationTableRowData>, columnProps: any) {
        const cnaData = DiscreteCNAColumnFormatter.getData(data.rowData, columnProps.data as DiscreteCNACacheType);
        return (<Td key={data.name} column={data.name} value={DiscreteCNAColumnFormatter.getTdValue(cnaData)}>
            <DefaultTooltip
                placement="left"
                overlay={DiscreteCNAColumnFormatter.getTooltipContents(cnaData)}
                arrowContent={<div className="rc-tooltip-arrow-inner"/>}
            >
                {DiscreteCNAColumnFormatter.getTdContents(cnaData)}
            </DefaultTooltip>
        </Td>);
    }

    protected static getData(data:Mutation[] | undefined, discreteCNAData:DiscreteCNACacheType):DiscreteCNACacheDataType | null {
        if (!data || data.length === 0) {
            return null;
        }
        const sampleId = data[0].sampleId;
        const entrezGeneId = data[0].entrezGeneId;
        let cacheDatum:DiscreteCNACacheDataType|null = null;
        if (discreteCNAData && discreteCNAData[sampleId]) {
            if (discreteCNAData[sampleId].geneData[entrezGeneId]) {
                cacheDatum = discreteCNAData[sampleId].geneData[entrezGeneId];
            } else if (discreteCNAData[sampleId].fetchedWithoutGeneArgument === "complete") {
                // We don't want to show 'Loading' if we already know that there's no data for it
                //  because we've already queried all data for this sample and we don't have anything
                cacheDatum = { status: "complete", data: null}
            }
        }
        return cacheDatum;
    }

    protected static getTdValue(cacheDatum:DiscreteCNACacheDataType | null) {
        if (cacheDatum !== null && cacheDatum.status === "complete" && cacheDatum.data !== null) {
            return cacheDatum.data.alteration;
        } else {
            return Number.POSITIVE_INFINITY;
        }
    }

    protected static getTdContents(cacheDatum:DiscreteCNACacheDataType | null) {
        if (cacheDatum !== null && cacheDatum.status === "complete" && cacheDatum.data !== null) {
            const alteration = cacheDatum.data.alteration;
            if (alteration === 2) {
                return (<span style={{color:"red", textAlign:"center", fontSize:"12px"}} alt="High-level amplification">
                    <b>Amp</b>
                </span>);
            } else if (alteration === 1) {
                return (<span style={{color:"red", textAlign:"center", fontSize:"smaller"}} alt="Low-level gain">
                    <b>Gain</b>
                </span>);
            } else if (alteration === 0) {
                return (<span style={{color:"black", textAlign:"center", fontSize:"xx-small"}} alt="Diploid / normal">
                    Diploid
                </span>);
            } else if (alteration === -1) {
                return (<span style={{color:"blue", textAlign:"center", fontSize:"smaller"}} alt="Shallow deletion">
                    <b>ShallowDel</b>
                </span>);
            } else {
                return (<span style={{color:"blue", textAlign:"center", fontSize:"12px"}} alt="Deep deletion">
                    <b>DeepDel</b>
                </span>);
            }
        } else if (cacheDatum && cacheDatum.status === "complete" && cacheDatum.data === null) {
            return (<span
                style={{color: "gray", fontSize:"xx-small", textAlign:"center"}}
                alt="CNA data is not available for this gene."
            >
                    NA
                </span>);
        } else if (cacheDatum && cacheDatum.status === "error") {
            return (<span
                style={{color: "gray", fontSize:"xx-small", textAlign:"center"}}
                alt="Error retrieving data."
            >
                    ERROR
                </span>);
        } else {
            return (
                <span
                    style={{color: "gray", fontSize:"xx-small", textAlign:"center"}}
                    alt="Querying server for data."
                >
                    LOADING
                </span>
            );
        }
    }

    protected static getTooltipContents(cacheDatum:DiscreteCNACacheDataType | null) {
        const altToText:{[a:number]:string} = {
            '-2':"Deep deletion",
            '-1':"Shallow deletion",
            '0':"Diploid / normal",
            '1':"Low-level gain",
            '2':"High-level amplification"
        };
        if (cacheDatum && cacheDatum.status === "complete" && cacheDatum.data !== null) {
            return (
                <div>
                    <span>{altToText[cacheDatum.data.alteration]}</span>
                </div>
            );
        } else if (cacheDatum && cacheDatum.status === "complete" && cacheDatum.data === null) {
            return (<span>CNA data is not available for this gene.</span>);
        } else if (cacheDatum && cacheDatum.status === "error") {
            return (<span>Error retrieving data.</span>);
        } else {
            return (<span>Querying server for data.</span>);
        }
    }
}