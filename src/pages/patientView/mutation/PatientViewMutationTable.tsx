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
import * as _ from "lodash";

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

function defaultFilter(data:Mutation[], dataField:string, filterStringUpper:string):boolean {
    if (data.length > 0) {
        return data.reduce((match:boolean, next:Mutation)=>{
            const val = (next as any)[dataField];
            if (val) {
                return match || ((val.toUpperCase().indexOf(filterStringUpper) > -1));
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
            sortBy: (d:Mutation[]):number|null=>{
                const cache = this.props.discreteCNACache;
                if (cache) {
                    return DiscreteCNAColumnFormatter.getSortValue(d, cache);
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
            sortBy:(d:Mutation[])=>{
                const cache = this.props.variantCountCache;
                if (cache) {
                    return CohortColumnFormatter.getSortValue(d, cache);
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
            sortBy:(d:Mutation[])=>d.map(m=>m.normalRefCount),
            visible: false,
            order: 180
        };

        this._columns[MutationTableColumnType.VAR_READS_N] = {
            name: "Variant Reads (N)",
            render: (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, this.getSamples(), "normalAltCount"),
            download: (d:Mutation[])=>AlleleCountColumnFormatter.getTextValue(d, this.getSamples(), "normalAltCount"),
            sortBy:(d:Mutation[])=>d.map(m=>m.normalAltCount),
            visible: false,
            order: 170
        };

        this._columns[MutationTableColumnType.REF_READS] = {
            name: "Ref Reads",
            render: (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, this.getSamples(), "tumorRefCount"),
            download: (d:Mutation[])=>AlleleCountColumnFormatter.getTextValue(d, this.getSamples(), "tumorRefCount"),
            sortBy:(d:Mutation[])=>d.map(m=>m.tumorRefCount),
            visible: false,
            order: 150
        };

        this._columns[MutationTableColumnType.VAR_READS] = {
            name: "Variant Reads",
            render: (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, this.getSamples(), "tumorAltCount"),
            download: (d:Mutation[])=>AlleleCountColumnFormatter.getTextValue(d, this.getSamples(), "tumorAltCount"),
            sortBy:(d:Mutation[])=>d.map(m=>m.tumorAltCount),
            visible: false,
            order: 140
        };

        this._columns[MutationTableColumnType.START_POS] = {
            name: "Start Pos",
            render: (d:Mutation[])=>getSpanForDataField(d, "startPosition"),
            download: (d:Mutation[])=>getTextForDataField(d, "startPosition"),
            sortBy:(d:Mutation[])=>d.map(m=>m.startPosition),
            visible: false,
            order: 50
        };

        this._columns[MutationTableColumnType.END_POS] = {
            name: "End Pos",
            render: (d:Mutation[])=>getSpanForDataField(d, "endPosition"),
            download: (d:Mutation[])=>getTextForDataField(d, "endPosition"),
            sortBy:(d:Mutation[])=>d.map(m=>m.endPosition),
            visible: false,
            order: 60
        };

        this._columns[MutationTableColumnType.REF_ALLELE] = {
            name: "Ref",
            render: (d:Mutation[])=>getSpanForDataField(d, "referenceAllele"),
            download: (d:Mutation[])=>getTextForDataField(d, "referenceAllele"),
            sortBy:(d:Mutation[])=>d.map(m=>m.referenceAllele),
            visible: false,
            order: 70
        };

        this._columns[MutationTableColumnType.VAR_ALLELE] = {
            name: "Var",
            render: (d:Mutation[])=>getSpanForDataField(d, "variantAllele"),
            download: (d:Mutation[])=>getTextForDataField(d, "variantAllele"),
            sortBy:(d:Mutation[])=>d.map(m=>m.variantAllele),
            visible: false,
            order: 80
        };

        this._columns[MutationTableColumnType.MUTATION_STATUS] = {
            name: "MS",
            render: (d:Mutation[])=>getSpanForDataField(d, "mutationStatus"),
            download: (d:Mutation[])=>getTextForDataField(d, "mutationStatus"),
            sortBy:(d:Mutation[])=>d.map(m=>m.mutationStatus),
            filter: (d:Mutation[], filterString:string, filterStringUpper:string) =>
                defaultFilter(d, "mutationStatus", filterStringUpper),
            visible: false,
            order: 90
        };

        this._columns[MutationTableColumnType.VALIDATION_STATUS] = {
            name: "VS",
            render: (d:Mutation[])=>getSpanForDataField(d, "validationStatus"),
            download: (d:Mutation[])=>getTextForDataField(d, "validationStatus"),
            sortBy:(d:Mutation[])=>d.map(m=>m.validationStatus),
            filter: (d:Mutation[], filterString:string, filterStringUpper:string) =>
                defaultFilter(d, "validationStatus", filterStringUpper),
            visible: false,
            order: 100
        };

        this._columns[MutationTableColumnType.CENTER] = {
            name: "Center",
            render: (d:Mutation[])=>getSpanForDataField(d, "center"),
            download: (d:Mutation[])=>getTextForDataField(d, "center"),
            sortBy:(d:Mutation[])=>d.map(m=>m.center),
            filter: (d:Mutation[], filterString:string, filterStringUpper:string) =>
                defaultFilter(d, "center", filterStringUpper),
            visible: false,
            order: 120
        };

        this._columns[MutationTableColumnType.GENE] = {
            name: "Gene",
            render: (d:Mutation[])=>GeneColumnFormatter.renderFunction(d),
            download: (d:Mutation[])=>GeneColumnFormatter.getTextValue(d),
            sortBy:(d:Mutation[])=>GeneColumnFormatter.getSortValue(d),
            filter:(d:Mutation[], filterString:string, filterStringUpper:string) =>
                GeneColumnFormatter.getTextValue(d).toUpperCase().indexOf(filterStringUpper) > -1,
            order: 20
        };

        this._columns[MutationTableColumnType.CHROMOSOME] = {
            name: "Chromosome",
            render: (d:Mutation[])=>(<span>{ChromosomeColumnFormatter.getData(d)}</span>),
            download: (d:Mutation[])=>(ChromosomeColumnFormatter.getData(d) || ""),
            sortBy:(d:Mutation[])=>ChromosomeColumnFormatter.getSortValue(d),
            filter:(d:Mutation[], filterString:string, filterStringUpper:string) =>
                (ChromosomeColumnFormatter.getData(d)+'').toUpperCase().indexOf(filterStringUpper) > -1,
            visible: false,
            order: 40
        };

        this._columns[MutationTableColumnType.PROTEIN_CHANGE] = {
            name: "Protein Change",
            render: ProteinChangeColumnFormatter.renderFunction,
            download: DefaultProteinChangeColumnFormatter.getTextValue,
            sortBy:(d:Mutation[])=>DefaultProteinChangeColumnFormatter.getSortValue(d),
            filter: (d:Mutation[], filterString:string, filterStringUpper:string) =>
                DefaultProteinChangeColumnFormatter.getTextValue(d).toUpperCase().indexOf(filterStringUpper) > -1,
            order: 30
        };

        this._columns[MutationTableColumnType.MUTATION_TYPE] = {
            name: "Mutation Type",
            render:MutationTypeColumnFormatter.renderFunction,
            download:MutationTypeColumnFormatter.getTextValue,
            sortBy:(d:Mutation[])=>MutationTypeColumnFormatter.getDisplayValue(d),
            filter:(d:Mutation[], filterString:string, filterStringUpper:string) =>
                MutationTypeColumnFormatter.getDisplayValue(d).toUpperCase().indexOf(filterStringUpper) > -1,
            order: 110
        };

        this._columns[MutationTableColumnType.MUTATION_ASSESSOR] = {
            name: "Mutation Assessor",
            render:MutationAssessorColumnFormatter.renderFunction,
            download:MutationAssessorColumnFormatter.getTextValue,
            sortBy:(d:Mutation[])=>MutationAssessorColumnFormatter.getSortValue(d),
            filter:(d:Mutation[], filterString:string, filterStringUpper:string) =>
                MutationAssessorColumnFormatter.filterValue(d).toUpperCase().indexOf(filterStringUpper) > -1,
            visible: false,
            order: 190
        };

        this._columns[MutationTableColumnType.COSMIC] = {
            name: "COSMIC",
            render: (d:Mutation[])=>CosmicColumnFormatter.renderFunction(d, this.props.cosmicData),
            sortBy:(d:Mutation[])=>CosmicColumnFormatter.getSortValue(d, this.props.cosmicData),
            tooltip: (<span>COSMIC occurrences</span>),
            order: 184
        };

        this._columns[MutationTableColumnType.TUMOR_ALLELE_FREQ] = {
            name: "Allele Freq",
            render: (d:Mutation[])=>AlleleFreqColumnFormatter.renderFunction(d, this.props.sampleManager),
            sortBy:(d:Mutation[])=>AlleleFreqColumnFormatter.getSortValue(d, this.props.sampleManager),
            tooltip:(<span>Variant allele frequency in the tumor sample</span>),
            order: 130
        };

        this._columns[MutationTableColumnType.TUMORS] = {
            name: "Tumors",
            render:(d:Mutation[])=>TumorColumnFormatter.renderFunction(d, this.props.sampleManager),
            sortBy:(d:Mutation[])=>TumorColumnFormatter.getSortValue(d, this.props.sampleManager),
            order: 5
        };

        this._columns[MutationTableColumnType.SAMPLE_ID] = {
            name: "Sample",
            render:(d:Mutation[])=>SampleColumnFormatter.renderFunction(d),
            sortBy:(d:Mutation[])=>SampleColumnFormatter.getDisplayValue(d),
            filter:(d:Mutation[], filterString:string, filterStringUpper:string) =>
                SampleColumnFormatter.getDisplayValue(d).toUpperCase().indexOf(filterStringUpper) > -1,
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
            sortBy:(d:Mutation[])=>{
                return AnnotationColumnFormatter.sortValue(d,
                    this.props.hotspots, this.props.myCancerGenomeData, this.props.oncoKbData, this.props.pmidData);
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
            } else if (next === MutationTableColumnType.COPY_NUM && (!this.props.discreteCNAGeneticProfileId || this.getSamples().length > 1)) {
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
                    initialItemsPerPage={25}
                />);
    }

}