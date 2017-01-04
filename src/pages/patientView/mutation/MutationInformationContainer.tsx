import * as React from "react";
import mockData from "./mock/mutationData.json";
import {Td} from 'reactableMSK';
import MutationTable from "../../../shared/components/mutationTable/MutationTable";
import {IColumnDefMap} from "../../../shared/components/enhancedReactTable/IEnhancedReactTableProps";
import ProteinChangeColumnFormatter from "./column/ProteinChangeColumnFormatter";
import {IColumnFormatterData} from "../../../shared/components/enhancedReactTable/IColumnFormatter";
import TumorColumnFormatter from "./column/TumorColumnFormatter";
import AlleleFreqColumnFormatter from "./column/AlleleFreqColumnFormatter";

export interface IMutationInformationContainerProps {
    // setTab?: (activeTab:number) => void;
    store?: any;
    sampleOrder:string[];
    sampleColors:{ [s:string]: string};
    sampleLabels:{ [s:string]: string};
    sampleTumorType:{ [s:string]: string};
    sampleCancerType:{ [s:string]: string};
};

export default class MutationInformationContainer extends React.Component<IMutationInformationContainerProps, {}> {
    constructor() {
        super();
        this.mergedMutations = this.mergeMutations(mockData);
    }

    public render() {
        // TODO properly customize table for patient view specific columns!!!
        let columns:IColumnDefMap = {
            sampleId: {
                name: "Sample Id", // name does not matter when the column is "excluded"
                visible: "excluded"
            },
            proteinChange: {
                name: "Protein Change",
                formatter: ProteinChangeColumnFormatter.renderFunction
            },
            tumors: {
                name: "Tumors",
                formatter: TumorColumnFormatter.renderFunction,
                sortable: TumorColumnFormatter.sortFunction,
                filterable: false,
                props: {
                    sampleOrder: this.props.sampleOrder,
                    sampleColors: this.props.sampleColors,
                    sampleLabels: this.props.sampleLabels,
                    sampleTumorType: this.props.sampleTumorType,
                    sampleCancerType: this.props.sampleCancerType
                }
            },
            annotation: {
                name: "Annotation"
            },
            copyNumber: {
                name: "Copy #"
            },
            mRnaExp: {
                name: "mRNA Exp."
            },
            cohort: {
                name: "Cohort"
            },
            cosmic: {
                name: "COSMIC"
            },
            tumorAlleleFreq: {
                name: "Variant Allele Frequency",
                formatter: AlleleFreqColumnFormatter.renderFunction,
                sortable: AlleleFreqColumnFormatter.sortFunction,
                filterable: false,
                props: {
                    sampleOrder: this.props.sampleOrder,
                    sampleColors: this.props.sampleColors,
                    sampleLabels: this.props.sampleLabels
                }
            },
            normalRefCount: {
                name: "Ref Count (N)",
                columnData: undefined,
                formatter: this.makeMultipleValueColumnDataRenderFunction("normalRefCount"),
            },
            normalAltCount: {
                name: "Alt Count (N)",
                columnData: undefined,
                formatter: this.makeMultipleValueColumnDataRenderFunction("normalAltCount"),
            },
            tumorRefCount: {
                name: "Ref Count (T)",
                columnData: undefined,
                formatter: this.makeMultipleValueColumnDataRenderFunction("tumorRefCount"),
            },
            tumorAltCount: {
                name: "Alt Count (T)",
                columnData: undefined,
                formatter: this.makeMultipleValueColumnDataRenderFunction("tumorAltCount"),
            },
        };

        return (
            <div>
                <MutationTable rawData={this.mergedMutations} columns={columns}/>
            </div>
        );
    }

    private mergeMutations(data) {
        let idToMutations = {};
        let mutationId;
        for (let mutation of data) {
            mutationId = this.getMutationId(mutation);
            idToMutations[mutationId] = idToMutations[mutationId] || [];
            idToMutations[mutationId].push(mutation);
        }
        return Object.keys(idToMutations).map(id => idToMutations[id]);
    }

    private getMutationId(m):string {
        return [m.gene.chromosome, m.startPos, m.endPos, m.referenceAllele, m.variantAllele].join("_");
    }

    private makeMultipleValueColumnDataRenderFunction(dataField:string) {
        const sampleOrder = this.props.sampleOrder;
        return function(data:IColumnFormatterData) {
            let ret = "";
            if (data.rowData) {
                const rowDataArr = [].concat(data.rowData);
                const sampleToValue = {};
                for (let rowDatum of rowDataArr) {
                    sampleToValue[rowDatum.sampleId] = rowDatum[dataField];
                }
                const samplesWithValue = sampleOrder.filter(sampleId=>sampleToValue.hasOwnProperty(sampleId));
                if (samplesWithValue.length === 1) {
                    ret = sampleToValue[samplesWithValue[0]];
                } else {
                    ret = samplesWithValue.map(sampleId=>(`${sampleId}: ${sampleToValue[sampleId]}`)).join("\n");
                }
            }
            return (<Td column={data.name} value={data}>{ret}</Td>);
        };
    }
}
