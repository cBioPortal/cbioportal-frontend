import * as React from 'react';
import {Circle} from "better-react-spinkit";
import 'rc-tooltip/assets/bootstrap_white.css';
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {default as TableCellStatusIndicator, TableCellStatus} from "shared/components/TableCellStatus";
import { VariantAnnotation } from 'shared/api/generated/GenomeNexusAPI';
import GenomeNexusCache, { GenomeNexusCacheDataType } from "shared/cache/GenomeNexusCache";

export default class RsidColumnFormatter {

    public static renderFunction(data:Mutation[],
                                 genomeNexusCache:GenomeNexusCache|undefined) {
        const genomeNexusCacheData = RsidColumnFormatter.getGenomeNexusDataFromCache(data, genomeNexusCache);
        return (
            <div>
                {RsidColumnFormatter.getRsidViz(genomeNexusCacheData)}
            </div>
        );
    }

    private static getGenomeNexusDataFromCache(data:Mutation[], cache:GenomeNexusCache|undefined):GenomeNexusCacheDataType | null {
        if (data.length === 0 || !cache) {
            return null;
        }
        return cache.get(data[0]);
    }

    private static getRsidViz(genomeNexusCacheData:GenomeNexusCacheDataType|null) {
        let status:TableCellStatus | null = null;

        if (genomeNexusCacheData === null) {
            status = TableCellStatus.LOADING;
        } else if (genomeNexusCacheData.status === "error") {
            status = TableCellStatus.ERROR;
        } else if (genomeNexusCacheData.data === null) {
            status = TableCellStatus.NA;
        } else {
            let rsidData = RsidColumnFormatter.getData(genomeNexusCacheData.data);
            if (rsidData == null) {
                return null;
            }
            else {
                return (
                    <div style={{textAlign:"right"}}>
                        <a href={"https://www.ncbi.nlm.nih.gov/snp/"+rsidData} target = "blank">{rsidData}</a>
                    </div>
                );
            }        
        }

        if (status !== null) {
            // show loading circle
            if (status === TableCellStatus.LOADING) {
                return <Circle size={18} scaleEnd={0.5} scaleStart={0.2} color="#aaa" className="pull-right"/>;
            } 
            else {
                return <TableCellStatusIndicator status={status}/>;
            }
        }
    }

    public static getData(genomeNexusData: VariantAnnotation | null): string | null
    {
        if (!genomeNexusData)
        {
            return null;
        }
        return genomeNexusData.my_variant_info && genomeNexusData.my_variant_info.annotation && 
                genomeNexusData.my_variant_info.annotation.mutdb && genomeNexusData.my_variant_info.annotation.mutdb.rsid; 
    }

    public static download(data:Mutation[], genomeNexusCache:GenomeNexusCache): string
    {
        const genomeNexusData = RsidColumnFormatter.getGenomeNexusDataFromCache(data, genomeNexusCache);
        const rsidData = genomeNexusData && RsidColumnFormatter.getData(genomeNexusData.data);

        if (!rsidData) {
            return "";
        }
        else {
            return rsidData;
        }
    }

    public static getSortValue(data:Mutation[], genomeNexusCache:GenomeNexusCache): string|null {
        const genomeNexusCacheData = RsidColumnFormatter.getGenomeNexusDataFromCache(data, genomeNexusCache);
        if (genomeNexusCacheData) {
            let rsidData = RsidColumnFormatter.getData(genomeNexusCacheData.data);            
            if (rsidData == null) {
                return null;
            }
            else {
                return rsidData;
            }
        }    
        else {
            return null;
        }
    }
} 