import * as React from 'react';
import {Circle} from "better-react-spinkit";
import 'rc-tooltip/assets/bootstrap_white.css';
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {default as TableCellStatusIndicator, TableCellStatus} from "shared/components/TableCellStatus";
import {MyVariantInfoAnnotation} from 'shared/api/generated/GenomeNexusAPI';
import GenomeNexusMyVariantInfoCache, { GenomeNexusCacheDataType } from "shared/cache/GenomeNexusMyVariantInfoCache";
import DefaultTooltip from 'public-lib/components/defaultTooltip/DefaultTooltip';

export default class ClinVarColumnFormatter {
    
    public static renderFunction(data:Mutation[],
                                genomeNexusMyVariantInfoCache: GenomeNexusMyVariantInfoCache | undefined) {
        const genomeNexusCacheData = ClinVarColumnFormatter.getGenomeNexusDataFromCache(data, genomeNexusMyVariantInfoCache);
        return (
            <div data-test="clinvar-data">
                {ClinVarColumnFormatter.getClinVarDataViz(genomeNexusCacheData)}
            </div>
        );
    }

    private static getGenomeNexusDataFromCache(data:Mutation[], cache:GenomeNexusMyVariantInfoCache | undefined): GenomeNexusCacheDataType | null {
        if (data.length === 0 || !cache) {
            return null;
        }
        return cache.get(data[0]);
    }

    private static getClinVarDataViz(genomeNexusCacheData:GenomeNexusCacheDataType | null) {
        let status:TableCellStatus | null = null;

        if (genomeNexusCacheData === null) {
            status = TableCellStatus.LOADING;
        } else if (genomeNexusCacheData.status === "error") {
            status = TableCellStatus.ERROR;
        } else if (genomeNexusCacheData.data === null) {
            status = TableCellStatus.NA;
        } else {
            let clinVarId = ClinVarColumnFormatter.getData(genomeNexusCacheData.data.my_variant_info);
            if (clinVarId == null) {
                return (
                    <DefaultTooltip
                        placement="topRight"
                        overlay={(<span>Variant has no ClinVar data.</span>)}
                    >
                        <span style={{height: '100%', width: '100%', display: 'block', overflow: 'hidden'}}>&nbsp;</span>
                    </DefaultTooltip>
                );
            }
            else {
                let clinVarLink = "https://www.ncbi.nlm.nih.gov/clinvar/variation/" + clinVarId + "/";
                return (
                    <DefaultTooltip
                        placement="top"
                        overlay={(<span>Click to see variant on ClinVar website.</span>)}
                    >
                        <span style={{textAlign:"right", float:"right"}}>
                            <a href={clinVarLink} target="_blank">{clinVarId}</a>
                        </span>
                    </DefaultTooltip>
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

    public static getData(genomeNexusData:  MyVariantInfoAnnotation | null): string | null {
        if (genomeNexusData && genomeNexusData.annotation && genomeNexusData.annotation.clinVar && genomeNexusData.annotation.clinVar.variantId)
        {
            return genomeNexusData.annotation.clinVar.variantId.toString();
        }
        else {
            return null;
        }
    }

    public static download(data: Mutation[], genomeNexusMyVariantInfoCache: GenomeNexusMyVariantInfoCache): string {
        const genomeNexusCacheData = ClinVarColumnFormatter.getGenomeNexusDataFromCache(data, genomeNexusMyVariantInfoCache);
        if (genomeNexusCacheData && genomeNexusCacheData.data) {
            let clinVarId = ClinVarColumnFormatter.getData(genomeNexusCacheData.data.my_variant_info);   
            if (clinVarId) {
                return clinVarId;
            }
        }
        return "";
    }

    public static getSortValue(data:Mutation[], genomeNexusCache:GenomeNexusMyVariantInfoCache): number | null {
        const genomeNexusCacheData = ClinVarColumnFormatter.getGenomeNexusDataFromCache(data, genomeNexusCache);
        if (genomeNexusCacheData && genomeNexusCacheData.data && genomeNexusCacheData.data.my_variant_info) {
            let clinVarId = ClinVarColumnFormatter.getData(genomeNexusCacheData.data.my_variant_info);
            if (clinVarId !== null) {
                return parseInt(clinVarId);
            }
        }
        return null; 
    }
}