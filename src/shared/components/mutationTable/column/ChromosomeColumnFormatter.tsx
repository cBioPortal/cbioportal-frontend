import {Mutation} from "shared/api/generated/CBioPortalAPI";

/**
 * @author Selcuk Onur Sumer
 */
export default class ChromosomeColumnFormatter
{
    public static getSortValue(data:Mutation[]):number|null
    {
        const chromosome = ChromosomeColumnFormatter.getData(data);
        if (!chromosome) {
            return null;
        } else {
            return ChromosomeColumnFormatter.extractSortValue(chromosome);
        }
    }

    public static extractSortValue(chromosome:string):number {
        const numerical:RegExp = /[0-9]+/g;

        const matched:RegExpMatchArray|null = chromosome.match(numerical);
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

    public static getData(data:Mutation[]):string|null
    {
        if (data.length > 0) {
            return data[0].chr;
        } else {
            return null;
        }
    }
}
