import * as React from 'react';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import 'rc-tooltip/assets/bootstrap_white.css';
import styles from "./mutationAssessor.module.scss";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {MutationAssessor, IGenomeNexusData} from "shared/model/GenomeNexus";
import {generateMutationAssessorQuery} from "shared/lib/GenomeNexusUtils";
import GenomeNexusCache from "shared/cache/GenomeNexusCache"
import {ICacheData, ICache} from "shared/lib/SimpleCache";

type MA_CLASS_NAME = 'oma-high' | 'oma-medium' | 'oma-low' | 'oma-neutral' | 'oma-na';

export interface IMutationAssessorFormat
{
    label: string;
    className: MA_CLASS_NAME;
    priority: number;
}

export interface IColumnProps {
    mutationData: Mutation[];
    genomeNexusData?: IGenomeNexusData;
    genomeNexusCache?: GenomeNexusCache;
}

/**
 * @author Selcuk Onur Sumer
 */
export default class MutationAssessorColumnFormatter //extends React.Component<IColumnProps, {}>
{
    /**
     * Mapping between the functional impact score (data) values and
     * view values.
     */
    public static get MA_SCORE_MAP():{[impact:string]: IMutationAssessorFormat} {
        return {
            h: {label: "High", className: "oma-high", priority: 4},
            m: {label: "Medium", className: "oma-medium", priority: 3},
            l: {label: "Low", className: "oma-low", priority: 2},
            n: {label: "Neutral", className: "oma-neutral", priority: 1},
            na: {label: "", className: "oma-na", priority: 0},
        };
    }

    public static getSortValue(columnProps:IColumnProps):(number|null)[]
    {
        // If data is missing, it returns undefined. For the way the table works, we map this to null.
        let score:number|undefined = MutationAssessorColumnFormatter.getData(columnProps).score;
        let returnScore:number|null;

        // If data is missing, it returns undefined. For the way the table works, we map this to null.
        if (score === undefined || score === 0) {
            returnScore = null;
        } else {
            returnScore = score;
        }
        const format = MutationAssessorColumnFormatter.getMapEntry(columnProps);
        const priority = format ? format.priority : -1;

        return [priority, returnScore];
    }

    public static filterValue(columnProps:IColumnProps):string
    {
        return MutationAssessorColumnFormatter.getDisplayValue(columnProps);
    }

    /**
     * Determines the display value by using the impact field.
     *
     * @param data  column formatter data
     * @returns {string}    mutation assessor text value
     */
    public static getDisplayValue(columnProps:IColumnProps):string
    {
        const entry:IMutationAssessorFormat|undefined =
            MutationAssessorColumnFormatter.getMapEntry(columnProps);

        // first, try to find a mapped value
        if (entry) {
            return entry.label;
        }
        // if no mapped value, then just return empty text
        else {
            return MutationAssessorColumnFormatter.getTextValue(columnProps);
        }
    }

    public static getTextValue(columnProps:IColumnProps):string
    {
        const maData = MutationAssessorColumnFormatter.getData(columnProps);

        // return impact value (if exists)
        if (maData && maData.impact) {
            return maData.impact.toString();
        }
        else {
            return "";
        }
    }

    public static getScoreClassName(columnProps:IColumnProps):string
    {
        const value:IMutationAssessorFormat|undefined =
            MutationAssessorColumnFormatter.getMapEntry(columnProps);

        if (value) {
            return value.className;
        }
        else {
            return "";
        }
    }

    public static getMaClassName(columnProps:IColumnProps):string
    {
        const value:IMutationAssessorFormat|undefined =
            MutationAssessorColumnFormatter.getMapEntry(columnProps);

        if (value) {
            return "oma-link";
        }
        else {
            return "";
        }
    }

    public static getMapEntry(columnProps:IColumnProps)
    {
        const maData = MutationAssessorColumnFormatter.getData(columnProps);

        if (maData && maData.impact) {
            return MutationAssessorColumnFormatter.MA_SCORE_MAP[maData.impact.toLowerCase()];
        }
        else {
            return undefined;
        }
    }

    public static getCacheData(columnProps:IColumnProps)
    {
        let cacheData:ICacheData<MutationAssessor>|undefined;
        let data:Mutation = columnProps.mutationData[0];

        if (columnProps.genomeNexusCache) {

            // getting the data for the current mutation
            const cache = columnProps.genomeNexusCache.getData([data.entrezGeneId.toString()], data);

            if (cache) {
                cacheData = cache[data.entrezGeneId.toString()];
            }
        }

        return cacheData;
    }

