import * as React from 'react';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import styles from "./mutationType.module.scss";
import getCanonicalMutationType from "shared/lib/getCanonicalMutationType";

interface IMutationTypeFormat {
    label?: string;
    longName?: string;
    className: string;
    mainType: string;
    priority?: number;
}

/**
 * @author Selcuk Onur Sumer
 */
export default class MutationTypeColumnFormatter
{
    public static get MAIN_MUTATION_TYPE_MAP():{[key:string]: IMutationTypeFormat} {
        return {
            missense: {label: "Missense",
                longName: "Missense",
                className: "missense-mutation",
                mainType: "missense",
                priority: 1},
            inframe: {label: "IF",
                longName: "In-frame",
                className: "inframe-mutation",
                mainType: "inframe",
                priority: 2},
            truncating: {
                label: "Truncating",
                longName: "Truncating",
                className: "trunc-mutation",
                mainType: "truncating",
                priority: 4},
            nonsense: {label: "Nonsense",
                longName: "Nonsense",
                className: "trunc-mutation",
                mainType: "truncating",
                priority: 6},
            nonstop: {label: "Nonstop",
                longName: "Nonstop",
                className: "trunc-mutation",
                mainType: "truncating",
                priority: 7},
            nonstart: {label: "Nonstart",
                longName: "Nonstart",
                className: "trunc-mutation",
                mainType: "truncating",
                priority: 8},
            frameshift: {label: "FS",
                longName: "Frame Shift",
                className: "trunc-mutation",
                mainType: "truncating",
                priority: 4},
            frame_shift_del: {label: "FS del",
                longName: "Frame Shift Deletion",
                className: "trunc-mutation",
                mainType: "truncating",
                priority: 4},
            frame_shift_ins: {label: "FS ins",
                longName: "Frame Shift Insertion",
                className: "trunc-mutation",
                mainType: "truncating",
                priority: 5},
            in_frame_ins: {label: "IF ins",
                longName: "In-frame Insertion",
                className: "inframe-mutation",
                mainType: "inframe",
                priority: 3},
            in_frame_del: {label: "IF del",
                longName: "In-frame Deletion",
                className: "inframe-mutation",
                mainType: "inframe",
                priority: 2},
            splice_site: {label: "Splice",
                longName: "Splice site",
                className: "trunc-mutation",
                mainType: "truncating",
                priority: 9},
            fusion: {label: "Fusion",
                longName: "Fusion",
                className: "fusion",
                mainType: "other",
                priority: 10},
            silent: {label: "Silent",
                longName: "Silent",
                className: "other-mutation",
                mainType: "other",
                priority: 11},
            other: {label: "Other",
                longName: "Other",
                className: "other-mutation",
                mainType: "other",
                priority: 11},
        };
    }

    /**
     * Determines the display value by using the impact field.
     *
     * @param data  column formatter data
     * @returns {string}    mutation assessor text value
     */
    public static getDisplayValue(data:Mutation[]):string
    {
        const entry:IMutationTypeFormat|undefined =
            MutationTypeColumnFormatter.getMapEntry(data);

        // first, try to find a mapped value
        if (entry && entry.label) {
            return entry.label;
        }
        // if no mapped value, then return the text value as is
        else {
            return MutationTypeColumnFormatter.getTextValue(data);
        }
    }

    public static getTextValue(data:Mutation[]):string
    {
        let textValue:string = "";
        const dataValue = MutationTypeColumnFormatter.getData(data);

        if (dataValue) {
            textValue = dataValue.toString();
        }

        return textValue;
    }

    public static getClassName(data:Mutation[]):string
    {
        const value:IMutationTypeFormat|undefined =
            MutationTypeColumnFormatter.getMapEntry(data);

        if (value && value.className) {
            return value.className;
        }
        // for unmapped values, use the "other" style
        else {
            return MutationTypeColumnFormatter.MAIN_MUTATION_TYPE_MAP["other"].className;
        }
    }

    public static getMapEntry(data:Mutation[])
    {
        const mutationType = MutationTypeColumnFormatter.getData(data);

        if (mutationType) {
            return MutationTypeColumnFormatter.MAIN_MUTATION_TYPE_MAP[getCanonicalMutationType(mutationType)];
        }
        else {
            return undefined;
        }
    }

    public static getData(data:Mutation[])
    {
        if (data.length > 0) {
            return data[0].mutationType;
        } else {
            return null;
        }
    }

    public static renderFunction(data:Mutation[])
    {
        // use text for all purposes (display, sort, filter)
        const text:string = MutationTypeColumnFormatter.getDisplayValue(data);
        const className:string = MutationTypeColumnFormatter.getClassName(data);

        // use actual value for tooltip
        const toolTip:string = MutationTypeColumnFormatter.getTextValue(data);

        let content = <span className={styles[className]}>{text}</span>;

        // add tooltip only if the display value differs from the actual text value!
        if (toolTip.toLowerCase() !== text.toLowerCase())
        {
            const arrowContent = <div className="rc-tooltip-arrow-inner"/>;

            content = (
                <DefaultTooltip overlay={<span>{toolTip}</span>} placement="left" arrowContent={arrowContent}>
                    {content}
                </DefaultTooltip>
            );
        }

        return content;
    }
}

