import * as React from "react";
import { createSelector } from "reselect";
import MutationTable from "../../../shared/components/mutationTable/MutationTable";
import {IColumnDefMap} from "../../../shared/components/enhancedReactTable/IEnhancedReactTableProps";
import ProteinChangeColumnFormatter from "./column/ProteinChangeColumnFormatter";
import TumorColumnFormatter from "./column/TumorColumnFormatter";
import AlleleFreqColumnFormatter from "./column/AlleleFreqColumnFormatter";
import AlleleCountColumnFormatter from "./column/AlleleCountColumnFormatter";
import { Mutation } from "../../../shared/api/CBioPortalAPI";
import SampleManager from "../sampleManager";


export interface IMutationInformationContainerProps {
    mutations: Array<Mutation>;
    sampleOrder:string[];
    sampleColors:{ [s:string]: string};
    sampleLabels:{ [s:string]: string};
    sampleTumorType:{ [s:string]: string};
    sampleCancerType:{ [s:string]: string};
    sampleManager:SampleManager;
};

export default class MutationInformationContainer extends React.Component<IMutationInformationContainerProps, {}>
{
    private mutationsSelector = (state: any, props:IMutationInformationContainerProps) => props.mutations;
    private mergedMutationsSelector = createSelector(this.mutationsSelector, (mutations:Array<Mutation>) => this.mergeMutations(mutations));

    constructor(props:IMutationInformationContainerProps) {
        super(props);
    }

    public render() {
        let columns:IColumnDefMap = {
            sampleId: {
                name: "Sample",
                visible: "excluded"
            },
            proteinChange: {
                name: "Protein Change",
                formatter: ProteinChangeColumnFormatter.renderFunction
            },
            tumors: {
                name: "Tumors",
                priority: 0.50,
                formatter: TumorColumnFormatter.renderFunction,
                sortable: TumorColumnFormatter.sortFunction,
                filterable: false,
                columnProps: {
                    sampleOrder: this.props.sampleOrder,
                    sampleColors: this.props.sampleColors,
                    sampleLabels: this.props.sampleLabels,
                    sampleTumorType: this.props.sampleTumorType,
                    sampleCancerType: this.props.sampleCancerType,
                    sampleManager:this.props.sampleManager
                }
            },
            chromosome: {
                name: "Chr",
                visible: "hidden"
            },
            startPos: {
                name: "Start",
                visible: "hidden"
            },
            endPos: {
                name: "End",
                visible: "hidden"
            },
            mutationStatus: {
                name: "Status",
                visible: "hidden"
            },
            validationStatus: {
                name: "Validation",
                visible: "hidden"
            },
            mutationType: {
                name: "Type"
            },
            annotation: {
                name: "Annotation",
                priority: 3.50,
                sortable: true
            },
            copyNumber: {
                name: "Copy #",
                priority: 18.10,
                sortable: true
            },
            mRnaExp: {
                name: "mRNA Expr.",
                priority: 18.20,
                sortable: true
            },
            cohort: {
                name: "Cohort",
                priority: 18.30,
                sortable: true
            },
            cosmic: {
                name: "COSMIC",
                priority: 18.40,
                sortable: true
            },
            tumorAlleleFreq: {
                name: "Allele Freq",
                formatter: AlleleFreqColumnFormatter.renderFunction,
                sortable: AlleleFreqColumnFormatter.sortFunction,
                filterable: false,
                columnProps: {
                    sampleOrder: this.props.sampleOrder,
                    sampleColors: this.props.sampleColors,
                    sampleLabels: this.props.sampleLabels
                }
            },
            normalAlleleFreq : {
                name: "Allele Freq (N)",
                visible: "hidden"
            },
            normalRefCount: {
                name: "Ref Reads (N)",
                formatter: AlleleCountColumnFormatter.renderFunction,
                columnProps: {
                    dataField: "normalRefCount",
                    sampleOrder: this.props.sampleOrder
                },
                visible: "hidden"
            },
            normalAltCount: {
                name: "Variant Reads (N)",
                formatter: AlleleCountColumnFormatter.renderFunction,
                columnProps: {
                    dataField: "normalAltCount",
                    sampleOrder: this.props.sampleOrder
                },
                visible: "hidden"
            },
            tumorRefCount: {
                name: "Ref Reads",
                formatter: AlleleCountColumnFormatter.renderFunction,
                columnProps: {
                    dataField: "tumorRefCount",
                    sampleOrder: this.props.sampleOrder
                },
                visible: "hidden"
            },
            tumorAltCount: {
                name: "Variant Reads",
                formatter: AlleleCountColumnFormatter.renderFunction,
                columnProps: {
                    dataField: "tumorAltCount",
                    sampleOrder: this.props.sampleOrder
                },
                visible: "hidden"
            },
            referenceAllele: {
                name: "Ref",
                visible: "hidden"
            },
            variantAllele: {
                name: "Var",
                visible: "hidden"
            },
            center: {
                name: "Center",
                visible: "hidden"
            },
            mutationAssessor: {
                name: "Mutation Assessor",
                visible: "hidden"
            }
        };

        return (
            <div>
                <MutationTable rawData={this.mergedMutationsSelector(this.state, this.props)} columns={columns} />
            </div>
        );
    }

    private mergeMutations(data:Array<Mutation>):Array<Array<Mutation>> {
        let idToMutations:{[key:string]: Array<Mutation>} = {};
        let mutationId:string;

        for (let mutation of data) {
            mutationId = this.getMutationId(mutation);
            idToMutations[mutationId] = idToMutations[mutationId] || [];
            idToMutations[mutationId].push(mutation);
        }

        return Object.keys(idToMutations).map(id => idToMutations[id]);
    }

    private getMutationId(m:Mutation):string {
        return [m.gene.chromosome, m.startPosition, m.endPosition, m.referenceAllele, m.variantAllele].join("_");
    }
}
