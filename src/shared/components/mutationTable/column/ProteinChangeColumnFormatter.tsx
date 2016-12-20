import * as React from 'react';
import {Td} from 'reactableMSK';
import {IColumnFormatterData, IColumnFormatter}
    from "../../enhancedReactTable/IColumnFormatter";

/**
 * @author Selcuk Onur Sumer
 */
export default class ProteinChangeColumnFormatter implements IColumnFormatter
{
    public static sortFunction(a:IColumnFormatterData, b:IColumnFormatterData):boolean
    {
        let aValue = ProteinChangeColumnFormatter.sortValue(a);
        let bValue = ProteinChangeColumnFormatter.sortValue(b);

        return aValue > bValue;
    }

    // this is to sort alphabetically
    // in case the protein position values are the same
    public static extractNonNumerical(matched:RegExpMatchArray):Array<number>
    {
        let nonNumerical:RegExp = /[^0-9]+/g;
        let buffer:RegExpMatchArray|null = matched[0].match(nonNumerical);
        let value:Array<number> = [];

        if (buffer && buffer.length > 0)
        {
            let str:string = buffer.join("");

            // since we are returning a float value
            // assigning numerical value for each character.
            // we have at most 2 characters, so this should be safe...
            for (let i:number=0; i<str.length; i++)
            {
                value.push(str.charCodeAt(i));
            }
        }

        return value;
    }

    public static sortValue(data:IColumnFormatterData):number
    {
        let proteinChange:string = ProteinChangeColumnFormatter.getTextValue(data);
        return ProteinChangeColumnFormatter.extractSortValue(proteinChange);
    }

    /**
     * Extracts the sort value for the protein change value.
     * The return value is based on the protein change location.
     *
     * @param proteinChange
     * @returns {number} sort value
     */
    public static extractSortValue(proteinChange:string):number
    {
        // let matched = proteinChange.match(/.*[A-Z]([0-9]+)[^0-9]+/);
        let alleleAndPosition:RegExp = /[A-Za-z][0-9]+./g;
        let position:RegExp = /[0-9]+/g;

        // first priority is to match values like V600E , V600, E747G, E747, X37_, X37, etc.
        let matched:RegExpMatchArray|null = proteinChange.match(alleleAndPosition);
        let buffer:Array<number> = [];

        // if no match, then search for numerical (position) match only
        if (!matched || matched.length === 0)
        {
            matched = proteinChange.match(position);
        }
        // if match, then extract the first numerical value for sorting purposes
        else
        {
            // this is to sort alphabetically
            buffer = ProteinChangeColumnFormatter.extractNonNumerical(matched);
            matched = matched[0].match(position);
        }

        // if match, then use the first integer value as sorting data
        if (matched && matched.length > 0)
        {
            let toParse:string =  matched[0];

            // this is to sort alphabetically
            if (buffer && buffer.length > 0)
            {
                // add the alphabetical information as the decimal part...
                // (not the best way to ensure alphabetical sorting,
                // but in this method we are only allowed to return a numerical value)
                toParse += "." + buffer.join("");
            }

            return parseFloat(toParse);
        }
        else
        {
            // no match at all: do not sort
            return -Infinity;
        }
    }

    public static filterValue(data:IColumnFormatterData):string
    {
        return ProteinChangeColumnFormatter.getTextValue(data);
    }

    public static getTextValue(data:IColumnFormatterData):string
    {
        let textValue:string = "";
        let dataValue = ProteinChangeColumnFormatter.getData(data);

        if (dataValue) {
            textValue = dataValue.toString();
        }

        return textValue;
    }

    public static getDisplayValue(data:IColumnFormatterData):string
    {
        // same as text value
        return ProteinChangeColumnFormatter.getTextValue(data);
    }

    public static getData(data:IColumnFormatterData)
    {
        let value;

        if (data.columnData) {
            value = data.columnData;
        }
        else if (data.rowData) {
            value = data.rowData.proteinChange;
        }
        else {
            value = null;
        }

        return value;
    }

    public static renderFunction(data:IColumnFormatterData)
    {
        let text:string = ProteinChangeColumnFormatter.getDisplayValue(data);

        data.toString = function() {
            return ProteinChangeColumnFormatter.filterValue(data);
        };

        // TODO we probably need two different renderer classes, one for patient view one for results page
        return (
            <Td column={data.name} value={data}>
                <span>{text}</span>
            </Td>
        );
    }
}
