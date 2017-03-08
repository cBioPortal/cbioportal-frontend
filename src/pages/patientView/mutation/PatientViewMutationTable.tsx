import * as React from "react";
import {observer} from "mobx-react";
import {observable, computed} from "mobx";
import SampleManager from "../sampleManager";
import PatientHeader from "../patientHeader/PatientHeader";
import {PatientViewPageStore} from "../clinicalInformation/PatientViewPageStore";
import {default as MSKTable, Column} from "../../../shared/components/msktable/MSKTable";
import {Mutation} from "../../../shared/api/generated/CBioPortalAPI";
import DiscreteCNAColumnFormatter from "./column/DiscreteCNAColumnFormatter";
import {MutSigData} from "../PatientViewPage";
import MrnaExprColumnFormatter from "./column/MrnaExprColumnFormatter";
import CohortColumnFormatter from "./column/CohortColumnFormatter";
import AlleleCountColumnFormatter from "./column/AlleleCountColumnFormatter";
import GeneColumnFormatter from "../../../shared/components/mutationTable/column/GeneColumnFormatter";
import ChromosomeColumnFormatter from "../../../shared/components/mutationTable/column/ChromosomeColumnFormatter";
import ProteinChangeColumnFormatter from "./column/ProteinChangeColumnFormatter";
import {default as DefaultProteinChangeColumnFormatter} from "../../../shared/components/mutationTable/column/ProteinChangeColumnFormatter";
import {Protocol} from "_debugger";
import MutationTypeColumnFormatter from "../../../shared/components/mutationTable/column/MutationTypeColumnFormatter";
import MutationAssessorColumnFormatter from "../../../shared/components/mutationTable/column/MutationAssessorColumnFormatter";
import {
    ICosmicData,
    default as CosmicColumnFormatter
} from "../../../shared/components/mutationTable/column/CosmicColumnFormatter";
import AlleleFreqColumnFormatter from "./column/AlleleFreqColumnFormatter";
import TumorColumnFormatter from "./column/TumorColumnFormatter";
import SampleColumnFormatter from "../../../shared/components/mutationTable/column/SampleColumnFormatter";

export type PatientViewMutationTableProps = {
    sampleManager:SampleManager | null;
    store:PatientViewPageStore;
    mutSigData?:MutSigData;
    cosmicData?:ICosmicData;
    columns:MutationTableColumn[];
}

export enum MutationTableColumn {
    SAMPLE_ID,
    TUMORS,
    GENE,
    PROTEIN_CHANGE,
    CHROMOSOME,
    START_POS,
    END_POS,
    REF_ALLELE,
    VAR_ALLELE,
    MUTATION_STATUS,
    VALIDATION_STATUS,
    MUTATION_TYPE,
    CENTER,
    TUMOR_ALLELE_FREQ,
    MUTATION_ASSESSOR,
    ANNOTATION,
    COSMIC,
    COPY_NUM,
    MRNA_EXPR,
    COHORT,
    REF_READS_N,
    VAR_READS_N,
    REF_READS,
    VAR_READS
}

class MutationTableComponent extends MSKTable<Mutation[]> {
}

type maybeNumber = number|null|undefined;
type maybeString = string|null|undefined;

function getSpanForDataField(data:Mutation[], dataField:string) {
    let contents = null;
    if (data.length > 0 && data[0].hasOwnProperty(dataField)) {
        contents = (data[0] as any)[dataField];
    }
    return (<span>{contents}</span>);
}

function isFiniteNumber(val:number|null|undefined) {
    return !(typeof val === "undefined" || val === null || !isFinite(val));
}

function isString(val:string|null|undefined) {
    return !(typeof val === "undefined" || val === null);
}

function listSort<T>(sortValue1:T[], sortValue2:T[], ascending:boolean, cmp:(a:T,b:T, ascending:boolean)=>number):number {
    if (sortValue1.length === sortValue2.length) {
        let ret = 0;
        for (let i=0; i<sortValue1.length; i++) {
            ret = cmp(sortValue1[i], sortValue2[i], ascending);
            if (ret !== 0) {
                break;
            }
        }
        return ret;
    } else if (sortValue1.length < sortValue2.length) {
        return (ascending ? 1 : -1);
    } else {
        return (ascending ? -1 : 1);
    }
}

