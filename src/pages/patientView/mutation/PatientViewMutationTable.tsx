import * as React from "react";
import {computed} from "mobx";
import {observer} from "mobx-react";
import {
    IMutationTableProps, MutationTableColumnType, default as MutationTable
} from "shared/components/mutationTable/MutationTable";
import DiscreteCNACache from "shared/cache/DiscreteCNACache";
import SampleManager from "../sampleManager";
import {Mutation, ClinicalData, MolecularProfile} from "shared/api/generated/CBioPortalAPI";
import AlleleCountColumnFormatter from "shared/components/mutationTable/column/AlleleCountColumnFormatter";
import DiscreteCNAColumnFormatter from "shared/components/mutationTable/column/DiscreteCNAColumnFormatter";
import FACETSCNAColumnFormatter from "shared/components/mutationTable/column/FACETSCNAColumnFormatter";
import MutantCopiesColumnFormatter from "shared/components/mutationTable/column/MutantCopiesColumnFormatter";
import CancerCellFractionColumnFormatter from "shared/components/mutationTable/column/CancerCellFractionColumnFormatter";
import FACETSClonalColumnFormatter from "./column/FACETSClonalColumnFormatter";
import FACETSMutantCopiesColumnFormatter from "./column/FACETSMutantCopiesColumnFormatter";
import PatientFACETSCNAColumnFormatter from "./column/PatientFACETSCNAColumnFormatter";
import AlleleFreqColumnFormatter from "./column/AlleleFreqColumnFormatter";
import FACETSColumnFormatter from "./column/FACETSColumnFormatter";
import TumorColumnFormatter from "./column/TumorColumnFormatter";
import {isUncalled} from "shared/lib/MutationUtils";
import {floatValueIsNA} from "shared/lib/NumberUtils";
import TumorAlleleFreqColumnFormatter from "shared/components/mutationTable/column/TumorAlleleFreqColumnFormatter";
import ExonColumnFormatter from "shared/components/mutationTable/column/ExonColumnFormatter";

export interface IPatientViewMutationTableProps extends IMutationTableProps {
    sampleManager:SampleManager | null;
    sampleIds?:string[];
}

@observer
export default class PatientViewMutationTable extends MutationTable<IPatientViewMutationTableProps> {

    constructor(props:IPatientViewMutationTableProps) {
        super(props);
    }

    public static defaultProps =
    {
        ...MutationTable.defaultProps,
        initialItemsPerPage: 10,
        paginationProps:{ itemsPerPageOptions:[10,25,50,100] },
        columns: [
            MutationTableColumnType.COHORT,
            MutationTableColumnType.MRNA_EXPR,
            MutationTableColumnType.COPY_NUM,
            MutationTableColumnType.FACETS_COPY_NUM,
            MutationTableColumnType.ANNOTATION,
            MutationTableColumnType.REF_READS_N,
            MutationTableColumnType.VAR_READS_N,
            MutationTableColumnType.REF_READS,
            MutationTableColumnType.VAR_READS,
            MutationTableColumnType.START_POS,
            MutationTableColumnType.END_POS,
            MutationTableColumnType.REF_ALLELE,
            MutationTableColumnType.VAR_ALLELE,
            MutationTableColumnType.MUTATION_STATUS,
            MutationTableColumnType.VALIDATION_STATUS,
            MutationTableColumnType.CENTER,
            MutationTableColumnType.GENE,
            MutationTableColumnType.CHROMOSOME,
            MutationTableColumnType.PROTEIN_CHANGE,
            MutationTableColumnType.MUTATION_TYPE,
            MutationTableColumnType.CLONAL,
            MutationTableColumnType.CANCER_CELL_FRACTION,
            MutationTableColumnType.MUTANT_COPIES,
            MutationTableColumnType.FUNCTIONAL_IMPACT,
            MutationTableColumnType.COSMIC,
            MutationTableColumnType.TUMOR_ALLELE_FREQ,
            MutationTableColumnType.TUMORS,
            MutationTableColumnType.EXON,
            MutationTableColumnType.HGVSC,
            MutationTableColumnType.GNOMAD,
            MutationTableColumnType.CLINVAR,
            MutationTableColumnType.DBSNP
        ]
    };

    protected getSamples():string[] {
        if (this.props.sampleIds) {
            return this.props.sampleIds;
        }
        else {
            return [];
        }
    }

