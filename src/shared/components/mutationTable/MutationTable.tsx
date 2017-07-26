import * as React from "react";
import {observer} from "mobx-react";
import {observable, computed} from "mobx";
import * as _ from "lodash";
import {default as LazyMobXTable, Column, SortDirection} from "shared/components/lazyMobXTable/LazyMobXTable";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import SampleColumnFormatter from "./column/SampleColumnFormatter";
import TumorAlleleFreqColumnFormatter from "./column/TumorAlleleFreqColumnFormatter";
import NormalAlleleFreqColumnFormatter from "./column/NormalAlleleFreqColumnFormatter";
import MrnaExprColumnFormatter from "./column/MrnaExprColumnFormatter";
import CohortColumnFormatter from "./column/CohortColumnFormatter";
import DiscreteCNAColumnFormatter from "./column/DiscreteCNAColumnFormatter";
import AlleleCountColumnFormatter from "./column/AlleleCountColumnFormatter";
import GeneColumnFormatter from "./column/GeneColumnFormatter";
import ChromosomeColumnFormatter from "./column/ChromosomeColumnFormatter";
import ProteinChangeColumnFormatter from "./column/ProteinChangeColumnFormatter";
import MutationTypeColumnFormatter from "./column/MutationTypeColumnFormatter";
import MutationAssessorColumnFormatter from "./column/MutationAssessorColumnFormatter";
import CosmicColumnFormatter from "./column/CosmicColumnFormatter";
import {ICosmicData} from "shared/model/Cosmic";
import AnnotationColumnFormatter from "./column/AnnotationColumnFormatter";
import {IMyCancerGenomeData} from "shared/model/MyCancerGenome";
import {IHotspotData} from "shared/model/CancerHotspots";
import {IOncoKbDataWrapper} from "shared/model/OncoKB";
import {ICivicVariant, ICivicGene} from "shared/model/Civic.ts";
import {IMutSigData} from "shared/model/MutSig";
import DiscreteCNACache from "shared/cache/DiscreteCNACache";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import MrnaExprRankCache from "shared/cache/MrnaExprRankCache";
import VariantCountCache from "shared/cache/VariantCountCache";
import PubMedCache from "shared/cache/PubMedCache";
import MutationCountCache from "../../cache/MutationCountCache";
import MutationCountColumnFormatter from "./column/MutationCountColumnFormatter";
import CancerTypeColumnFormatter from "./column/CancerTypeColumnFormatter";
import {IMobXApplicationDataStore} from "../../lib/IMobXApplicationDataStore";

export interface IMutationTableProps {
    studyId?:string;
    sampleIdToTumorType?: {[sampleId: string]: string}
    discreteCNACache?:DiscreteCNACache;
    oncoKbEvidenceCache?:OncoKbEvidenceCache;
    mrnaExprRankCache?:MrnaExprRankCache;
    variantCountCache?:VariantCountCache;
    pubMedCache?:PubMedCache
    mutationCountCache?:MutationCountCache;
    mutSigData?:IMutSigData;
    enableOncoKb?: boolean;
    enableMyCancerGenome?: boolean;
    enableHotspot?: boolean;
    enableCivic?: boolean;
    myCancerGenomeData?: IMyCancerGenomeData;
    hotspots?: IHotspotData;
    cosmicData?:ICosmicData;
    oncoKbData?: IOncoKbDataWrapper;
    civicGenes?: ICivicGene;
    civicVariants?: ICivicVariant;
    mrnaExprRankGeneticProfileId?:string;
    discreteCNAGeneticProfileId?:string;
    columns?:MutationTableColumnType[];
    data?:Mutation[][];
    dataStore?:IMobXApplicationDataStore<Mutation[]>;
    initialItemsPerPage?:number;
    itemsLabel?:string;
    itemsLabelPlural?:string;
    initialSortColumn?:string;
    initialSortDirection?:SortDirection
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
    NORMAL_ALLELE_FREQ,
    MUTATION_ASSESSOR,
    ANNOTATION,
    COSMIC,
    COPY_NUM,
    MRNA_EXPR,
    COHORT,
    REF_READS_N,
    VAR_READS_N,
    REF_READS,
    VAR_READS,
    CANCER_TYPE,
    NUM_MUTATIONS
}