export function numberListSort(sortValue1:maybeNumber[], sortValue2:maybeNumber[], ascending:boolean):number {
    return listSort<maybeNumber>(sortValue1, sortValue2, ascending, numberSort);
}

function stringListSort(sortValue1:maybeString[], sortValue2:maybeString[], ascending:boolean):number {
    return listSort<maybeString>(sortValue1, sortValue2, ascending, stringSort);
}

function numberSort(sortValue1:number|null|undefined, sortValue2:number|null|undefined, ascending:boolean):number {
    if (isFiniteNumber(sortValue1) && isFiniteNumber(sortValue2)) {
        sortValue1 = sortValue1 as number;
        sortValue2 = sortValue2 as number;
        if (sortValue1 === sortValue2) {
            return 0;
        } else if (sortValue1 < sortValue2) {
            return ascending ? -1 : 1;
        } else {
            return ascending ? 1 : -1;
        }
    } else if (!isFiniteNumber(sortValue1)) {
        return 1;
    } else if (!isFiniteNumber(sortValue2)) {
        return -1;
    } else {
        return 0;
    }
}

function stringSort(sortValue1:string|null|undefined, sortValue2:string|null|undefined, ascending:boolean):number {
    if (isString(sortValue1) && isString(sortValue2)) {
        sortValue1 = sortValue1 as string;
        sortValue2 = sortValue2 as string;
        return (ascending ? 1 : -1)*sortValue1.localeCompare(sortValue2);
    } else if (!isString(sortValue1)) {
        return 1;
    } else if (!isString(sortValue2)) {
        return -1;
    } else {
        return 0;
    }
}


function defaultSort(d1:Mutation[], d2:Mutation[], ascending:boolean, dataField:string, dataType:"number"|"string"):number {
    const d1Vals = d1.map(d=>(d as any)[dataField]);
    const d2Vals = d2.map(d=>(d as any)[dataField]);
    if (dataType === "number") {
        return numberListSort(d1Vals, d2Vals, ascending);
    } else {
        return stringListSort(d1Vals, d2Vals, ascending);
    }
}

function defaultFilter(data:Mutation[], dataField:string, filterString:string):boolean {
    if (data.length > 0) {
        return data.reduce((match:boolean, next:Mutation)=>{
            const val = (next as any)[dataField];
            if (val) {
                return match || ((val.indexOf(filterString) > -1));
            } else {
                return match;
            }
        }, false);
    } else {
        return false;
    }
}

@observer
export default class PatientViewMutationTable extends React.Component<PatientViewMutationTableProps,{}> {
    @observable private _columns:{[columnEnum:number]:Column<Mutation[]>};

    constructor(props:PatientViewMutationTableProps) {
        super(props);
        this._columns = {};
        this.generateColumns();
    }

    private getSamples():string[] {
        if (this.props.sampleManager === null) {
            return [];
        } else {
            return this.props.sampleManager.getSampleIdsInOrder();
        }
    }

