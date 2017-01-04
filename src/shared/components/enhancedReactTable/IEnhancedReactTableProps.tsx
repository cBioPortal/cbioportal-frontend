/**
 * @author Selcuk Onur Sumer
 */
interface IEnhancedReactTableProps {
    reactTableProps: any; // all available reactableMSK props
    columns: Array<any>; // column definitions (including component renderers)
    rawData: Array<any>; // raw data
}

export default IEnhancedReactTableProps;