type MutationTableColumn = Column<Mutation[]>&{order?:number, shouldExclude?:()=>boolean};

export class MutationTableComponent extends LazyMobXTable<Mutation[]> {
}

export function getSpanForDataField(data:Mutation[], dataField:string) {
    let contents = getTextForDataField(data, dataField);
    return (<span>{contents}</span>);
}

export function getTextForDataField(data:Mutation[], dataField:string) {
    let text = "";
    if (data.length > 0 && data[0].hasOwnProperty(dataField)) {
        text = (data[0] as any)[dataField];
    }
    return text;
}

export function defaultFilter(data:Mutation[], dataField:string, filterStringUpper:string):boolean {
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
export default class MutationTable<P extends IMutationTableProps> extends React.Component<P, {}> {
    @observable protected _columns:{[columnEnum:number]:MutationTableColumn};

    public static defaultProps = {
        initialItemsPerPage: 25,
        initialSortColumn: "Annotation",
        initialSortDirection: "desc",
        itemsLabel: "Mutation",
        itemsLabelPlural: "Mutations",
        enableOncoKb: true,
        enableMyCancerGenome: true,
        enableHotspot: true,
        enableCivic: false
    };

    constructor(props:P)
    {
        super(props);
        this._columns = {};
        this.generateColumns();
    }

    protected generateColumns() {
        this._columns = {};

        this._columns[MutationTableColumnType.SAMPLE_ID] = {
            name: "Sample ID",
            render: (d:Mutation[]) => SampleColumnFormatter.renderFunction(d, this.props.studyId),
            download: SampleColumnFormatter.getTextValue,
            sortBy: SampleColumnFormatter.getTextValue,
            filter: (d:Mutation[], filterString:string, filterStringUpper:string) =>
                defaultFilter(d, "sampleId", filterStringUpper),
            visible: true
        };

        this._columns[MutationTableColumnType.TUMOR_ALLELE_FREQ] = {
            name: "Allele Freq (T)",
            render: TumorAlleleFreqColumnFormatter.renderFunction,
            headerRender: (name: string) => <span style={{display:'inline-block', maxWidth:55}}>{name}</span>,
            sortBy: TumorAlleleFreqColumnFormatter.getSortValue,
            tooltip:(<span>Variant allele frequency in the tumor sample</span>),
            visible: true
        };

        this._columns[MutationTableColumnType.NORMAL_ALLELE_FREQ] = {
            name: "Allele Freq (N)",
            render: NormalAlleleFreqColumnFormatter.renderFunction,
            headerRender: (name: string) => <span style={{display:'inline-block', maxWidth:55}}>{name}</span>,
            sortBy: NormalAlleleFreqColumnFormatter.getSortValue,
            tooltip:(<span>Variant allele frequency in the normal sample</span>),
            visible: false
        };

        this._columns[MutationTableColumnType.MRNA_EXPR] = {
            name:"mRNA Expr.",
            render:(d:Mutation[])=>(this.props.mrnaExprRankCache
                ? MrnaExprColumnFormatter.renderFunction(d, this.props.mrnaExprRankCache as MrnaExprRankCache)
                : (<span></span>))
        };

        this._columns[MutationTableColumnType.COHORT] = {
            name:"Cohort",
            render:(d:Mutation[])=>(this.props.variantCountCache
                ? CohortColumnFormatter.renderFunction(d, this.props.mutSigData, this.props.variantCountCache as VariantCountCache)
                : (<span></span>)),
            sortBy:(d:Mutation[])=>{
                const cache = this.props.variantCountCache;
                if (cache) {
                    return CohortColumnFormatter.getSortValue(d, cache as VariantCountCache);
                } else {
                    return 0;
                }
            },
            tooltip: (<span>Mutation frequency in cohort</span>),
            defaultSortDirection: "desc"
        };

        this._columns[MutationTableColumnType.COPY_NUM] = {
            name: "Copy #",
            render:(d:Mutation[])=>(this.props.discreteCNACache
                ? DiscreteCNAColumnFormatter.renderFunction(d, this.props.discreteCNACache as DiscreteCNACache)
                : (<span></span>)),
            sortBy: (d:Mutation[]):number|null=>{
                const cache = this.props.discreteCNACache;
                if (cache) {
                    return DiscreteCNAColumnFormatter.getSortValue(d, cache as DiscreteCNACache);
                } else {
                    return 0;
                }
            },
            filter:(d:Mutation[], filterString:string)=>{
                if (this.props.discreteCNACache) {
                    return DiscreteCNAColumnFormatter.filter(d, this.props.discreteCNACache as DiscreteCNACache, filterString)
                } else {
                    return false;
                }
            }
        };

        this._columns[MutationTableColumnType.REF_READS_N] = {
            name: "Ref Reads (N)",
            render: (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, [d[0].sampleId], "normalRefCount"),
            download: (d:Mutation[])=>AlleleCountColumnFormatter.getTextValue(d, [d[0].sampleId], "normalRefCount"),
            sortBy:(d:Mutation[])=>d.map(m=>m.normalRefCount),
            visible: false
        };

        this._columns[MutationTableColumnType.VAR_READS_N] = {
            name: "Variant Reads (N)",
            render: (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, [d[0].sampleId], "normalAltCount"),
            download: (d:Mutation[])=>AlleleCountColumnFormatter.getTextValue(d, [d[0].sampleId], "normalAltCount"),
            sortBy:(d:Mutation[])=>d.map(m=>m.normalAltCount),
            visible: false
        };

        this._columns[MutationTableColumnType.REF_READS] = {
            name: "Ref Reads",
            render: (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, [d[0].sampleId], "tumorRefCount"),
            download: (d:Mutation[])=>AlleleCountColumnFormatter.getTextValue(d, [d[0].sampleId], "tumorRefCount"),
            sortBy:(d:Mutation[])=>d.map(m=>m.tumorRefCount),
            visible: false
        };

        this._columns[MutationTableColumnType.VAR_READS] = {
            name: "Variant Reads",
            render: (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, [d[0].sampleId], "tumorAltCount"),
            download: (d:Mutation[])=>AlleleCountColumnFormatter.getTextValue(d, [d[0].sampleId], "tumorAltCount"),
            sortBy:(d:Mutation[])=>d.map(m=>m.tumorAltCount),
            visible: false
        };

        this._columns[MutationTableColumnType.START_POS] = {
            name: "Start Pos",
            render: (d:Mutation[])=>getSpanForDataField(d, "startPosition"),
            download: (d:Mutation[])=>getTextForDataField(d, "startPosition"),
            sortBy:(d:Mutation[])=>d.map(m=>m.startPosition),
            visible: false
        };

        this._columns[MutationTableColumnType.END_POS] = {
            name: "End Pos",
            render: (d:Mutation[])=>getSpanForDataField(d, "endPosition"),
            download: (d:Mutation[])=>getTextForDataField(d, "endPosition"),
            sortBy:(d:Mutation[])=>d.map(m=>m.endPosition),
            visible: false
        };

        this._columns[MutationTableColumnType.REF_ALLELE] = {
            name: "Ref",
            render: (d:Mutation[])=>getSpanForDataField(d, "referenceAllele"),
            download: (d:Mutation[])=>getTextForDataField(d, "referenceAllele"),
            sortBy:(d:Mutation[])=>d.map(m=>m.referenceAllele),
            visible: false
        };

        this._columns[MutationTableColumnType.VAR_ALLELE] = {
            name: "Var",
            render: (d:Mutation[])=>getSpanForDataField(d, "variantAllele"),
            download: (d:Mutation[])=>getTextForDataField(d, "variantAllele"),
            sortBy:(d:Mutation[])=>d.map(m=>m.variantAllele),
            visible: false
        };

        this._columns[MutationTableColumnType.MUTATION_STATUS] = {
            name: "MS",
            render: (d:Mutation[])=>getSpanForDataField(d, "mutationStatus"),
            download: (d:Mutation[])=>getTextForDataField(d, "mutationStatus"),
            sortBy:(d:Mutation[])=>d.map(m=>m.mutationStatus),
            filter: (d:Mutation[], filterString:string, filterStringUpper:string) =>
                defaultFilter(d, "mutationStatus", filterStringUpper),
            visible: false
        };

        this._columns[MutationTableColumnType.VALIDATION_STATUS] = {
            name: "VS",
            render: (d:Mutation[])=>getSpanForDataField(d, "validationStatus"),
            download: (d:Mutation[])=>getTextForDataField(d, "validationStatus"),
            sortBy:(d:Mutation[])=>d.map(m=>m.validationStatus),
            filter: (d:Mutation[], filterString:string, filterStringUpper:string) =>
                defaultFilter(d, "validationStatus", filterStringUpper),
            visible: false
        };

        this._columns[MutationTableColumnType.CENTER] = {
            name: "Center",
            render: (d:Mutation[])=>getSpanForDataField(d, "center"),
            download: (d:Mutation[])=>getTextForDataField(d, "center"),
            sortBy:(d:Mutation[])=>d.map(m=>m.center),
            filter: (d:Mutation[], filterString:string, filterStringUpper:string) =>
                defaultFilter(d, "center", filterStringUpper),
            visible: false
        };

        this._columns[MutationTableColumnType.GENE] = {
            name: "Gene",
            render: (d:Mutation[])=>GeneColumnFormatter.renderFunction(d),
            download: (d:Mutation[])=>GeneColumnFormatter.getTextValue(d),
            sortBy:(d:Mutation[])=>GeneColumnFormatter.getSortValue(d),
            filter:(d:Mutation[], filterString:string, filterStringUpper:string) =>
                GeneColumnFormatter.getTextValue(d).toUpperCase().indexOf(filterStringUpper) > -1
        };

        this._columns[MutationTableColumnType.CHROMOSOME] = {
            name: "Chromosome",
            render: (d:Mutation[])=>(<span>{ChromosomeColumnFormatter.getData(d)}</span>),
            download: (d:Mutation[])=>(ChromosomeColumnFormatter.getData(d) || ""),
            sortBy:(d:Mutation[])=>ChromosomeColumnFormatter.getSortValue(d),
            filter:(d:Mutation[], filterString:string, filterStringUpper:string) =>
                (ChromosomeColumnFormatter.getData(d)+'').toUpperCase().indexOf(filterStringUpper) > -1,
            visible: false
        };

        this._columns[MutationTableColumnType.PROTEIN_CHANGE] = {
            name: "Protein Change",
            render: ProteinChangeColumnFormatter.renderFunction,
            download: ProteinChangeColumnFormatter.getTextValue,
            sortBy:(d:Mutation[])=>ProteinChangeColumnFormatter.getSortValue(d),
            filter: (d:Mutation[], filterString:string, filterStringUpper:string) =>
                ProteinChangeColumnFormatter.getTextValue(d).toUpperCase().indexOf(filterStringUpper) > -1
        };

        this._columns[MutationTableColumnType.MUTATION_TYPE] = {
            name: "Mutation Type",
            render:MutationTypeColumnFormatter.renderFunction,
            download:MutationTypeColumnFormatter.getTextValue,
            sortBy:(d:Mutation[])=>MutationTypeColumnFormatter.getDisplayValue(d),
            filter:(d:Mutation[], filterString:string, filterStringUpper:string) =>
                MutationTypeColumnFormatter.getDisplayValue(d).toUpperCase().indexOf(filterStringUpper) > -1
        };

        this._columns[MutationTableColumnType.MUTATION_ASSESSOR] = {
            name: "Mutation Assessor",
            headerRender: (name: string) => <span style={{display:'inline-block', maxWidth:60}}>{name}</span>,
            render:MutationAssessorColumnFormatter.renderFunction,
            download:MutationAssessorColumnFormatter.getTextValue,
            sortBy:(d:Mutation[])=>MutationAssessorColumnFormatter.getSortValue(d),
            filter:(d:Mutation[], filterString:string, filterStringUpper:string) =>
                MutationAssessorColumnFormatter.filterValue(d).toUpperCase().indexOf(filterStringUpper) > -1,
            visible: false
        };

        this._columns[MutationTableColumnType.COSMIC] = {
            name: "COSMIC",
            render: (d:Mutation[])=>CosmicColumnFormatter.renderFunction(d, this.props.cosmicData),
            sortBy: (d:Mutation[])=>CosmicColumnFormatter.getSortValue(d, this.props.cosmicData),
            download: (d:Mutation[])=>CosmicColumnFormatter.getDownloadValue(d, this.props.cosmicData),
            tooltip: (<span>COSMIC occurrences</span>),
            defaultSortDirection: "desc"
        };

        this._columns[MutationTableColumnType.ANNOTATION] = {
            name: "Annotation",
            render: (d:Mutation[]) => (AnnotationColumnFormatter.renderFunction(d, {
                hotspots: this.props.hotspots,
                myCancerGenomeData: this.props.myCancerGenomeData,
                oncoKbData: this.props.oncoKbData,
                oncoKbEvidenceCache: this.props.oncoKbEvidenceCache,
                pubMedCache: this.props.pubMedCache,
                civicGenes: this.props.civicGenes,
                civicVariants: this.props.civicVariants,
                enableCivic: this.props.enableCivic as boolean,
                enableOncoKb: this.props.enableOncoKb as boolean,
                enableMyCancerGenome: this.props.enableMyCancerGenome as boolean,
                enableHotspot: this.props.enableHotspot as boolean
            })),
            sortBy:(d:Mutation[])=>{
                return AnnotationColumnFormatter.sortValue(d,
                    this.props.hotspots,
                    this.props.myCancerGenomeData,
                    this.props.oncoKbData,
                    this.props.civicGenes,
                    this.props.civicVariants);
            }
        };

        this._columns[MutationTableColumnType.CANCER_TYPE] = {
            name: "Cancer Type",
            render: (d:Mutation[]) => CancerTypeColumnFormatter.render(d, this.props.sampleIdToTumorType),
            sortBy: (d:Mutation[]) => CancerTypeColumnFormatter.sortBy(d, this.props.sampleIdToTumorType),
            filter: (d:Mutation[], filterString:string, filterStringUpper:string) =>
                CancerTypeColumnFormatter.filter(d, filterStringUpper, this.props.sampleIdToTumorType),
            tooltip:(<span>Cancer Type</span>),
        };

        this._columns[MutationTableColumnType.NUM_MUTATIONS] = {
            name: "# Mut in Sample",
            render: MutationCountColumnFormatter.makeRenderFunction(this),
            headerRender: (name: string) => <span style={{display:'inline-block', maxWidth:55}}>{name}</span>,
            sortBy: (d:Mutation[]) => MutationCountColumnFormatter.sortBy(d, this.props.mutationCountCache),
            tooltip:(<span>Total number of nonsynonymous mutations in the sample</span>)
        };
    }

    @computed protected get orderedColumns(): MutationTableColumnType[] {
        const columns = (this.props.columns || []) as MutationTableColumnType[];

        return _.sortBy(columns, (c:MutationTableColumnType) => {
            let order:number = -1;

            if (this._columns[c] && this._columns[c].order) {
                order = this._columns[c].order as number;
            }

            return order;
        });
    }

    @computed protected get columns():Column<Mutation[]>[] {
        return this.orderedColumns.reduce((columns:Column<Mutation[]>[], next:MutationTableColumnType) => {
            let column = this._columns[next];


            if (column && // actual column definition may be missing for a specific enum
                (!column.shouldExclude || !column.shouldExclude())) {
                columns.push(column);
            }

            return columns;
        }, []);
    }

    public render()
    {
        return (
            <MutationTableComponent
                columns={this.columns}
                data={this.props.data}
                dataStore={this.props.dataStore}
                initialItemsPerPage={this.props.initialItemsPerPage}
                initialSortColumn={this.props.initialSortColumn}
                initialSortDirection={this.props.initialSortDirection}
                itemsLabel={this.props.itemsLabel}
                itemsLabelPlural={this.props.itemsLabelPlural}
            />
        );
    }
}
