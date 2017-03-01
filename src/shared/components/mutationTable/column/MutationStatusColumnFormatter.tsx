import {IColumnFormatterData} from "shared/components/enhancedReactTable/IColumnFormatter";
import {MutationTableRowData} from "../IMutationTableProps";
import {Mutation} from "shared/api/CBioPortalAPI";

/**
 * @author Selcuk Onur Sumer
 */
export default class MutationStatusColumnFormatter
{
    public static getDataFromRow(rowData:MutationTableRowData|undefined)
    {
        let value;

        if (rowData) {
            const mutations:Mutation[] = rowData;
            value = mutations[0].mutationStatus;
        }
        else {
            value = null;
        }

        return value;
    }

    public static getData(data:IColumnFormatterData<MutationTableRowData>)
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
