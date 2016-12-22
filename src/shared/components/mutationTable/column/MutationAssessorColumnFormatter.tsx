import * as React from 'react';
import Tooltip from 'rc-tooltip';
import {Td} from 'reactableMSK';
import {IColumnFormatterData, IColumnFormatter}
    from "../../enhancedReactTable/IColumnFormatter";
import 'rc-tooltip/assets/bootstrap_white.css';
import "./mutationAssessor.scss";

type MA_CLASS_NAME = 'oma-high' | 'oma-medium' | 'oma-low' | 'oma-neutral';
type IMutationAssessorFormat = {
    label: string,
    className: MA_CLASS_NAME,
    priority: number
};

/**
 * @author Selcuk Onur Sumer
 */
export default class MutationAssessorColumnFormatter implements IColumnFormatter
{
    /**
     * Mapping between the functional impact score (data) values and
     * view values.
     */
    public static get MA_SCORE_MAP():{[key:string]: IMutationAssessorFormat} {
        return {
            h: {label: "High", className: "oma-high", priority: 4},
            m: {label: "Medium", className: "oma-medium", priority: 3},
            l: {label: "Low", className: "oma-low", priority: 2},
            n: {label: "Neutral", className: "oma-neutral", priority: 1}
        };
    }

    public static sortFunction(a:IColumnFormatterData, b:IColumnFormatterData):boolean
    {
        const aScore = MutationAssessorColumnFormatter.getData(a).score;
        const bScore = MutationAssessorColumnFormatter.getData(b).score;
        const aImpact = MutationAssessorColumnFormatter.getData(a).impact;
        const bImpact = MutationAssessorColumnFormatter.getData(b).impact;

        // use actual score values to compare (if exist)
        if (aScore && bScore)
        {
            return aScore > bScore;
        }
        // if no score available sort by impact priority
        else if (aImpact && bImpact)
        {
            let aPriority = -1;
            let bPriority = -1;

            if (MutationAssessorColumnFormatter.MA_SCORE_MAP[aImpact.toLowerCase()])
            {
                aPriority = MutationAssessorColumnFormatter.MA_SCORE_MAP[aImpact.toLowerCase()].priority;
            }

            if (MutationAssessorColumnFormatter.MA_SCORE_MAP[bImpact.toLowerCase()])
            {
                bPriority = MutationAssessorColumnFormatter.MA_SCORE_MAP[bImpact.toLowerCase()].priority;
            }

            return aPriority > bPriority;
        }

        return false;
    }

    public static filterValue(data:IColumnFormatterData):string
    {
        return MutationAssessorColumnFormatter.getDisplayValue(data);
    }

    /**
     * Determines the display value by using the impact field.
     *
     * @param data  column formatter data
     * @returns {string}    mutation assessor text value
     */
    public static getDisplayValue(data:IColumnFormatterData):string
    {
        const entry:IMutationAssessorFormat|undefined =
            MutationAssessorColumnFormatter.getMapEntry(data);

        // first, try to find a mapped value
        if (entry) {
            return entry.label;
        }
        // if no mapped value, then return the text value as is
        else {
            return MutationAssessorColumnFormatter.getTextValue(data);
        }
    }

    public static getTextValue(data:IColumnFormatterData):string
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

    public static getScoreClassName(data:IColumnFormatterData):string
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

    public static getMaClassName(data:IColumnFormatterData):string
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

    public static getMapEntry(data:IColumnFormatterData)
    {
        const maData = MutationAssessorColumnFormatter.getData(data);

        if (maData && maData.impact) {
            return MutationAssessorColumnFormatter.MA_SCORE_MAP[maData.impact.toLowerCase()];
        }
        else {
            return undefined;
        }
    }

    public static getData(data:IColumnFormatterData)
    {
        let maData;

        if (data.columnData)
        {
            maData = data.columnData;
        }
        else if (data.rowData)
        {
            maData = {
                impact: data.rowData.functionalImpactScore,
                score: data.rowData.fisValue,
                pdb: data.rowData.linkPdb,
                msa: data.rowData.linkMsa,
                xVar: data.rowData.linkXvar
            };
        }
        else {
            maData = {};
        }

        return maData;
    }

    public static getTooltipContent(data:IColumnFormatterData)
    {
        const maData = MutationAssessorColumnFormatter.getData(data);
        let xVar:any = "";
        let msa:any = "";
        let pdb:any = "";
        let impact:any = "";

        if (maData.score)
        {
            impact = (
                <div>
                    Predicted impact score: <b>{impact}</b>
                </div>
            );
        }

        // TODO load image file
        if (maData.xVar)
        {
            xVar = (
                <div className='mutation-assessor-main-link mutation-assessor-link'>
                    <a href={maData.xVar} target='_blank'>
                        <img height='15' width='19' src={require("./mutationAssessor.png")} alt='Mutation Assessor' />
                        Go to Mutation Assessor
                    </a>
                </div>
            );
        }

        if (maData.msa)
        {
            msa = (
                <div className='mutation-assessor-msa-link mutation-assessor-link'>
                    <a href={maData.msa} target='_blank'>
                        <span className="ma-msa-icon">msa</span>
                        Multiple Sequence Alignment
                    </a>
                </div>
            );
        }

        if (maData.pdb)
        {
            pdb = (
                <div className='mutation-assessor-3d-link mutation-assessor-link'>
                    <a href={maData.pdb} target='_blank'>
                        <span className="ma-3d-icon">3D</span>
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

    public static renderFunction(data:IColumnFormatterData)
    {
        const text:string = MutationAssessorColumnFormatter.getDisplayValue(data);
        const fisClass:string = MutationAssessorColumnFormatter.getScoreClassName(data);
        const maClass:string = MutationAssessorColumnFormatter.getMaClassName(data);
        const tooltipContent = MutationAssessorColumnFormatter.getTooltipContent(data);

        // this is required to have a proper filtering when we pass a complex object as Td.value
        data.toString = function() {
            return MutationAssessorColumnFormatter.filterValue(data);
        };

        const arrowContent = <div className="rc-tooltip-arrow-inner"/>;

        return (
            <Td column={data.name} value={data}>
                <Tooltip overlay={tooltipContent} placement="rightTop" arrowContent={arrowContent}>
                    <span className={`${maClass} ${fisClass}`}>{text}</span>
                </Tooltip>
            </Td>
        );
    }
}
