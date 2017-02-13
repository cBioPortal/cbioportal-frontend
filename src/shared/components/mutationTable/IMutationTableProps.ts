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
    onVisibleRowsChange?:(data:MutationTableRowData[]) => void;
}

export type MutationTableRowData = Array<Mutation>;

export default IMutationTableProps;