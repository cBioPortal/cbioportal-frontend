import {Mutation} from "shared/api/generated/CBioPortalAPI";

/**
 * @author Selcuk Onur Sumer
 */
export default class MutationStatusColumnFormatter
{
    public static getData(data:Mutation[])
    {
        let value;

        if (data.length > 0) {
            value = data[0].mutationStatus;
        }
        else {
            value = null;
        }

        return value;
    }
}
