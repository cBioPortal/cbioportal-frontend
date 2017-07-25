import * as React from 'react';
import DefaultTooltip from 'shared/components/DefaultTooltip';
import 'rc-tooltip/assets/bootstrap_white.css';
import styles from "./mutationAssessor.module.scss";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {MutationAssessor, IGenomeNexusData} from "shared/model/GenomeNexus";

type MA_CLASS_NAME = 'oma-high' | 'oma-medium' | 'oma-low' | 'oma-neutral' | 'oma-na';

export interface IMutationAssessorFormat
{
    label: string;
    className: MA_CLASS_NAME;
    priority: number;
}

export interface IColumnProps {
    mutationData: Mutation[];
    genomeNexusData?: any;
}

/**
 * @author Selcuk Onur Sumer
 */
export default class MutationAssessorColumnFormatter
{
    /**
     * Mapping between the functional impact score (data) values and
     * view values.
     */
    public static get MA_SCORE_MAP():{[impact:string]: IMutationAssessorFormat} {
        return {
            high: {label: "High", className: "oma-high", priority: 4},
            medium: {label: "Medium", className: "oma-medium", priority: 3},
            low: {label: "Low", className: "oma-low", priority: 2},
            neutral: {label: "Neutral", className: "oma-neutral", priority: 1},
            na: {label: "NA", className: "oma-na", priority: 0},
        };
    }

    public static getSortValue(columnProps:IColumnProps):(number|null)[]
    {
        // If data is missing, it returns undefined. For the way the table works, we map this to null.
        let score:number|undefined = MutationAssessorColumnFormatter.getData(columnProps).score;
        let returnScore:number|null;
        if (score === undefined) {
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
        // if no mapped value, then return the text value as is
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

    public static getData(columnProps:IColumnProps)
    {
        let data:Mutation[] = columnProps.mutationData;
        let genomeNexusData:IGenomeNexusData = columnProps.genomeNexusData;

        let maData;

        if (data.length > 0 && genomeNexusData &&
            genomeNexusData.hasOwnProperty("mutation_assessor")) {

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
            link.length > 0 &&
            link.toLowerCase() !== "na" &&
            link.toLowerCase().indexOf("not available") === -1)
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
        let data:Mutation[] = columnProps.mutationData;

        const NA:string = MutationAssessorColumnFormatter.MA_SCORE_MAP["na"].label;

        const text:string = MutationAssessorColumnFormatter.getDisplayValue(columnProps);
        const fisClass:string = MutationAssessorColumnFormatter.getScoreClassName(columnProps);
        const maClass:string = MutationAssessorColumnFormatter.getMaClassName(columnProps);

        let content = (
            <span className={`${styles[maClass]} ${styles[fisClass]}`}>{text}</span>
        );

        // add tooltip for valid values
        if (text.length > 0 && text !== NA)
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
}
