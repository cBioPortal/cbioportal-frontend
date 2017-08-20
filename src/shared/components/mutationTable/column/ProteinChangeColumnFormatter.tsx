import * as React from 'react';
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import TruncatedText from "shared/components/TruncatedText";
import MutationStatusColumnFormatter from "./MutationStatusColumnFormatter";
import styles from './proteinChange.module.scss';

/**
 * @author Selcuk Onur Sumer
 */
export default class ProteinChangeColumnFormatter
{
    public static getSortValue(d:Mutation[]):number|null {
        return ProteinChangeColumnFormatter.extractSortValue(
            ProteinChangeColumnFormatter.getTextValue(d)
        );
    }

    // this is to sort alphabetically
    // in case the protein position values are the same
    public static extractNonNumerical(matched:RegExpMatchArray):number[]
    {
        const nonNumerical:RegExp = /[^0-9]+/g;
        const buffer:RegExpMatchArray|null = matched[0].match(nonNumerical);
        const value:number[] = [];

        if (buffer && buffer.length > 0)
        {
            const str:string = buffer.join("");

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

    /**
     * Extracts the sort value for the protein change value.
     * The return value is based on the protein change location.
     *
     * @param proteinChange
     * @returns {number} sort value
     */
    public static extractSortValue(proteinChange:string):number|null
    {
        // let matched = proteinChange.match(/.*[A-Z]([0-9]+)[^0-9]+/);
        const alleleAndPosition:RegExp = /[A-Za-z][0-9]+./g;
        const position:RegExp = /[0-9]+/g;

        // first priority is to match values like V600E , V600, E747G, E747, X37_, X37, etc.
        let matched:RegExpMatchArray|null = proteinChange.match(alleleAndPosition);
        let buffer:number[] = [];

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
            return null;
        }
    }

    public static getTextValue(data:Mutation[]):string
    {
        let textValue:string = "";
        const dataValue = ProteinChangeColumnFormatter.getData(data);

        if (dataValue) {
            textValue = dataValue.toString();
        }

        return textValue;
    }

    public static getDisplayValue(data:Mutation[]):string
    {
        // same as text value
        return ProteinChangeColumnFormatter.getTextValue(data);
    }

    public static getData(data:Mutation[])
    {
        if (data.length > 0) {
            return data[0].proteinChange;
        } else {
            return null;
        }
    }

    public static renderPlainText(data:Mutation[])
    {
        // use text as display value
        const text:string = ProteinChangeColumnFormatter.getDisplayValue(data);

        return (
                <span>{text}</span>
        );
    }

    public static renderWithMutationStatus(data:Mutation[])
    {
        // use text as display value
        const text:string = ProteinChangeColumnFormatter.getDisplayValue(data);

        const mutationStatus:string|null = MutationStatusColumnFormatter.getData(data);

        let content = (
            <TruncatedText
                text={text}
                tooltip={<span>{text}</span>}
                className={styles.proteinChange}
                maxLength={20}
            />
        );

        // add a germline indicator next to protein change if it is a germline mutation!
        if (mutationStatus &&
            mutationStatus.toLowerCase().indexOf("germline") > -1)
        {
            content = (
                <span>
                    {content}
                    <span className={styles.germline}>Germline</span>
                </span>
            );
        }

        return content;
    }
}
