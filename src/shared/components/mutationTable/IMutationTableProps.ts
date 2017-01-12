import {IEnhancedReactTableProps} from "../enhancedReactTable/IEnhancedReactTableProps";
import {ClinicalDataBySampleId} from "../../api/api-types-extended";
import {Mutation} from "../../api/CBioPortalAPI";

/**
 * @author Selcuk Onur Sumer
 */
export interface IMutationTableProps extends IEnhancedReactTableProps<MutationTableRowData>
{
    title?:string;
    samples?: ClinicalDataBySampleId;
}

export type MutationTableRowData = Mutation|Array<Mutation>;

export default IMutationTableProps;