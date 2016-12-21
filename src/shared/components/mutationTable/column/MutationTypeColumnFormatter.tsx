import * as React from 'react';
import Tooltip from 'rc-tooltip';
import {Td} from 'reactableMSK';
import {IColumnFormatterData, IColumnFormatter}
    from "../../enhancedReactTable/IColumnFormatter";
import "./mutationType.scss";

type IMutationTypeFormat = {
    label?: string,
    longName?: string,
    className: string,
    mainType: string,
    priority?: number
};

/**
 * @author Selcuk Onur Sumer
 */
export default class MutationTypeColumnFormatter implements IColumnFormatter
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
            default: {label: "Other",
                longName: "Other",
                className: "other-mutation",
                mainType: "other",
                priority: 11},
            // not defining a label property:
            // mutations mapped to "other" will be labelled
            // with their actual data value
            other: {className: "other-mutation",
                mainType: "other",
                priority: 11}
        };
    }

    public static get MUTATION_TYPE_MAP():{[key:string]: IMutationTypeFormat} {
        let mainMap = MutationTypeColumnFormatter.MAIN_MUTATION_TYPE_MAP;
        
        return {
            missense_mutation: mainMap["missense"],
            missense: mainMap["missense"],
            missense_variant: mainMap["missense"],
            frame_shift_ins: mainMap["frame_shift_ins"],
            frame_shift_del: mainMap["frame_shift_del"],
            frameshift: mainMap["frameshift"],
            frameshift_deletion: mainMap["frame_shift_del"],
            frameshift_insertion: mainMap["frame_shift_ins"],
            de_novo_start_outofframe: mainMap["frameshift"],
            frameshift_variant: mainMap["frameshift"],
            nonsense_mutation: mainMap["nonsense"],
            nonsense: mainMap["nonsense"],
            stopgain_snv: mainMap["nonsense"],
            stop_gained: mainMap["nonsense"],
            splice_site: mainMap["splice_site"],
            splice: mainMap["splice_site"],
            "splice site": mainMap["splice_site"],
            splicing: mainMap["splice_site"],
            splice_site_snp: mainMap["splice_site"],
            splice_site_del: mainMap["splice_site"],
            splice_site_indel: mainMap["splice_site"],
            splice_region_variant: mainMap["splice_site"],
            translation_start_site:  mainMap["nonstart"],
            initiator_codon_variant: mainMap["nonstart"],
            start_codon_snp: mainMap["nonstart"],
            start_codon_del: mainMap["nonstart"],
            nonstop_mutation: mainMap["nonstop"],
            stop_lost: mainMap["nonstop"],
            in_frame_del: mainMap["in_frame_del"],
            in_frame_deletion: mainMap["in_frame_del"],
            in_frame_ins: mainMap["in_frame_ins"],
            in_frame_insertion: mainMap["in_frame_ins"],
            indel: mainMap["in_frame_del"],
            nonframeshift_deletion: mainMap["inframe"],
            nonframeshift: mainMap["inframe"],
            "nonframeshift insertion": mainMap["inframe"],
            nonframeshift_insertion: mainMap["inframe"],
            targeted_region: mainMap["inframe"],
            inframe: mainMap["inframe"],
            truncating: mainMap["truncating"],
            feature_truncation: mainMap["truncating"],
            fusion: mainMap["fusion"],
            silent: mainMap["silent"],
            synonymous_variant: mainMap["silent"],
            any: mainMap["default"],
            other: mainMap["default"]
        };
    }

    /**
     * Determines the display value by using the impact field.
     *
     * @param data  column formatter data
     * @returns {string}    mutation assessor text value
     */
    public static getDisplayValue(data:IColumnFormatterData):string
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

    public static getTextValue(data:IColumnFormatterData):string
    {
        let textValue:string = "";
        const dataValue = MutationTypeColumnFormatter.getData(data);

        if (dataValue) {
            textValue = dataValue.toString();
        }

        return textValue;
    }

    public static getClassName(data:IColumnFormatterData):string
    {
        const value:IMutationTypeFormat|undefined =
            MutationTypeColumnFormatter.getMapEntry(data);

        if (value && value.className) {
            return value.className;
        }
        // for unmapped values, use the "other" style
        else {
            return MutationTypeColumnFormatter.MUTATION_TYPE_MAP["other"].className;
        }
    }

    public static getMapEntry(data:IColumnFormatterData)
    {
        const mutationType = MutationTypeColumnFormatter.getData(data);

        if (mutationType) {
            return MutationTypeColumnFormatter.MUTATION_TYPE_MAP[mutationType.toLowerCase()];
        }
        else {
            return undefined;
        }
    }

    public static getData(data:IColumnFormatterData)
    {
        let mutationType;

        if (data.columnData)
        {
            mutationType = data.columnData;
        }
        else if (data.rowData)
        {
            mutationType = data.rowData.mutationType;
        }
        else {
            mutationType = null;
        }

        return mutationType;
    }

    public static renderFunction(data:IColumnFormatterData)
    {
        // use text for all purposes (display, sort, filter)
        const text:string = MutationTypeColumnFormatter.getDisplayValue(data);
        const className:string = MutationTypeColumnFormatter.getClassName(data);

        // use actual value for tooltip
        const toolTip:string = MutationTypeColumnFormatter.getTextValue(data);

        const arrowContent = <div className="rc-tooltip-arrow-inner"/>;

        return (
            <Td column={data.name} value={text}>
                <Tooltip overlay={toolTip} placement="rightTop" arrowContent={arrowContent}>
                    <span className={className}>{text}</span>
                </Tooltip>
            </Td>
        );
    }
}

