import * as React from 'react';
import {Circle} from "better-react-spinkit";
import * as _ from 'lodash';
import 'rc-tooltip/assets/bootstrap_white.css';
import styles from "./gnomad.module.scss";
import generalStyles from "./styles.module.scss";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import {default as TableCellStatusIndicator, TableCellStatus} from "shared/components/TableCellStatus";
import {MyVariantInfo, MyVariantInfoAnnotation, Gnomad, AlleleCount, AlleleNumber, Homozygotes, AlleleFrequency} from 'shared/api/generated/GenomeNexusAPI';
import GenomeNexusMyVariantInfoCache, { GenomeNexusCacheDataType } from "shared/cache/GenomeNexusMyVariantInfoCache";
import GnomadFrequencyTable from 'shared/components/gnomad/GnomadFrequencyTable';

export type GnomadData = {
    'population': string

        'alleleCount': number

        'alleleNumber': number

        'homozygotes': number

        'alleleFrequency': number
};

const PopulationName: {[key:string]: string} = {
    "African" : "afr",
        
        "Latino" : "amr",

        "Other" : "oth",

        "European (Non-Finnish)" : "nfe",

        "European (Finnish)" : "fin",

        "Ashkenazi Jewish" : "asj",

        "East Asian" : "eas",

        "South Asian" : "sas",

        "Total" : ""
}

export enum ColumnName {
    population = 'population',
        
        alleleCount = 'ac',
    
        alleleNumber = 'an',
    
        homozygotes = 'hom',
    
        alleleFrequency = 'af'
}

export function frequencyOutput(frequency: number) {
    
    if (frequency === 0) {
        return <span>0</span>
    }
    else {
        // keep one digit on allele frequency and using scientific notation
        return <span>{parseFloat(frequency.toString()).toExponential(1)}</span>;
    }
}
export default class GnomadColumnFormatter {

    public static renderFunction(data: Mutation[],
                                 genomeNexusMyVariantInfoCache: GenomeNexusMyVariantInfoCache | undefined) {
        const genomeNexusCacheData = GnomadColumnFormatter.getGenomeNexusDataFromCache(data, genomeNexusMyVariantInfoCache);
        return (
            <div>
                <span data-test='gnomad-column' data-test2={data[0].sampleId}>{GnomadColumnFormatter.getGnomadDataViz(genomeNexusCacheData)}</span>
            </div>
        );
    }

    private static getGenomeNexusDataFromCache(data: Mutation[], cache: GenomeNexusMyVariantInfoCache | undefined): GenomeNexusCacheDataType | null {    
        if (data.length === 0 || !cache) {
            return null;
        }
        return cache.get(data[0]);
    }