    private generateColumns() {
        this._columns = {};
        this._columns[MutationTableColumn.COPY_NUM] = {
            name: "Copy #",
            render:(d:Mutation[])=>DiscreteCNAColumnFormatter.renderFunction(d, this.props.store.discreteCNACache),
            sort:(d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                const sortValue1 = DiscreteCNAColumnFormatter.getSortValue(d1, this.props.store.discreteCNACache);
                const sortValue2 = DiscreteCNAColumnFormatter.getSortValue(d2, this.props.store.discreteCNACache);
                return numberSort(sortValue1, sortValue2, ascending);
            },
            filter:(d:Mutation[], filterString:string)=>{
                return DiscreteCNAColumnFormatter.filter(
                    d, this.props.store.discreteCNACache, filterString)
            },
        };
        this._columns[MutationTableColumn.MRNA_EXPR] = {
            name:"mRNA Expr.",
            render:(d:Mutation[])=>MrnaExprColumnFormatter.renderFunction(d, this.props.store.mrnaExprRankCache),
        };
        this._columns[MutationTableColumn.COHORT] = {
            name:"Cohort",
            render:(d:Mutation[])=>CohortColumnFormatter.renderFunction(d, this.props.mutSigData, this.props.store.variantCountCache),
            sort:(d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                const sortValue1 = CohortColumnFormatter.getSortValue(d1, this.props.store.variantCountCache);
                const sortValue2 = CohortColumnFormatter.getSortValue(d2, this.props.store.variantCountCache);
                return numberSort(sortValue1, sortValue2, ascending);
            },
            tooltip: (<span>Mutation frequency in cohort</span>)
        };

        this._columns[MutationTableColumn.REF_READS_N] = {
            name: "Ref Reads (N)",
            render: (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, this.getSamples(), "normalRefCount"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "normalRefCount", "number")
        };

        this._columns[MutationTableColumn.VAR_READS_N] = {
            name: "Variant Reads (N)",
            render: (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, this.getSamples(), "normalAltCount"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "normalAltCount", "number")
        };

        this._columns[MutationTableColumn.REF_READS] = {
            name: "Ref Reads",
            render: (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, this.getSamples(), "tumorRefCount"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "tumorRefCount", "number")
        };

        this._columns[MutationTableColumn.VAR_READS] = {
            name: "Variant Reads",
            render: (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, this.getSamples(), "tumorAltCount"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "tumorAltCount", "number")
        };

        this._columns[MutationTableColumn.START_POS] = {
            name: "Start Pos",
            render: (d:Mutation[])=>getSpanForDataField(d, "startPosition"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "startPosition", "number")
        };

        this._columns[MutationTableColumn.END_POS] = {
            name: "End Pos",
            render: (d:Mutation[])=>getSpanForDataField(d, "endPosition"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "endPosition", "number")
        };

        this._columns[MutationTableColumn.REF_ALLELE] = {
            name: "Ref",
            render: (d:Mutation[])=>getSpanForDataField(d, "referenceAllele"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "referenceAllele", "string")
        };

        this._columns[MutationTableColumn.VAR_ALLELE] = {
            name: "Var",
            render: (d:Mutation[])=>getSpanForDataField(d, "variantAllele"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "variantAllele", "string")
        };

        this._columns[MutationTableColumn.MUTATION_STATUS] = {
            name: "MS",
            render: (d:Mutation[])=>getSpanForDataField(d, "mutationStatus"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "mutationStatus", "string"),
            filter: (d:Mutation[], filterString:string)=>defaultFilter(d, "mutationStatus", filterString)
        };

        this._columns[MutationTableColumn.VALIDATION_STATUS] = {
            name: "VS",
            render: (d:Mutation[])=>getSpanForDataField(d, "validationStatus"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "validationStatus", "string"),
            filter: (d:Mutation[], filterString:string)=>defaultFilter(d, "validationStatus", filterString)
        };

        this._columns[MutationTableColumn.CENTER] = {
            name: "Center",
            render: (d:Mutation[])=>getSpanForDataField(d, "center"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "center", "string"),
            filter: (d:Mutation[], filterString:string)=>defaultFilter(d, "center", filterString)
        };

        this._columns[MutationTableColumn.GENE] = {
            name: "Gene",
            render: (d:Mutation[])=>GeneColumnFormatter.renderFunction(d),
            sort:(d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                return stringSort(GeneColumnFormatter.getSortValue(d1), GeneColumnFormatter.getSortValue(d2), ascending);
            },
            filter:(d:Mutation[], filterString:string)=>(GeneColumnFormatter.getTextValue(d).indexOf(filterString) > -1)
        };

        this._columns[MutationTableColumn.CHROMOSOME] = {
            name: "Chromosome",
            render: (d:Mutation[])=>(<span>{ChromosomeColumnFormatter.getData(d)}</span>),
            sort:(d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                return numberSort(ChromosomeColumnFormatter.getSortValue(d1),
                    ChromosomeColumnFormatter.getSortValue(d2),
                    ascending);
            },
            filter:(d:Mutation[], filterString:string)=>{
                return ((ChromosomeColumnFormatter.getData(d)+'').indexOf(filterString) > -1);
            }
        };

        this._columns[MutationTableColumn.PROTEIN_CHANGE] = {
            name: "Protein Change",
            render: ProteinChangeColumnFormatter.renderFunction,
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                return numberSort(DefaultProteinChangeColumnFormatter.getSortValue(d1),
                                DefaultProteinChangeColumnFormatter.getSortValue(d2),
                                ascending);
            },
            filter: (d:Mutation[], filterString:string)=>{
                return (DefaultProteinChangeColumnFormatter.getTextValue(d).indexOf(filterString) > -1);
            }
        };

