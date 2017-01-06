import {IColumnFormatterData}
    from "../../../../shared/components/enhancedReactTable/IColumnFormatter";

/**
 * @author Selcuk Onur Sumer
 */
export default class MutationStatusColumnFormatter
{
    public static getDataFromRow(rowData:any)
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

    public static getData(data:IColumnFormatterData)
    {
        let mutationStatus;

        if (data.columnData) {
            mutationStatus = data.columnData;
        }
        else {
            mutationStatus = MutationStatusColumnFormatter.getDataFromRow(data.rowData);
        }

        return mutationStatus;
    }
}