    protected generateColumns() {
        super.generateColumns();

        this._columns[MutationTableColumnType.TUMOR_ALLELE_FREQ] = {
            name: "Allele Freq",
            render: (d:Mutation[])=>AlleleFreqColumnFormatter.renderFunction(d, this.props.sampleManager),
            sortBy:(d:Mutation[])=>AlleleFreqColumnFormatter.getSortValue(d, this.props.sampleManager),
            download: (d:Mutation[])=>AlleleFreqColumnFormatter.getFrequency(d),
            tooltip:(<span>Variant allele frequency in the tumor sample</span>),
            visible: AlleleFreqColumnFormatter.isVisible(this.props.sampleManager,
                this.props.dataStore ? this.props.dataStore.allData : this.props.data)
        };

        this._columns[MutationTableColumnType.TUMORS] = {
            name: "Tumors",
            render:(d:Mutation[])=>TumorColumnFormatter.renderFunction(d, this.props.sampleManager),
            sortBy:(d:Mutation[])=>TumorColumnFormatter.getSortValue(d, this.props.sampleManager),
            download: (d:Mutation[])=>TumorColumnFormatter.getSample(d),
        };

        // customization for FACETS count columns
        // primarily to change display in case of patient with a shared mutation across multiple samples

        this._columns[MutationTableColumnType.CANCER_CELL_FRACTION] = {
            name: "CCF",
            tooltip:(<span>Cancer Cell Fraction</span>),
            render: (d:Mutation[])=>FACETSColumnFormatter.renderFunction(d, this.props.sampleManager),
            sortBy:(d:Mutation[])=>d.map(m=>m.ccfMCopies),
            download:(d:Mutation[])=>CancerCellFractionColumnFormatter.getCancerCellFractionDownload(d)
        };

        this._columns[MutationTableColumnType.CLONAL] = {
            name: "Clonal",
            tooltip: (<span>FACETS Clonal</span>),
            render:(d:Mutation[])=>FACETSClonalColumnFormatter.renderFunction(d, this.getSamples(), this.props.sampleManager),
            sortBy:(d:Mutation[])=>d.map(m=>m.ccfMCopiesUpper),
            download:(d:Mutation[])=>FACETSClonalColumnFormatter.getClonalDownload(d)
        };

        this._columns[MutationTableColumnType.MUTANT_COPIES] = {
            name: "Mutant Copies",
            tooltip: (<span>FACETS Best Guess for Mutant Copies / Total Copies</span>),
            render:(d:Mutation[])=>FACETSMutantCopiesColumnFormatter.renderFunction(d, this.props.sampleIdToClinicalDataMap, this.getSamples(), this.props.sampleManager),
            download:(d:Mutation[])=>MutantCopiesColumnFormatter.getMutantCopiesDownload(d, this.props.sampleIdToClinicalDataMap),
            sortBy:(d:Mutation[])=>MutantCopiesColumnFormatter.getDisplayValueAsString(d, this.props.sampleIdToClinicalDataMap, this.getSamples())
        };

        this._columns[MutationTableColumnType.FACETS_COPY_NUM] = {
            name: "Integer Copy #",
            render:(d:Mutation[])=>PatientFACETSCNAColumnFormatter.renderFunction(d,this.props.sampleIdToClinicalDataMap, this.getSamples(), this.props.sampleManager),
            sortBy:(d:Mutation[])=>FACETSCNAColumnFormatter.getSortValue(d, this.props.sampleIdToClinicalDataMap, this.getSamples())
        };
        // customization for allele count columns

        this._columns[MutationTableColumnType.REF_READS_N].render =
            (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, this.getSamples(), "normalRefCount");
        this._columns[MutationTableColumnType.REF_READS_N].download =
            (d:Mutation[])=>AlleleCountColumnFormatter.getReads(d, "normalRefCount");

        this._columns[MutationTableColumnType.VAR_READS_N].render =
            (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, this.getSamples(), "normalAltCount");
        this._columns[MutationTableColumnType.VAR_READS_N].download =
            (d:Mutation[])=>AlleleCountColumnFormatter.getReads(d, "normalAltCount");

        this._columns[MutationTableColumnType.REF_READS].render =
            (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, this.getSamples(), "tumorRefCount");
        this._columns[MutationTableColumnType.REF_READS].download =
            (d:Mutation[])=>AlleleCountColumnFormatter.getReads(d, "tumorRefCount");

        this._columns[MutationTableColumnType.VAR_READS].render =
            (d:Mutation[])=>AlleleCountColumnFormatter.renderFunction(d, this.getSamples(), "tumorAltCount");
        this._columns[MutationTableColumnType.VAR_READS].download =
            (d:Mutation[])=>AlleleCountColumnFormatter.getReads(d, "tumorAltCount");

        // customization for columns
        this._columns[MutationTableColumnType.EXON].sortBy = undefined;
        this._columns[MutationTableColumnType.EXON].render = 
            (d:Mutation[]) => (ExonColumnFormatter.renderFunction(d, this.props.genomeNexusCache, true));
        
        // order columns
        this._columns[MutationTableColumnType.TUMORS].order = 5;
        this._columns[MutationTableColumnType.GENE].order = 20;
        this._columns[MutationTableColumnType.PROTEIN_CHANGE].order = 30;
        this._columns[MutationTableColumnType.ANNOTATION].order = 35;
        this._columns[MutationTableColumnType.FUNCTIONAL_IMPACT].order = 38;
        this._columns[MutationTableColumnType.CHROMOSOME].order = 40;
        this._columns[MutationTableColumnType.START_POS].order = 50;
        this._columns[MutationTableColumnType.END_POS].order = 60;
        this._columns[MutationTableColumnType.REF_ALLELE].order = 70;
        this._columns[MutationTableColumnType.VAR_ALLELE].order = 80;
        this._columns[MutationTableColumnType.MUTATION_STATUS].order = 90;
        this._columns[MutationTableColumnType.VALIDATION_STATUS].order = 100;
        this._columns[MutationTableColumnType.MUTATION_TYPE].order = 110;
        this._columns[MutationTableColumnType.CLONAL].order = 115;
        this._columns[MutationTableColumnType.CANCER_CELL_FRACTION].order = 116;
        this._columns[MutationTableColumnType.MUTANT_COPIES].order = 117;
        this._columns[MutationTableColumnType.CENTER].order = 120;
        this._columns[MutationTableColumnType.TUMOR_ALLELE_FREQ].order = 130;
        this._columns[MutationTableColumnType.VAR_READS].order = 140;
        this._columns[MutationTableColumnType.REF_READS].order = 150;
        this._columns[MutationTableColumnType.VAR_READS_N].order = 170;
        this._columns[MutationTableColumnType.REF_READS_N].order = 175;
        this._columns[MutationTableColumnType.COPY_NUM].order = 180;
        this._columns[MutationTableColumnType.FACETS_COPY_NUM].order = 181;
        this._columns[MutationTableColumnType.MRNA_EXPR].order = 182;
        this._columns[MutationTableColumnType.COHORT].order = 183;
        this._columns[MutationTableColumnType.COSMIC].order = 184;
        this._columns[MutationTableColumnType.EXON].order = 185;
        this._columns[MutationTableColumnType.HGVSC].order = 186;
        this._columns[MutationTableColumnType.GNOMAD].order = 187;
        this._columns[MutationTableColumnType.CLINVAR].order = 188;
        this._columns[MutationTableColumnType.DBSNP].order = 189;

        // exclusions
        this._columns[MutationTableColumnType.MRNA_EXPR].shouldExclude = ()=>{
            return (!this.props.mrnaExprRankMolecularProfileId) || (this.getSamples().length > 1);
        };

        this._columns[MutationTableColumnType.CLONAL].shouldExclude = ()=>{
            return !this.hasCcfMCopies;
        };

        this._columns[MutationTableColumnType.CANCER_CELL_FRACTION].shouldExclude = ()=>{
            return !this.hasCcfMCopies;
        };

        // hide if multiple samples (same as Copy Number column)
        // included because Mutant copies should only be shown in conjunction with Copy Num
        this._columns[MutationTableColumnType.MUTANT_COPIES].shouldExclude = ()=>{
            return (!this.hasMutantCopies || !this.props.discreteCNAMolecularProfileId);
        };

        // only hide tumor column if there is one sample and no uncalled
        // mutations (there is no information added in that case by the sample
        // label)
        this._columns[MutationTableColumnType.TUMORS].shouldExclude = ()=>{
            return this.getSamples().length < 2 && !this.hasUncalledMutations;
        };
        this._columns[MutationTableColumnType.COPY_NUM].shouldExclude = ()=>{
            return (!this.props.discreteCNAMolecularProfileId) || (this.getSamples().length > 1);
        };
    }

