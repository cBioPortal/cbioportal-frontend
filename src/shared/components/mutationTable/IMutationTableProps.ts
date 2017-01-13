import {IEnhancedReactTableProps} from "../enhancedReactTable/IEnhancedReactTableProps";
import {Mutation} from "../../api/CBioPortalAPI";

/**
 * @author Selcuk Onur Sumer
 */
export interface IMutationTableProps extends IEnhancedReactTableProps<MutationTableRowData>
{
    title?:string;
}

export type MutationTableRowData = Mutation|Array<Mutation>;

export default IMutationTableProps;