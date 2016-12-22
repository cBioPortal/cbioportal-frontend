import * as React from 'react';
import {Td} from 'reactableMSK';
import {IColumnFormatterData, IColumnFormatter}
    from "../../../../shared/components/enhancedReactTable/IColumnFormatter";
import {default as DefaultProteinChangeColumnFormatter} from
    "../../../../shared/components/mutationTable/column/ProteinChangeColumnFormatter";
import styles from './proteinChange.module.scss';

/**
 * Designed to customize protein change column content for patient view page.
 *
 * @author Selcuk Onur Sumer
 */
export default class ProteinChangeColumnFormatter implements IColumnFormatter
{
    // TODO factor out this function into MutationStatusColumnFormatter class!
    public static getMutationStatus(rowData:any)
    {
        let value;

        if (rowData) {
            let rowDataArray:Array<any> = [].concat(rowData);
            value = rowDataArray[0].mutationStatus;
        }
        else {
            value = null;
        }

        return value;
    }

    public static renderFunction(data:IColumnFormatterData)
    {
        // use text as display value
        const text:string = DefaultProteinChangeColumnFormatter.getDisplayValue(data);

        // use value as sort & filter value
        const value:string = DefaultProteinChangeColumnFormatter.getTextValue(data);

        let mutationStatus:string|null = ProteinChangeColumnFormatter.getMutationStatus(data.rowData);

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

        return (
            <Td column={data.name} value={value}>
                {content}
            </Td>
        );
    }
}
