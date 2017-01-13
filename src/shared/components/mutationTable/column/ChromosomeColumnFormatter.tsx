import {IColumnFormatterData}
    from "../../../../shared/components/enhancedReactTable/IColumnFormatter";
import GeneColumnFormatter from "./GeneColumnFormatter";
import {MutationTableRowData} from "../IMutationTableProps";

/**
 * @author Selcuk Onur Sumer
 */
export default class ChromosomeColumnFormatter
{
    public static getDataFromRow(rowData:MutationTableRowData|undefined)
    {
        let geneData = GeneColumnFormatter.getDataFromRow(rowData);

        if (geneData) {
            return geneData.chromosome;
        }
        else {
            return null;
        }
    }

    public static sortFunction(a:string, b:string):number
    {
        let aValue = ChromosomeColumnFormatter.extractSortValue(a);
        let bValue = ChromosomeColumnFormatter.extractSortValue(b);

        return aValue > bValue ? 1 : -1;
    }

    public static extractSortValue(chromosome:string)
    {
        const numerical:RegExp = /[0-9]+/g;

        let matched:RegExpMatchArray|null = chromosome.match(numerical);
        let value:number = -1;

        // if no match, then search for X or Y
        if (matched)
        {
            value = parseInt(matched[0]);
        }
        else if (chromosome.toLowerCase().indexOf("x") > -1)
        {
            value = 23;
        }
        else if (chromosome.toLowerCase().indexOf("y") > -1)
        {
            value = 24;
        }

        return value;
    }

    public static getData(data:IColumnFormatterData<MutationTableRowData>)
    {
        let chromosome;

        if (data.columnData) {
            chromosome = data.columnData;
        }
        else {
            chromosome = ChromosomeColumnFormatter.getDataFromRow(data.rowData);
        }

        return chromosome;
    }
}
