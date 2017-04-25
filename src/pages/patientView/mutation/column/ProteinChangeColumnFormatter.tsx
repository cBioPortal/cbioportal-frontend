import * as React from 'react';
import {
    default as DefaultProteinChangeColumnFormatter
} from "shared/components/mutationTable/column/ProteinChangeColumnFormatter";
import MutationStatusColumnFormatter from "shared/components/mutationTable/column/MutationStatusColumnFormatter";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import styles from './style/proteinChange.module.scss';

/**
 * Designed to customize protein change column content for patient view page.
 *
 * @author Selcuk Onur Sumer
 */
export default class ProteinChangeColumnFormatter
{
    public static renderFunction(data:Mutation[])
    {
        // use text as display value
        const text:string = DefaultProteinChangeColumnFormatter.getDisplayValue(data);

        const mutationStatus:string|null = MutationStatusColumnFormatter.getData(data);

        let content = <span className={styles.proteinChange}>{text}</span>;

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