    public static getData(columnProps:IColumnProps)
    {
        let data:Mutation[] = columnProps.mutationData;
        let genomeNexusData = columnProps.genomeNexusData;
        let genomeNexusCache = columnProps.genomeNexusCache;

        let maData;

        if (data.length > 0 && genomeNexusCache) {

            const cacheData:ICacheData<MutationAssessor>|undefined = 
                MutationAssessorColumnFormatter.getCacheData(columnProps);

            if (cacheData && cacheData.status === "complete" && cacheData.data) {
                maData = {
                    impact: cacheData.data.functionalImpact,
                    score: cacheData.data.functionalImpactScore,
                    pdb: data[0].linkPdb,
                    msa: data[0].linkMsa,
                    xVar: data[0].linkXvar
                };
            }
            else if (cacheData && cacheData.status === "pending") {
                maData = {
                    impact: "pending",
                    score: 0,
                    pdb: data[0].linkPdb,
                    msa: data[0].linkMsa,
                    xVar: data[0].linkXvar
                }
            }
            else if (cacheData && cacheData.status === "error") {
                maData = {
                    impact: "error",
                    score: 0,
                    pdb: data[0].linkPdb,
                    msa: data[0].linkMsa,
                    xVar: data[0].linkXvar
                }
            }
            else {
                maData = {
                    impact: "na",
                    score: 0,
                    pdb: data[0].linkPdb,
                    msa: data[0].linkMsa,
                    xVar: data[0].linkXvar
                }
            }
        }
        
        else if (data.length > 0 && !genomeNexusCache && genomeNexusData) {
            let genomeNexusMap = genomeNexusData.mutation_assessor;
            let mutationAssessor:MutationAssessor = genomeNexusMap[data[0].entrezGeneId];

            if (mutationAssessor) {
                maData = {
                    impact: mutationAssessor.functionalImpact,
                    score: mutationAssessor.functionalImpactScore,
                    pdb: data[0].linkPdb,
                    msa: data[0].linkMsa,
                    xVar: data[0].linkXvar
                };
            }
            // when mutation assessor undefined
            else {
                maData = {
                    impact: "na",
                    score: 0,
                    pdb: data[0].linkPdb,
                    msa: data[0].linkMsa,
                    xVar: data[0].linkXvar
                }
            }
        }

        else {
            return maData = {
                impact: undefined,
                score: undefined,
                pdb: undefined,
                msa: undefined,
                xVar: undefined
            };
        }

        return maData;
    }

    public static getTooltipContent(columnProps:IColumnProps)
    {
        const maData = MutationAssessorColumnFormatter.getData(columnProps);
        let xVar:any = "";
        let msa:any = "";
        let pdb:any = "";
        let impact:any = "";

        // workaround: links in the database are not working anymore!
        const xVarLink = MutationAssessorColumnFormatter.maLink(maData.xVar);
        const msaLink = MutationAssessorColumnFormatter.maLink(maData.msa);
        const pdbLink = MutationAssessorColumnFormatter.maLink(maData.pdb);

        if (maData.score !== undefined )
        {
            impact = (
                <div>
                    Predicted impact score: <b>{maData.score.toFixed(2)}</b>
                </div>
            );
        }

        if (xVarLink)
        {
            xVar = (
                <div className={styles['mutation-assessor-link']}>
                    <a href={xVarLink} target='_blank'>
                        <img
                            height='15'
                            width='19'
                            src={require("./mutationAssessor.png")}
                            className={styles['mutation-assessor-main-img']}
                            alt='Mutation Assessor'
                        />
                        Go to Mutation Assessor
                    </a>
                </div>
            );
        }

        if (msaLink)
        {
            msa = (
                <div className={styles['mutation-assessor-link']}>
                    <a href={msaLink} target='_blank'>
                        <span className={`${styles['ma-icon']} ${styles['ma-msa-icon']}`}>msa</span>
                        Multiple Sequence Alignment
                    </a>
                </div>
            );
        }

        if (pdbLink)
        {
            pdb = (
                <div className={styles['mutation-assessor-link']}>
                    <a href={pdbLink} target='_blank'>
                        <span className={`${styles['ma-icon']} ${styles['ma-3d-icon']}`}>3D</span>
                        Mutation Assessor 3D View
                    </a>
                </div>
            );
        }

        return (
            <span>
                {impact}
                {xVar}
                {msa}
                {pdb}
            </span>
        );
    }

    // This is mostly to make the legacy MA links work
    public static maLink(link:string|undefined)
    {
        let url = null;

        // ignore invalid links ("", "NA", "Not Available")
        if (link &&
            MutationAssessorColumnFormatter.isValidValue(link))
        {
            // getma.org is the legacy link, need to replace it with the actual value
            url = link.replace("getma.org", "mutationassessor.org/r3");

            // prepend "http://" if needed
            if (url.indexOf("http://") !== 0)
            {
                url = `http://${url}`;
            }
        }

        return url;
    }

    public static renderFunction(columnProps:IColumnProps)
    {
        const text:string = MutationAssessorColumnFormatter.getDisplayValue(data);
        const fisClass:string = MutationAssessorColumnFormatter.getScoreClassName(data);
        const maClass:string = MutationAssessorColumnFormatter.getMaClassName(data);
        let data:Mutation[] = columnProps.mutationData;

        let content = (
            <span className={`${styles[maClass]} ${styles[fisClass]}`}>{text}</span>
        );

        // add tooltip for valid values
        if (MutationAssessorColumnFormatter.isValidValue(text))
        {
            const arrowContent = <div className="rc-tooltip-arrow-inner"/>;
            const tooltipContent = MutationAssessorColumnFormatter.getTooltipContent(columnProps);

            // update content with the tooltip
            content = (
                <DefaultTooltip overlay={tooltipContent} placement="left" arrowContent={arrowContent}>
                    {content}
                </DefaultTooltip>
            );
        }

        return content;
    }

    public static isValidValue(value: string) {
        return (
            value.length > 0 &&
            value.toLowerCase() !== "na" &&
            value.toLowerCase().indexOf("not available") === -1
        );
    }
}
