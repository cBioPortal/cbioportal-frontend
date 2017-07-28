import * as React from 'react';
import DefaultTooltip from 'shared/components/DefaultTooltip';
import 'rc-tooltip/assets/bootstrap_white.css';
import {
    DiscreteCNACacheDataType,
    default as DiscreteCNACache
} from "shared/cache/DiscreteCNACache";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {default as TableCellStatusIndicator, TableCellStatus} from "shared/components/TableCellStatus";

export default class DiscreteCNAColumnFormatter {

    private static altToFilterString:{[a:number]:string} = {
        "2": "amp",
        "1": "gain",
        "0": "diploid",
        "-1": "shallowdel",
        "-2": "deepdel"
    };

    public static renderFunction(data: Mutation[], cache:DiscreteCNACache) {
        const cnaData = DiscreteCNAColumnFormatter.getData(data, cache);
        return (<DefaultTooltip
                placement="left"
                overlay={DiscreteCNAColumnFormatter.getTooltipContents(cnaData)}
                arrowContent={<div className="rc-tooltip-arrow-inner"/>}
            >
                {DiscreteCNAColumnFormatter.getTdContents(cnaData)}
            </DefaultTooltip>
        );
    }

    public static getSortValue(data:Mutation[], cache:DiscreteCNACache) {
        return DiscreteCNAColumnFormatter.getTdValue(DiscreteCNAColumnFormatter.getData(data, cache));
    }

    public static filter(data:Mutation[], cache:DiscreteCNACache, filterString:string):boolean {
        const cnaData = DiscreteCNAColumnFormatter.getData(data, cache);
        if (cnaData && cnaData.data) {
            return (!!DiscreteCNAColumnFormatter.altToFilterString[cnaData.data.alteration])
                && (DiscreteCNAColumnFormatter.altToFilterString[cnaData.data.alteration]
                    .indexOf(filterString.toLowerCase()) > -1);
        } else {
            return false;
        }
    }

    protected static getData(data:Mutation[] | undefined, discreteCNACache:DiscreteCNACache):DiscreteCNACacheDataType | null {
        if (!data || data.length === 0 || !discreteCNACache.geneticProfileIdDiscrete) {
            return null;
        }
        const sampleId = data[0].sampleId;
        const entrezGeneId = data[0].entrezGeneId;
        return discreteCNACache.get({sampleId, entrezGeneId});
    }

    protected static getTdValue(cacheDatum:DiscreteCNACacheDataType | null):number|null {
        if (cacheDatum !== null && cacheDatum.status === "complete" && cacheDatum.data !== null) {
            return cacheDatum.data.alteration;
        } else {
            return null;
        }
    }

    protected static getTdContents(cacheDatum:DiscreteCNACacheDataType | null) {
        let status:TableCellStatus | null = null;
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
            status=TableCellStatus.NA;
        } else if (cacheDatum && cacheDatum.status === "error") {
            status=TableCellStatus.ERROR;
        } else {
            status=TableCellStatus.NA;
        }
        if (status !== null) {
            return (
                <TableCellStatusIndicator
                    status={status}
                    naAlt="CNA data is not available for this gene."
                />
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

    public static isVisible(cache:DiscreteCNACache): boolean {

        if (cache) {
            return !!cache.geneticProfileIdDiscrete;
        }

        return false;
    }
}