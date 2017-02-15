import * as React from "react";
import { createSelector } from "reselect";
import MutationTable from "../../../shared/components/mutationTable/MutationTable";
import {IColumnDefMap} from "../../../shared/components/enhancedReactTable/IEnhancedReactTableProps";
import ProteinChangeColumnFormatter from "./column/ProteinChangeColumnFormatter";
import TumorColumnFormatter from "./column/TumorColumnFormatter";
import AlleleFreqColumnFormatter from "./column/AlleleFreqColumnFormatter";
import {MrnaRankData, default as MrnaExprColumnFormatter} from "./column/MrnaExprColumnFormatter";
import AlleleCountColumnFormatter from "./column/AlleleCountColumnFormatter";
import {IVariantCountData, default as CohortColumnFormatter} from "./column/CohortColumnFormatter";
import { Mutation } from "../../../shared/api/generated/CBioPortalAPI";
import SampleManager from "../sampleManager";
import {
    default as AnnotationColumnFormatter, IHotspotData, IMyCancerGenomeData, IOncoKbData
} from "./column/AnnotationColumnFormatter";
import { MutSigData } from "../PatientViewPage";
import {
    default as CosmicColumnFormatter, ICosmicData
} from "../../../shared/components/mutationTable/column/CosmicColumnFormatter";


export interface IMutationInformationContainerProps {
    mutations: Array<Mutation>;
    myCancerGenomeData?: IMyCancerGenomeData;
    hotspots?: IHotspotData;
    cosmicData?: ICosmicData;
    oncoKbData?: IOncoKbData;
    mrnaExprRankData?: MrnaRankData;
    mutSigData?: MutSigData;
    variantCountData?: IVariantCountData;
    sampleOrder:string[];
    sampleColors:{ [s:string]: string};
    sampleLabels:{ [s:string]: string};
    sampleTumorType:{ [s:string]: string};
    sampleCancerType:{ [s:string]: string};
    sampleManager:SampleManager;
    onVisibleRowsChange?:(data:Mutation[][]) => void;
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
            gene: {
                name: "Gene",
                description: "HUGO Symbol"
            },
            proteinChange: {
                name: "Protein Change",
                formatter: ProteinChangeColumnFormatter.renderFunction
            },
            tumors: {
                name: "Tumors",
                description: "Cases/Samples",
                priority: 0.50,
                formatter: TumorColumnFormatter.renderFunction,
                sortable: TumorColumnFormatter.sortFunction,
                filterable: false,
                columnProps: {
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
                name: "Type",
                description: "Mutation Type"
            },
            annotation: {
                name: "Annotation",
                formatter: AnnotationColumnFormatter.renderFunction,
                priority: 3.50,
                sortable: AnnotationColumnFormatter.sortFunction,
                filterable: false,
                columnProps: {
                    hotspots: this.props.hotspots,
                    myCancerGenomeData: this.props.myCancerGenomeData,
                    oncoKbData: this.props.oncoKbData,
                    enableOncoKb: true,
                    enableMyCancerGenome: true,
                    enableHotspot: true
                }
            },
            copyNumber: {
                name: "Copy #",
                priority: 18.10,
                sortable: false
            },
            mRnaExp: {
                name: "mRNA Expr.",
                priority: 18.20,
                formatter: MrnaExprColumnFormatter.renderFunction,
                sortable: false,
                columnProps: {
                    data: this.props.mrnaExprRankData
                }
            },
            cohort: {
                name: "Cohort",
                description: "Mutation frequency in cohort",
                priority: 18.30,
                formatter: CohortColumnFormatter.renderFunction,
                sortable: true,
                columnProps: {
                    mutSigData: this.props.mutSigData,
                    variantCountData: this.props.variantCountData
                }
            },
            cosmic: {
                name: "COSMIC",
                description: "COSMIC occurrences",
                formatter: CosmicColumnFormatter.renderFunction,
                priority: 18.40,
                sortable: true,
                columnProps: {
                    cosmicData: this.props.cosmicData
                }
            },
            tumorAlleleFreq: {
                name: "Allele Freq",
                description: "Variant allele frequency in the tumor sample",
                formatter: AlleleFreqColumnFormatter.renderFunction,
                sortable: AlleleFreqColumnFormatter.sortFunction,
                filterable: false,
                columnProps: {
                    sampleManager: this.props.sampleManager
                }
            },
            normalAlleleFreq : {
                name: "Allele Freq (N)",
                description: "Variant allele frequency in the normal sample",
                visible: "hidden"
            },
            normalRefCount: {
                name: "Ref Reads (N)",
                formatter: AlleleCountColumnFormatter.renderFunction,
                downloader: AlleleCountColumnFormatter.getTextValue,
                columnProps: {
                    dataField: "normalRefCount",
                    sampleOrder: this.props.sampleOrder
                },
                visible: "hidden"
            },
            normalAltCount: {
                name: "Variant Reads (N)",
                formatter: AlleleCountColumnFormatter.renderFunction,
                downloader: AlleleCountColumnFormatter.getTextValue,
                columnProps: {
                    dataField: "normalAltCount",
                    sampleOrder: this.props.sampleOrder
                },
                visible: "hidden"
            },
            tumorRefCount: {
                name: "Ref Reads",
                formatter: AlleleCountColumnFormatter.renderFunction,
                downloader: AlleleCountColumnFormatter.getTextValue,
                columnProps: {
                    dataField: "tumorRefCount",
                    sampleOrder: this.props.sampleOrder
                },
                visible: "hidden"
            },
            tumorAltCount: {
                name: "Variant Reads",
                formatter: AlleleCountColumnFormatter.renderFunction,
                downloader: AlleleCountColumnFormatter.getTextValue,
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
                <MutationTable rawData={this.mergedMutationsSelector(this.state, this.props)} columns={columns}
                                onVisibleRowsChange={this.props.onVisibleRowsChange} />
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
