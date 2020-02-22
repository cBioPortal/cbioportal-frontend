import * as React from 'react';
import {
    DefaultTooltip,
    getCanonicalMutationType,
} from 'cbioportal-frontend-commons';
import { Mutation } from 'shared/api/generated/CBioPortalAPI';
import {
    ICategoricalColumn,
    createToolTip,
} from './CategoricalColumnFormatter';
import styles from './mutationType.module.scss';

/**
 * Mutation Column Formatter.
 */
export default class MutationTypeColumnFormatter {
    public static get MAIN_MUTATION_TYPE_MAP(): {
        [key: string]: ICategoricalColumn;
    } {
        return {
            missense: {
                displayValue: 'Missense',
                className: styles.missenseMutation,
            },
            inframe: {
                displayValue: 'IF',
                className: styles.inframeMutation,
            },
            truncating: {
                displayValue: 'Truncating',
                className: styles.truncMutation,
            },
            nonsense: {
                displayValue: 'Nonsense',
                className: styles.truncMutation,
            },
            nonstop: {
                displayValue: 'Nonstop',
                className: styles.truncMutation,
            },
            nonstart: {
                displayValue: 'Nonstart',
                className: styles.truncMutation,
            },
            frameshift: {
                displayValue: 'FS',
                className: styles.truncMutation,
            },
            frame_shift_del: {
                displayValue: 'FS del',
                className: styles.truncMutation,
            },
            frame_shift_ins: {
                displayValue: 'FS ins',
                className: styles.trunMutation,
            },
            in_frame_ins: {
                displayValue: 'IF ins',
                className: styles.inframeMutation,
            },
            in_frame_del: {
                displayValue: 'IF del',
                className: styles.inframeMutation,
            },
            splice_site: {
                displayValue: 'Splice',
                className: styles.truncMutation,
            },
            fusion: {
                displayValue: 'Fusion',
                className: styles.fusion,
            },
            silent: {
                displayValue: 'Silent',
                className: styles.otherMutation,
            },
            other: {
                displayValue: 'Other',
                className: styles.otherMutation,
            },
        };
    }

    /**
     * Determines the display value.
     *
     * @param data  mutation data.
     * @returns {string} value to display within the column.
     */
    public static getDisplayValue(data: Mutation[]): string {
        const entry:
            | ICategoricalColumn
            | undefined = MutationTypeColumnFormatter.getMapEntry(data);

        // first, try to find a mapped value
        if (entry && entry.displayValue) {
            return entry.displayValue;
        }
        // if no mapped value, then return the text value as is
        else {
            return MutationTypeColumnFormatter.getTextValue(data);
        }
    }

    public static getTextValue(data: Mutation[]): string {
        let textValue: string = '';
        const dataValue = MutationTypeColumnFormatter.getData(data);

        if (dataValue) {
            textValue = dataValue.toString();
        }

        return textValue;
    }

    public static getClassName(data: Mutation[]): string {
        const value:
            | ICategoricalColumn
            | undefined = MutationTypeColumnFormatter.getMapEntry(data);

        if (value && value.className) {
            return value.className;
        }
        // for unmapped values, use the "other" style
        else {
            return MutationTypeColumnFormatter.MAIN_MUTATION_TYPE_MAP['other']
                .className;
        }
    }

    public static getMapEntry(data: Mutation[]) {
        const mutationType = MutationTypeColumnFormatter.getData(data);

        if (mutationType) {
            return MutationTypeColumnFormatter.MAIN_MUTATION_TYPE_MAP[
                getCanonicalMutationType(mutationType)
            ];
        } else {
            return undefined;
        }
    }

    public static getData(data: Mutation[]) {
        if (data.length > 0) {
            return data[0].mutationType;
        } else {
            return null;
        }
    }

    public static renderFunction(data: Mutation[]) {
        // use text for all purposes (display, sort, filter)
        const text: string = MutationTypeColumnFormatter.getDisplayValue(data);
        const className: string = MutationTypeColumnFormatter.getClassName(
            data
        );

        // use actual value for tooltip
        const toolTip: string = MutationTypeColumnFormatter.getTextValue(data);
        let content = <span className={className}>{text}</span>;

        // add tooltip only if the display value differs from the actual text value!
        if (toolTip.toLowerCase() !== text.toLowerCase()) {
            content = createToolTip(content, toolTip);
        }
        return content;
    }
}
