import * as React from 'react';
import DefaultTooltip from 'shared/components/DefaultTooltip';
import 'rc-tooltip/assets/bootstrap_white.css';
import styles from "./mutationAssessor.module.scss";
import {Mutation} from "shared/api/generated/CBioPortalAPI";

type MA_CLASS_NAME = 'oma-high' | 'oma-medium' | 'oma-low' | 'oma-neutral' | 'oma-na';

export interface IMutationAssessorFormat
{
    label: string;
    className: MA_CLASS_NAME;
    priority: number;
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
            h: {label: "High", className: "oma-high", priority: 4},
            m: {label: "Medium", className: "oma-medium", priority: 3},
            l: {label: "Low", className: "oma-low", priority: 2},
            n: {label: "Neutral", className: "oma-neutral", priority: 1},
            na: {label: "", className: "oma-na", priority: 0},
        };
    }

    public static getSortValue(d:Mutation[]):(number|null)[]
    {
        let score:number|undefined = MutationAssessorColumnFormatter.getData(d).score;
        let returnScore:number|null;

        // If data is missing, it returns undefined. For the way the table works, we map this to null.
        if (score === undefined || score === 0) {
            returnScore = null;
        } else {
            returnScore = score;
        }

        const format = MutationAssessorColumnFormatter.getMapEntry(d);
        const priority = format && format.priority > 0 ? format.priority : null;

        return [priority, returnScore];
    }

    public static filterValue(data:Mutation[]):string
    {
        return MutationAssessorColumnFormatter.getDisplayValue(data);
    }

    /**
     * Determines the display value by using the impact field.
     *
     * @param data  column formatter data
     * @returns {string}    mutation assessor text value
     */
    public static getDisplayValue(data:Mutation[]):string
    {
        const entry:IMutationAssessorFormat|undefined =
            MutationAssessorColumnFormatter.getMapEntry(data);

        // first, try to find a mapped value
        if (entry) {
            return entry.label;
        }
        // if no mapped value, then just return empty text
        else {
            return "";
        }
    }

    public static getTextValue(data:Mutation[]):string
    {
        const maData = MutationAssessorColumnFormatter.getData(data);

        // return impact value (if exists)
        if (maData && maData.impact) {
            return maData.impact.toString();
        }
        else {
            return "";
        }
    }

    public static getScoreClassName(data:Mutation[]):string
    {
        const value:IMutationAssessorFormat|undefined =
            MutationAssessorColumnFormatter.getMapEntry(data);

        if (value) {
            return value.className;
        }
        else {
            return "";
        }
    }

    public static getMaClassName(data:Mutation[]):string
    {
        const value:IMutationAssessorFormat|undefined =
            MutationAssessorColumnFormatter.getMapEntry(data);

        if (value) {
            return "oma-link";
        }
        else {
            return "";
        }
    }

    public static getMapEntry(data:Mutation[])
    {
        const maData = MutationAssessorColumnFormatter.getData(data);

        if (maData && maData.impact) {
            return MutationAssessorColumnFormatter.MA_SCORE_MAP[maData.impact.toLowerCase()];
        }
        else {
            return undefined;
        }
    }

    public static getData(data:Mutation[])
    {
        let maData;

        if (data.length > 0) {
            maData = {
                impact: data[0].functionalImpactScore,
                score: data[0].fisValue,
                pdb: data[0].linkPdb,
                msa: data[0].linkMsa,
                xVar: data[0].linkXvar
            };
        } else {
            maData = {
                impact: undefined,
                score: undefined,
                pdb: undefined,
                msa: undefined,
                xVar: undefined
            };
        }
        return maData;
    }

    public static getTooltipContent(data:Mutation[])
    {
        const maData = MutationAssessorColumnFormatter.getData(data);
        let xVar:any = "";
        let msa:any = "";
        let pdb:any = "";
        let impact:any = "";

        // workaround: links in the database are not working anymore!
        const xVarLink = MutationAssessorColumnFormatter.maLink(maData.xVar);
        const msaLink = MutationAssessorColumnFormatter.maLink(maData.msa);
        const pdbLink = MutationAssessorColumnFormatter.maLink(maData.pdb);

        if (maData.score)
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
            url = link.replace("getma.org", "mutationassessor.org/r2");

            // prepend "http://" if needed
            if (url.indexOf("http://") !== 0)
            {
                url = `http://${url}`;
            }
        }

        return url;
    }

    public static renderFunction(data:Mutation[])
    {
        const text:string = MutationAssessorColumnFormatter.getDisplayValue(data);
        const fisClass:string = MutationAssessorColumnFormatter.getScoreClassName(data);
        const maClass:string = MutationAssessorColumnFormatter.getMaClassName(data);

        let content = (
            <span className={`${styles[maClass]} ${styles[fisClass]}`}>{text}</span>
        );

        // add tooltip for valid values
        if (MutationAssessorColumnFormatter.isValidValue(text))
        {
            const arrowContent = <div className="rc-tooltip-arrow-inner"/>;
            const tooltipContent = MutationAssessorColumnFormatter.getTooltipContent(data);

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
