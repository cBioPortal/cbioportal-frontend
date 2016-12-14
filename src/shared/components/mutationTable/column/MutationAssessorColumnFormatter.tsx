import * as React from 'react';
import {IColumnFormatterProps, IColumnFormatterData, IColumnFormatter}
    from "../../enhancedReactTable/IColumnFormatterProps";
import "./mutationAssessor.scss";

/**
 * @author Selcuk Onur Sumer
 */
export default class MutationAssessorColumnFormatter extends React.Component<IColumnFormatterProps, {}> implements IColumnFormatter
{
    /**
     * Mapping between the functional impact score (data) values and
     * view values.
     */
    public static get MA_SCORE_MAP():{[key:string]:any} {
        return {
            h: {label: "High", style: "oma-high", priority: 4},
            m: {label: "Medium", style: "oma-medium", priority: 3},
            l: {label: "Low", style: "oma-low", priority: 2},
            n: {label: "Neutral", style: "oma-neutral", priority: 1}
        };
    }

    public static sortFunction(a:IColumnFormatterData, b:IColumnFormatterData):boolean
    {
        let aScore = MutationAssessorColumnFormatter.getData(a).score;
        let bScore = MutationAssessorColumnFormatter.getData(b).score;
        let aImpact = MutationAssessorColumnFormatter.getData(a).impact;
        let bImpact = MutationAssessorColumnFormatter.getData(b).impact;

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
        let entry:any = MutationAssessorColumnFormatter.getMapEntry(data);

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
        let maData:any = MutationAssessorColumnFormatter.getData(data);

        // return impact value (if exists)
        if (maData && maData.impact) {
            return maData.impact;
        }
        else {
            return "";
        }
    }

    public static getScoreClass(data:IColumnFormatterData):string
    {
        let value:any = MutationAssessorColumnFormatter.getMapEntry(data);

        if (value) {
            return value.style;
        }
        else {
            return "";
        }
    }

    public static getMaClass(data:IColumnFormatterData):string
    {
        let value:any = MutationAssessorColumnFormatter.getMapEntry(data);

        if (value) {
            return "oma-link";
        }
        else {
            return "";
        }
    }

    public static getMapEntry(data:IColumnFormatterData):any // IMutationAssessorFormat?
    {
        let entry:any = null;
        let maData:any = MutationAssessorColumnFormatter.getData(data);

        if (maData && maData.impact) {
            entry = MutationAssessorColumnFormatter.MA_SCORE_MAP[maData.impact.toLowerCase()];
        }

        return entry;
    }

    public static getData(data:IColumnFormatterData):any
    {
        let maData:any;

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

    constructor(props:IColumnFormatterProps)
    {
        super(props);
        this.state = {};
    }

    public render():any
    {
        let data:IColumnFormatterData = this.props.data;
        let text:string = MutationAssessorColumnFormatter.getDisplayValue(data);
        let fisClass:string = MutationAssessorColumnFormatter.getScoreClass(data);
        let maClass:string = MutationAssessorColumnFormatter.getMaClass(data);

        return (
            <span className={`${maClass} ${fisClass}`}>{text}</span>
        );
    }
}
