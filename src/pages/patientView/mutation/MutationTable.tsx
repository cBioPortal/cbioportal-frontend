import * as React from 'react';
import EnhancedReactTable from "../../../shared/components/enhancedReactTable/EnhancedReactTable";
import IEnhancedReactTableProps from "../../../shared/components/enhancedReactTable/IEnhancedReactTableProps";
import GeneColumnFormatter from "./column/GeneColumnFormatter";
import SampleColumnFormatter from "./column/SampleColumnFormatter";

//import styles from './styles.module.scss';
//import './styles.css';

export default class MutationTable extends React.Component<IEnhancedReactTableProps, {}>
{
    private updateProps(props:IEnhancedReactTableProps)
    {
        // TODO [duplicate] update and use mock/mutationData.json instead!
        const rawData:Array<any> = [
            {
                "gene":
                {
                    "chromosome": "string",
                    "entrezGeneId": "number",
                    "hugoGeneSymbol": "string",
                    "type": "string"
                },
                "startPos": "number",
                "endPos": "number",
                "referenceAllele": "string",
                "variantAllele": "string",
                "aminoAcidChange": "string",
                "annotation":
                {
                    "proteinChange": "string",
                    "mutationType": "string",
                    "proteinPosEnd": "number",
                    "proteinPosStart": "number",
                    "keyword": "string",
                    "uniprotEntryName": "string",
                    "uniprotAccession": "string"
                },
                "mutationAssessor":
                {
                    "impact": "string",
                    "score": "number",
                    "pdb": "string",
                    "msa": "string",
                    "xVar": "string"
                },
                "center": "string",
                "mutationStatus": "string",
                "validationStatus": "string",
                "geneticProfileId": "string",
                "sampleId": "string",
                "tumorRefCount": "number",
                "tumorAltCount": "number",
                "normalRefCount": "number",
                "normalAltCount": "number"
            }
        ];

        const defaultProps:IEnhancedReactTableProps = {
            rawData, // TODO this is mock data, replace with actual data
            columns: [
                {
                    name: "Gene",
                    formatter: GeneColumnFormatter,
                    sortable: true,
                    filterable: true,
                    visible: true
                },
                {
                    name: "Sample",
                    formatter: SampleColumnFormatter,
                    sortable: true,
                    filterable: true,
                    visible: true
                },
                {
                    name: "Start Pos",
                    dataField: "startPos",
                    sortable: true,
                    filterable: true,
                    visible: true
                },
                {
                    name: "center",
                    sortable: true,
                    filterable: true,
                    visible: true
                },
            ],
            reactTableProps: {
                className: "table",
                id: "table"
            }
        };

        // TODO merge provided props with the default props!
        return defaultProps;
    }

    constructor(props:IEnhancedReactTableProps)
    {
        super(props);
        this.state = {};
    }

    public render()
    {
        const {reactTableProps, columns, rawData} = this.updateProps(this.props);

        return(
            <EnhancedReactTable reactTableProps={reactTableProps}
                                columns={columns}
                                rawData={rawData}/>
        );
    }
};