        this._columns[MutationTableColumn.MUTATION_TYPE] = {
            name: "Mutation Type",
            render:MutationTypeColumnFormatter.renderFunction,
            sort:(d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                return stringSort(MutationTypeColumnFormatter.getDisplayValue(d1),
                                    MutationTypeColumnFormatter.getDisplayValue(d2),
                                    ascending);
            },
            filter:(d:Mutation[], filterString:string)=>{
                return (MutationTypeColumnFormatter.getDisplayValue(d).indexOf(filterString) > -1);
            }
        };

        this._columns[MutationTableColumn.MUTATION_ASSESSOR] = {
            name: "Mutation Assessor",
            render:MutationAssessorColumnFormatter.renderFunction,
            sort:(d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                return numberListSort(MutationAssessorColumnFormatter.getSortValue(d1),
                                    MutationAssessorColumnFormatter.getSortValue(d2),
                                    ascending);
            },
            filter:(d:Mutation[], filterString:string)=>{
                return (MutationAssessorColumnFormatter.filterValue(d).indexOf(filterString) > -1);
            }
        };

        this._columns[MutationTableColumn.COSMIC] = {
            name: "COSMIC",
            render: (d:Mutation[])=>CosmicColumnFormatter.renderFunction(d, this.props.cosmicData),
            sort:(d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                return numberSort(CosmicColumnFormatter.getSortValue(d1, this.props.cosmicData),
                                CosmicColumnFormatter.getSortValue(d2, this.props.cosmicData),
                                ascending);
            },
            tooltip: (<span>COSMIC occurrences</span>)
        };

        this._columns[MutationTableColumn.TUMOR_ALLELE_FREQ] = {
            name: "Allele Freq",
            render: (d:Mutation[])=>AlleleFreqColumnFormatter.renderFunction(d, this.props.sampleManager),
            sort:(d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                return numberListSort(AlleleFreqColumnFormatter.getSortValue(d1, this.props.sampleManager),
                                AlleleFreqColumnFormatter.getSortValue(d2, this.props.sampleManager),
                                ascending);
            },
            tooltip:(<span>Variant allele frequency in the tumor sample</span>)
        };

        this._columns[MutationTableColumn.TUMORS] = {
            name: "Tumors",
            render:(d:Mutation[])=>TumorColumnFormatter.renderFunction(d, this.props.sampleManager),
            sort:(d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                return numberListSort(TumorColumnFormatter.getSortValue(d1, this.props.sampleManager),
                                        TumorColumnFormatter.getSortValue(d2, this.props.sampleManager),
                                        ascending);
            },
        };

        this._columns[MutationTableColumn.SAMPLE_ID] = {
            name: "Sample",
            render:(d:Mutation[])=>SampleColumnFormatter.renderFunction(d),
            sort:(d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                return stringSort(SampleColumnFormatter.getDisplayValue(d1),
                                    SampleColumnFormatter.getDisplayValue(d2),
                                    ascending);
            },
            filter:(d:Mutation[], filterString:string)=>{
                return (SampleColumnFormatter.getDisplayValue(d).indexOf(filterString) > -1);
            }
        };
    }

    @computed private get columns():Column<Mutation[]>[] {
        return this.props.columns.map((columnEnum:MutationTableColumn)=>this._columns[columnEnum]);
    }

    render() {


        return (<MutationTableComponent
                    columns={this.columns}
                    data={this.props.store.mergedMutationData}
                />);
    }

}