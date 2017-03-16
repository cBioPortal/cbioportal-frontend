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
import {default as AnnotationColumnFormatter, IMyCancerGenomeData, IHotspotData, IOncoKbData} from "./column/AnnotationColumnFormatter";
import DiscreteCNACache from "../clinicalInformation/DiscreteCNACache";
import MrnaExprRankCache from "../clinicalInformation/MrnaExprRankCache";
import CohortVariantCountCache from "../clinicalInformation/CohortVariantCountCache";
import _ from "lodash";

export type PatientViewMutationTableProps = {
    sampleManager:SampleManager | null;
    sampleIds?:string[];
    discreteCNACache?:DiscreteCNACache;
    mrnaExprRankCache?:MrnaExprRankCache;
    variantCountCache?:CohortVariantCountCache;
    mutSigData?:MutSigData;
    myCancerGenomeData?: IMyCancerGenomeData;
    hotspots?: IHotspotData;
    cosmicData?:ICosmicData;
    oncoKbData?:IOncoKbData;
    pmidData?:any;
    mrnaExprRankGeneticProfileId?:string;
    discreteCNAGeneticProfileId?:string;
    columns:MutationTableColumnType[];
    data:Mutation[][];
}

export enum MutationTableColumnType {
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

type MutationTableColumn = Column<Mutation[]>&{order:number};

class MutationTableComponent extends MSKTable<Mutation[]> {
}

type maybeNumber = number|null|undefined;
type maybeString = string|null|undefined;

function getSpanForDataField(data:Mutation[], dataField:string) {
    let contents = getTextForDataField(data, dataField);
    return (<span>{contents}</span>);
}

function getTextForDataField(data:Mutation[], dataField:string) {
    let text = "";
    if (data.length > 0 && data[0].hasOwnProperty(dataField)) {
        text = (data[0] as any)[dataField];
    }
    return text;
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
    @observable private _columns:{[columnEnum:number]:MutationTableColumn};

    constructor(props:PatientViewMutationTableProps) {
        super(props);
        this._columns = {};
        this.generateColumns();
    }

    private getSamples():string[] {
        return this.props.sampleIds || [];
    }

    private generateColumns() {
        this._columns = {};
        this._columns[MutationTableColumnType.COPY_NUM] = {
            name: "Copy #",
            render:(d:Mutation[])=>(this.props.discreteCNACache
                                        ? DiscreteCNAColumnFormatter.renderFunction(d, this.props.discreteCNACache)
                                        : (<span></span>)),
            sort:(d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                if (this.props.discreteCNACache) {
                    const sortValue1 = DiscreteCNAColumnFormatter.getSortValue(d1, this.props.discreteCNACache);
                    const sortValue2 = DiscreteCNAColumnFormatter.getSortValue(d2, this.props.discreteCNACache);
                    return numberSort(sortValue1, sortValue2, ascending);
                } else {
                    return 0;
                }
            },
            filter:(d:Mutation[], filterString:string)=>{
                if (this.props.discreteCNACache) {
                    return DiscreteCNAColumnFormatter.filter(d, this.props.discreteCNACache, filterString)
                } else {
                    return false;
                }
            },
            order: 181
        };
        this._columns[MutationTableColumnType.MRNA_EXPR] = {
            name:"mRNA Expr.",
            render:(d:Mutation[])=>(this.props.mrnaExprRankCache
                                        ? MrnaExprColumnFormatter.renderFunction(d, this.props.mrnaExprRankCache)
                                        : (<span></span>)),
            order: 182
        };
        this._columns[MutationTableColumnType.COHORT] = {
            name:"Cohort",
            render:(d:Mutation[])=>(this.props.variantCountCache
                                        ? CohortColumnFormatter.renderFunction(d, this.props.mutSigData, this.props.variantCountCache)
                                        : (<span></span>)),
            sort:(d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                if (this.props.variantCountCache) {
                    const sortValue1 = CohortColumnFormatter.getSortValue(d1, this.props.variantCountCache);
                    const sortValue2 = CohortColumnFormatter.getSortValue(d2, this.props.variantCountCache);
                    return numberSort(sortValue1, sortValue2, ascending);
                } else {
                    return 0;
                }
            },
            tooltip: (<span>Mutation frequency in cohort</span>),
            order: 183
        };

        this._columns[MutationTableColumnType.REF_READS_N] = {
            name: "Ref Reads (N)",
            render: (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, this.getSamples(), "normalRefCount"),
            download: (d:Mutation[])=>AlleleCountColumnFormatter.getTextValue(d, this.getSamples(), "normalRefCount"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "normalRefCount", "number"),
            visible: false,
            order: 180
        };

        this._columns[MutationTableColumnType.VAR_READS_N] = {
            name: "Variant Reads (N)",
            render: (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, this.getSamples(), "normalAltCount"),
            download: (d:Mutation[])=>AlleleCountColumnFormatter.getTextValue(d, this.getSamples(), "normalAltCount"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "normalAltCount", "number"),
            visible: false,
            order: 170
        };

        this._columns[MutationTableColumnType.REF_READS] = {
            name: "Ref Reads",
            render: (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, this.getSamples(), "tumorRefCount"),
            download: (d:Mutation[])=>AlleleCountColumnFormatter.getTextValue(d, this.getSamples(), "tumorRefCount"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "tumorRefCount", "number"),
            visible: false,
            order: 150
        };

        this._columns[MutationTableColumnType.VAR_READS] = {
            name: "Variant Reads",
            render: (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, this.getSamples(), "tumorAltCount"),
            download: (d:Mutation[])=>AlleleCountColumnFormatter.getTextValue(d, this.getSamples(), "tumorAltCount"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "tumorAltCount", "number"),
            visible: false,
            order: 140
        };

        this._columns[MutationTableColumnType.START_POS] = {
            name: "Start Pos",
            render: (d:Mutation[])=>getSpanForDataField(d, "startPosition"),
            download: (d:Mutation[])=>getTextForDataField(d, "startPosition"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "startPosition", "number"),
            visible: false,
            order: 50
        };

        this._columns[MutationTableColumnType.END_POS] = {
            name: "End Pos",
            render: (d:Mutation[])=>getSpanForDataField(d, "endPosition"),
            download: (d:Mutation[])=>getTextForDataField(d, "endPosition"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "endPosition", "number"),
            visible: false,
            order: 60
        };

        this._columns[MutationTableColumnType.REF_ALLELE] = {
            name: "Ref",
            render: (d:Mutation[])=>getSpanForDataField(d, "referenceAllele"),
            download: (d:Mutation[])=>getTextForDataField(d, "referenceAllele"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "referenceAllele", "string"),
            visible: false,
            order: 70
        };

        this._columns[MutationTableColumnType.VAR_ALLELE] = {
            name: "Var",
            render: (d:Mutation[])=>getSpanForDataField(d, "variantAllele"),
            download: (d:Mutation[])=>getTextForDataField(d, "variantAllele"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "variantAllele", "string"),
            visible: false,
            order: 80
        };

        this._columns[MutationTableColumnType.MUTATION_STATUS] = {
            name: "MS",
            render: (d:Mutation[])=>getSpanForDataField(d, "mutationStatus"),
            download: (d:Mutation[])=>getTextForDataField(d, "mutationStatus"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "mutationStatus", "string"),
            filter: (d:Mutation[], filterString:string)=>defaultFilter(d, "mutationStatus", filterString),
            visible: false,
            order: 90
        };

        this._columns[MutationTableColumnType.VALIDATION_STATUS] = {
            name: "VS",
            render: (d:Mutation[])=>getSpanForDataField(d, "validationStatus"),
            download: (d:Mutation[])=>getTextForDataField(d, "validationStatus"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "validationStatus", "string"),
            filter: (d:Mutation[], filterString:string)=>defaultFilter(d, "validationStatus", filterString),
            visible: false,
            order: 100
        };

        this._columns[MutationTableColumnType.CENTER] = {
            name: "Center",
            render: (d:Mutation[])=>getSpanForDataField(d, "center"),
            download: (d:Mutation[])=>getTextForDataField(d, "center"),
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>defaultSort(d1, d2, ascending, "center", "string"),
            filter: (d:Mutation[], filterString:string)=>defaultFilter(d, "center", filterString),
            visible: false,
            order: 120
        };

        this._columns[MutationTableColumnType.GENE] = {
            name: "Gene",
            render: (d:Mutation[])=>GeneColumnFormatter.renderFunction(d),
            download: (d:Mutation[])=>GeneColumnFormatter.getTextValue(d),
            sort:(d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                return stringSort(GeneColumnFormatter.getSortValue(d1), GeneColumnFormatter.getSortValue(d2), ascending);
            },
            filter:(d:Mutation[], filterString:string)=>(GeneColumnFormatter.getTextValue(d).indexOf(filterString) > -1),
            order: 20
        };

        this._columns[MutationTableColumnType.CHROMOSOME] = {
            name: "Chromosome",
            render: (d:Mutation[])=>(<span>{ChromosomeColumnFormatter.getData(d)}</span>),
            download: (d:Mutation[])=>(ChromosomeColumnFormatter.getData(d) || ""),
            sort:(d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                return numberSort(ChromosomeColumnFormatter.getSortValue(d1),
                    ChromosomeColumnFormatter.getSortValue(d2),
                    ascending);
            },
            filter:(d:Mutation[], filterString:string)=>{
                return ((ChromosomeColumnFormatter.getData(d)+'').indexOf(filterString) > -1);
            },
            visible: false,
            order: 40
        };

        this._columns[MutationTableColumnType.PROTEIN_CHANGE] = {
            name: "Protein Change",
            render: ProteinChangeColumnFormatter.renderFunction,
            download: DefaultProteinChangeColumnFormatter.getTextValue,
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                return numberSort(DefaultProteinChangeColumnFormatter.getSortValue(d1),
                                DefaultProteinChangeColumnFormatter.getSortValue(d2),
                                ascending);
            },
            filter: (d:Mutation[], filterString:string)=>{
                return (DefaultProteinChangeColumnFormatter.getTextValue(d).indexOf(filterString) > -1);
            },
            order: 30
        };

        this._columns[MutationTableColumnType.MUTATION_TYPE] = {
            name: "Mutation Type",
            render:MutationTypeColumnFormatter.renderFunction,
            download:MutationTypeColumnFormatter.getTextValue,
            sort:(d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                return stringSort(MutationTypeColumnFormatter.getDisplayValue(d1),
                                    MutationTypeColumnFormatter.getDisplayValue(d2),
                                    ascending);
            },
            filter:(d:Mutation[], filterString:string)=>{
                return (MutationTypeColumnFormatter.getDisplayValue(d).indexOf(filterString) > -1);
            },
            order: 110
        };

        this._columns[MutationTableColumnType.MUTATION_ASSESSOR] = {
            name: "Mutation Assessor",
            render:MutationAssessorColumnFormatter.renderFunction,
            download:MutationAssessorColumnFormatter.getTextValue,
            sort:(d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                return numberListSort(MutationAssessorColumnFormatter.getSortValue(d1),
                                    MutationAssessorColumnFormatter.getSortValue(d2),
                                    ascending);
            },
            filter:(d:Mutation[], filterString:string)=>{
                return (MutationAssessorColumnFormatter.filterValue(d).indexOf(filterString) > -1);
            },
            visible: false,
            order: 190
        };

        this._columns[MutationTableColumnType.COSMIC] = {
            name: "COSMIC",
            render: (d:Mutation[])=>CosmicColumnFormatter.renderFunction(d, this.props.cosmicData),
            sort:(d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                return numberSort(CosmicColumnFormatter.getSortValue(d1, this.props.cosmicData),
                                CosmicColumnFormatter.getSortValue(d2, this.props.cosmicData),
                                ascending);
            },
            tooltip: (<span>COSMIC occurrences</span>),
            order: 184
        };

        this._columns[MutationTableColumnType.TUMOR_ALLELE_FREQ] = {
            name: "Allele Freq",
            render: (d:Mutation[])=>AlleleFreqColumnFormatter.renderFunction(d, this.props.sampleManager),
            sort:(d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                return numberListSort(AlleleFreqColumnFormatter.getSortValue(d1, this.props.sampleManager),
                                AlleleFreqColumnFormatter.getSortValue(d2, this.props.sampleManager),
                                ascending);
            },
            tooltip:(<span>Variant allele frequency in the tumor sample</span>),
            order: 130
        };

        this._columns[MutationTableColumnType.TUMORS] = {
            name: "Tumors",
            render:(d:Mutation[])=>TumorColumnFormatter.renderFunction(d, this.props.sampleManager),
            sort:(d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                return numberListSort(TumorColumnFormatter.getSortValue(d1, this.props.sampleManager),
                                        TumorColumnFormatter.getSortValue(d2, this.props.sampleManager),
                                        ascending);
            },
            order: 5
        };

        this._columns[MutationTableColumnType.SAMPLE_ID] = {
            name: "Sample",
            render:(d:Mutation[])=>SampleColumnFormatter.renderFunction(d),
            sort:(d1:Mutation[], d2:Mutation[], ascending:boolean)=>{
                return stringSort(SampleColumnFormatter.getDisplayValue(d1),
                                    SampleColumnFormatter.getDisplayValue(d2),
                                    ascending);
            },
            filter:(d:Mutation[], filterString:string)=>{
                return (SampleColumnFormatter.getDisplayValue(d).indexOf(filterString) > -1);
            },
            order: 10
        };

        this._columns[MutationTableColumnType.ANNOTATION] = {
            name: "Annotation",
            render: (d:Mutation[]) => (AnnotationColumnFormatter.renderFunction(d, {
                hotspots: this.props.hotspots,
                myCancerGenomeData: this.props.myCancerGenomeData,
                oncoKbData: this.props.oncoKbData,
                pmidData: this.props.pmidData,
                enableOncoKb: true,
                enableMyCancerGenome: true,
                enableHotspot: true
            })),
            // TODO might be better to implement this in AnnotationColumnFormatter
            sort: (d1:Mutation[], d2:Mutation[], ascending:boolean) => {
                const a1 = AnnotationColumnFormatter.getData(d1,
                    this.props.hotspots,
                    this.props.myCancerGenomeData,
                    this.props.oncoKbData,
                    this.props.pmidData);

                const a2 = AnnotationColumnFormatter.getData(d2,
                    this.props.hotspots,
                    this.props.myCancerGenomeData,
                    this.props.oncoKbData,
                    this.props.pmidData);

                return (ascending ? 1 : -1) * AnnotationColumnFormatter.sortFunction(a1, a2);
            },
            order: 35
        };
    }

    @computed private get columns():Column<Mutation[]>[] {
        let orderedColumns = _.sortBy(this.props.columns, (c:MutationTableColumnType)=>this._columns[c].order);
        return orderedColumns.reduce((columns:Column<Mutation[]>[], next:MutationTableColumnType)=>{
            let shouldAdd = true;
            if (next === MutationTableColumnType.MRNA_EXPR &&
                (!this.props.mrnaExprRankGeneticProfileId
                || this.getSamples().length > 1)) {
                shouldAdd = false;
            } else if (next === MutationTableColumnType.TUMORS && this.getSamples().length < 2) {
                shouldAdd = false;
            } else if (next === MutationTableColumnType.COPY_NUM && !this.props.discreteCNAGeneticProfileId) {
                shouldAdd = false;
            }
            if (shouldAdd) {
                columns.push(this._columns[next]);
            }
            return columns;
        }, []);
    }

    render() {


        return (<MutationTableComponent
                    columns={this.columns}
                    data={this.props.data}
                    initialSortColumn="Annotation"
                    initialSortDirection="desc"
                />);
    }

}