    @computed private get hasCcfMCopies():boolean {
        let data:Mutation[][] = [];
        if (this.props.data) {
            data = this.props.data;
        } else if (this.props.dataStore) {
            data = this.props.dataStore.allData;
        }
        return data.some((row:Mutation[]) => {
            return row.some((m:Mutation) => {
                return !floatValueIsNA(m.ccfMCopies);
            });
        });
    }

    @computed private get hasMutantCopies():boolean {
        let data:Mutation[][] = [];
        let clinicalData:{[sampleId:string]:ClinicalData[]} = {};
        if (this.props.sampleIdToClinicalDataMap) {
            clinicalData = this.props.sampleIdToClinicalDataMap;
        }
        if (this.props.data) {
            data = this.props.data;
        } else if (this.props.dataStore) {
            data = this.props.dataStore.allData;
        }
        return data.some((row:Mutation[]) => {
            return row.some((m:Mutation) => {
                return (m.totalCopyNumber !== -1 && clinicalData[m.sampleId].filter((cd: ClinicalData) => cd.clinicalAttributeId === "FACETS_PURITY").length > 0);
            });
        });
    }

    @computed private get hasUncalledMutations():boolean {
        let data:Mutation[][] = [];
        if (this.props.data) {
            data = this.props.data;
        } else if (this.props.dataStore) {
            data = this.props.dataStore.allData;
        }
        return data.some((row:Mutation[]) => {
            return row.some((m:Mutation) => {
                return isUncalled(m.molecularProfileId);
            });
        });
    }
}