    private static getGnomadDataViz(genomeNexusCacheData: GenomeNexusCacheDataType | null) {
        let status:TableCellStatus | null = null;

        if (genomeNexusCacheData == null) {
            status = TableCellStatus.LOADING;
        } else if (genomeNexusCacheData.status === "error") {
            status = TableCellStatus.ERROR;
        } else if (genomeNexusCacheData.data == null) {
            status = TableCellStatus.NA;
        } else {

            const gnomadData = GnomadColumnFormatter.getData(genomeNexusCacheData.data.my_variant_info);
            let gnomadUrl = "";
            let display: JSX.Element;
            let overlay: (() => JSX.Element) | null = null;
            let content: JSX.Element;
            let result : {[key:string]: GnomadData} = {};
            // Checking if gnomad data is valid
            if (gnomadData && (gnomadData.gnomadExome || gnomadData.gnomadGenome)) {
                // get gnomad link from chrom, location, ref and alt
                gnomadUrl = (gnomadData && gnomadData.dbsnp) ? GnomadColumnFormatter.generateGnomadUrl(
                    gnomadData.dbsnp.chrom, gnomadData.dbsnp.hg19.start, gnomadData.dbsnp.ref, gnomadData.dbsnp.alt) : "";

                const gnomadExome : {[key:string]: GnomadData} = {};
                const gnomadGenome : {[key:string]: GnomadData} = {};
                const gnomadResult : {[key:string]: GnomadData} = {};

                // If only gnomadExome data exist, show gnomadExome result in the table
                if (gnomadData.gnomadExome) {
                    Object.keys(PopulationName).map(key => {
                        this.setGnomadTableData(key, gnomadData.gnomadExome, gnomadExome);
                    })
                    result = gnomadExome;
                }

                // If only gnomadGenome data exist, show gnomadGenome result in the table
                if (gnomadData.gnomadGenome) {
                    Object.keys(PopulationName).map(key => {
                        this.setGnomadTableData(key, gnomadData.gnomadGenome, gnomadGenome);
                    })
                    result = gnomadGenome;
                }

                // If both gnomadExome and gnomadGenome exist, combine gnomadExome and gnomadGenome together
                if (gnomadData.gnomadExome && gnomadData.gnomadGenome) {
                    Object.keys(PopulationName).map(key => {
                        gnomadResult[key] = {
                            'population': key,
                            'alleleCount': gnomadExome[key].alleleCount + gnomadGenome[key].alleleCount,
                            'alleleNumber': gnomadExome[key].alleleNumber + gnomadGenome[key].alleleNumber,
                            'homozygotes': gnomadExome[key].homozygotes + gnomadGenome[key].homozygotes,
                            'alleleFrequency': GnomadColumnFormatter.calculateAlleleFrequency(
                                                gnomadExome[key].alleleCount + gnomadGenome[key].alleleCount, 
                                                gnomadExome[key].alleleNumber + gnomadGenome[key].alleleNumber, null)
                        } as GnomadData;
                    })
                    result = gnomadResult;
                }

                // sort by frequency
                const sorted = _.sortBy(Object.values(result).slice(0, 8), ['alleleFrequency']).reverse();
                // add the total row at the bottom
                sorted.push(result["Total"]);
                
                // The column will show the total frequency
                // Column will show 0 if the total frequency is 0, still has the tooltip to show the gnomad table (since gnomad data is still available)
                if (result["Total"].alleleFrequency === 0) {
                    display = <span>0</span>
                }
                else {
                    display = <span>{parseFloat(result["Total"].alleleFrequency.toString()).toExponential(1)}</span>
                }

                overlay = () => (
                    <span className={styles["gnomad-table"]} data-test='gnomad-table'>
                        <GnomadFrequencyTable data={sorted} gnomadUrl={gnomadUrl}/>
                    </span>
                
                );
            }

            // if there is no gnomad data, the column will be blank, and have a tooltip to indicate this variant has no data in gnomad
            else {
                display = 
                <DefaultTooltip
                    placement="topRight"
                    overlay={(<span>Variant has no data in gnomAD.</span>)}
                >
                    <span style={{height: '100%', width: '100%', display: 'block', overflow: 'hidden'}}>&nbsp;</span>
                </DefaultTooltip>
            }

            content = (
                <div className={generalStyles["integer-data"]}>
                    {display}
                </div>
            );

            // add a tooltip if the gnomad value is valid
            if (overlay) {
                content = (
                    <DefaultTooltip
                        overlay={overlay}
                        placement="topRight"
                        trigger={['hover', 'focus']}
                        destroyTooltipOnHide={true}
                    >
                        {content}
                    </DefaultTooltip>
                );
            }
            return content;  
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

    public static getData(genomeNexusData: MyVariantInfoAnnotation | null): MyVariantInfo | null {
        if (!genomeNexusData)
        {
            return null;
        }
        return genomeNexusData.annotation;
    }

    public static setGnomadTableData (key: string, data: Gnomad, result: {[key:string]: GnomadData}) {

        // Access data by population name and column name in the format of: columnName_populationName, e.g. "ac_afr"
        // If access "total" data, the name would be e.g. "ac" for alleleCount, "an" for alleleNumber 
        const alleleCountName : keyof AlleleCount = (PopulationName[key] ? ColumnName.alleleCount + "_" + PopulationName[key]
                                                                        : ColumnName.alleleCount).toString() as keyof AlleleCount;
        const alleleNumberName : keyof AlleleNumber = (PopulationName[key] ? ColumnName.alleleNumber + "_" + PopulationName[key]
                                                                        : ColumnName.alleleNumber).toString() as keyof AlleleNumber;
        const homozygotesName : keyof Homozygotes = (PopulationName[key] ? ColumnName.homozygotes + "_" + PopulationName[key]
                                                                        : ColumnName.homozygotes).toString() as keyof Homozygotes;
        const alleleFrequencyName : keyof AlleleFrequency = (PopulationName[key] ? ColumnName.alleleFrequency + "_" + PopulationName[key]
                                                                        : ColumnName.alleleFrequency).toString() as keyof AlleleFrequency;

        result[key] = {
            'population' : key,
            'alleleCount': data.alleleCount[alleleCountName] ? data.alleleCount[alleleCountName] : 0,
            'alleleNumber': data.alleleNumber[alleleNumberName] ? data.alleleNumber[alleleNumberName] : 0,
            'homozygotes': data.homozygotes[homozygotesName],
            'alleleFrequency': GnomadColumnFormatter.calculateAlleleFrequency(
                            data.alleleCount[alleleCountName], data.alleleNumber[alleleNumberName], data.alleleFrequency[alleleFrequencyName])
        } as GnomadData;
    }

    public static calculateAlleleFrequency(count: number | null, totalNumber: number | null, frequency: number | null): number {
        if (frequency !== null) {
            return frequency;
        }
        else {
            return count && totalNumber && totalNumber !== 0 ? count / totalNumber : 0;
        }
    }

    public static getSortValue(data: Mutation[], genomeNexusMyVariantInfoCache: GenomeNexusMyVariantInfoCache): number | null {
        const genomeNexusCacheData = GnomadColumnFormatter.getGenomeNexusDataFromCache(data, genomeNexusMyVariantInfoCache);
        if (genomeNexusCacheData && genomeNexusCacheData.data) {
            let gnomadData = GnomadColumnFormatter.getData(genomeNexusCacheData.data.my_variant_info);

            // If has both gnomadExome and gnomadGenome, sort by the total frequency
            if (gnomadData && gnomadData.gnomadExome && gnomadData.gnomadGenome) {
                return GnomadColumnFormatter.calculateAlleleFrequency (
                    gnomadData.gnomadExome.alleleCount.ac + gnomadData.gnomadGenome.alleleCount.ac, 
                    gnomadData.gnomadExome.alleleNumber.an + gnomadData.gnomadGenome.alleleFrequency.af, null);
            }

            // If only has gnomadExome, sort by gnomadExome frequency
            if (gnomadData && gnomadData.gnomadExome) {
                return GnomadColumnFormatter.calculateAlleleFrequency (
                    gnomadData.gnomadExome.alleleCount.ac, gnomadData.gnomadExome.alleleNumber.an, gnomadData.gnomadExome.alleleFrequency.af);
            }

            // If only has gnomadGenome, sort by gnomadGenome frequency
            if (gnomadData && gnomadData.gnomadGenome) {
                return GnomadColumnFormatter.calculateAlleleFrequency (
                    gnomadData.gnomadGenome.alleleCount.ac, gnomadData.gnomadGenome.alleleNumber.an, gnomadData.gnomadGenome.alleleFrequency.af);
            }
        }
        // If genomeNexusCacheData is null or gnomadData is null, return null
        return null;

    }

    public static download(data: Mutation[], genomeNexusMyVariantInfoCache: GenomeNexusMyVariantInfoCache): string
    {
        const genomeNexusCacheData = GnomadColumnFormatter.getGenomeNexusDataFromCache(data, genomeNexusMyVariantInfoCache);

        if (genomeNexusCacheData && genomeNexusCacheData.data) {
            let gnomadData = GnomadColumnFormatter.getData(genomeNexusCacheData.data.my_variant_info);

            if (gnomadData && gnomadData.gnomadExome && gnomadData.gnomadGenome) {
                return GnomadColumnFormatter.calculateAlleleFrequency (
                    gnomadData.gnomadExome.alleleCount.ac + gnomadData.gnomadGenome.alleleCount.ac, 
                    gnomadData.gnomadExome.alleleNumber.an + gnomadData.gnomadGenome.alleleFrequency.af, null).toString();
            }

            if (gnomadData && gnomadData.gnomadExome) {
                return GnomadColumnFormatter.calculateAlleleFrequency (
                    gnomadData.gnomadExome.alleleCount.ac, gnomadData.gnomadExome.alleleNumber.an, gnomadData.gnomadExome.alleleFrequency.af).toString();
            }

            if (gnomadData && gnomadData.gnomadGenome) {
                return GnomadColumnFormatter.calculateAlleleFrequency (
                    gnomadData.gnomadGenome.alleleCount.ac, gnomadData.gnomadGenome.alleleNumber.an, gnomadData.gnomadGenome.alleleFrequency.af).toString();
            }
        }
        
        return "";

    }

    public static generateGnomadUrl(chrom: String | null, start: number | null, alt: String | null, ref: String | null) {
        
        if (chrom && start && alt && ref) {
            return "https://gnomad.broadinstitute.org/variant/" + chrom + "-" + start.toString() + "-" + alt + "-" + ref;
        }
        else {
            return "https://gnomad.broadinstitute.org/";
        }
        
    }
} 